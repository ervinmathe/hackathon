import { NestFactory } from '@nestjs/core';
import { CmsModule } from './cms.module';

async function bootstrap() {
  const app = await NestFactory.create(CmsModule);
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`CMS is running on: http://localhost:${port}`);
}
bootstrap();

