import { forwardRef, Module } from '@nestjs/common';
import { RbacCacheService } from '@/modules/core/rbac/services/rbac-cache.service';
import { RbacService } from '@/modules/core/rbac/services/rbac.service';
import { RbacPermissionIndexService } from '@/modules/core/rbac/services/rbac-permission-index.service';
import { RbacRoleAssignmentService } from '@/modules/core/rbac/services/rbac-role-assignment.service';
import { RbacAuthorizationOrchestrator } from '@/modules/core/rbac/services/rbac-authorization.orchestrator';
import { RbacController } from '@/modules/core/rbac/controllers/rbac.controller';
import { AdminGroupModule } from '@/modules/core/context/group/admin/group.module';

import { ContextRepositoryModule } from '@/modules/core/context/context.repository.module';
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
