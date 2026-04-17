import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';

@Injectable()
export class CalendarService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  async findAll(universityId?: string, enrollmentId?: string, onlyApproved = true, currentUserId?: string) {
    const query = this.knex('calendar_events')
      .join('users', 'calendar_events.created_by', 'users.id')
      .leftJoin('event_interests', 'calendar_events.id', 'event_interests.event_id')
      .select(
        'calendar_events.*',
        'users.username as author_name',
        this.knex.raw('count(event_interests.user_id)::int as interests_count')
      )
      .groupBy('calendar_events.id', 'users.username');

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

    const events = await query.orderBy('start_time', 'asc');

    // Check if current user is interested
    if (currentUserId) {
      const myInterests = await this.knex('event_interests')
        .where({ user_id: currentUserId })
        .select('event_id');
      const interestIds = new Set(myInterests.map(i => i.event_id));
      return events.map(e => ({
        ...e,
        is_interested: interestIds.has(e.id)
      }));
    }

    return events;
  }

  async toggleInterest(userId: string, eventId: string) {
    const existing = await this.knex('event_interests')
      .where({ user_id: userId, event_id: eventId })
      .first();

    if (existing) {
      await this.knex('event_interests')
        .where({ user_id: userId, event_id: eventId })
        .del();
      return { interested: false };
    } else {
      await this.knex('event_interests').insert({
        user_id: userId,
        event_id: eventId
      });
      return { interested: true };
    }
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
