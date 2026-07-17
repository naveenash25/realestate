import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody: true is required for Razorpay webhook signature verification
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });

  // Local dev fallback for file storage (STORAGE_DRIVER=local, the default) —
  // serves backend/uploads/ directly. Not used when STORAGE_DRIVER=gcs.
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  const port = process.env.PORT || 8080;
  await app.listen(port);
  console.log(`Backend running on port ${port}`);
}
bootstrap();
