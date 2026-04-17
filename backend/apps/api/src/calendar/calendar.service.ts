import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';

@Injectable()
export class CalendarService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  async findAll(universityId?: string, enrollmentId?: string) {
    const query = this.knex('calendar_events').select('*');

    if (enrollmentId) {
      query.where((qb) => {
        qb.where({ enrollment_id: enrollmentId }).orWhereNull('enrollment_id');
      });
    } else if (universityId) {
      // If no specific enrollment is provided, we fetch events for all enrollments of that university
      const enrollmentIds = await this.knex('enrollments')
        .where({ university_id: universityId })
        .pluck('id');
      
      query.where((qb) => {
        qb.whereIn('enrollment_id', enrollmentIds).orWhereNull('enrollment_id');
      });
    }

    return query.orderBy('start_time', 'asc');
  }

  async create(data: any) {
    const [event] = await this.knex('calendar_events').insert(data).returning('*');
    return event;
  }
}
