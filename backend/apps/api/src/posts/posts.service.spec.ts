import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';

describe('PostsService (Unit)', () => {
  let service: PostsService;
  let knexMock: any;

  beforeEach(async () => {
    const mockQuery = {
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
      join: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      fn: { now: jest.fn().mockReturnValue('now') },
    };

    knexMock = jest.fn(() => mockQuery);
    // Also attach fn to the knexMock itself for this.knex.fn.now()
    (knexMock as any).fn = { now: jest.fn().mockReturnValue('now') };

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

  describe('findOne', () => {
    it('should return a post with attachments and comments', async () => {
        const mockChain = {
            join: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue({ id: 'p1', title: 'Post' }),
            orderBy: jest.fn().mockResolvedValue([{ id: 'c1' }])
        };
        knexMock.mockReturnValue(mockChain);

        const result = await service.findOne('p1');
        expect(result).toBeDefined();
        expect(result.id).toBe('p1');
        expect(result.comments).toBeDefined();
    });

    it('should return null if post not found', async () => {
        const mockChain = {
            join: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(null)
        };
        knexMock.mockReturnValue(mockChain);

        const result = await service.findOne('999');
        expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update the post content', async () => {
        const localMock = knexMock(); // get the query object
        localMock.returning.mockResolvedValue([{ id: 'p1', title: 'Updated' }]);

        const result = await service.update('p1', { title: 'Updated' });
        expect(result.title).toBe('Updated');
    });
  });

  describe('togglePin', () => {
    it('should toggle is_pinned field', async () => {
        const mockChain = {
            where: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue({ id: 'p1', is_pinned: false }),
            update: jest.fn().mockReturnThis(),
            returning: jest.fn().mockResolvedValue([{ id: 'p1', is_pinned: true }])
        };
        knexMock.mockReturnValue(mockChain);

        const result = await service.togglePin('p1');
        expect(result.is_pinned).toBe(true);
    });
  });
});
