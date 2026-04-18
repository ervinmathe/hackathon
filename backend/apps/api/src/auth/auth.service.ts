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
    console.log('--- Register Step 1: Data received', data);
    const { username, email, password, university_id, enrollment_id, year } = data;

    try {
      console.log('--- Register Step 2: Checking existing user');
      const existingUser = await this.knex('users')
        .where({ email })
        .orWhere({ username })
        .first();

      if (existingUser) {
        console.log('--- Register Step 2b: User already exists');
        throw new ConflictException('Username or email already exists');
      }

      console.log('--- Register Step 3: Hashing password');
      const hashedPassword = await bcrypt.hash(password, 10);

      const parsedYear = parseInt(year, 10);
      const finalYear = isNaN(parsedYear) ? 1 : parsedYear;

      console.log('--- Register Step 4: Resolving university_id');
      let finalUniversityId = university_id;
      if (!finalUniversityId) {
        console.log('--- Register Step 4b: No university_id, fetching first from DB');
        const firstUni = await this.knex('universities').first();
        finalUniversityId = firstUni?.id;
        console.log('--- Register Step 4c: Fallback university found:', finalUniversityId);
      }

      if (!finalUniversityId) {
        console.error('--- Register ERROR: No university found in DB to link user to!');
        throw new ConflictException('Please create a university first in the Admin panel');
      }

      console.log('--- Register Step 5: Inserting user into DB');
      const [user] = await this.knex('users')
        .insert({
          username,
          email,
          password: hashedPassword,
          university_id: finalUniversityId,
          enrollment_id: enrollment_id || null,
          year: finalYear,
        })
        .returning(['id', 'username', 'email', 'role', 'university_id', 'enrollment_id', 'profile_url']);

      console.log('--- Register SUCCESS: User created', user.id);
      return user;
    } catch (error) {
      console.error('--- Register FATAL ERROR:', error);
      throw error;
    }
  }

  async login(data: any) {
    const { email, username, password } = data;
    
    // Support both 'email' and 'username' keys from frontend
    const identifier = email || username;

    if (!identifier) {
      throw new UnauthorizedException('Username or Email is required');
    }

    const user = await this.knex('users')
      .where({ email: identifier })
      .orWhere({ username: identifier })
      .first();
    
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
        enrollment_id: user.enrollment_id,
        profile_url: user.profile_url
      }
    };
  }

  async getUser(id: string) {
    const user = await this.knex('users')
      .where({ id })
      .select('id', 'username', 'email', 'role', 'university_id', 'enrollment_id', 'year', 'profile_url', 'preferences')
      .first();
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  async updateProfile(id: string, data: any) {
    console.log(`Updating profile for ID: ${id}`, data);
    const { username, email, password, enrollment_id, year, profile_url } = data;
    const updateData: any = {};

    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (year) updateData.year = parseInt(year, 10);
    if (enrollment_id) updateData.enrollment_id = enrollment_id;
    if (profile_url) updateData.profile_url = profile_url;
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    try {
      // Megpróbáljuk UUID-ként kezelni, de ha a DB integer-t vár, itt lehet a hiba
      const [updatedUser] = await this.knex('users')
        .where({ id })
        .update(updateData)
        .returning(['id', 'username', 'email', 'role', 'university_id', 'enrollment_id', 'year', 'profile_url']);

      console.log('Update result:', updatedUser);

      if (!updatedUser) {
        console.error(`User with ID ${id} not found in DB!`);
        throw new UnauthorizedException('User not found');
      }
      return updatedUser;
    } catch (error) {
      console.error('Database Update Error:', error);
      if (error.code === '23505') {
        throw new ConflictException('Username or email already taken');
      }
      throw error;
    }
  }
}
