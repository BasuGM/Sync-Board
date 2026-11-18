import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import type { AuthResponse, AuthUser } from '@syncboard/shared';
import * as argon2 from 'argon2';
import type { Response } from 'express';
import { AppConfig } from '../config/app.config';
import { AuthConfig } from '../config/auth.config';
import { PrismaService } from '../prisma/prisma.service';
import {
  generateRefreshToken,
  hashRefreshToken,
  refreshExpiresAt,
} from './auth.tokens';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const INVALID_CREDENTIALS = 'Invalid email or password';
const REGISTRATION_FAILED = 'Unable to complete registration';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private get authConfig(): AuthConfig {
    return this.configService.get<AuthConfig>('auth', { infer: true })!;
  }

  private get appConfig(): AppConfig {
    return this.configService.get<AppConfig>('app', { infer: true })!;
  }

  toUserDto(user: { id: string; email: string; name: string }): AuthUser {
    return { id: user.id, email: user.email, name: user.name };
  }

  setRefreshCookie(response: Response, rawToken: string) {
    const maxAge =
      this.authConfig.refreshTokenExpiresDays * 24 * 60 * 60 * 1000;
    response.cookie(this.authConfig.refreshCookieName, rawToken, {
      httpOnly: true,
      secure: this.appConfig.nodeEnv === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge,
    });
  }

  clearRefreshCookie(response: Response) {
    response.clearCookie(this.authConfig.refreshCookieName, {
      httpOnly: true,
      secure: this.appConfig.nodeEnv === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
    });
  }

  private async signAccessToken(user: {
    id: string;
    email: string;
  }): Promise<string> {
    const signOptions: JwtSignOptions = {
      secret: this.authConfig.accessTokenSecret,
      expiresIn: this.authConfig
        .accessTokenExpiresIn as JwtSignOptions['expiresIn'],
    };
    return this.jwtService.signAsync(
      { sub: user.id, email: user.email },
      signOptions,
    );
  }

  private async createSession(userId: string) {
    const rawRefresh = generateRefreshToken();
    const refreshTokenHash = hashRefreshToken(rawRefresh);
    const expiresAt = refreshExpiresAt(this.authConfig.refreshTokenExpiresDays);

    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash,
        expiresAt,
      },
    });

    return { rawRefresh, sessionId: session.id };
  }

  private async buildAuthResponse(
    user: { id: string; email: string; name: string },
    response: Response,
  ): Promise<AuthResponse> {
    const accessToken = await this.signAccessToken(user);
    const { rawRefresh } = await this.createSession(user.id);
    this.setRefreshCookie(response, rawRefresh);
    return { accessToken, user: this.toUserDto(user) };
  }

  async register(dto: RegisterDto, response: Response): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException(REGISTRATION_FAILED);
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    try {
      const user = await this.prisma.user.create({
        data: { email, name: dto.name, passwordHash },
      });
      return this.buildAuthResponse(user, response);
    } catch (error) {
      this.logger.warn('Registration failed', error);
      throw new ConflictException(REGISTRATION_FAILED);
    }
  }

  async login(dto: LoginDto, response: Response): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    return this.buildAuthResponse(user, response);
  }

  getRefreshCookieName(): string {
    return this.authConfig.refreshCookieName;
  }

  async refresh(
    rawToken: string | undefined,
    response: Response,
  ): Promise<AuthResponse> {
    if (!rawToken) {
      throw new UnauthorizedException('Session expired');
    }

    const tokenHash = hashRefreshToken(rawToken);

    type LockedSessionRow = {
      id: string;
      userId: string;
      expiresAt: Date;
      revokedAt: Date | null;
      replacedById: string | null;
    };

    return this.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<LockedSessionRow[]>`
        SELECT id, "userId", "expiresAt", "revokedAt", "replacedById"
        FROM "Session"
        WHERE "refreshTokenHash" = ${tokenHash}
        FOR UPDATE
      `;

      const session = locked[0];
      if (!session) {
        throw new UnauthorizedException('Session expired');
      }

      if (session.revokedAt) {
        this.clearRefreshCookie(response);
        if (session.replacedById) {
          throw new UnauthorizedException('Session expired');
        }
        await tx.session.updateMany({
          where: { userId: session.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        throw new UnauthorizedException('Session reuse detected');
      }

      if (session.expiresAt < new Date()) {
        await tx.session.update({
          where: { id: session.id },
          data: { revokedAt: new Date() },
        });
        this.clearRefreshCookie(response);
        throw new UnauthorizedException('Session expired');
      }

      const user = await tx.user.findUnique({ where: { id: session.userId } });
      if (!user) {
        throw new UnauthorizedException('Session expired');
      }

      const rawRefresh = generateRefreshToken();
      const refreshTokenHash = hashRefreshToken(rawRefresh);
      const expiresAt = refreshExpiresAt(
        this.authConfig.refreshTokenExpiresDays,
      );

      const newSession = await tx.session.create({
        data: {
          userId: session.userId,
          refreshTokenHash,
          expiresAt,
        },
      });

      await tx.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date(), replacedById: newSession.id },
      });

      const accessToken = await this.signAccessToken(user);
      this.setRefreshCookie(response, rawRefresh);

      return {
        accessToken,
        user: this.toUserDto(user),
      };
    });
  }

  async logout(
    rawToken: string | undefined,
    response: Response,
  ): Promise<void> {
    if (rawToken) {
      const tokenHash = hashRefreshToken(rawToken);
      await this.prisma.session.updateMany({
        where: { refreshTokenHash: tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    this.clearRefreshCookie(response);
  }

  async getMe(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.toUserDto(user);
  }
}
