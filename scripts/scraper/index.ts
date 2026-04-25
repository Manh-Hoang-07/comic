import * as path from 'path';
import { ScraperService } from './scraper.service';
import { comicExists, insertComic, disconnect } from './database.service';
import { getStorageType } from './storage-uploader';
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
  console.log(`  Storage type: ${getStorageType()}`);
  console.log(`  Local path: ${config.storagePath}`);
  console.log('');

  const scraper = new ScraperService(config);

  try {
    // Initialize browser
    console.log('[Init] Launching browser...');
    await scraper.init();
    console.log('[Init] Browser ready\n');

    // Scrape comics and insert to DB immediately after each one
    const { successCount, skippedCount, totalChapters, totalPages } = await scraper.scrapeAll(
      async (comic) => {
        console.log(`  [DB] Inserting: ${comic.title} (${comic.chapters.length} chapters)`);
        await insertComic(comic);
        return true;
      },
      (slug) => comicExists(slug),
    );

    console.log('\n===========================================');
    console.log(`  DONE!`);
    console.log(`  Comics inserted: ${successCount}, skipped: ${skippedCount}`);
    console.log(`  Total chapters: ${totalChapters}`);
    console.log(`  Total pages: ${totalPages}`);
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
