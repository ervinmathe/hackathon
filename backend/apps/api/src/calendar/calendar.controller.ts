import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CalendarService } from './calendar.service';

@ApiTags('calendar')
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  @ApiOperation({ summary: 'Get calendar events' })
  @ApiQuery({ name: 'universityId', required: false })
  @ApiQuery({ name: 'enrollmentId', required: false })
  async findAll(
    @Query('universityId') universityId?: string,
    @Query('enrollmentId') enrollmentId?: string,
  ) {
    return this.calendarService.findAll(universityId, enrollmentId);
  }
}
