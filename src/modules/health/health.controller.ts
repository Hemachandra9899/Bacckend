import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { HealthService } from './health.service';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  getHealthRoot(@Res() res: Response) {
    return res.json(this.healthService.getHealth());
  }

  @Get('api/health')
  getHealthApi(@Res() res: Response) {
    return res.json(this.healthService.getHealth());
  }
}
