import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';

describe('PostsService (Unit)', () => {
  let service: PostsService;
  let knexMock: any;

  beforeEach(async () => {
    knexMock = jest.fn((table) => ({
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
      join: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      fn: { now: () => 'now' },
    }));

    // Mock transaction
    (knexMock as any).transaction = jest.fn(async (callback) => {
      const trx = jest.fn((table) => ({
        insert: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: '1' }]),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ id: '1', title: 'Test Post' }),
        select: jest.fn().mockResolvedValue([]),
      }));
      return callback(trx);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: 'KNEX_CONNECTION',
          useValue: knexMock,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPost', () => {
    it('should create a post within a transaction', async () => {
      const result = await service.createPost({
        forum_id: 'f1',
        author_id: 'u1',
        title: 'Title',
        content: 'Content'
      });
      expect(result).toBeDefined();
      expect(result.id).toBe('1');
    });
  });

  describe('delete', () => {
    it('should delete a post', async () => {
      const mockChain = {
        where: jest.fn().mockReturnThis(),
        del: jest.fn().mockResolvedValue(1)
      };
      knexMock.mockReturnValue(mockChain);

      await service.delete('1');
      expect(mockChain.where).toHaveBeenCalledWith({ id: '1' });
      expect(mockChain.del).toHaveBeenCalled();
    });
  });
});
