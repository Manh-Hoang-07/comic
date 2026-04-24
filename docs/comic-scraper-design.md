# Comic Scraper - Thiết kế giải pháp

## Tổng quan

Script standalone Node.js + TypeScript dùng **Puppeteer** để crawl ~40 truyện hot nhất từ `nettruyen.works`, mỗi truyện tối đa 50 chapter mới nhất. Ảnh lưu local, data insert vào MySQL qua Prisma.

## Nguồn dữ liệu

- **Listing page:** `https://nettruyen.works/tim-truyen?sort=10` (top all time, 20 truyện/trang → 2 trang)
- **Detail page:** `/truyen-tranh/{slug}` → thông tin truyện + danh sách chapter
- **Chapter page:** `/truyen-tranh/{slug}/chuong-{number}` → ảnh các trang

## Cấu trúc thư mục

```
d:\comic/
├── scripts/
│   └── scraper/
│       ├── index.ts              # Entry point
│       ├── scraper.service.ts    # Logic crawl chính (orchestrator)
│       ├── page-parser.ts        # Parse data từ các trang (Puppeteer)
│       ├── image-downloader.ts   # Download ảnh về local
│       ├── database.service.ts   # Xóa data cũ + insert data mới qua Prisma
│       └── types.ts              # TypeScript interfaces cho scraped data
├── storage/
│   └── comics/                   # Ảnh lưu local
│       └── {comic-slug}/
│           └── chapter-{index}/
│               └── {page-number}.jpg
```

## Flow xử lý

```
1. Xóa sạch dữ liệu cũ (ChapterPage → Chapter → ComicStats → ComicCategoryOnComic → Comic)
2. Crawl listing page (2 trang) → 40 comic URLs
       ↓ delay 1-2s giữa mỗi request
3. Crawl detail page (x40) → comic info + chapter list (max 50 mới nhất)
       ↓ delay 1-2s
4. Crawl chapter page (tối đa ~2000) → page image URLs
       ↓ delay 1-2s
5. Download images → save to storage/comics/{slug}/chapter-{index}/{page}.jpg
       ↓
6. Insert vào database: Comic → ComicStats → ComicCategory → ComicCategoryOnComic → Chapter → ChapterPage
```

## Data mapping

| Nettruyen Field | DB Model | DB Field | Ghi chú |
|---|---|---|---|
| Title | Comic | title, slug | slug generate từ URL |
| Cover image | Comic | cover_image | Local path: `/storage/comics/{slug}/cover.jpg` |
| Author | Comic | author | |
| Description | Comic | description | |
| Trạng thái | Comic | status | Map: "Đang tiến hành" → "published", "Hoàn thành" → "published" |
| Thể loại | ComicCategory | name, slug | Upsert theo slug |
| Lượt xem | ComicStats | view_count | Parse "527.042" → 527042 |
| Lượt theo dõi | ComicStats | follow_count | Parse "52.272.604" → 52272604 |
| Rating | ComicStats | rating_sum, rating_count | |
| Chapter number | Chapter | chapter_index, chapter_label | |
| Chapter view | Chapter | view_count | |
| Page images | ChapterPage | image_url, page_number | Local path |

## Xử lý ảnh Nettruyen

- Ảnh dùng lazy loading (lozad library)
- Dual server: `data-sv1`, `data-sv2` attributes
- Puppeteer sẽ scroll page để trigger lazy load, sau đó đọc `src` hoặc `data-sv1`
- Download qua HTTP stream với referer header = `https://nettruyen.works`

## Rate Limiting & Error Handling

- **Delay:** Random 1-2 giây giữa mỗi request
- **Retry:** Tối đa 3 lần, exponential backoff (2s, 4s, 8s)
- **Timeout:** 30s cho mỗi page load
- **Resume:** Skip download nếu file ảnh đã tồn tại
- **Logging:** Console log progress `[Comic 5/40] [Chapter 10/50] [Page 3/20]`

## Chạy script

```bash
npx ts-node scripts/scraper/index.ts
```

## Dependencies bổ sung

- `puppeteer` - headless browser
- (Prisma client đã có sẵn)

## Ước tính dung lượng

- ~40 truyện × 50 chapter × ~20 trang × ~200KB/ảnh ≈ **~8GB** storage
- Thời gian crawl: ~3-5 giờ (do rate limiting 1-2s/request)
