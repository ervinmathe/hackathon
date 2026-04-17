import { Injectable, Inject, ConflictException, UnauthorizedException } from '@nestjs/common';
import { Knex } from 'knex';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  async getUniversities() {
    return this.knex('universities').select('id', 'name', 'description');
  }

  async getEnrollmentsByUniversity(universityId: string) {
    return this.knex('enrollments').where({ university_id: universityId }).select('id', 'name', 'description');
  }

  async register(data: any) {
    const { username, email, password, university_id, enrollment_id, year } = data;

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
        university_id,
        enrollment_id,
        year: parseInt(year, 10),
      })
      .returning(['id', 'username', 'email', 'role', 'university_id', 'enrollment_id']);

    return user;
  }

  async login(data: any) {
    const { username, password } = data;
    
    const user = await this.knex('users').where({ username }).first();
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // In a real app we would return a JWT here. For simplicity in this Hackathon:
    return {
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        university_id: user.university_id,
        enrollment_id: user.enrollment_id
      }
    };
  }

  async updateProfile(id: string, data: any) {
    const { username, email, password, enrollment_id, year } = data;
    const updateData: any = {};

    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (year) updateData.year = parseInt(year, 10);
    if (enrollment_id) updateData.enrollment_id = enrollment_id;
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const [updatedUser] = await this.knex('users')
      .where({ id })
      .update(updateData)
      .returning(['id', 'username', 'email', 'role', 'university_id', 'enrollment_id', 'year']);

    return updatedUser;
  }
}
