import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma/prisma.service';
import { SeedRoles } from '@/core/database/seeder/core/seed-roles';
import { SeedPermissions } from '@/core/database/seeder/core/seed-permissions';
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

@Injectable()
export class SeedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seedPermissions: SeedPermissions,
    private readonly seedRoles: SeedRoles,
    private readonly seedUsers: SeedUsers,
    private readonly seedMenus: SeedMenus,
    private readonly seedBannerLocations: SeedBannerLocations,
    private readonly seedBanners: SeedBanners,
    private readonly seedContacts: SeedContacts,
    private readonly seedGeneralConfigs: SeedGeneralConfigs,
    private readonly seedEmailConfigs: SeedEmailConfigs,
    private readonly seedGroups: SeedGroups,
    private readonly seedContentTemplates: SeedContentTemplates,

    private readonly seedProjects: SeedProjects,
    private readonly seedAboutSections: SeedAboutSections,
    private readonly seedStaff: SeedStaff,
    private readonly seedTestimonials: SeedTestimonials,
    private readonly seedPartners: SeedPartners,
    private readonly seedGallery: SeedGallery,
    private readonly seedCertificates: SeedCertificates,
    private readonly seedFaqs: SeedFaqs,
    private readonly seedPosts: SeedPosts,
    private readonly seedComicCategories: SeedComicCategories,
    private readonly seedComics: SeedComics,
    private readonly seedChapters: SeedChapters,
    private readonly seedComicLastChapter: SeedComicLastChapter,
    private readonly seedComicComments: SeedComicComments,

    private readonly seedLocations: SeedLocations,
  ) { }

  async seedAll(): Promise<void> {
    try {
      await this.seedPermissions.seed();
      await this.seedRoles.seed();
      await this.seedUsers.seed();
      await this.seedGroups.seed();
      await this.seedMenus.seed();
      await this.seedBannerLocations.seed();
      await this.seedBanners.seed();
      await this.seedContacts.seed();
      await this.seedGeneralConfigs.seed();
      await this.seedEmailConfigs.seed();
      await this.seedContentTemplates.seed();
      await this.seedGroups.seed();
      await this.seedProjects.seed();
      await this.seedAboutSections.seed();
      await this.seedStaff.seed();
      await this.seedPartners.seed();
      await this.seedGallery.seed();
      await this.seedCertificates.seed();
      await this.seedFaqs.seed();
      await this.seedTestimonials.seed();
      await this.seedPosts.seed();

      await this.seedComicCategories.seed();
      await this.seedComics.seed();
      await this.seedChapters.seed();
      await this.seedComicComments.seed();
      await this.seedComicLastChapter.seed();
      await this.seedLocations.seed();
    } catch (error) {
      throw error;
    }
  }

  async clearAll(includeLocations = true): Promise<void> {
    try {
      if (includeLocations) await this.seedLocations.clear();
      await this.prisma.userRoleAssignment.deleteMany({});
      await this.prisma.userGroup.deleteMany({});
      await this.prisma.roleHasPermission.deleteMany({});
      await this.prisma.roleContext.deleteMany({});
      await this.prisma.menuPermission.deleteMany({});
      await this.prisma.bookmark.deleteMany({});
      await this.prisma.readingHistory.deleteMany({});
      await this.prisma.comicFollow.deleteMany({});
      await this.prisma.comicView.deleteMany({});
      await this.prisma.comicReview.deleteMany({});
      await this.prisma.chapterPage.deleteMany({});
      await this.prisma.chapter.deleteMany({});
      await this.prisma.comicStats.deleteMany({});
      await this.prisma.comicComment.deleteMany({});
      await this.prisma.comic.deleteMany({});
      await this.prisma.comicCategory.deleteMany({});
      await this.prisma.banner.deleteMany({});
      await this.prisma.bannerLocation.deleteMany({});
      await this.prisma.contact.deleteMany({});
      await this.prisma.menu.deleteMany({});
      await this.prisma.notification.deleteMany({});
      await this.prisma.group.deleteMany({});
      await this.prisma.context.deleteMany({});
      await this.prisma.user.deleteMany({});
      await this.prisma.role.deleteMany({});
      await this.prisma.permission.deleteMany({});
      await this.prisma.emailConfig.deleteMany({});
      await this.prisma.generalConfig.deleteMany({});
      await this.prisma.contentTemplate.deleteMany({});
      await this.prisma.testimonial.deleteMany({});
      await this.prisma.project.deleteMany({});
      await this.prisma.gallery.deleteMany({});
      await this.prisma.certificate.deleteMany({});
      await this.prisma.faq.deleteMany({});
      await this.prisma.partner.deleteMany({});
      await this.prisma.staff.deleteMany({});
      await this.prisma.aboutSection.deleteMany({});
      await this.prisma.postPosttag.deleteMany({});
      await this.prisma.postPostcategory.deleteMany({});
      await this.prisma.post.deleteMany({});
      await this.prisma.postTag.deleteMany({});
      await this.prisma.postCategory.deleteMany({});
    } catch (error) {
      throw error;
    }
  }

  async clearDatabase(includeLocations = true): Promise<void> {
    await this.clearAll(includeLocations);
  }
}

