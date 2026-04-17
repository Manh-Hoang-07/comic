import { Module } from '@nestjs/common';
import { AdminContextController } from './controllers/context.controller';
import { AdminContextService } from './services/context.service';
import { ContextRepositoryModule } from '../context.repository.module';

import { RbacRepositoryModule } from '@/modules/system/rbac/rbac.repository.module';

@Module({
  imports: [ContextRepositoryModule, RbacRepositoryModule],
  controllers: [AdminContextController],
  providers: [AdminContextService],
  exports: [AdminContextService],
})
export class AdminContextModule {}
