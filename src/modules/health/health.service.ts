import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getHealth() {
    return {
      status: 'ok',
      service: 'second-brain-api',
      uptime: `${Math.floor(process.uptime())}s`,
      timestamp: new Date().toISOString(),
      memoryUsage: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      },
      environment: process.env.NODE_ENV || 'production',
    };
  }
}
