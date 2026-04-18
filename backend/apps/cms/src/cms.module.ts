import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';
import { AuthGuiController } from './auth-gui.controller';
import { CmsGuiController } from './cms-gui.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
  ],
  controllers: [
    CmsController,
    AuthGuiController,
    CmsGuiController,
  ],
  providers: [CmsService],
})
export class CmsModule {}
