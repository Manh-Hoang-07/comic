import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { SystemConfigRepositoryModule } from '@/modules/system/system-config/system-config.repository.module';

@Module({
  imports: [SystemConfigRepositoryModule],
  providers: [MailService],
  exports: [MailService],
})
export class AppMailModule {}
