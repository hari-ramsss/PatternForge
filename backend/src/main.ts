import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Verify critical environment variables in production
  if (process.env.NODE_ENV === 'production') {
    const requiredEnv = ['DATABASE_URL', 'REDIS_URL', 'JWT_SECRET'];
    const missing = requiredEnv.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      logger.error(`FATAL: Missing required environment variables in production: ${missing.join(', ')}`);
      process.exit(1);
    }
  }

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // Production-safe CORS configuration
  const frontendUrl = process.env.FRONTEND_URL;
  const allowedOrigins: string[] = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  if (frontendUrl) {
    const customOrigins = frontendUrl.split(',').map((o) => o.trim()).filter(Boolean);
    allowedOrigins.push(...customOrigins);
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin) || (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy: Origin ${origin} is not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  logger.log(`Application running on port ${port}`);
}
bootstrap();

