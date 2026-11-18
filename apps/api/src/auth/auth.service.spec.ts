import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { hashRefreshToken } from './auth.tokens';

describe('AuthService', () => {
  let service: AuthService;
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    session: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
  };
  const jwtService = { signAsync: jest.fn().mockResolvedValue('access-token') };
  const response = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'auth') {
                return {
                  accessTokenSecret: 'secret',
                  accessTokenExpiresIn: '15m',
                  refreshTokenExpiresDays: 7,
                  refreshCookieName: 'syncboard_refresh',
                };
              }
              if (key === 'app') {
                return {
                  nodeEnv: 'test',
                  corsOrigin: 'http://localhost:3000',
                  port: 3001,
                };
              }
              return null;
            },
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    prisma.$transaction.mockImplementation(
      async (fn: (tx: typeof prisma) => Promise<void>) => fn(prisma),
    );
  });

  it('registers a new user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'u1',
      email: 'user@example.com',
      name: 'User',
      passwordHash: 'hash',
    });
    prisma.session.create.mockResolvedValue({ id: 's1' });

    const result = await service.register(
      {
        name: 'User',
        email: 'User@Example.com',
        password: 'Password1',
      },
      response,
    );

    expect(result.accessToken).toBe('access-token');
    expect(result.user.email).toBe('user@example.com');
    expect(response.cookie).toHaveBeenCalled();
  });

  it('rejects duplicate email registration without exposing enumeration details', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing' });
    await expect(
      service.register(
        { name: 'A', email: 'a@b.com', password: 'Password1' },
        response,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects invalid login credentials uniformly', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.login({ email: 'a@b.com', password: 'Password1' }, response),
    ).rejects.toThrow(UnauthorizedException);

    const hash = await argon2.hash('Password1', { type: argon2.argon2id });
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      name: 'A',
      passwordHash: hash,
    });
    await expect(
      service.login({ email: 'a@b.com', password: 'WrongPass1' }, response),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('logs in with valid credentials', async () => {
    const hash = await argon2.hash('Password1', { type: argon2.argon2id });
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      name: 'A',
      passwordHash: hash,
    });
    prisma.session.create.mockResolvedValue({ id: 's1' });

    const result = await service.login(
      { email: 'a@b.com', password: 'Password1' },
      response,
    );
    expect(result.accessToken).toBe('access-token');
    expect(response.cookie).toHaveBeenCalled();
  });

  it('rejects expired refresh sessions', async () => {
    prisma.$queryRaw.mockResolvedValue([
      {
        id: 'old',
        userId: 'u1',
        expiresAt: new Date(Date.now() - 60_000),
        revokedAt: null,
        replacedById: null,
      },
    ]);
    prisma.session.update.mockResolvedValue({});

    await expect(service.refresh('token', response)).rejects.toThrow(
      'Session expired',
    );
  });

  it('returns profile for getMe', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      name: 'A',
    });
    await expect(service.getMe('u1')).resolves.toEqual({
      id: 'u1',
      email: 'a@b.com',
      name: 'A',
    });
  });

  it('rotates refresh tokens', async () => {
    const raw = 'refresh-raw';
    prisma.$queryRaw.mockResolvedValue([
      {
        id: 'old',
        userId: 'u1',
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: null,
        replacedById: null,
      },
    ]);
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      name: 'A',
    });
    prisma.session.create.mockResolvedValue({ id: 'new' });

    const result = await service.refresh(raw, response);

    expect(result.accessToken).toBe('access-token');
    expect(prisma.session.update).toHaveBeenCalled();
    expect(prisma.session.create).toHaveBeenCalled();
  });

  it('rejects a rotated refresh token without mass revocation', async () => {
    prisma.$queryRaw.mockResolvedValue([
      {
        id: 'old',
        userId: 'u1',
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: new Date(),
        replacedById: 'replacement',
      },
    ]);

    await expect(service.refresh('token', response)).rejects.toThrow(
      'Session expired',
    );
    expect(prisma.session.updateMany).not.toHaveBeenCalled();
  });

  it('detects refresh token reuse after logout-style revocation', async () => {
    prisma.$queryRaw.mockResolvedValue([
      {
        id: 'old',
        userId: 'u1',
        expiresAt: new Date(Date.now() + 60_000),
        revokedAt: new Date(),
        replacedById: null,
      },
    ]);
    prisma.session.updateMany.mockResolvedValue({ count: 1 });

    await expect(service.refresh('token', response)).rejects.toThrow(
      'Session reuse detected',
    );
    expect(prisma.session.updateMany).toHaveBeenCalled();
  });

  it('hashes passwords with argon2id', async () => {
    const hash = await argon2.hash('Password1', { type: argon2.argon2id });
    expect(await argon2.verify(hash, 'Password1')).toBe(true);
  });

  it('logout revokes session by token hash', async () => {
    const raw = 'logout-token';
    prisma.session.updateMany.mockResolvedValue({ count: 1 });
    await service.logout(raw, response);
    expect(prisma.session.updateMany).toHaveBeenCalledWith({
      where: { refreshTokenHash: hashRefreshToken(raw), revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });
});
