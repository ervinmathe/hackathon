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
}
