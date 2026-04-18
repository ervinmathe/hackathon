import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from './comments.service';

describe('CommentsService (Unit)', () => {
  let service: CommentsService;
  let knexMock: any;

  beforeEach(async () => {
    knexMock = jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      join: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ id: 'c1', content: 'Test comment' }]),
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: 'KNEX_CONNECTION',
          useValue: knexMock,
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a comment', async () => {
      const result = await service.create('p1', 'u1', 'Hello');
      expect(result).toBeDefined();
      expect(result.id).toBe('c1');
    });
  });

  describe('findByPost', () => {
    it('should query comments by post id', async () => {
      const mockQuery = {
        join: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockImplementation((col, dir) => {
            return Promise.resolve([{ id: 'c1', content: 'Test' }]);
        }),
      };
      knexMock.mockReturnValue(mockQuery);

      const result = await service.findByPost('p1');
      expect(result).toHaveLength(1);
      expect(mockQuery.where).toHaveBeenCalledWith({ post_id: 'p1' });
    });
  });

  describe('update', () => {
    it('should update a comment', async () => {
        const result = await service.update('c1', 'New content');
        expect(result).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should delete a comment', async () => {
        const mockQuery = {
            where: jest.fn().mockReturnThis(),
            del: jest.fn().mockResolvedValue(1)
        };
        knexMock.mockReturnValue(mockQuery);
        const result = await service.delete('c1');
        expect(result).toBe(1);
    });
  });
});
