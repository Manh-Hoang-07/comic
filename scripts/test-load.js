import http from 'k6/http';
import { check } from 'k6';
import { Counter } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

/**
 * Đổi host/port: k6 run -e BASE_URL=http://127.0.0.1:8000 test.js
 * Log lỗi mạng: mặc định mọi status=0; giảm spam: -e K6_NET_ERROR_SAMPLE=0.05
 * Nếu 100% status=0 và data_received=0 B → gần như chắc app không lắng nghe / sai URL.
 */
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

/** Timeout k6 (ms): nên >= app request timeout để status 0 không bị nhầm với reset kết nối */
const HTTP_TIMEOUT_MS = '120s';

/**
 * Log lỗi transport (status=0)
 * 1 = log mọi lần; 0.05 = sample 5% để tránh spam terminal khi tải cao.
 */
const K6_NET_ERROR_SAMPLE = 1; 


const codes = [200, 408, 429, 500, 502, 503, 504];
const endpoints = ['homepage', 'comics'];

/** Mỗi endpoint × mã HTTP + 0 (lỗi transport) + other */
const c = {};
for (const ep of endpoints) {
  for (const code of codes) {
    const key = `${ep}_${code}`;
    c[key] = new Counter(key);
  }
  c[`${ep}_0`] = new Counter(`${ep}_0_net`);
  c[`${ep}_other`] = new Counter(`${ep}_other`);
}

function recordStatus(endpoint, res) {
  const s = res.status;
  if (s === 0) {
    c[`${endpoint}_0`].add(1);
    return;
  }
  const named = `${endpoint}_${s}`;
  if (c[named]) c[named].add(1);
  else c[`${endpoint}_other`].add(1);
}

function request(name, baseUrl, path) {
  const url = `${baseUrl}${path}`;
  const res = http.get(url, { timeout: HTTP_TIMEOUT_MS });
  recordStatus(name, res);

  check(res, {
    [`${name}: status is 200`]: (r) => r.status === 200,
  });

  if (res.status === 0 && Math.random() < K6_NET_ERROR_SAMPLE) {
    console.warn(
      `[${name}] transport status=0 error_code=${res.error_code ?? 'n/a'} error="${res.error ?? ''}" url=${url}`,
    );
  } else if (res.status !== 200 && res.status !== 0 && Math.random() < 0.02) {
    console.warn(
      `[${name}] status=${res.status} error_code=${res.error_code ?? 'n/a'} error="${res.error ?? ''}" url=${url}`,
    );
  }

  return res;
}

/** Chạy 1 lần trước VU: không bắt được server thì dừng ngay, tránh chạy 30s vô nghĩa */
export function setup() {
  const probe = `${BASE_URL}/api/public/homepage`;
  const res = http.get(probe, { timeout: '10s' });
  if (res.status === 0) {
    throw new Error(
      `[setup] Không kết nối được ${probe}\n` +
        `  → Kiểm tra: npm run start:dev (hoặc app) đang chạy đúng PORT.\n` +
        `  → Thử: k6 run -e BASE_URL=http://127.0.0.1:8000 test.js\n` +
        `  → k6: error_code=${res.error_code} message="${res.error}"`,
    );
  }
  return { baseUrl: BASE_URL };
}

export const options = {
  vus: 500,
  duration: '30s',
};

export default function (data) {
  const base = (data && data.baseUrl) || BASE_URL;
  request('homepage', base, '/api/public/homepage');
  request('comics', base, '/api/public/comics');
}

export function handleSummary(data) {
  const lines = ['\n========== HTTP status breakdown =========='];

  const row = (label, metricName) => {
    const n = data.metrics[metricName]?.values?.count ?? 0;
    if (n === 0) return;
    lines.push(`  ${label.padEnd(24)} ${n}`);
  };

  for (const ep of endpoints) {
    lines.push(`  --- ${ep} ---`);
    row('200', `${ep}_200`);
    row('408 (timeout app)', `${ep}_408`);
    row('429', `${ep}_429`);
    row('500', `${ep}_500`);
    row('502', `${ep}_502`);
    row('503', `${ep}_503`);
    row('504', `${ep}_504`);
    row('0 (network / k6 timeout)', `${ep}_0_net`);
    row('other HTTP', `${ep}_other`);
  }

  const z = data.metrics.homepage_0_net?.values?.count ?? 0;
  const total = data.metrics.http_reqs?.values?.count ?? 0;
  if (total > 0 && z === total / 2) {
    lines.push(
      '\n  [Gợi ý] Mọi request status=0 + data_received=0 → server không phản hồi (down/sai port).',
    );
  }

  lines.push('===========================================\n');

  return {
    stdout:
      textSummary(data, { indent: ' ', enableColors: true }) + '\n' + lines.join('\n'),
  };
}
