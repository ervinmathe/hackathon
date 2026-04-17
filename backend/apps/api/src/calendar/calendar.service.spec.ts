import { Test, TestingModule } from '@nestjs/testing';
import { CalendarService } from './calendar.service';

describe('CalendarService (Unit)', () => {
  let service: CalendarService;
  let knexMock: any;

  beforeEach(async () => {
    knexMock = jest.fn(() => ({
      join: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ id: '1', role: 'student' }),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ id: 'e1' }]),
    }));

    // Mock knex.raw
    (knexMock as any).raw = jest.fn().mockReturnValue('count');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarService,
        {
          provide: 'KNEX_CONNECTION',
          useValue: knexMock,
        },
      ],
    }).compile();

    service = module.get<CalendarService>(CalendarService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should query calendar_events with joins', async () => {
      const mockQuery = {
        join: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation((onFulfilled) => Promise.resolve(onFulfilled([]))),
      };
      knexMock.mockReturnValue(mockQuery);

      const result = await service.findAll();
      expect(result).toBeDefined();
      expect(mockQuery.join).toHaveBeenCalledWith('users', 'calendar_events.created_by', 'users.id');
    });
  });

  describe('toggleInterest', () => {
    it('should insert if not exists', async () => {
        const mockQuery = {
            where: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(null),
            insert: jest.fn().mockResolvedValue([1])
        };
        knexMock.mockReturnValue(mockQuery);

        const result = await service.toggleInterest('u1', 'e1');
        expect(result.interested).toBe(true);
    });

    it('should delete if exists', async () => {
        const mockQuery = {
            where: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue({ user_id: 'u1' }),
            del: jest.fn().mockResolvedValue(1)
        };
        knexMock.mockReturnValue(mockQuery);

        const result = await service.toggleInterest('u1', 'e1');
        expect(result.interested).toBe(false);
    });
  });
});
