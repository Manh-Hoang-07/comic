import type { Page } from 'puppeteer';
import type { ScrapedComic, ScrapedChapter, ScrapedPage } from './types';

const BASE_URL = 'https://nettruyen.works';

export async function parseListingPage(page: Page, pageNum: number): Promise<{ slug: string; url: string; title: string }[]> {
  const url = `${BASE_URL}/tim-truyen?sort=10&page=${pageNum}`;
  console.log(`  [Listing] Loading page ${pageNum}: ${url}`);

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('.items .item', { timeout: 10000 });

  const comics = await page.evaluate(() => {
    const items = document.querySelectorAll('.items .item');
    const results: { slug: string; url: string; title: string }[] = [];

    items.forEach((item) => {
      const linkEl = item.querySelector('.image > a') as HTMLAnchorElement;
      const titleEl = item.querySelector('figcaption h3 a') || item.querySelector('h3 a');

      if (linkEl && titleEl) {
        const href = linkEl.getAttribute('href') || '';
        const fullUrl = href.startsWith('http') ? href : `${window.location.origin}${href}`;
        const slug = href.replace(/.*\/truyen-tranh\//, '').replace(/\/$/, '');

        results.push({
          slug,
          url: fullUrl,
          title: (titleEl as HTMLElement).innerText.trim(),
        });
      }
    });

    return results;
  });

  console.log(`  [Listing] Found ${comics.length} comics on page ${pageNum}`);
  return comics;
}

export async function parseDetailPage(
  page: Page,
  comicUrl: string,
  maxChapters: number,
): Promise<Omit<ScrapedComic, 'chapters'> & { chapterLinks: { url: string; label: string; index: number }[] }> {
  await page.goto(comicUrl, { waitUntil: 'networkidle2', timeout: 30000 });

  // Click "Xem thêm" to load full chapter list via AJAX
  await page.evaluate(() => {
    const btn = document.querySelector('.view-more') as HTMLElement;
    if (btn) {
      btn.classList.remove('hidden');
      btn.click();
    }
  });
  // Wait for AJAX chapter list to load
  await new Promise((r) => setTimeout(r, 3000));

  const data = await page.evaluate(
    (maxCh: number) => {
      // Title
      const titleEl = document.querySelector('h1.title-detail') || document.querySelector('h1');
      const title = titleEl?.textContent?.trim() || '';

      // Cover image
      const coverEl = document.querySelector('.col-image img') as HTMLImageElement;
      const coverImageUrl = coverEl?.getAttribute('src') || coverEl?.getAttribute('data-original') || '';

      // Info rows
      const infoRows = document.querySelectorAll('.list-info .row');
      let author = '';
      let status = '';
      const categories: string[] = [];

      infoRows.forEach((row) => {
        const label = row.querySelector('.name')?.textContent?.trim() || '';
        if (label.includes('Tác giả')) {
          const authorLinks = row.querySelectorAll('.col-xs-8 a');
          author = Array.from(authorLinks)
            .map((a) => a.textContent?.trim())
            .filter(Boolean)
            .join(', ');
          if (!author) {
            author = row.querySelector('.col-xs-8')?.textContent?.trim() || '';
          }
        } else if (label.includes('Tình trạng')) {
          status = row.querySelector('.col-xs-8')?.textContent?.trim() || '';
        } else if (label.includes('Thể loại')) {
          row.querySelectorAll('.col-xs-8 a').forEach((a) => {
            const cat = a.textContent?.trim();
            if (cat) categories.push(cat);
          });
        }
      });

      // Description
      const descEl = document.querySelector('.detail-content p') || document.querySelector('.detail-content');
      const description = descEl?.textContent?.trim() || '';

      // Stats
      const followEl = document.querySelector('.follow span b, .follow b');
      const followText = followEl?.textContent?.trim() || '0';
      const followCount = parseInt(followText.replace(/[.,]/g, ''), 10) || 0;

      // View count from info
      let viewCount = 0;
      infoRows.forEach((row) => {
        const label = row.querySelector('.name')?.textContent?.trim() || '';
        if (label.includes('Lượt xem')) {
          const viewText = row.querySelector('.col-xs-8')?.textContent?.trim() || '0';
          viewCount = parseInt(viewText.replace(/[.,]/g, ''), 10) || 0;
        }
      });

      // Rating
      const ratingEl = document.querySelector('[itemprop="ratingValue"]');
      const ratingCountEl = document.querySelector('[itemprop="ratingCount"]');
      const ratingValue = parseFloat(ratingEl?.getAttribute('content') || ratingEl?.textContent || '0') || 0;
      const ratingCount = parseInt((ratingCountEl?.getAttribute('content') || ratingCountEl?.textContent || '0').replace(/[.,]/g, ''), 10) || 0;

      // Chapter list (full list after AJAX load)
      const chapterRows = document.querySelectorAll('#nt_listchapter .row a[href*="chuong"]');
      const chapterLinks: { url: string; label: string; index: number }[] = [];

      chapterRows.forEach((linkEl) => {
        if (chapterLinks.length >= maxCh) return;

        const href = linkEl.getAttribute('href') || '';
        const chapterText = linkEl.textContent?.trim() || '';

        // Parse chapter index from text like "Chapter 100" or "Chương 100"
        const indexMatch = chapterText.match(/(?:chapter|chương|chuong|chap)\.?\s*(\d+(?:\.\d+)?)/i);
        const chapterIndex = indexMatch ? parseFloat(indexMatch[1]) : 0;

        if (chapterIndex > 0) {
          chapterLinks.push({
            url: href.startsWith('http') ? href : `${window.location.origin}${href}`,
            label: chapterText,
            index: Math.floor(chapterIndex),
          });
        }
      });

      return {
        title,
        coverImageUrl,
        author,
        description,
        status,
        categories,
        viewCount,
        followCount,
        ratingValue,
        ratingCount,
        chapterLinks,
      };
    },
    maxChapters,
  );

  const slug = comicUrl.replace(/.*\/truyen-tranh\//, '').replace(/\/$/, '');

  return {
    slug,
    title: data.title,
    url: comicUrl,
    coverImageUrl: data.coverImageUrl,
    author: data.author,
    description: data.description,
    status: data.status,
    categories: data.categories,
    viewCount: data.viewCount,
    followCount: data.followCount,
    ratingValue: data.ratingValue,
    ratingCount: data.ratingCount,
    chapterLinks: data.chapterLinks,
  };
}

export async function parseChapterPage(page: Page, chapterUrl: string): Promise<ScrapedPage[]> {
  await page.goto(chapterUrl, { waitUntil: 'networkidle2', timeout: 30000 });

  // Scroll to trigger lazy loading
  await autoScroll(page);

  const pages = await page.evaluate(() => {
    const images = document.querySelectorAll('.reading-detail .page-chapter img');
    const results: ScrapedPage[] = [];

    images.forEach((img, index) => {
      const src =
        (img as HTMLImageElement).getAttribute('data-sv1') ||
        (img as HTMLImageElement).getAttribute('src') ||
        (img as HTMLImageElement).getAttribute('data-sv2') ||
        (img as HTMLImageElement).getAttribute('data-original') ||
        (img as HTMLImageElement).getAttribute('data-cdn') ||
        (img as HTMLImageElement).getAttribute('data-src') ||
        '';

      if (src && !src.includes('thumb-default') && !src.includes('loading')) {
        results.push({
          pageNumber: index + 1,
          imageUrl: src.startsWith('//') ? `https:${src}` : src,
        });
      }
    });

    return results;
  });

  return pages;
}

async function autoScroll(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 500;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
  // Wait for lazy-loaded images
  await new Promise((r) => setTimeout(r, 1000));
}
