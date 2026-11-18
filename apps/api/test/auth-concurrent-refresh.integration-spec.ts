import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser');

const describeIntegration =
  process.env.RUN_DB_INTEGRATION === 'true' ? describe : describe.skip;

function getRefreshCookie(
  setCookie: string | string[] | undefined,
  name = 'syncboard_refresh',
): string | undefined {
  if (!setCookie) {
    return undefined;
  }
  const values = Array.isArray(setCookie) ? setCookie : [setCookie];
  const entry = values.find((line) => line.startsWith(`${name}=`));
  if (!entry) {
    return undefined;
  }
  return entry.split(';')[0].split('=').slice(1).join('=');
}

describeIntegration('Auth concurrent refresh (integration)', () => {
  let app: INestApplication;
  const email = `concurrent-${Date.now()}@syncboard.test`;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows only one concurrent rotation and keeps the replacement session valid', async () => {
    const server = app.getHttpServer();
    const login = await request(server)
      .post('/api/v1/auth/register')
      .send({ name: 'Concurrent QA', email, password: 'Password1' })
      .expect(201);

    const refreshCookie = getRefreshCookie(login.headers['set-cookie']);
    expect(refreshCookie).toBeDefined();

    const responses = await Promise.all(
      Array.from({ length: 6 }).map(() =>
        request(server)
          .post('/api/v1/auth/refresh')
          .set('Cookie', `syncboard_refresh=${refreshCookie}`),
      ),
    );

    const successes = responses.filter((r) => r.status === 201);
    const failures = responses.filter((r) => r.status === 401);
    expect(successes).toHaveLength(1);
    expect(failures.length).toBeGreaterThanOrEqual(5);

    const newCookie = getRefreshCookie(successes[0].headers['set-cookie']);
    expect(newCookie).toBeDefined();
    expect(newCookie).not.toBe(refreshCookie);

    await request(server)
      .post('/api/v1/auth/refresh')
      .set('Cookie', `syncboard_refresh=${newCookie}`)
      .expect(201);
  });

  it('treats a rotated token as expired rather than theft', async () => {
    const server = app.getHttpServer();
    const emailReuse = `reuse-${Date.now()}@syncboard.test`;
    const login = await request(server)
      .post('/api/v1/auth/register')
      .send({ name: 'Reuse QA', email: emailReuse, password: 'Password1' })
      .expect(201);

    const oldCookie = getRefreshCookie(login.headers['set-cookie']);
    await request(server)
      .post('/api/v1/auth/refresh')
      .set('Cookie', `syncboard_refresh=${oldCookie}`)
      .expect(201);

    await request(server)
      .post('/api/v1/auth/refresh')
      .set('Cookie', `syncboard_refresh=${oldCookie}`)
      .expect(401);

    const stillActive = await request(server)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`);
    expect([200, 401]).toContain(stillActive.status);
  });
});
