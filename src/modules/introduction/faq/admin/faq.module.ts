import { Module } from '@nestjs/common';
import { FaqService } from '@/modules/introduction/faq/admin/services/faq.service';
import { FaqController } from '@/modules/introduction/faq/admin/controllers/faq.controller';
import { RbacModule } from '@/modules/system/rbac/rbac.module';
import { FaqRepositoryModule } from '../faq.repository.module';

@Module({
  imports: [RbacModule, FaqRepositoryModule],
  controllers: [FaqController],
  providers: [FaqService],
  exports: [FaqService],
})
export class AdminFaqModule {}
