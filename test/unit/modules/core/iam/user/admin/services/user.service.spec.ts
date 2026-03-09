import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '@/modules/core/iam/user/admin/services/user.service';
import { IUserRepository, USER_REPOSITORY } from '@/modules/core/iam/user/domain/user.repository';
import { UserActionService } from '@/modules/core/iam/user/admin/services/user-action.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as authContextHelper from '@/common/auth/utils/auth-context.helper';
import { RequestContext } from '@/common/shared/utils';

jest.mock('bcryptjs');
jest.mock('@/common/auth/utils/auth-context.helper');

describe('UserService', () => {
    let service: UserService;
    let userRepo: any;
    let userActionService: any;

    beforeEach(async () => {
        userRepo = {
            findById: jest.fn(),
            findByIdForAuth: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            checkUnique: jest.fn(),
            toPrimaryKey: jest.fn((id) => id),
        };

        userActionService = {
            syncRelations: jest.fn().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                { provide: USER_REPOSITORY, useValue: userRepo },
                { provide: UserActionService, useValue: userActionService },
            ],
        }).compile();

        service = module.get<UserService>(UserService);
        (authContextHelper.getCurrentUserId as jest.Mock).mockReturnValue(1);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('beforeCreate', () => {
        it('should hash password and check uniqueness', async () => {
            userRepo.checkUnique.mockResolvedValue(true);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_pwd');

            const payload = await (service as any).beforeCreate({
                email: 'test@example.com',
                password: 'password123'
            });

            expect(payload.password).toBe('hashed_pwd');
            expect(userRepo.checkUnique).toHaveBeenCalledWith('email', 'test@example.com', undefined);
            expect(payload.created_user_id).toBe(1);
        });

        it('should throw BadRequestException if email exists', async () => {
            userRepo.checkUnique.mockResolvedValue(false);
            await expect((service as any).beforeCreate({ email: 'exists@example.com' })).rejects.toThrow(BadRequestException);
        });
    });

    describe('create', () => {
        it('should call syncRelations after creation', async () => {
            const user = { id: 5n };
            userRepo.create.mockResolvedValue(user);
            userRepo.findById.mockResolvedValue(user);

            userRepo.checkUnique.mockResolvedValue(true);
            const data = { email: 't@t.com', role_ids: [1] };
            await service.create(data);

            expect(userActionService.syncRelations).toHaveBeenCalledWith(5, data);
        });
    });

    describe('userChangePassword', () => {
        it('should throw BadRequestException if old password does not match', async () => {
            userRepo.findByIdForAuth.mockResolvedValue({ id: 1, password: 'hashed_old' });
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.userChangePassword(1, 'wrong', 'new')).rejects.toThrow(BadRequestException);
        });
    });

    describe('transform', () => {
        it('should extract role_ids for current group and convert BigInt', () => {
            jest.spyOn(RequestContext, 'get').mockReturnValue(10); // groupId=10
            const user = {
                id: 1n,
                user_role_assignments: [
                    { group_id: 10n, role_id: 100n },
                    { group_id: 20n, role_id: 200n }
                ]
            };
            const result = (service as any).transform(user);
            expect(result.id).toBe(1);
            expect(result.role_ids).toEqual([100]);
            expect(result.user_role_assignments).toBeUndefined();
        });
    });
});
