import { StringUtil } from '@/core/utils/string.util';

/**
 * Interface for a entity repository that supports slug lookups.
 */
export interface SlugRepository {
    findBySlug(slug: string): Promise<any>;
}

/**
 * Service to handle unique slug generation.
 */
export class SlugHelper {
    /**
     * Generates a unique slug for a given title and repository.
     * If the slug already exists, it appends a timestamp.
     */
    static async uniqueSlug(
        title: string,
        repository: SlugRepository,
        excludeId?: string | number | bigint,
    ): Promise<string> {
        let slug = StringUtil.toSlug(title);

        const existing = await repository.findBySlug(slug);

        // If slug exists and it's not the current entity being updated
        if (existing && (!excludeId || String(existing.id) !== String(excludeId))) {
            slug = `${slug}-${Date.now()}`;
        }

        return slug;
    }
}
