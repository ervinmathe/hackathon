import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CmsService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  // --- Universities ---
  async createUniversity(data: { name: string; description?: string }) {
    const [university] = await this.knex('universities')
      .insert(data)
      .returning('*');
    return university;
  }

  async getAllUniversities() {
    return this.knex('universities').select('*').orderBy('name', 'asc');
  }

  async deleteUniversity(id: string) {
    const deletedCount = await this.knex('universities').where({ id }).del();
    if (deletedCount === 0) throw new NotFoundException('University not found');
    return { success: true };
  }

  // --- Enrollments (Szakok) ---
  async createEnrollment(data: { name: string; description?: string; university_id: string }) {
    const [enrollment] = await this.knex('enrollments')
      .insert(data)
      .returning('*');
    return enrollment;
  }

  async updateEnrollment(id: string, data: { name?: string; description?: string; university_id?: string }) {
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
    return this.knex('enrollments')
      .join('universities', 'enrollments.university_id', 'universities.id')
      .select('enrollments.*', 'universities.name as university_name')
      .orderBy('enrollments.name', 'asc');
  }

  // --- Forums (Subjects) ---
  async createForum(data: { name: string; description?: string; enrollment_id: string; university_id: string }) {
    const [forum] = await this.knex('forums')
      .insert(data)
      .returning('*');
    return forum;
  }

  async updateForum(id: string, data: { name?: string; description?: string; enrollment_id?: string; university_id?: string }) {
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
    return this.knex('forums')
      .join('universities', 'forums.university_id', 'universities.id')
      .join('enrollments', 'forums.enrollment_id', 'enrollments.id')
      .select('forums.*', 'universities.name as university_name', 'enrollments.name as enrollment_name')
      .orderBy('forums.name', 'asc');
  }

  // --- Users Management ---
  async createUser(data: { username: string; email: string; password: string; role: string; enrollment_id?: string; university_id: string; year?: number }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const [user] = await this.knex('users')
      .insert({
        ...data,
        password: hashedPassword,
      })
      .returning(['id', 'username', 'email', 'role']);
    return user;
  }

  async getAllUsers() {
    return this.knex('users')
      .leftJoin('universities', 'users.university_id', 'universities.id')
      .leftJoin('enrollments', 'users.enrollment_id', 'enrollments.id')
      .select('users.id', 'users.username', 'users.email', 'users.role', 'users.year', 'users.created_at', 'universities.name as university_name', 'enrollments.name as enrollment_name');
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

  // --- Comments Moderation ---
  async getAllComments() {
    return this.knex('comments')
      .join('users', 'comments.author_id', 'users.id')
      .join('posts', 'comments.post_id', 'posts.id')
      .select('comments.*', 'users.username as author_name', 'posts.title as post_title')
      .orderBy('comments.created_at', 'desc');
  }

  async deleteComment(id: string) {
    const deletedCount = await this.knex('comments').where({ id }).del();
    if (deletedCount === 0) throw new NotFoundException('Comment not found');
    return { success: true };
  }

  // --- Calendar Management ---
  async getAllEvents() {
    return this.knex('calendar_events')
      .join('users', 'calendar_events.created_by', 'users.id')
      .leftJoin('universities', 'calendar_events.university_id', 'universities.id')
      .select('calendar_events.*', 'users.username as author_name', 'universities.name as university_name')
      .orderBy('calendar_events.start_time', 'asc');
  }
}
