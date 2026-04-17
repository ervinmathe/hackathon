import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';

@Injectable()
export class CmsService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  async createEnrollment(data: { name: string; description?: string }) {
    const [enrollment] = await this.knex('enrollments')
      .insert(data)
      .returning('*');
    return enrollment;
  }

  async getAllEnrollments() {
    return this.knex('enrollments').select('*').orderBy('name', 'asc');
  }

  async createForum(data: { name: string; description?: string; enrollment_id: string }) {
    const [forum] = await this.knex('forums')
      .insert(data)
      .returning('*');
    return forum;
  }

  async getAllForums() {
    return this.knex('forums').select('*').orderBy('name', 'asc');
  }
}
