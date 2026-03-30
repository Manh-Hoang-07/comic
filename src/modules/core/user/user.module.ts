import { Module, Global } from '@nestjs/common';
import { RbacModule } from '@/modules/core/rbac/rbac.module';
import { UserService } from './admin/services/user.service';
import { UserPasswordService } from './admin/services/user-password.service';
import { UserActionService } from './admin/services/user-action.service';
import { ProfileService } from './user/services/profile.service';
import { UserRepository } from './repositories/user.repository';
import { UserController } from './admin/controllers/user.controller';
import { ProfileController } from './user/controllers/profile.controller';

@Global()
@Module({
  imports: [RbacModule],
  providers: [
    UserService, 
    UserPasswordService,
    UserActionService,
    ProfileService, 
    UserRepository,
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
  ],
  controllers: [
    UserController, 
    ProfileController
  ],
  exports: [
    UserService, 
    UserPasswordService,
    UserActionService,
    ProfileService, 
    UserRepository,
    'IUserRepository'
  ],
})
export class UserModule { }
