import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';

@Injectable()
export class CmsService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  // --- Enrollments (Szakok) ---
  async createEnrollment(data: { name: string; description?: string }) {
    const [enrollment] = await this.knex('enrollments')
      .insert(data)
      .returning('*');
    return enrollment;
  }

  async updateEnrollment(id: string, data: { name?: string; description?: string }) {
    const [enrollment] = await this.knex('enrollments')
      .where({ id })
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    return enrollment;
  }

  async deleteEnrollment(id: string) {
    const deletedCount = await this.knex('enrollments').where({ id }).del();
    if (deletedCount === 0) throw new NotFoundException('Enrollment not found');
    return { success: true };
  }

  async getAllEnrollments() {
    return this.knex('enrollments').select('*').orderBy('name', 'asc');
  }

  // --- Forums (Subjects) ---
  async createForum(data: { name: string; description?: string; enrollment_id: string }) {
    const [forum] = await this.knex('forums')
      .insert(data)
      .returning('*');
    return forum;
  }

  async updateForum(id: string, data: { name?: string; description?: string; enrollment_id?: string }) {
    const [forum] = await this.knex('forums')
      .where({ id })
      .update({ ...data, updated_at: new Date() })
      .returning('*');
    if (!forum) throw new NotFoundException('Forum not found');
    return forum;
  }

  async deleteForum(id: string) {
    const deletedCount = await this.knex('forums').where({ id }).del();
    if (deletedCount === 0) throw new NotFoundException('Forum not found');
    return { success: true };
  }

  async getAllForums() {
    return this.knex('forums').select('*').orderBy('name', 'asc');
  }

  // --- Users Management ---
  async getAllUsers() {
    return this.knex('users').select('id', 'username', 'email', 'role', 'enrollment_id', 'year', 'created_at');
  }

  async deleteUser(id: string) {
    const deletedCount = await this.knex('users').where({ id }).del();
    if (deletedCount === 0) throw new NotFoundException('User not found');
    return { success: true };
  }

  // --- Posts & Attachments ---
  async getAllPosts() {
    return this.knex('posts')
      .join('users', 'posts.author_id', 'users.id')
      .join('forums', 'posts.forum_id', 'forums.id')
      .select('posts.*', 'users.username as author_name', 'forums.name as forum_name')
      .orderBy('posts.created_at', 'desc');
  }

  async deletePost(id: string) {
    const deletedCount = await this.knex('posts').where({ id }).del();
    if (deletedCount === 0) throw new NotFoundException('Post not found');
    return { success: true };
  }
}
