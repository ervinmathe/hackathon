import { Controller, Get, Post, Body, Session, Res, Render } from '@nestjs/common';
import * as express from 'express';

@Controller()
export class AuthGuiController {
  @Get('login')
  @Render('login')
  getLogin(@Session() session: any) {
    if (session && session.isAdmin) {
      return { redirect: '/dashboard' };
    }
    return { error: null };
  }

  @Post('login')
  async login(@Body() body: any, @Session() session: any, @Res() res: express.Response) {
    const { username, password } = body;
    if (username === 'admin' && password === 'admin') {
      session.isAdmin = true;
      return res.redirect('/dashboard');
    }
    return res.render('login', { error: 'Érvénytelen felhasználónév vagy jelszó' });
  }

  @Get('logout')
  logout(@Session() session: any, @Res() res: express.Response) {
    if (session) {
      session.isAdmin = false;
    }
    return res.redirect('/login');
  }
}
