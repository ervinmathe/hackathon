import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { Knex } from 'knex';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  async getEnrollments() {
    return this.knex('enrollments').select('*');
  }

  async register(data: any) {
    const { username, email, password, enrollment_id, year } = data;

    const existingUser = await this.knex('users')
      .where({ email })
      .orWhere({ username })
      .first();

    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [user] = await this.knex('users')
      .insert({
        username,
        email,
        password: hashedPassword,
        enrollment_id,
        year: parseInt(year, 10),
      })
      .returning(['id', 'username', 'email', 'role']);

    return user;
  }
}
