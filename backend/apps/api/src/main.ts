import { NestFactory } from '@nestjs/core';
import { ApiModule } from './api.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

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

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Hackathon API')
    .setDescription('The public API for the Thanatos project')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`API is running on: http://localhost:${port}`);
  console.log(`API Swagger Docs: http://localhost:${port}/docs`);
}
bootstrap();

