import puppeteer, { type Browser, type Page } from 'puppeteer';
import { parseListingPage, parseDetailPage, parseChapterPage } from './page-parser';
import { downloadToBufferWithRetry } from './image-downloader';
import { getUploader } from './storage-uploader';
import type { ScrapedComic, ScrapedChapter, ScraperConfig } from './types';

const CONCURRENT_COMICS = 2;
const IMAGE_CONCURRENCY = 5;

export class ScraperService {
  private browser: Browser | null = null;
  private config: ScraperConfig;

  constructor(config: ScraperConfig) {
    this.config = config;
  }

  async init(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private async createPage(): Promise<Page> {
    if (!this.browser) throw new Error('Browser not initialized');
    const page = await this.browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    );
    await page.setViewport({ width: 1280, height: 800 });
    return page;
  }

  async scrapeAll(
    onComicScraped?: (comic: ScrapedComic) => Promise<boolean>,
    shouldSkip?: (slug: string) => Promise<boolean>,
  ): Promise<{ successCount: number; skippedCount: number; totalChapters: number; totalPages: number }> {
    if (!this.browser) throw new Error('Browser not initialized. Call init() first.');

    // Step 1: Get comic list from listing pages
    console.log('\n=== STEP 1: Scraping comic listing ===');
    const listPage = await this.createPage();
    const comicList: { slug: string; url: string; title: string }[] = [];
    const itemsPerPage = 36;
    const pagesNeeded = Math.ceil(this.config.maxComics / itemsPerPage);

    for (let p = 1; p <= pagesNeeded; p++) {
      const comics = await parseListingPage(listPage, p);
      comicList.push(...comics);
      if (p < pagesNeeded) await this.delay();
    }
    await listPage.close();

    const comicsToScrape = comicList.slice(0, this.config.maxComics);
    console.log(`\nTotal comics to scrape: ${comicsToScrape.length}`);

    // Step 2: Scrape comics in parallel batches, insert to DB immediately
    console.log('\n=== STEP 2: Scraping comic details (2 concurrent) ===');
    let successCount = 0;
    let skippedCount = 0;
    let totalChapters = 0;
    let totalPages = 0;

    for (let i = 0; i < comicsToScrape.length; i += CONCURRENT_COMICS) {
      const batch = comicsToScrape.slice(i, i + CONCURRENT_COMICS);
      await Promise.allSettled(
        batch.map(async (comic, batchIdx) => {
          const idx = i + batchIdx;

          // Skip comics that already exist before scraping
          if (shouldSkip) {
            try {
              if (await shouldSkip(comic.slug)) {
                console.log(`\n[Comic ${idx + 1}/${comicsToScrape.length}] Skipped (already exists): ${comic.title}`);
                skippedCount++;
                return;
              }
            } catch (err) {
              console.error(`  [DB ERROR] Check exists ${comic.title}: ${(err as Error).message}`);
            }
          }

          const page = await this.createPage();
          try {
            console.log(`\n[Comic ${idx + 1}/${comicsToScrape.length}] ${comic.title}`);
            const result = await this.scrapeComic(page, comic.url, idx + 1, comicsToScrape.length);

            // Insert to DB immediately
            if (onComicScraped) {
              try {
                await onComicScraped(result);
                successCount++;
                totalChapters += result.chapters.length;
                totalPages += result.chapters.reduce((s, ch) => s + ch.pages.length, 0);
              } catch (err) {
                console.error(`  [DB ERROR] ${comic.title}: ${(err as Error).message}`);
              }
            }
          } catch (err) {
            console.error(`  [ERROR] Failed to scrape ${comic.title}: ${(err as Error).message}`);
          } finally {
            await page.close();
          }
        }),
      );

      await this.delay();
    }

    return { successCount, skippedCount, totalChapters, totalPages };
  }

  private async scrapeComic(page: Page, comicUrl: string, currentIdx: number, totalComics: number): Promise<ScrapedComic> {
    // Parse detail page
    const detail = await this.retryOperation(() => parseDetailPage(page, comicUrl, this.config.maxChaptersPerComic));

    console.log(`  Title: ${detail.title} | Author: ${detail.author} | Chapters: ${detail.chapterLinks.length}`);

    // Download cover image
    const coverLocalPath = await this.downloadCover(detail.slug, detail.coverImageUrl);

    // Scrape chapters
    const chapters: ScrapedChapter[] = [];
    for (let j = 0; j < detail.chapterLinks.length; j++) {
      const chLink = detail.chapterLinks[j];
      console.log(`  [${currentIdx}/${totalComics}] Ch ${j + 1}/${detail.chapterLinks.length} - ${chLink.label}`);

      try {
        const pages = await this.retryOperation(() => parseChapterPage(page, chLink.url));

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
        console.error(`    [ERROR] Chapter failed: ${(err as Error).message}`);
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
    const key = `${slug}/cover${ext}`;
    const mimetype = this.getMimetype(ext);

    const buffer = await downloadToBufferWithRetry(imageUrl);
    if (!buffer) return '';

    const uploader = getUploader();
    const result = await uploader.upload(buffer, key, mimetype);
    return result.url;
  }

  private async downloadChapterImages(
    slug: string,
    chapterIndex: number,
    pages: { pageNumber: number; imageUrl: string }[],
  ): Promise<{ pageNumber: number; imageUrl: string }[]> {
    const results: { pageNumber: number; imageUrl: string }[] = new Array(pages.length);
    const uploader = getUploader();

    for (let i = 0; i < pages.length; i += IMAGE_CONCURRENCY) {
      const batch = pages.slice(i, i + IMAGE_CONCURRENCY);
      await Promise.all(
        batch.map(async (pg, batchIdx) => {
          const idx = i + batchIdx;
          const ext = this.getImageExt(pg.imageUrl);
          const key = `${slug}/chapter-${chapterIndex}/${pg.pageNumber}${ext}`;
          const mimetype = this.getMimetype(ext);

          const buffer = await downloadToBufferWithRetry(pg.imageUrl);
          if (buffer) {
            const result = await uploader.upload(buffer, key, mimetype);
            results[idx] = { pageNumber: pg.pageNumber, imageUrl: result.url };
          } else {
            results[idx] = { pageNumber: pg.pageNumber, imageUrl: pg.imageUrl };
          }
        }),
      );
      // Small delay between image batches to avoid throttling
      if (i + IMAGE_CONCURRENCY < pages.length) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    return results;
  }

  private getImageExt(url: string): string {
    const match = url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i);
    return match ? `.${match[1].toLowerCase()}` : '.jpg';
  }

  private getMimetype(ext: string): string {
    const map: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    return map[ext] || 'image/jpeg';
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
