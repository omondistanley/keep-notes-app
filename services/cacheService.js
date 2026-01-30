/**
 * In-memory cache for pulled integration data (news, financial).
 * Caches real API responses so we serve fresh-but-cached data and avoid dummy values.
 * TTL: financial 5 min, news 15 min (configurable via env).
 */

const FINANCIAL_TTL_MS = parseInt(process.env.FINANCIAL_CACHE_TTL_MS || "300000", 10) || 300000; // 5 min
const NEWS_TTL_MS = parseInt(process.env.NEWS_CACHE_TTL_MS || "900000", 10) || 900000; // 15 min

const financialCache = new Map(); // key -> { data, fetchedAt }
const newsCache = new Map();

function get(key, cache, ttlMs) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > ttlMs) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function set(key, data, cache, ttlMs) {
  cache.set(key, { data, fetchedAt: Date.now() });
}

const cacheService = {
  getFinancial(key) {
    return get(key, financialCache, FINANCIAL_TTL_MS);
  },
  setFinancial(key, data) {
    set(key, data, financialCache, FINANCIAL_TTL_MS);
  },
  getNews(key) {
    return get(key, newsCache, NEWS_TTL_MS);
  },
  setNews(key, data) {
    set(key, data, newsCache, NEWS_TTL_MS);
  },
  clearFinancial() {
    financialCache.clear();
  },
  clearNews() {
    newsCache.clear();
  }
};

module.exports = cacheService;
