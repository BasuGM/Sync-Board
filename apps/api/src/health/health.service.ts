import { Injectable, Logger } from '@nestjs/common';
import type { HealthResponse } from '@syncboard/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getHealth(): Promise<{ body: HealthResponse; httpStatus: number }> {
    const timestamp = new Date().toISOString();
    let databaseStatus: HealthResponse['checks']['database'] = { status: 'up' };

    try {
      await this.prisma.pingDatabase();
    } catch (error) {
      this.logger.warn('Database health check failed', error);
      databaseStatus = {
        status: 'down',
        message: 'Unable to reach PostgreSQL',
      };
    }

    const liveness = { status: 'up' as const };
    const checks = { liveness, database: databaseStatus };
    const overallStatus = databaseStatus.status === 'up' ? 'ok' : 'degraded';

    return {
      httpStatus: overallStatus === 'ok' ? 200 : 503,
      body: {
        status: overallStatus,
        timestamp,
        checks,
      },
    };
  }
}
