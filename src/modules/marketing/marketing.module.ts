import { Module } from '@nestjs/common';
import { MarketingRepositoryModule } from './marketing.repository.module';

// Import admin modules
import { AdminBannerModule } from '@/modules/marketing/banner/admin/banner.module';
import { AdminBannerLocationModule } from '@/modules/marketing/banner-location/admin/banner-location.module';
import { AdminContactModule } from '@/modules/marketing/contact/admin/contact.module';

// Import public modules
import { PublicBannerModule } from '@/modules/marketing/banner/public/banner.module';
import { PublicContactModule } from '@/modules/marketing/contact/public/contact.module';

@Module({
  imports: [
    MarketingRepositoryModule,
    // Admin modules
    AdminBannerModule,
    AdminBannerLocationModule,
    AdminContactModule,
    // Public modules
    PublicBannerModule,
    PublicContactModule,
  ],
  exports: [],
})
export class MarketingModule {}
