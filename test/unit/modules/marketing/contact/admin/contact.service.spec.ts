import { Test, TestingModule } from '@nestjs/testing';
import { ContactService } from '@/modules/marketing/contact/admin/services/contact.service';
import { CONTACT_REPOSITORY } from '@/modules/marketing/contact/domain/contact.repository';
import { ContactStatus } from '@/shared/enums/types/contact-status.enum';

describe('Admin ContactService', () => {
    let service: ContactService;
    let repository: any;

    beforeEach(async () => {
        repository = {
            getList: jest.fn(),
            getOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ContactService,
                {
                    provide: CONTACT_REPOSITORY,
                    useValue: repository,
                },
            ],
        }).compile();

        service = module.get<ContactService>(ContactService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getSimpleList', () => {
        it('should call getList with default limit', async () => {
            await service.getSimpleList({});
            expect(repository.getList).toHaveBeenCalledWith({ limit: 50 });
        });
    });

    describe('markAsRead', () => {
        it('should update status to Read if current status is Pending', async () => {
            const mockContact = { id: 1, status: ContactStatus.Pending };
            repository.getOne.mockResolvedValue(mockContact);

            await service.markAsRead(1);

            expect(repository.update).toHaveBeenCalledWith(1, {
                status: ContactStatus.Read
            });
        });

        it('should not update if status is not Pending', async () => {
            const mockContact = { id: 1, status: ContactStatus.Replied };
            repository.getOne.mockResolvedValue(mockContact);

            await service.markAsRead(1);

            expect(repository.update).not.toHaveBeenCalled();
        });
    });

    describe('closeContact', () => {
        it('should update status to Closed', async () => {
            await service.closeContact(1);
            expect(repository.update).toHaveBeenCalledWith(1, {
                status: ContactStatus.Closed
            });
        });
    });
});
