import { Module } from '@nestjs/common';
import { RbacCacheService } from '@/modules/core/rbac/services/rbac-cache.service';
import { RbacService } from '@/modules/core/rbac/services/rbac.service';
import { RbacPermissionIndexService } from '@/modules/core/rbac/services/rbac-permission-index.service';
import { RbacRoleAssignmentService } from '@/modules/core/rbac/services/rbac-role-assignment.service';
import { RbacController } from '@/modules/core/rbac/controllers/rbac.controller';
import { ContextCatalogService } from '@/modules/core/rbac/catalog/context-catalog.service';
import { GroupCatalogService } from '@/modules/core/rbac/catalog/group-catalog.service';
import { RoleCatalogService } from '@/modules/core/rbac/catalog/role-catalog.service';
import { PermissionCatalogService } from '@/modules/core/rbac/catalog/permission-catalog.service';
import { RoleContextCatalogService } from '@/modules/core/rbac/catalog/role-context-catalog.service';

import { ContextRepositoryModule } from '@/modules/core/context/context.repository.module';
import { RbacRepositoryModule } from './rbac.repository.module';

@Module({
  imports: [ContextRepositoryModule, RbacRepositoryModule],
  providers: [
    ContextCatalogService,
    GroupCatalogService,
    RoleCatalogService,
    PermissionCatalogService,
    RoleContextCatalogService,
    RbacService,
    RbacCacheService,
    RbacPermissionIndexService,
    RbacRoleAssignmentService,
  ],
  controllers: [RbacController],
  exports: [
    RbacService,
    RbacCacheService,
    ContextCatalogService,
    GroupCatalogService,
    RoleCatalogService,
    PermissionCatalogService,
    RoleContextCatalogService,
  ],
})
export class RbacModule { }

