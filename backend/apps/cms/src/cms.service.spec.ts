import { Test, TestingModule } from '@nestjs/testing';
import { CmsService } from './cms.service';
import { NotFoundException } from '@nestjs/common';

describe('CmsService (Unit)', () => {
  let service: CmsService;
  let knexMock: any;

  beforeEach(async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
      join: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ id: '1', name: 'Test' }]),
      then: jest.fn().mockImplementation((onFulfilled) => Promise.resolve(onFulfilled([]))),
    };

    knexMock = jest.fn(() => mockQuery);

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

  describe('Enrollments', () => {
    it('should create an enrollment', async () => {
      const result = await service.createEnrollment({ name: 'Szak', university_id: '1' });
      expect(result).toBeDefined();
    });

    it('should update an enrollment', async () => {
        const localMock = knexMock();
        localMock.returning.mockResolvedValue([{ id: '1' }]);
        const result = await service.updateEnrollment('1', { name: 'New' });
        expect(result).toBeDefined();
    });

    it('should getAllEnrollments with join', async () => {
        const localMock = knexMock();
        localMock.orderBy.mockResolvedValue([]);
        await service.getAllEnrollments();
        expect(localMock.join).toHaveBeenCalledWith('universities', 'enrollments.university_id', 'universities.id');
    });
  });

  describe('Users', () => {
      it('should getAllUsers with joins', async () => {
          await service.getAllUsers();
          expect(knexMock).toHaveBeenCalledWith('users');
      });
  });

  describe('Forums', () => {
      it('should getAllForums', async () => {
          await service.getAllForums();
          expect(knexMock).toHaveBeenCalledWith('forums');
      });
  });
});
