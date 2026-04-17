import { Controller, Get, Session, Res, Render } from '@nestjs/common';
import * as express from 'express';
import { CmsService } from './cms.service';

@Controller()
export class CmsGuiController {
  constructor(private readonly cmsService: CmsService) {}

  @Get()
  index(@Res() res: express.Response) {
    return res.redirect('/dashboard');
  }

  @Get('dashboard')
  async dashboard(@Session() session: any, @Res() res: express.Response) {
    if (!session || !session.userRole) {
      return res.redirect('/login');
    }

    const universities = await this.cmsService.getAllUniversities();
    const enrollments = await this.cmsService.getAllEnrollments();
    const forums = await this.cmsService.getAllForums();
    const users = await this.cmsService.getAllUsers();
    const posts = await this.cmsService.getAllPosts();

    return res.render('dashboard', {
      universities,
      enrollments,
      forums,
      users,
      posts,
      userRole: session.userRole,
    });
  }
}
