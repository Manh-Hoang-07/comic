import { Module } from '@nestjs/common';
import { PrismaModule } from '@/core/database/prisma/prisma.module';
import { EncryptionModule } from '@/common/encryption/encryption.module';
import { SeedService } from '@/core/database/seeder/seed-data';
import { SeedPermissions } from '@/core/database/seeder/core/seed-permissions';
import { SeedRoles } from '@/core/database/seeder/core/seed-roles';
import { SeedUsers } from '@/core/database/seeder/core/seed-users';
import { SeedMenus } from '@/core/database/seeder/core/seed-menus';
import { SeedBannerLocations } from '@/core/database/seeder/marketing/seed-banner-locations';
import { SeedBanners } from '@/core/database/seeder/marketing/seed-banners';
import { SeedContacts } from '@/core/database/seeder/marketing/seed-contacts';
import { SeedGeneralConfigs } from '@/core/database/seeder/core/seed-general-configs';
import { SeedEmailConfigs } from '@/core/database/seeder/core/seed-email-configs';
import { SeedGroups } from '@/core/database/seeder/core/seed-groups';
import { SeedProjects } from '@/core/database/seeder/introduction/seed-projects';
import { SeedAboutSections } from '@/core/database/seeder/introduction/seed-about-sections';
import { SeedStaff } from '@/core/database/seeder/introduction/seed-staff';
import { SeedTestimonials } from '@/core/database/seeder/introduction/seed-testimonials';
import { SeedPartners } from '@/core/database/seeder/introduction/seed-partners';
import { SeedGallery } from '@/core/database/seeder/introduction/seed-gallery';
import { SeedCertificates } from '@/core/database/seeder/introduction/seed-certificates';
import { SeedFaqs } from '@/core/database/seeder/marketing/seed-faqs';
import { SeedPosts } from '@/core/database/seeder/post/seed-posts';
import { SeedContentTemplates } from '@/core/database/seeder/core/seed-content-templates';

import { SeedComicCategories } from '@/core/database/seeder/comic/seed-comic-categories';
import { SeedComics } from '@/core/database/seeder/comic/seed-comics';
import { SeedChapters } from '@/core/database/seeder/comic/seed-chapters';
import { SeedComicLastChapter } from '@/core/database/seeder/comic/seed-comic-last-chapter';
import { SeedComicComments } from '@/core/database/seeder/comic/seed-comic-comments';

import { SeedLocations } from '@/core/database/seeder/core/seed-locations';

@Module({
  imports: [PrismaModule, EncryptionModule],
  providers: [
    // Main seed service
    SeedService,
    // Individual seeders
    SeedPermissions,
    SeedRoles,
    SeedUsers,
    SeedMenus,
    SeedBannerLocations,
    SeedBanners,
    SeedContacts,
    SeedGeneralConfigs,
    SeedEmailConfigs,
    SeedGroups,
    SeedContentTemplates,
    // Introduction Seeders
    SeedProjects,
    SeedAboutSections,
    SeedStaff,
    SeedTestimonials,
    SeedPartners,
    SeedGallery,
    SeedCertificates,
    SeedFaqs,
    // Post Module Seeders
    SeedPosts,

    // Comic Seeders
    SeedComicCategories,
    SeedComics,
    SeedChapters,
    SeedComicLastChapter,
    SeedComicComments,

    SeedLocations,
  ],
  exports: [SeedService],
})
export class SeederModule { }

