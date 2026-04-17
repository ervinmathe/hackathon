import { Test, TestingModule } from '@nestjs/testing';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';

describe('CmsController', () => {
  let cmsController: CmsController;
  let cmsService: CmsService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [CmsController],
      providers: [
        CmsService,
        {
          provide: 'KNEX_CONNECTION',
          useValue: {}, // Mock value
        },
      ],
    }).compile();

    cmsController = app.get<CmsController>(CmsController);
    cmsService = app.get<CmsService>(CmsService);
  });

  describe('getAllUniversities', () => {
    it('should call service.getAllUniversities', async () => {
      const spy = jest.spyOn(cmsService, 'getAllUniversities').mockResolvedValue([]);
      const result = await cmsController.getAllUniversities();
      expect(result).toEqual([]);
      expect(spy).toHaveBeenCalled();
    });
  });
});
