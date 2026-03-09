import { Module } from '@nestjs/common';
import { RbacModule } from '@/modules/core/rbac/rbac.module';
import { UserService } from './services/user.service';
import { UserActionService } from './services/user-action.service';
import { UserController } from './controllers/user.controller';

@Module({
  imports: [RbacModule],
  providers: [UserService, UserActionService],
  controllers: [UserController],
  exports: [UserService, UserActionService],
})
export class AdminUserModule { }
