import { Controller, Get, HttpCode, Res } from '@nestjs/common';
import type { Response } from 'express';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HttpCode(200)
  async getHealth(@Res() response: Response) {
    const { body, httpStatus } = await this.healthService.getHealth();
    return response.status(httpStatus).json(body);
  }
}
