import { Injectable, Inject } from '@nestjs/common';
import { Comic } from '@prisma/client';
import { IComicRepository, COMIC_REPOSITORY } from '../../domain/comic.repository';
import { IComicStatsRepository, COMIC_STATS_REPOSITORY } from '../../../stats/domain/comic-stats.repository';

@Injectable()
export class ComicActionService {
    constructor(
        @Inject(COMIC_REPOSITORY)
        private readonly comicRepository: IComicRepository,
        @Inject(COMIC_STATS_REPOSITORY)
        private readonly statsRepository: IComicStatsRepository,
    ) { }

    /**
     * Initializes stats for a new comic.
     */
    async initializeStats(comicId: bigint): Promise<void> {
        await this.statsRepository.create({
            comic_id: comicId,
            view_count: BigInt(0),
            follow_count: BigInt(0),
            rating_count: BigInt(0),
            rating_sum: BigInt(0),
        } as any);
    }

    /**
     * Syncs categories for a comic.
     */
    async syncCategories(comicId: bigint, categoryIds: any[]): Promise<void> {
        if (categoryIds && Array.isArray(categoryIds)) {
            const pks = categoryIds.map((id) => BigInt(id));
            await this.comicRepository.syncCategories(comicId, pks);
        }
    }

    /**
     * Handles all post-creation/update relations and side-effects.
     */
    async syncRelations(comic: Comic, data: { category_ids?: any[] }, isNew = false): Promise<void> {
        if (isNew) {
            await this.initializeStats(comic.id as bigint);
        }

        if (data.category_ids !== undefined) {
            await this.syncCategories(comic.id as bigint, data.category_ids);
        }
    }
}
