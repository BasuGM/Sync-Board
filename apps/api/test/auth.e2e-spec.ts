import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
// CommonJS default interop differs under Jest/ts-jest for cookie-parser.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser');
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

const describeAuthE2e =
  process.env.RUN_DB_INTEGRATION === 'true' ? describe : describe.skip;

describeAuthE2e('Auth (e2e)', () => {
  let app: INestApplication;
  const email = `user-${Date.now()}@syncboard.test`;

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

  it('registers, returns me, refreshes, and logs out', async () => {
    const agent = request.agent(app.getHttpServer());

    const register = await agent
      .post('/api/v1/auth/register')
      .send({
        name: 'QA User',
        email,
        password: 'Password1',
      })
      .expect(201);

    expect(register.body.accessToken).toBeDefined();
    expect(register.body.user.email).toBe(email);

    const me = await agent
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${register.body.accessToken}`)
      .expect(200);
    expect(me.body.email).toBe(email);

    const refreshed = await agent.post('/api/v1/auth/refresh').expect(201);
    expect(refreshed.body.accessToken).toBeDefined();

    await agent.post('/api/v1/auth/logout').expect(201);
  });

  it('logs out with refresh cookie only and blocks subsequent refresh', async () => {
    const logoutEmail = `logout-${Date.now()}@syncboard.test`;
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/api/v1/auth/register')
      .send({ name: 'Logout QA', email: logoutEmail, password: 'Password1' })
      .expect(201);

    await agent.post('/api/v1/auth/logout').expect(201);
    await agent.post('/api/v1/auth/refresh').expect(401);
  });

  it('rejects whitespace-only registration names', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: '   ',
        email: `name-${Date.now()}@syncboard.test`,
        password: 'Password1',
      })
      .expect(400);
  });

  it('persists trimmed multi-word names', async () => {
    const trimmedEmail = `trim-${Date.now()}@syncboard.test`;
    const register = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: '  John   Doe  ',
        email: trimmedEmail,
        password: 'Password1',
      })
      .expect(201);
    expect(register.body.user.name).toBe('John Doe');
  });

  it('rejects unauthorized /auth/me', async () => {
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
  });

  it('rejects duplicate registration', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ name: 'User', email, password: 'Password1' })
      .expect(409);
  });

  it('rejects invalid login credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'WrongPass1' })
      .expect(401);
  });
});
