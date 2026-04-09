import { getBaseUrl } from './lib/config.js';
import { getJson, postJson, unwrap, formatTopErrors } from './lib/api.js';

export const options = {
  vus: 1,
  duration: '10s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
  },
};

export function setup() {
  const base = getBaseUrl();
  return { base };
}

export default function (data) {
  getJson(`${data.base}/public/homepage`, {}, { name: 'GET /public/homepage' });
  getJson(`${data.base}/public/menus`, {}, { name: 'GET /public/menus' });

  const comics = getJson(`${data.base}/public/comics?page=1&limit=5`, {}, { name: 'GET /public/comics' });
  const comicsData = unwrap(comics.json);
  const items = comicsData?.items || comicsData?.data || comicsData?.list || comicsData;
  const first = Array.isArray(items) ? items[0] : null;
  const slug = first?.slug;
  if (slug) {
    getJson(`${data.base}/public/comics/${encodeURIComponent(slug)}`, {}, { name: 'GET /public/comics/:slug' });
    const chapters = getJson(`${data.base}/public/comics/${encodeURIComponent(slug)}/chapters`, {}, { name: 'GET /public/comics/:slug/chapters' });
    const chapData = unwrap(chapters.json);
    const chItems = chapData?.items || chapData?.data || chapData?.list || chapData;
    const firstChap = Array.isArray(chItems) ? chItems[0] : null;
    const chapterId = firstChap?.id ?? firstChap?.chapter_id;
    if (chapterId !== undefined && chapterId !== null) {
      getJson(`${data.base}/public/chapters/${encodeURIComponent(String(chapterId))}/pages`, {}, { name: 'GET /public/chapters/:id/pages' });
      postJson(`${data.base}/public/chapters/${encodeURIComponent(String(chapterId))}/view`, {}, {}, { name: 'POST /public/chapters/:id/view' });
    }
  }
}

export function handleSummary(data) {
  return {
    stdout: `\n${formatTopErrors(20)}\n`,
  };
}

