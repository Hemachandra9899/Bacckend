import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KeepAliveService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KeepAliveService.name);
  private timer: NodeJS.Timeout | null = null;
  // Runs every 3.5 minutes (210,000 ms) to keep Render awake (15 min sleep limit)
  private readonly intervalMs = 3.5 * 60 * 1000;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.startKeepAlive();
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private startKeepAlive() {
    const port = this.configService.get<number>('port') || 5001;
    const isProduction = process.env.NODE_ENV === 'production';

    const baseUrl =
      process.env.RENDER_EXTERNAL_URL ||
      process.env.KEEP_ALIVE_URL ||
      (isProduction
        ? 'https://portfolio-bacckend.onrender.com'
        : `http://localhost:${port}`);

    const healthUrl = baseUrl.endsWith('/health')
      ? baseUrl
      : `${baseUrl.replace(/\/$/, '')}/health`;

    this.logger.log(`⏰ Render Keep-Alive job scheduled every 3.5 mins to: ${healthUrl}`);

    // Initial ping after 15 seconds
    setTimeout(() => this.ping(healthUrl), 15000);

    // Periodic ping every 3.5 minutes
    this.timer = setInterval(() => {
      this.ping(healthUrl);
    }, this.intervalMs);
  }

  private async ping(url: string) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        this.logger.log(`💓 Keep-Alive self-ping successful (${res.status}) -> ${url}`);
      } else {
        this.logger.warn(`⚠️  Keep-Alive self-ping returned status ${res.status}`);
      }
    } catch (err: any) {
      this.logger.warn(`⚠️  Keep-Alive self-ping warning: ${err.message}`);
    }
  }
}
