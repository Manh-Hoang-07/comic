import { Test, TestingModule } from '@nestjs/testing';
import { ContactService } from '@/modules/marketing/contact/admin/services/contact.service';
import { CONTACT_REPOSITORY } from '@/modules/marketing/contact/domain/contact.repository';
import { ContactStatus } from '@/shared/enums/types/contact-status.enum';

describe('Admin ContactService', () => {
    let service: ContactService;
    let repository: any;

    beforeEach(async () => {
        repository = {
            findAll: jest.fn().mockResolvedValue({ data: [], meta: {} }),
            findById: jest.fn(),
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
        it('should call repository.findAll with default limit', async () => {
            await service.getSimpleList({});
            expect(repository.findAll).toHaveBeenCalledWith(
                expect.objectContaining({ limit: 50 })
            );
        });
    });

    describe('markAsRead', () => {
        it('should update status to Read if current status is Pending', async () => {
            const mockContact = { id: 1, status: ContactStatus.Pending };
            repository.findById.mockResolvedValue(mockContact);
            repository.update.mockResolvedValue({ ...mockContact, status: ContactStatus.Read });

            await service.markAsRead(1);

            expect(repository.update).toHaveBeenCalledWith(1, {
                status: ContactStatus.Read
            });
        });

        it('should not update if status is not Pending', async () => {
            const mockContact = { id: 1, status: ContactStatus.Replied };
            repository.findById.mockResolvedValue(mockContact);

            await service.markAsRead(1);

            expect(repository.update).not.toHaveBeenCalled();
        });
    });

    describe('closeContact', () => {
        it('should update status to Closed', async () => {
            repository.update.mockResolvedValue({ id: 1, status: ContactStatus.Closed });
            await service.closeContact(1);
            expect(repository.update).toHaveBeenCalledWith(1, {
                status: ContactStatus.Closed
            });
        });
    });
});
