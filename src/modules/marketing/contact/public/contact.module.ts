import { Module } from '@nestjs/common';
import { PublicContactService } from '@/modules/marketing/contact/public/services/contact.service';
import { PublicContactController } from '@/modules/marketing/contact/public/controllers/contact.controller';

import { ContactRepositoryModule } from '@/modules/marketing/contact/contact.repository.module';

@Module({
  imports: [ContactRepositoryModule],
  controllers: [PublicContactController],
  providers: [PublicContactService],
  exports: [PublicContactService],
})
export class PublicContactModule { }

