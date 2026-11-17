import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const runDbIntegration = process.env.RUN_DB_INTEGRATION === 'true';

(runDbIntegration ? describe : describe.skip)(
  'Health database integration',
  () => {
    let app: INestApplication;

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      app.setGlobalPrefix('api/v1');
      await app.init();
    });

    afterAll(async () => {
      const prisma = app.get(PrismaService);
      await prisma.$disconnect();
      await app.close();
    });

    it('reports database up when PostgreSQL is available', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/health');

      expect(response.status).toBe(200);
      expect(response.body.checks.database.status).toBe('up');
    });
  },
);
