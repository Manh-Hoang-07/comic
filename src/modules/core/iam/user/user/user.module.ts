import { Module } from '@nestjs/common';
import { ProfileController } from './controllers/profile.controller';
import { RbacModule } from '@/modules/core/rbac/rbac.module';
import { AdminUserModule } from '../admin/user.module';

@Module({
    imports: [RbacModule, AdminUserModule],
    controllers: [ProfileController],
})
export class UserProfileModule { }
