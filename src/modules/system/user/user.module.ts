import { Module, Global } from '@nestjs/common';
import { RbacModule } from '@/modules/system/rbac/rbac.module';
import { UserService } from './admin/services/user.service';
import { UserRolesService } from './admin/services/user-roles.service';
import { UserRoleScopeService } from './admin/services/user-role-scope.service';
import { PolicyService } from './admin/services/policy.service';
import { PasswordService } from './admin/services/password.service';
import { RelationService } from './admin/services/relation.service';
import { ProfileService } from './user/services/profile.service';
import { USER_REPOSITORY } from './domain/user.repository';
import { UserRepositoryImpl } from './infrastructure/repositories/user.repository.impl';
import { PROFILE_REPOSITORY } from './domain/profile.repository';
import { ProfileRepositoryImpl } from './infrastructure/repositories/profile.repository.impl';
import { UserController } from './admin/controllers/user.controller';
import { ProfileController } from './user/controllers/profile.controller';

@Global()
@Module({
  imports: [RbacModule],
  providers: [
    UserRoleScopeService,
    PolicyService,
    UserService,
    UserRolesService,
    PasswordService,
    RelationService,
    ProfileService,
    UserRepositoryImpl,
    ProfileRepositoryImpl,
    {
      provide: USER_REPOSITORY,
      useExisting: UserRepositoryImpl,
    },
    {
      provide: PROFILE_REPOSITORY,
      useExisting: ProfileRepositoryImpl,
    },
  ],
  controllers: [UserController, ProfileController],
  exports: [
    PolicyService,
    UserService,
    PasswordService,
    RelationService,
    ProfileService,
    UserRepositoryImpl,
    ProfileRepositoryImpl,
    USER_REPOSITORY,
    PROFILE_REPOSITORY,
  ],
})
export class UserModule {}
