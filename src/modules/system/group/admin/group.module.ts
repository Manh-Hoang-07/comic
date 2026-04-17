import { forwardRef, Module } from '@nestjs/common';
import { AdminGroupController } from './controllers/group.controller';
import { AdminGroupService } from './services/group.service';
import { GroupActionService } from './services/group-action.service';
import { RbacModule } from '@/modules/system/rbac/rbac.module';
import { ContextRepositoryModule } from '@/modules/system/context/context.repository.module';
import { RbacRepositoryModule } from '@/modules/system/rbac/rbac.repository.module';

@Module({
  imports: [
    forwardRef(() => RbacModule),
    ContextRepositoryModule,
    RbacRepositoryModule,
  ],
  controllers: [AdminGroupController],
  providers: [AdminGroupService, GroupActionService],
  exports: [AdminGroupService, GroupActionService],
})
export class AdminGroupModule {}
