import * as path from 'path';
import { ScraperService } from './scraper.service';
import { comicExists, insertComic, disconnect } from './database.service';
import type { ScraperConfig } from './types';

const config: ScraperConfig = {
  baseUrl: 'https://nettruyen.works',
  maxComics: 40,
  maxChaptersPerComic: 20,
  delayMin: 300,
  delayMax: 500,
  retryAttempts: 3,
  timeout: 30000,
  storagePath: path.resolve(__dirname, '../../storage/comics'),
};

async function main() {
  console.log('===========================================');
  console.log('  NetTruyen Comic Scraper');
  console.log('===========================================');
  console.log(`Config:`);
  console.log(`  Max comics: ${config.maxComics}`);
  console.log(`  Max chapters/comic: ${config.maxChaptersPerComic}`);
  console.log(`  Delay: ${config.delayMin}-${config.delayMax}ms`);
  console.log(`  Storage: ${config.storagePath}`);
  console.log('');

  const scraper = new ScraperService(config);

  try {
    // Initialize browser
    console.log('[Init] Launching browser...');
    await scraper.init();
    console.log('[Init] Browser ready\n');

    // Scrape comics
    const comics = await scraper.scrapeAll();

    console.log(`\n=== STEP 3: Saving to database ===`);
    console.log(`Total comics scraped: ${comics.length}`);

    // Insert comics (skip if already exists)
    let successCount = 0;
    let skippedCount = 0;
    for (let i = 0; i < comics.length; i++) {
      const comic = comics[i];
      try {
        if (await comicExists(comic.slug)) {
          console.log(`[DB ${i + 1}/${comics.length}] Skipped (already exists): ${comic.title}`);
          skippedCount++;
          continue;
        }
        console.log(`[DB ${i + 1}/${comics.length}] Inserting: ${comic.title} (${comic.chapters.length} chapters)`);
        await insertComic(comic);
        successCount++;
      } catch (err) {
        console.error(`[DB] Failed to insert ${comic.title}: ${(err as Error).message}`);
      }
    }

    console.log('\n===========================================');
    console.log(`  DONE!`);
    console.log(`  Comics inserted: ${successCount}, skipped: ${skippedCount}`);
    console.log(`  Total chapters: ${comics.reduce((sum, c) => sum + c.chapters.length, 0)}`);
    console.log(`  Total pages: ${comics.reduce((sum, c) => sum + c.chapters.reduce((s, ch) => s + ch.pages.length, 0), 0)}`);
    console.log('===========================================');
  } catch (err) {
    console.error('\n[FATAL]', (err as Error).message);
    console.error((err as Error).stack);
  } finally {
    await scraper.close();
    await disconnect();
    console.log('\n[Cleanup] Browser closed, DB disconnected');
  }
}

main();
