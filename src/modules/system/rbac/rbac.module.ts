import { forwardRef, Module } from '@nestjs/common';
import { RbacCacheService } from '@/modules/system/rbac/services/rbac-cache.service';
import { RbacService } from '@/modules/system/rbac/services/rbac.service';
import { RbacPermissionIndexService } from '@/modules/system/rbac/services/rbac-permission-index.service';
import { RbacRoleAssignmentService } from '@/modules/system/rbac/services/rbac-role-assignment.service';
import { RbacAuthorizationOrchestrator } from '@/modules/system/rbac/services/rbac-authorization.orchestrator';
import { RbacController } from '@/modules/system/rbac/controllers/rbac.controller';
import { AdminGroupModule } from '@/modules/system/group/admin/group.module';

import { ContextRepositoryModule } from '@/modules/system/context/context.repository.module';
import { RbacRepositoryModule } from './rbac.repository.module';

@Module({
  imports: [
    ContextRepositoryModule,
    RbacRepositoryModule,
    forwardRef(() => AdminGroupModule),
  ],
  providers: [
    RbacService,
    RbacCacheService,
    RbacPermissionIndexService,
    RbacRoleAssignmentService,
    RbacAuthorizationOrchestrator,
  ],
  controllers: [RbacController],
  exports: [RbacService, RbacCacheService, RbacAuthorizationOrchestrator],
})
export class RbacModule {}
