import { Module } from '@nestjs/common';
import { RbacModule } from '@/modules/system/rbac/rbac.module';

// Import admin modules
import { AdminContextModule } from '@/modules/system/context/admin/context.module';
import { AdminGroupModule } from '@/modules/system/group/admin/group.module';

// Import user modules
import { UserContextModule } from '@/modules/system/context/user/context.module';
import { UserGroupModule } from '@/modules/system/group/user/group.module';

// Import repository module
import { ContextRepositoryModule } from './context.repository.module';

import { RbacRepositoryModule } from '@/modules/system/rbac/rbac.repository.module';

@Module({
  imports: [
    RbacModule,
    ContextRepositoryModule,
    RbacRepositoryModule,
    // Admin modules
    AdminContextModule,
    AdminGroupModule,
    // User modules
    UserContextModule,
    UserGroupModule,
  ],
  exports: [
    ContextRepositoryModule,
    AdminContextModule,
    AdminGroupModule,
    UserContextModule,
    UserGroupModule,
  ],
})
export class ContextModule {}
