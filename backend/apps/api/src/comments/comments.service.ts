import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';

@Injectable()
export class CommentsService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  async create(postId: string, authorId: string, content: string) {
    const [comment] = await this.knex('comments')
      .insert({
        post_id: postId,
        author_id: authorId,
        content,
      })
      .returning('*');
    return comment;
  }

  async findByPost(postId: string) {
    return this.knex('comments')
      .join('users', 'comments.author_id', 'users.id')
      .where({ post_id: postId })
      .select(
        'comments.*',
        'users.username as author_name'
      )
      .orderBy('comments.created_at', 'asc');
  }

  async update(id: string, content: string) {
    const [updatedComment] = await this.knex('comments')
      .where({ id })
      .update({ content })
      .returning('*');
    return updatedComment;
  }

  async delete(id: string) {
    return this.knex('comments').where({ id }).del();
  }
}
