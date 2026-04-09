import { sleep } from 'k6';
import { randomItem, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import { getBaseUrl, getThinkTimeMs, getEnv } from './lib/config.js';
import { getJson, postJson, unwrap, formatTopErrors } from './lib/api.js';

export const options = {
  scenarios: {
    browse: {
      executor: 'ramping-vus',
      startVUs: Number(getEnv('K6_START_VUS', '0')),
      stages: [
        { duration: getEnv('K6_RAMP_1', '30s'), target: Number(getEnv('K6_VUS_1', '50')) },
        { duration: getEnv('K6_RAMP_2', '1m'), target: Number(getEnv('K6_VUS_2', '200')) },
        { duration: getEnv('K6_RAMP_3', '2m'), target: Number(getEnv('K6_VUS_3', '500')) },
        { duration: getEnv('K6_RAMP_4', '30s'), target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
  },
};

function shouldTrackView() {
  // IMPORTANT: /public/chapters/:id/view is throttled per IP (10/min).
  // With high VUs from one machine/IP it will return 429 a lot.
  const rate = Number(getEnv('K6_VIEW_TRACK_RATE', '0')); // default OFF
  if (!Number.isFinite(rate) || rate <= 0) return false;
  return Math.random() < rate;
}

function pickComicSlug(listData) {
  const data = unwrap(listData);
  if (!data) return null;
  const items = data.items || data.data || data.list || data;
  if (!items || !Array.isArray(items) || items.length === 0) return null;
  const picked = randomItem(items);
  return picked?.slug || picked?.comic?.slug || null;
}

function pickChapterId(chaptersData) {
  const data = unwrap(chaptersData);
  if (!data) return null;
  const items = data.items || data.data || data.list || data;
  if (!items || !Array.isArray(items) || items.length === 0) return null;
  const picked = randomItem(items);
  return picked?.id ?? picked?.chapter_id ?? null;
}

export function setup() {
  const base = getBaseUrl();

  const homepage = getJson(`${base}/public/homepage`, {}, { name: 'GET /public/homepage' });
  const comics = getJson(`${base}/public/comics?page=1&limit=20`, {}, { name: 'GET /public/comics' });

  const slug = pickComicSlug(comics.json);
  let chapterId = null;

  if (slug) {
    const chapters = getJson(`${base}/public/comics/${encodeURIComponent(slug)}/chapters`, {}, { name: 'GET /public/comics/:slug/chapters' });
    chapterId = pickChapterId(chapters.json);
  }

  return { base, slug, chapterId, homepageOk: homepage.res.status };
}

export default function (data) {
  const { minMs, maxMs } = getThinkTimeMs();
  const base = data.base;

  // 1) Homepage aggregation endpoint
  getJson(`${base}/public/homepage`, {}, { name: 'GET /public/homepage' });
  sleep(randomIntBetween(minMs, maxMs) / 1000);

  // 2) Public comics list
  const list = getJson(`${base}/public/comics?page=1&limit=20`, {}, { name: 'GET /public/comics' });
  sleep(randomIntBetween(minMs, maxMs) / 1000);

  // 3) Comic details + chapters
  const slug = data.slug || pickComicSlug(list.json);
  if (slug) {
    getJson(`${base}/public/comics/${encodeURIComponent(slug)}`, {}, { name: 'GET /public/comics/:slug' });
    sleep(randomIntBetween(minMs, maxMs) / 1000);

    const chapters = getJson(`${base}/public/comics/${encodeURIComponent(slug)}/chapters`, {}, { name: 'GET /public/comics/:slug/chapters' });
    sleep(randomIntBetween(minMs, maxMs) / 1000);

    // 4) Chapter pages + view tracking (hot path)
    const chapterId = data.chapterId || pickChapterId(chapters.json);
    if (chapterId !== null && chapterId !== undefined) {
      getJson(`${base}/public/chapters/${encodeURIComponent(String(chapterId))}/pages`, {}, { name: 'GET /public/chapters/:id/pages' });
      sleep(randomIntBetween(minMs, maxMs) / 1000);

      if (shouldTrackView()) {
        postJson(`${base}/public/chapters/${encodeURIComponent(String(chapterId))}/view`, {}, {}, { name: 'POST /public/chapters/:id/view' });
        sleep(randomIntBetween(minMs, maxMs) / 1000);
      }
    }
  }
}

export function handleSummary(data) {
  // Print a concise error breakdown to stdout for fast diagnosis.
  return {
    stdout: `\n${formatTopErrors(20)}\n`,
  };
}

