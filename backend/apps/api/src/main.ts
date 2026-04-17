import { NestFactory } from '@nestjs/core';
import { ApiModule } from './api.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(ApiModule);

  app.enableCors(); // allow the frontend to access the API

  // Serve static files from 'public' folder
  app.useStaticAssets(join(__dirname, '..', '..', '..', 'public'), {
    prefix: '/public/',
  });

  // Increase limits for file uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`API is running on: http://localhost:${port}`);
}
bootstrap();

