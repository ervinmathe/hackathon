import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';

@Injectable()
export class PostsService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  async createPost(data: any, attachments?: any[]) {
    return this.knex.transaction(async (trx) => {
      const [post] = await trx('posts')
        .insert({
          forum_id: data.forum_id,
          author_id: data.author_id,
          title: data.title,
          description: data.description,
          content: data.content,
        })
        .returning('*');

      if (attachments && attachments.length > 0) {
        const attachmentData = attachments.map((att) => ({
          post_id: post.id,
          file_name: att.originalname,
          file_url: `/public/uploads/${att.filename}`, // Serve via express static
          file_type: att.mimetype,
        }));
        await trx('post_attachments').insert(attachmentData);
      }

      const postWithAttachments = await trx('posts')
        .where({ id: post.id })
        .first();
      
      const savedAttachments = await trx('post_attachments')
        .where({ post_id: post.id })
        .select('*');

      return { ...postWithAttachments, attachments: savedAttachments };
    });
  }

  async findOne(id: string) {
    const post = await this.knex('posts')
      .join('users', 'posts.author_id', 'users.id')
      .where('posts.id', id)
      .select('posts.*', 'users.username as author_name')
      .first();

    if (!post) return null;

    const attachments = await this.knex('post_attachments')
      .where({ post_id: id })
      .select('*');

    const comments = await this.knex('comments')
      .join('users', 'comments.author_id', 'users.id')
      .where({ post_id: id })
      .select('comments.*', 'users.username as author_name')
      .orderBy('created_at', 'asc');

    return { ...post, attachments, comments };
  }

  async update(id: string, data: any) {
    const [updatedPost] = await this.knex('posts')
      .where({ id })
      .update({
        title: data.title,
        description: data.description,
        content: data.content,
        updated_at: this.knex.fn.now(),
      })
      .returning('*');
    return updatedPost;
  }

  async delete(id: string) {
    return this.knex('posts').where({ id }).del();
  }

  async removeAttachment(attachmentId: string) {
    return this.knex('post_attachments').where({ id: attachmentId }).del();
  }
}
