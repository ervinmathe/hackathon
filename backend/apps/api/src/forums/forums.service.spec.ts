import { Test, TestingModule } from '@nestjs/testing';
import { ForumsService } from './forums.service';

describe('ForumsService (Unit)', () => {
  let service: ForumsService;
  let knexMock: any;

  beforeEach(async () => {
    knexMock = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      join: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(null),
      returning: jest.fn().mockResolvedValue([{ id: '1', name: 'Test Forum' }]),
      orderBy: jest.fn().mockReturnThis(),
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ForumsService,
        {
          provide: 'KNEX_CONNECTION',
          useValue: knexMock,
        },
      ],
    }).compile();

    service = module.get<ForumsService>(ForumsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should call knex with filters', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        // Mock the final promise behavior
        then: jest.fn().mockImplementation((onFulfilled) => {
            return Promise.resolve(onFulfilled([{ id: '1', name: 'Forum 1' }]));
        }),
      };
      knexMock.mockReturnValueOnce(mockQuery);

      const result = await service.findAll('uni1', 'en1');
      expect(result).toBeDefined();
      expect(mockQuery.where).toHaveBeenCalledWith({ university_id: 'uni1' });
    });
  });

  describe('join', () => {
    it('should insert a new join record if not exists', async () => {
        const mockQuery = {
            where: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(null),
            insert: jest.fn().mockReturnThis(),
            returning: jest.fn().mockResolvedValue([{ user_id: 'u1', forum_id: 'f1' }])
        };
        knexMock.mockReturnValue(mockQuery);

        const result = await service.join('u1', 'f1');
        expect(result.user_id).toBe('u1');
        expect(mockQuery.insert).toHaveBeenCalledWith({ user_id: 'u1', forum_id: 'f1' });
    });
  });

  describe('leave', () => {
    it('should delete join record', async () => {
        const mockQuery = {
            where: jest.fn().mockReturnThis(),
            del: jest.fn().mockResolvedValue(1)
        };
        knexMock.mockReturnValue(mockQuery);

        await service.leave('u1', 'f1');
        expect(mockQuery.del).toHaveBeenCalled();
    });
  });

  describe('findMyForums', () => {
    it('should query forums joined by user', async () => {
        const mockQuery = {
            join: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            select: jest.fn().mockResolvedValue([{ id: 'f1' }])
        };
        knexMock.mockReturnValue(mockQuery);

        const result = await service.findMyForums('u1');
        expect(result).toHaveLength(1);
        expect(mockQuery.join).toHaveBeenCalledWith('user_forums', 'forums.id', 'user_forums.forum_id');
    });
  });
});
