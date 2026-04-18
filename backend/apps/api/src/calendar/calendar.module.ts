import { Module } from '@nestjs/common';
import { DatabaseModule } from '@app/database';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CalendarController],
  providers: [CalendarService],
})
export class CalendarModule {}
