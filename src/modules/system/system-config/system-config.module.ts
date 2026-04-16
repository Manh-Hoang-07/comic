import { Module } from '@nestjs/common';
import { GeneralConfigModule } from './general/general-config.module';
import { EmailConfigModule } from './email/email-config.module';
import { CachePurgeModule } from './cache-purge/cache-purge.module';

@Module({
  imports: [GeneralConfigModule, EmailConfigModule, CachePurgeModule],
  exports: [GeneralConfigModule, EmailConfigModule, CachePurgeModule],
})
export class SystemConfigModule {}
