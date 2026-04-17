import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';

@Injectable()
export class ForumsService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  async findAll(universityId?: string, enrollmentId?: string, search?: string) {
    const query = this.knex('forums').select('*');
    if (universityId) {
      query.where({ university_id: universityId });
    }
    if (enrollmentId) {
      query.where({ enrollment_id: enrollmentId });
    }

    if (search && search.trim().length >= 3) {
      const searchTerms = search.trim().split(/\s+/);
      query.where((qb) => {
        searchTerms.forEach((term) => {
          if (term.length >= 3) {
            qb.orWhere('name', 'ILIKE', `%${term}%`);
          }
        });
      });
    }

    return query;
  }

  async findPostsByForum(forumId: string) {
    const posts = await this.knex('posts')
      .where({ forum_id: forumId })
      .select('*')
      .orderBy('created_at', 'desc');

    // Attachments for each post
    const postsWithAttachments = await Promise.all(
      posts.map(async (post) => {
        const attachments = await this.knex('post_attachments')
          .where({ post_id: post.id })
          .select('*');
        return { ...post, attachments };
      }),
    );

    return postsWithAttachments;
  }
}
