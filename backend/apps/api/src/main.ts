import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ApiModule } from './api.module';

// Kényszerített betöltés
dotenv.config({ path: join(process.cwd(), '.env') });

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(ApiModule);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow local development and the cloudflare tunnel
      if (!origin || origin.includes('localhost') || origin.includes('trycloudflare.com')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

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
