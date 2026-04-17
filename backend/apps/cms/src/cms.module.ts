import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
  ],
  controllers: [CmsController],
  providers: [CmsService],
})
export class CmsModule {}
