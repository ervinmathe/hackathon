import { Controller, Get, Post, Body, Session, Res, Render, Inject } from '@nestjs/common';
import * as express from 'express';
import { Knex } from 'knex';
import * as bcrypt from 'bcrypt';

@Controller()
export class AuthGuiController {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  @Get('login')
  @Render('login')
  getLogin(@Session() session: any) {
    if (session && session.userRole) {
      return { redirect: '/dashboard' };
    }
    return { error: null };
  }

  @Post('login')
  async login(@Body() body: any, @Session() session: any, @Res() res: express.Response) {
    const { username, password } = body;

    const user = await this.knex('users').where({ username }).first();

    if (user && (await bcrypt.compare(password, user.password))) {
      if (user.role === 'ADMIN' || user.role === 'LESSADMIN') {
        session.userRole = user.role;
        session.userId = user.id;
        return res.redirect('/dashboard');
      }
      return res.render('login', { error: 'Nincs adminisztrátori jogosultságod' });
    }

    return res.render('login', { error: 'Érvénytelen felhasználónév vagy jelszó' });
  }

  @Get('logout')
  logout(@Session() session: any, @Res() res: express.Response) {
    if (session) {
      session.userRole = null;
    }
    return res.redirect('/login');
  }
}
