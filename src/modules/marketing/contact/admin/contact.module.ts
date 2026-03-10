import { Module } from '@nestjs/common';
import { ContactService } from '@/modules/marketing/contact/admin/services/contact.service';
import { ContactController } from '@/modules/marketing/contact/admin/controllers/contact.controller';
import { ContactRepositoryModule } from '../contact.repository.module';

@Module({
  imports: [ContactRepositoryModule],
  controllers: [ContactController],
  providers: [ContactService],
  exports: [ContactService],
})
export class AdminContactModule { }
