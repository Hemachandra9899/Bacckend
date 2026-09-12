import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 5000;
  const allowedOrigins = configService.get<string[]>('cors.allowedOrigins') || [];

  // Enable CORS
  app.enableCors({
    origin: (origin, callback) => {
      // Allow server-to-server, curl, Postman where origin is undefined
      if (!origin) {
        return callback(null, true);
      }
      const normalizedOrigin = origin.replace(/\/$/, '');
      const normalizedAllowed = allowedOrigins.map((o) => o.replace(/\/$/, ''));
      if (
        normalizedAllowed.includes(normalizedOrigin) ||
        normalizedOrigin.endsWith('.vercel.app') ||
        /^http:\/\/localhost(:\d+)?$/.test(normalizedOrigin)
      ) {
        return callback(null, true);
      }
      logger.warn(`❌ CORS blocked for origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Global exception filter and request logging interceptor
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Graceful shutdown hooks
  app.enableShutdownHooks();

  await app.listen(port);

  logger.log('='.repeat(50));
  logger.log('🚀 SECOND BRAIN NESTJS API SERVER');
  logger.log('='.repeat(50));
  logger.log(`📍 Server running on http://localhost:${port}`);
  logger.log(`📍 Health check: http://localhost:${port}/`);
  logger.log('='.repeat(50));
}

bootstrap();
