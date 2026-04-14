import { Test, TestingModule } from '@nestjs/testing';
import { PublicContactService } from '@/modules/marketing/contact/public/services/contact.service';
import { CONTACT_REPOSITORY } from '@/modules/marketing/contact/domain/contact.repository';
import { ContactStatus } from '@/shared/enums/types/contact-status.enum';

describe('Public ContactService', () => {
  let service: PublicContactService;
  let repository: any;

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicContactService,
        {
          provide: CONTACT_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<PublicContactService>(PublicContactService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a contact with status Pending', async () => {
      const dto = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '123456789',
        message: 'Hello',
      };

      await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith({
        ...dto,
        status: ContactStatus.Pending,
      });
    });
  });
});
