import http from 'k6/http';
import { check } from 'k6';
import { Counter } from 'k6/metrics';

const httpErrorCount = new Counter('http_error_count');

// In-process error aggregation for quick diagnosis (works great for local runs).
// Key format: "<status> <method> <name>"
const errorBuckets = {};

function bucketKey(method, name, status) {
  return `${status} ${method} ${name}`;
}

function recordError(method, name, status) {
  const key = bucketKey(method, name, status);
  errorBuckets[key] = (errorBuckets[key] || 0) + 1;
}

export function formatTopErrors(limit = 15) {
  const entries = Object.entries(errorBuckets)
    .sort((a, b) => (b[1] || 0) - (a[1] || 0))
    .slice(0, limit);

  if (entries.length === 0) return 'No HTTP errors captured.';

  const lines = ['Top HTTP errors (status method endpoint):'];
  for (const [key, count] of entries) {
    lines.push(`- ${count}x ${key}`);
  }
  return lines.join('\n');
}

export function unwrap(json) {
  // Most endpoints appear to be wrapped by a transform interceptor:
  // { success, message, code, httpStatus, data, meta, timestamp }
  if (json && typeof json === 'object' && 'data' in json) return json.data;
  return json;
}

export function jsonHeaders(extra = {}) {
  return {
    'content-type': 'application/json',
    accept: 'application/json',
    ...extra,
  };
}

export function authHeaders(token, extra = {}) {
  if (!token) return jsonHeaders(extra);
  return jsonHeaders({ authorization: `Bearer ${token}`, ...extra });
}

export function getJson(url, params = {}, tags = {}) {
  const res = http.get(url, { ...params, tags });
  const ok = check(res, {
    'GET status is 2xx/3xx': (r) => r.status >= 200 && r.status < 400,
  });
  if (!ok) {
    httpErrorCount.add(1, {
      method: 'GET',
      name: tags?.name || url,
      status: String(res.status),
    });
    recordError('GET', tags?.name || url, String(res.status));
  }
  let json = null;
  try {
    json = res.json();
  } catch {
    // ignore parse errors (still useful to see status/latency)
  }
  return { res, json };
}

export function postJson(url, body, params = {}, tags = {}) {
  const res = http.post(url, JSON.stringify(body ?? {}), { ...params, tags });
  const ok = check(res, {
    'POST status is 2xx/3xx': (r) => r.status >= 200 && r.status < 400,
  });
  if (!ok) {
    httpErrorCount.add(1, {
      method: 'POST',
      name: tags?.name || url,
      status: String(res.status),
    });
    recordError('POST', tags?.name || url, String(res.status));
  }
  let json = null;
  try {
    json = res.json();
  } catch {
    // ignore parse errors
  }
  return { res, json };
}

