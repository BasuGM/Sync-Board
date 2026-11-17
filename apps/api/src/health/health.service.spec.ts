import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let prisma: { pingDatabase: jest.Mock };

  beforeEach(async () => {
    prisma = { pingDatabase: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(HealthService);
  });

  it('returns ok when database is reachable', async () => {
    const result = await service.getHealth();
    expect(result.httpStatus).toBe(200);
    expect(result.body.status).toBe('ok');
    expect(result.body.checks.liveness.status).toBe('up');
    expect(result.body.checks.database.status).toBe('up');
  });

  it('returns degraded when database is unreachable', async () => {
    prisma.pingDatabase.mockRejectedValueOnce(new Error('connection refused'));
    const result = await service.getHealth();
    expect(result.httpStatus).toBe(503);
    expect(result.body.status).toBe('degraded');
    expect(result.body.checks.database.status).toBe('down');
  });
});
