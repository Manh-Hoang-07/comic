export function getEnv(name, fallback = undefined) {
  const v = __ENV[name];
  if (v === undefined || v === null || v === '') return fallback;
  return v;
}

export function getBaseUrl() {
  const base = getEnv('K6_BASE_URL', 'http://localhost:8000');
  const prefix = getEnv('K6_API_PREFIX', '/api');
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const normalizedPrefix = prefix.startsWith('/') ? prefix : `/${prefix}`;
  return `${normalizedBase}${normalizedPrefix}`;
}

export function getThinkTimeMs() {
  const minMs = Number(getEnv('K6_THINK_MIN_MS', '200'));
  const maxMs = Number(getEnv('K6_THINK_MAX_MS', '800'));
  return { minMs, maxMs };
}

