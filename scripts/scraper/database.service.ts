import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import 'dotenv/config';
import type { ScrapedComic } from './types';

function createPrisma() {
  const url = process.env.DATABASE_URL || '';
  if (url.startsWith('mysql://') || url.startsWith('mysql2://') || url.startsWith('mariadb://')) {
    return new PrismaClient({ adapter: new PrismaMariaDb(url) });
  }
  return new PrismaClient();
}

const prisma = createPrisma();

export async function clearExistingData(): Promise<void> {
  console.log('[DB] Clearing existing comic data...');

  // Delete in correct order to respect foreign keys
  await prisma.bookmark.deleteMany({});
  await prisma.readingHistory.deleteMany({});
  await prisma.comicView.deleteMany({});
  await prisma.comicComment.deleteMany({});
  await prisma.comicReview.deleteMany({});
  await prisma.comicFollow.deleteMany({});
  await prisma.chapterPage.deleteMany({});
  await prisma.chapter.deleteMany({});
  await prisma.comicDailyStats.deleteMany({});
  await prisma.comicStats.deleteMany({});
  await prisma.comicCategoryOnComic.deleteMany({});
  await prisma.comic.deleteMany({});

  console.log('[DB] All comic data cleared');
}

export async function comicExists(slug: string): Promise<boolean> {
  const existing = await prisma.comic.findUnique({ where: { slug } });
  return !!existing;
}

export async function insertComic(comic: ScrapedComic, groupId?: bigint): Promise<bigint> {
  // Create comic
  const createdComic = await prisma.comic.create({
    data: {
      slug: comic.slug,
      title: comic.title,
      description: comic.description || null,
      cover_image: comic.coverImageUrl,
      author: comic.author || null,
      status: 'published',
      is_featured: false,
      group_id: groupId || null,
    },
  });

  const comicId = createdComic.id;

  // Create stats
  await prisma.comicStats.create({
    data: {
      comic_id: comicId,
      view_count: BigInt(comic.viewCount),
      follow_count: BigInt(comic.followCount),
      rating_count: BigInt(comic.ratingCount),
      rating_sum: BigInt(Math.round(comic.ratingValue * comic.ratingCount)),
    },
  });

  // Upsert categories and create relations
  for (const categoryName of comic.categories) {
    const categorySlug = slugify(categoryName);

    const category = await prisma.comicCategory.upsert({
      where: { slug: categorySlug },
      update: {},
      create: {
        name: categoryName,
        slug: categorySlug,
        group_id: groupId || null,
      },
    });

    await prisma.comicCategoryOnComic.create({
      data: {
        comic_id: comicId,
        comic_category_id: category.id,
      },
    });
  }

  // Create chapters and pages
  let lastChapterId: bigint | null = null;
  let lastChapterDate: Date | null = null;

  for (const chapter of comic.chapters) {
    const createdChapter = await prisma.chapter.create({
      data: {
        comic_id: comicId,
        chapter_index: chapter.chapterIndex,
        chapter_label: chapter.chapterLabel || `Chapter ${chapter.chapterIndex}`,
        title: chapter.title || `Chapter ${chapter.chapterIndex}`,
        status: 'published',
        view_count: BigInt(chapter.viewCount),
        group_id: groupId || null,
      },
    });

    // Track the latest chapter (highest index)
    if (!lastChapterId || chapter.chapterIndex > (comic.chapters.find((c) => c.chapterIndex)?.chapterIndex || 0)) {
      lastChapterId = createdChapter.id;
      lastChapterDate = createdChapter.created_at;
    }

    // Create pages
    if (chapter.pages.length > 0) {
      await prisma.chapterPage.createMany({
        data: chapter.pages.map((p) => ({
          chapter_id: createdChapter.id,
          page_number: p.pageNumber,
          image_url: p.imageUrl,
        })),
      });
    }
  }

  // Update last chapter reference
  if (lastChapterId) {
    await prisma.comic.update({
      where: { id: comicId },
      data: {
        last_chapter_id: lastChapterId,
        last_chapter_updated_at: lastChapterDate,
      },
    });
  }

  return comicId;
}

export async function disconnect(): Promise<void> {
  await prisma.$disconnect();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
