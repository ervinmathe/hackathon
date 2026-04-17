import { Test, TestingModule } from '@nestjs/testing';
import { CmsService } from './cms.service';
import { NotFoundException } from '@nestjs/common';

describe('CmsService (Unit)', () => {
  let service: CmsService;
  let knexMock: any;

  beforeEach(async () => {
    knexMock = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
      join: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ id: '1', name: 'Test' }]),
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CmsService,
        {
          provide: 'KNEX_CONNECTION',
          useValue: knexMock,
        },
      ],
    }).compile();

    service = module.get<CmsService>(CmsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllUniversities', () => {
    it('should return a list of universities', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue([{ id: '1', name: 'Uni A' }]),
      };
      knexMock.mockReturnValue(mockQuery);

      const result = await service.getAllUniversities();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Uni A');
    });
  });

  describe('deleteUniversity', () => {
    it('should delete and return success', async () => {
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        del: jest.fn().mockResolvedValue(1),
      };
      knexMock.mockReturnValue(mockQuery);

      const result = await service.deleteUniversity('1');
      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if nothing deleted', async () => {
        const mockQuery = {
          where: jest.fn().mockReturnThis(),
          del: jest.fn().mockResolvedValue(0),
        };
        knexMock.mockReturnValue(mockQuery);
  
        await expect(service.deleteUniversity('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('approveEvent', () => {
    it('should update event as approved', async () => {
        const mockQuery = {
            where: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            returning: jest.fn().mockResolvedValue([{ id: 'e1', is_approved: true }])
        };
        knexMock.mockReturnValue(mockQuery);

        const result = await service.approveEvent('e1');
        expect(result.is_approved).toBe(true);
    });
  });
});
