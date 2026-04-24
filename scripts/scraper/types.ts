export interface ScrapedComic {
  slug: string;
  title: string;
  url: string;
  coverImageUrl: string;
  author: string;
  description: string;
  status: string;
  categories: string[];
  viewCount: number;
  followCount: number;
  ratingValue: number;
  ratingCount: number;
  chapters: ScrapedChapter[];
}

export interface ScrapedChapter {
  chapterIndex: number;
  chapterLabel: string;
  title: string;
  url: string;
  viewCount: number;
  pages: ScrapedPage[];
}

export interface ScrapedPage {
  pageNumber: number;
  imageUrl: string;
}

export interface ScraperConfig {
  baseUrl: string;
  maxComics: number;
  maxChaptersPerComic: number;
  delayMin: number;
  delayMax: number;
  retryAttempts: number;
  timeout: number;
  storagePath: string;
}
