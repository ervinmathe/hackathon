import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ApiModule } from '../src/api.module';

describe('AuthController (E2E Integration)', () => {
  let app: INestApplication;
  let knex: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ApiModule],
    })
    .overrideProvider('KNEX_CONNECTION')
    .useValue({
        // Mocking database for E2E since we don't want to mess up real DB
        insert: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ 
            id: '1', username: 'testuser', password: 'hashed_password', role: 'student', 
            university_id: 'uni1', enrollment_id: 'en1', profile_url: null 
        }),
        update: jest.fn().mockReturnThis(),
        returning: jest.fn().mockImplementation((fields) => {
            return Promise.resolve([{ id: '1', username: 'testuser', profile_url: 'http://supabase.com/avatar.png' }]);
        }),
        select: jest.fn().mockReturnThis(),
    })
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/register (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: 'testuser',
        password: 'password123',
        email: 'test@uni.hu',
        role: 'student',
        university_id: 'uni1',
        enrollment_id: 'en1',
        year: '2026'
      })
      .expect(201);
  });

  it('/auth/profile/:id (POST) - Update Profile with profile_url', () => {
    return request(app.getHttpServer())
      .post('/auth/profile/1')
      .send({
        username: 'testuser_updated',
        profile_url: 'http://supabase.com/avatar.png'
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.profile_url).toBe('http://supabase.com/avatar.png');
      });
  });
});
