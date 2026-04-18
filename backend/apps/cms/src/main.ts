import { NestFactory } from '@nestjs/core';
import { CmsModule } from './cms.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const session = require('express-session');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(CmsModule);
  
  // EJS setup
  app.setBaseViewsDir(join(__dirname, '..', '..', '..', 'apps/cms/views'));
  app.setViewEngine('ejs');

  // Static assets
  app.useStaticAssets(join(__dirname, '..', '..', '..', 'public'), {
    prefix: '/public/',
  });

  // Session setup
  app.use(
    session({
      secret: 'hackathon-secret-123',
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 3600000 }, // 1 hour
    }),
  );

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Hackathon CMS API')
    .setDescription('The administrative CMS API for the Thanatos project')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`CMS is running on: http://localhost:${port}`);
  console.log(`CMS Swagger Docs: http://localhost:${port}/docs`);
  console.log(`CMS Login Page: http://localhost:${port}/login`);
}
bootstrap();
