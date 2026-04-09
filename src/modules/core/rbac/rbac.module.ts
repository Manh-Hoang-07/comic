import { Module } from '@nestjs/common';
import { RbacCacheService } from '@/modules/core/rbac/services/rbac-cache.service';
import { RbacService } from '@/modules/core/rbac/services/rbac.service';
import { RbacPermissionIndexService } from '@/modules/core/rbac/services/rbac-permission-index.service';
import { RbacRoleAssignmentService } from '@/modules/core/rbac/services/rbac-role-assignment.service';
import { RbacController } from '@/modules/core/rbac/controllers/rbac.controller';

import { ContextRepositoryModule } from '@/modules/core/context/context.repository.module';
import { RbacRepositoryModule } from './rbac.repository.module';

@Module({
  imports: [ContextRepositoryModule, RbacRepositoryModule],
  providers: [RbacService, RbacCacheService, RbacPermissionIndexService, RbacRoleAssignmentService],
  controllers: [RbacController],
  exports: [RbacService, RbacCacheService],
})
export class RbacModule { }

