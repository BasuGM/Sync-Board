import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser');
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { hashInvitationToken } from '../src/workspaces/workspace.tokens';

const runDbIntegration = process.env.RUN_DB_INTEGRATION === 'true';

(runDbIntegration ? describe : describe.skip)(
  'Workspaces (integration)',
  () => {
    let app: INestApplication;
    let prisma: PrismaService;

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      app.setGlobalPrefix('api/v1');
      app.use(cookieParser());
      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
        }),
      );
      await app.init();
      prisma = app.get(PrismaService);
    });

    afterAll(async () => {
      await prisma.$disconnect();
      await app.close();
    });

    async function registerUser(name: string, email: string) {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ name, email, password: 'Password1' })
        .expect(201);
      return response.body.accessToken as string;
    }

    it('creates workspace with owner membership and enforces isolation', async () => {
      const ownerToken = await registerUser(
        'Owner',
        `owner-${Date.now()}@syncboard.test`,
      );
      const outsiderToken = await registerUser(
        'Outsider',
        `outsider-${Date.now()}@syncboard.test`,
      );

      const created = await request(app.getHttpServer())
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Platform Team' })
        .expect(201);

      expect(created.body.role).toBe('OWNER');
      expect(created.body.memberCount).toBe(1);

      await request(app.getHttpServer())
        .get(`/api/v1/workspaces/${created.body.id}`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .expect(404);

      const list = await request(app.getHttpServer())
        .get('/api/v1/workspaces')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(list.body).toHaveLength(1);
    });

    it('accepts invitations atomically and rejects email mismatch', async () => {
      const ownerToken = await registerUser(
        'Inviter',
        `inviter-${Date.now()}@syncboard.test`,
      );
      const inviteeEmail = `invitee-${Date.now()}@syncboard.test`;
      const inviteeToken = await registerUser('Invitee', inviteeEmail);
      const wrongToken = await registerUser(
        'Wrong',
        `wrong-${Date.now()}@syncboard.test`,
      );

      const workspace = await request(app.getHttpServer())
        .post('/api/v1/workspaces')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Invite Flow' })
        .expect(201);

      const invitation = await request(app.getHttpServer())
        .post(`/api/v1/workspaces/${workspace.body.id}/invitations`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ email: inviteeEmail, role: 'MEMBER' })
        .expect(201);

      const token = new URL(invitation.body.invitationUrl).searchParams.get(
        'token',
      );
      expect(token).toBeTruthy();

      await request(app.getHttpServer())
        .post('/api/v1/invitations/accept')
        .set('Authorization', `Bearer ${wrongToken}`)
        .send({ token })
        .expect(403);

      await request(app.getHttpServer())
        .post('/api/v1/invitations/accept')
        .set('Authorization', `Bearer ${inviteeToken}`)
        .send({ token })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/v1/invitations/accept')
        .set('Authorization', `Bearer ${inviteeToken}`)
        .send({ token })
        .expect(400);

      const stored = await prisma.workspaceInvitation.findFirst({
        where: { tokenHash: hashInvitationToken(token!) },
      });
      expect(stored?.acceptedAt).not.toBeNull();
    });
  },
);
