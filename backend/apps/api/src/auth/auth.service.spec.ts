import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthService (Unit)', () => {
  let service: AuthService;
  let knexMock: any;

  beforeEach(async () => {
    knexMock = jest.fn((table) => ({
      where: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(null),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ id: '1', username: 'testuser' }]),
      select: jest.fn().mockReturnThis(),
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: 'KNEX_CONNECTION',
          useValue: knexMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should create a new user', async () => {
      const userData = { username: 'new', email: 'n@e.hu', password: 'p', university_id: '1', enrollment_id: '1', year: '2026' };
      const result = await service.register(userData);
      expect(result).toBeDefined();
      expect(result.username).toBe('testuser');
    });

    it('should throw ConflictException if user exists', async () => {
      const mockChain = {
          where: jest.fn().mockReturnThis(),
          orWhere: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue({ id: '1' })
      };
      knexMock.mockReturnValue(mockChain);

      await expect(service.register({ username: 'ex', email: 'e' })).rejects.toThrow(ConflictException);
    });
  });

  describe('updateProfile', () => {
    it('should update and return the user', async () => {
      const mockChain = {
          where: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          returning: jest.fn().mockResolvedValue([{ id: '1', username: 'updateduser', profile_url: 'http://example.com' }])
      };
      knexMock.mockReturnValue(mockChain);

      const result = await service.updateProfile('1', { username: 'updateduser', profile_url: 'http://example.com' });
      expect(result).toBeDefined();
      expect(result.username).toBe('updateduser');
      expect(result.profile_url).toBe('http://example.com');
    });

    it('should return undefined if user not found', async () => {
        // Mock knex chain to return empty array
        const localKnexMock = {
            where: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            returning: jest.fn().mockResolvedValue([])
        };
        
        const module: TestingModule = await Test.createTestingModule({
            providers: [
              AuthService,
              {
                provide: 'KNEX_CONNECTION',
                useValue: () => localKnexMock,
              },
            ],
          }).compile();
          const localService = module.get<AuthService>(AuthService);

        const result = await localService.updateProfile('999', {});
        expect(result).toBeUndefined();
    });
  });
});
