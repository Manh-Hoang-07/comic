import { Injectable, Inject } from '@nestjs/common';
import { IProjectRepository, PROJECT_REPOSITORY } from '@/modules/introduction/project/domain/project.repository';
import { BaseContentService } from '@/common/core/services';
import { Project } from '@prisma/client';
import { SlugHelper } from '@/common/core/utils/slug.helper';

@Injectable()
export class ProjectService extends BaseContentService<Project, IProjectRepository> {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepo: IProjectRepository,
  ) {
    super(projectRepo);
  }

  async getSimpleList(query: any) {
    return this.getList({
      ...query,
      limit: query.limit ?? 50,
    });
  }

  // ── Lifecycle Hooks ────────────────────────────────────────────────────────

  protected override async beforeCreate(data: any) {
    const payload = await super.beforeCreate(data);

    // Handle Slug
    if (!payload.slug) {
      payload.slug = await SlugHelper.uniqueSlug(payload.name, this.projectRepo);
    }

    return payload;
  }

  protected override async beforeUpdate(id: number | bigint, data: any) {
    const payload = { ...data };

    // Handle Slug
    if (payload.name || payload.slug) {
      payload.slug = await SlugHelper.uniqueSlug(
        payload.slug || payload.name || '',
        this.projectRepo,
        id
      );
    }

    return payload;
  }

  // ── Operations ─────────────────────────────────────────────────────────────

  async incrementViewCount(id: number | bigint) {
    return this.projectRepo.incrementViewCount(id);
  }
}
