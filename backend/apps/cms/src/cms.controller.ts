import { Controller, Get, Post, Body } from '@nestjs/common';
import { CmsService } from './cms.service';

@Controller('cms')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Get('enrollments')
  async getAllEnrollments() {
    return this.cmsService.getAllEnrollments();
  }

  @Post('enrollments')
  async createEnrollment(@Body() data: { name: string; description?: string }) {
    return this.cmsService.createEnrollment(data);
  }

  @Get('forums')
  async getAllForums() {
    return this.cmsService.getAllForums();
  }

  @Post('forums')
  async createForum(@Body() data: { name: string; description?: string; enrollment_id: string }) {
    return this.cmsService.createForum(data);
  }
}
