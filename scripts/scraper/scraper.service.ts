import puppeteer, { type Browser, type Page } from 'puppeteer';
import * as path from 'path';
import { parseListingPage, parseDetailPage, parseChapterPage } from './page-parser';
import { downloadWithRetry } from './image-downloader';
import type { ScrapedComic, ScrapedChapter, ScraperConfig } from './types';

export class ScraperService {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private config: ScraperConfig;

  constructor(config: ScraperConfig) {
    this.config = config;
  }

  async init(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    this.page = await this.browser.newPage();
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    );
    await this.page.setViewport({ width: 1280, height: 800 });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  async scrapeAll(): Promise<ScrapedComic[]> {
    if (!this.page) throw new Error('Browser not initialized. Call init() first.');

    // Step 1: Get comic list from listing pages
    console.log('\n=== STEP 1: Scraping comic listing ===');
    const comicList: { slug: string; url: string; title: string }[] = [];
    const itemsPerPage = 36;
    const pagesNeeded = Math.ceil(this.config.maxComics / itemsPerPage);

    for (let p = 1; p <= pagesNeeded; p++) {
      const comics = await parseListingPage(this.page, p);
      comicList.push(...comics);
      if (p < pagesNeeded) await this.delay();
    }

    const comicsToScrape = comicList.slice(0, this.config.maxComics);
    console.log(`\nTotal comics to scrape: ${comicsToScrape.length}`);

    // Step 2: Scrape each comic detail + chapters
    console.log('\n=== STEP 2: Scraping comic details ===');
    const results: ScrapedComic[] = [];

    for (let i = 0; i < comicsToScrape.length; i++) {
      const comic = comicsToScrape[i];
      console.log(`\n[Comic ${i + 1}/${comicsToScrape.length}] ${comic.title}`);

      try {
        const scrapedComic = await this.scrapeComic(comic.url, i + 1, comicsToScrape.length);
        results.push(scrapedComic);
      } catch (err) {
        console.error(`  [ERROR] Failed to scrape ${comic.title}: ${(err as Error).message}`);
      }

      await this.delay();
    }

    return results;
  }

  private async scrapeComic(comicUrl: string, currentIdx: number, totalComics: number): Promise<ScrapedComic> {
    if (!this.page) throw new Error('Browser not initialized');

    // Parse detail page
    const detail = await this.retryOperation(() => parseDetailPage(this.page!, comicUrl, this.config.maxChaptersPerComic));

    console.log(`  Title: ${detail.title}`);
    console.log(`  Author: ${detail.author}`);
    console.log(`  Categories: ${detail.categories.join(', ')}`);
    console.log(`  Chapters found: ${detail.chapterLinks.length}`);

    // Download cover image
    const coverLocalPath = await this.downloadCover(detail.slug, detail.coverImageUrl);

    await this.delay();

    // Scrape chapters
    const chapters: ScrapedChapter[] = [];
    for (let j = 0; j < detail.chapterLinks.length; j++) {
      const chLink = detail.chapterLinks[j];
      console.log(`  [Comic ${currentIdx}/${totalComics}] [Chapter ${j + 1}/${detail.chapterLinks.length}] ${chLink.label}`);

      try {
        const pages = await this.retryOperation(() => parseChapterPage(this.page!, chLink.url));
        console.log(`    Pages: ${pages.length}`);

        // Download chapter images
        const localPages = await this.downloadChapterImages(detail.slug, chLink.index, pages);

        chapters.push({
          chapterIndex: chLink.index,
          chapterLabel: chLink.label,
          title: chLink.label,
          url: chLink.url,
          viewCount: 0,
          pages: localPages,
        });
      } catch (err) {
        console.error(`    [ERROR] Failed to scrape chapter: ${(err as Error).message}`);
      }

      await this.delay();
    }

    return {
      slug: detail.slug,
      title: detail.title,
      url: comicUrl,
      coverImageUrl: coverLocalPath,
      author: detail.author,
      description: detail.description,
      status: detail.status,
      categories: detail.categories,
      viewCount: detail.viewCount,
      followCount: detail.followCount,
      ratingValue: detail.ratingValue,
      ratingCount: detail.ratingCount,
      chapters,
    };
  }

  private async downloadCover(slug: string, imageUrl: string): Promise<string> {
    if (!imageUrl) return '';

    const ext = this.getImageExt(imageUrl);
    const localPath = path.join(this.config.storagePath, slug, `cover${ext}`);
    const relativePath = `/storage/comics/${slug}/cover${ext}`;

    const success = await downloadWithRetry(imageUrl, localPath);
    if (success) {
      console.log(`  [Cover] Downloaded`);
    } else {
      console.warn(`  [Cover] Failed to download`);
    }

    return relativePath;
  }

  private async downloadChapterImages(
    slug: string,
    chapterIndex: number,
    pages: { pageNumber: number; imageUrl: string }[],
  ): Promise<{ pageNumber: number; imageUrl: string }[]> {
    const concurrency = 10;
    const results: { pageNumber: number; imageUrl: string }[] = new Array(pages.length);

    for (let i = 0; i < pages.length; i += concurrency) {
      const batch = pages.slice(i, i + concurrency);
      await Promise.all(
        batch.map(async (pg, batchIdx) => {
          const idx = i + batchIdx;
          const ext = this.getImageExt(pg.imageUrl);
          const localPath = path.join(this.config.storagePath, slug, `chapter-${chapterIndex}`, `${pg.pageNumber}${ext}`);
          const relativePath = `/storage/comics/${slug}/chapter-${chapterIndex}/${pg.pageNumber}${ext}`;

          const success = await downloadWithRetry(pg.imageUrl, localPath);
          results[idx] = success
            ? { pageNumber: pg.pageNumber, imageUrl: relativePath }
            : { pageNumber: pg.pageNumber, imageUrl: pg.imageUrl };
        }),
      );
    }

    return results;
  }

  private getImageExt(url: string): string {
    const match = url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i);
    return match ? `.${match[1].toLowerCase()}` : '.jpg';
  }

  private async delay(): Promise<void> {
    const ms = this.config.delayMin + Math.random() * (this.config.delayMax - this.config.delayMin);
    await new Promise((r) => setTimeout(r, ms));
  }

  private async retryOperation<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (err) {
        lastError = err as Error;
        if (attempt < this.config.retryAttempts) {
          const backoff = Math.pow(2, attempt) * 1000;
          console.warn(`    [Retry] Attempt ${attempt}/${this.config.retryAttempts}, waiting ${backoff}ms...`);
          await new Promise((r) => setTimeout(r, backoff));
        }
      }
    }

    throw lastError;
  }
}
