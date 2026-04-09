import { sleep } from 'k6';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import { getBaseUrl, getThinkTimeMs, getEnv } from './lib/config.js';
import { getJson, postJson, unwrap, authHeaders, formatTopErrors } from './lib/api.js';

export const options = {
  scenarios: {
    userJourney: {
      executor: 'ramping-vus',
      startVUs: Number(getEnv('K6_START_VUS', '0')),
      stages: [
        { duration: getEnv('K6_RAMP_1', '30s'), target: Number(getEnv('K6_VUS_1', '10')) },
        { duration: getEnv('K6_RAMP_2', '1m'), target: Number(getEnv('K6_VUS_2', '50')) },
        { duration: getEnv('K6_RAMP_3', '2m'), target: Number(getEnv('K6_VUS_3', '100')) },
        { duration: getEnv('K6_RAMP_4', '30s'), target: 0 },
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1200', 'p(99)<2500'],
  },
};

function pickFirst(items) {
  if (!items || !Array.isArray(items) || items.length === 0) return null;
  return items[0];
}

function pickComicAndChapterIds(comicsListJson, chaptersJson) {
  const comicsData = unwrap(comicsListJson);
  const comicsItems = comicsData?.items || comicsData?.data || comicsData?.list || comicsData;
  const firstComic = pickFirst(comicsItems);
  const comicId = firstComic?.id ?? firstComic?.comic_id ?? null;
  const comicSlug = firstComic?.slug ?? null;

  const chapData = unwrap(chaptersJson);
  const chapItems = chapData?.items || chapData?.data || chapData?.list || chapData;
  const firstChap = pickFirst(chapItems);
  const chapterId = firstChap?.id ?? firstChap?.chapter_id ?? null;

  return { comicId, comicSlug, chapterId };
}

export function setup() {
  const base = getBaseUrl();

  const email = getEnv('K6_EMAIL');
  const password = getEnv('K6_PASSWORD');

  let token = null;
  let refreshToken = null;

  if (email && password) {
    const login = postJson(
      `${base}/login`,
      { email, password, remember: true },
      { headers: { 'content-type': 'application/json', accept: 'application/json' } },
      { name: 'POST /login' },
    );

    const data = unwrap(login.json);
    token = data?.token ?? null;
    refreshToken = data?.refreshToken ?? null;
  }

  const comics = getJson(`${base}/public/comics?page=1&limit=10`, {}, { name: 'GET /public/comics' });
  let chapters = { json: null };
  let ids = { comicId: null, comicSlug: null, chapterId: null };

  const comicsData = unwrap(comics.json);
  const items = comicsData?.items || comicsData?.data || comicsData?.list || comicsData;
  const firstComic = pickFirst(items);
  const slug = firstComic?.slug;
  if (slug) {
    chapters = getJson(`${base}/public/comics/${encodeURIComponent(slug)}/chapters`, {}, { name: 'GET /public/comics/:slug/chapters' });
  }

  ids = pickComicAndChapterIds(comics.json, chapters.json);

  return { base, token, refreshToken, ...ids };
}

export default function (data) {
  const { minMs, maxMs } = getThinkTimeMs();
  const headers = authHeaders(data.token);

  // If no token provided, just exercise public endpoints and exit.
  if (!data.token) {
    getJson(`${data.base}/public/homepage`, {}, { name: 'GET /public/homepage' });
    sleep(randomIntBetween(minMs, maxMs) / 1000);
    return;
  }

  // Profile (auth)
  getJson(`${data.base}/user/profile`, { headers }, { name: 'GET /user/profile' });
  sleep(randomIntBetween(minMs, maxMs) / 1000);

  // Reading history update (auth write)
  if (data.comicId && data.chapterId) {
    postJson(
      `${data.base}/user/reading-history`,
      { comic_id: data.comicId, chapter_id: data.chapterId },
      { headers },
      { name: 'POST /user/reading-history' },
    );
    sleep(randomIntBetween(minMs, maxMs) / 1000);
  }

  // Bookmark create (auth write)
  if (data.chapterId) {
    postJson(
      `${data.base}/user/bookmarks`,
      { chapter_id: data.chapterId, page_number: 1 },
      { headers },
      { name: 'POST /user/bookmarks' },
    );
    sleep(randomIntBetween(minMs, maxMs) / 1000);
  }

  // Follow/unfollow can create churn; keep to a light read to avoid polluting data too much.
  if (data.comicId) {
    getJson(
      `${data.base}/user/follows/comics/${encodeURIComponent(String(data.comicId))}/is-following`,
      { headers },
      { name: 'GET /user/follows/comics/:comicId/is-following' },
    );
    sleep(randomIntBetween(minMs, maxMs) / 1000);
  }
}

export function handleSummary(data) {
  return {
    stdout: `\n${formatTopErrors(20)}\n`,
  };
}

