import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';

@Injectable()
export class CalendarService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  async findAll(universityId?: string, enrollmentId?: string, onlyApproved = true) {
    const query = this.knex('calendar_events')
      .join('users', 'calendar_events.created_by', 'users.id')
      .select('calendar_events.*', 'users.username as author_name');

    if (onlyApproved) {
      query.where('calendar_events.is_approved', true);
    }

    if (universityId) {
      query.where('calendar_events.university_id', universityId);
    }
    
    if (enrollmentId) {
      query.where((qb) => {
        qb.where({ enrollment_id: enrollmentId }).orWhereNull('enrollment_id');
      });
    }

    return query.orderBy('start_time', 'asc');
  }

  async create(data: any) {
    const { created_by, ...eventData } = data;
    
    // Check user role to auto-approve if admin/lessadmin
    const user = await this.knex('users').where({ id: created_by }).first();
    const isApproved = user && (user.role === 'ADMIN' || user.role === 'LESSADMIN');

    const [event] = await this.knex('calendar_events')
      .insert({
        ...eventData,
        created_by,
        university_id: user?.university_id,
        is_approved: isApproved
      })
      .returning('*');
    return event;
  }

  async approve(id: string) {
    const [event] = await this.knex('calendar_events')
      .where({ id })
      .update({ is_approved: true })
      .returning('*');
    return event;
  }

  async delete(id: string) {
    return this.knex('calendar_events').where({ id }).del();
  }
}
