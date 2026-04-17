import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CalendarService } from './calendar.service';

@ApiTags('calendar')
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  @ApiOperation({ summary: 'Get approved calendar events' })
  @ApiQuery({ name: 'universityId', required: false })
  @ApiQuery({ name: 'enrollmentId', required: false })
  async findAll(
    @Query('universityId') universityId?: string,
    @Query('enrollmentId') enrollmentId?: string,
  ) {
    return this.calendarService.findAll(universityId, enrollmentId, true);
  }

  @Post()
  @ApiOperation({ summary: 'Create a calendar event (pending approval for USERS)' })
  async create(@Body() body: any) {
    return this.calendarService.create(body);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a calendar event' })
  async approve(@Param('id') id: string) {
    return this.calendarService.approve(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a calendar event' })
  async delete(@Param('id') id: string) {
    return this.calendarService.delete(id);
  }
}
