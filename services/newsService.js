/**
 * News Service
 * Fetches real news from multiple sources; pulled data is cached (see cacheService).
 * - Google News RSS (no key), tried first
 * - GNews, Guardian, NYT, NewsAPI when keys are set
 * Only real articles are cached and returned; no mock/dummy data.
 */

const axios = require("axios");
const Parser = require("rss-parser");
const cacheService = require("./cacheService");
const rssParser = new Parser({
  timeout: 8000,
  headers: { "User-Agent": "KeepNotesApp/1.0 (News aggregator)" }
});

function normalizeArticle(a) {
  return {
    title: a.title || "",
    url: a.url || a.link || "",
    source: a.source || a.sourceName || "Unknown",
    publishedAt: a.publishedAt ? new Date(a.publishedAt) : (a.pubDate ? new Date(a.pubDate) : new Date()),
    snippet: (a.snippet || a.description || a.content || "").substring(0, 300),
    relevance: typeof a.relevance === "number" ? a.relevance : 0.8
  };
}

function dedupeByUrl(articles) {
  const seen = new Set();
  return articles.filter((a) => {
    const u = (a.url || a.link || "").toLowerCase();
    if (!u || seen.has(u)) return false;
    seen.add(u);
    return true;
  });
}

class NewsService {
  /**
   * GNews API (free tier: 100 req/day) - https://gnews.io/
   */
  async fetchGNews(keywords, count = 10) {
    const apiKey = process.env.GNEWS_API_KEY;
    if (!apiKey || !keywords.length) return [];
    const query = keywords.slice(0, 3).join(" ");
    try {
      const res = await axios.get("https://gnews.io/api/v4/search", {
        params: { q: query, lang: "en", max: Math.min(count, 20), apikey: apiKey },
        timeout: 10000
      });
      const items = (res.data && res.data.articles) || [];
      return items
        .filter((a) => a.title && a.url)
        .map((a) =>
          normalizeArticle({
            title: a.title,
            url: a.url,
            source: a.source?.name || "GNews",
            publishedAt: a.publishedAt,
            snippet: a.description || a.content
          })
        );
    } catch (err) {
      console.error("GNews error:", err.message);
      return [];
    }
  }

  /**
   * The Guardian API (free) - https://open-platform.theguardian.com/
   */
  async fetchGuardian(keywords, count = 10) {
    const apiKey = process.env.GUARDIAN_API_KEY;
    if (!apiKey || !keywords.length) return [];
    const query = keywords.slice(0, 3).join(" ");
    try {
      const res = await axios.get("https://content.guardianapis.com/search", {
        params: {
          "api-key": apiKey,
          q: query,
          "show-fields": "trailText",
          "page-size": Math.min(count, 20)
        },
        timeout: 10000
      });
      const items = (res.data && res.data.response && res.data.response.results) || [];
      return items
        .filter((a) => a.webTitle && a.webUrl)
        .map((a) =>
          normalizeArticle({
            title: a.webTitle,
            url: a.webUrl,
            source: "The Guardian",
            publishedAt: a.webPublicationDate,
            snippet: (a.fields && a.fields.trailText) || ""
          })
        );
    } catch (err) {
      console.error("Guardian error:", err.message);
      return [];
    }
  }

  /**
   * New York Times Article Search (free with key) - https://developer.nytimes.com/
   */
  async fetchNYT(keywords, count = 10) {
    const apiKey = process.env.NYT_API_KEY;
    if (!apiKey || !keywords.length) return [];
    const query = keywords.slice(0, 3).join(" ");
    try {
      const res = await axios.get("https://api.nytimes.com/svc/search/v2/articlesearch.json", {
        params: { "api-key": apiKey, q: query, sort: "newest" },
        timeout: 10000
      });
      const docs = (res.data && res.data.response && res.data.response.docs) || [];
      return docs
        .filter((d) => d.headline && d.headline.main && d.web_url)
        .slice(0, count)
        .map((d) =>
          normalizeArticle({
            title: d.headline.main,
            url: d.web_url,
            source: "NYT",
            publishedAt: d.pub_date,
            snippet: d.snippet || d.abstract || ""
          })
        );
    } catch (err) {
      console.error("NYT error:", err.message);
      return [];
    }
  }

  /**
   * NewsAPI.org (optional, dev key limited)
   */
  async fetchNewsAPI(keywords, count = 10) {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey || !keywords.length) return [];
    const query = keywords.slice(0, 3).join(" OR ");
    try {
      const res = await axios.get("https://newsapi.org/v2/everything", {
        params: {
          q: query,
          language: "en",
          pageSize: Math.min(count, 20),
          sortBy: "publishedAt",
          apiKey
        },
        timeout: 10000
      });
      const items = (res.data && res.data.articles) || [];
      return items
        .filter((a) => a.title && a.url)
        .map((a) =>
          normalizeArticle({
            title: a.title,
            url: a.url,
            source: a.source?.name || "NewsAPI",
            publishedAt: a.publishedAt,
            snippet: a.description || (a.content && a.content.substring(0, 200)) || ""
          })
        );
    } catch (err) {
      console.error("NewsAPI error:", err.message);
      return [];
    }
  }

  /**
   * Google News RSS (no API key)
   */
  async fetchNewsRss(keywords, count = 10) {
    if (!keywords.length) return [];
    const query = encodeURIComponent(keywords.slice(0, 2).join(" "));
    const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
    try {
      const feed = await rssParser.parseURL(url);
      const items = (feed && feed.items) || [];
      return items
        .filter((i) => i.title && i.link)
        .slice(0, count)
        .map((i) =>
          normalizeArticle({
            title: i.title,
            url: i.link,
            source: (i.creator || i["dc:creator"]) || "Google News",
            publishedAt: i.pubDate,
            snippet: i.contentSnippet || i.content || ""
          })
        );
    } catch (err) {
      console.error("News RSS error:", err.message);
      return [];
    }
  }

  /**
   * Fetch from all configured sources and merge (dedupe by URL, sort by date).
   * Tries Google News RSS first (no API key) so we get real, up-to-date news
   * even when no paid API keys are set.
   */
  async fetchRealNews(keywords, count = 10) {
    // Try free RSS first for current data without any API key
    let rssArticles = [];
    try {
      rssArticles = await this.fetchNewsRss(keywords, count);
    } catch (e) {
      console.error("News RSS (first try):", e.message);
    }
    // In parallel try any configured API sources
    const [gNews, guardian, nyt, newsApi] = await Promise.all([
      this.fetchGNews(keywords, count),
      this.fetchGuardian(keywords, count),
      this.fetchNYT(keywords, count),
      this.fetchNewsAPI(keywords, count)
    ]);
    const all = [rssArticles, gNews, guardian, nyt, newsApi].flat();
    const merged = dedupeByUrl(all);
    merged.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    return merged.slice(0, count);
  }

  /**
   * Mock news articles
   */
  generateMockArticles(keywords, count = 5) {
    const sources = ["BBC", "Reuters", "TechCrunch", "The Guardian", "Bloomberg"];
    const articles = [];
    for (let i = 0; i < count; i++) {
      const source = sources[Math.floor(Math.random() * sources.length)];
      const keyword = keywords[Math.floor(Math.random() * keywords.length)];
      articles.push({
        title: `${keyword} News: Latest Updates and Analysis`,
        url: `https://example.com/news/${keyword}-${i}`,
        source,
        publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        snippet: `Breaking news about ${keyword}. This article covers the latest developments.`,
        relevance: 0.7 + Math.random() * 0.3
      });
    }
    return articles.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Build a short extractive summary from top articles tied to the note's subject (keywords + title).
   * Uses up to 25 articles; summary is 2–4 sentences from titles and snippets.
   */
  summarizeArticlesForNote(articles, noteContext = {}) {
    const top = (articles || []).slice(0, 25);
    if (top.length === 0) return "";
    const keywords = noteContext.keywords || [];
    const noteTitle = (noteContext.title || "").trim();
    const parts = [];
    if (noteTitle || keywords.length) {
      const subject = noteTitle || keywords.slice(0, 5).join(", ");
      parts.push(`Based on recent coverage related to "${subject}":`);
    }
    const sentences = [];
    const seen = new Set();
    for (const a of top) {
      const title = (a.title || "").trim();
      const snippet = (a.snippet || "").trim().slice(0, 120);
      if (title && !seen.has(title)) {
        seen.add(title);
        if (snippet) {
          sentences.push(`${title} — ${snippet}${snippet.length >= 120 ? "…" : ""}`);
        } else {
          sentences.push(title);
        }
        if (sentences.length >= 5) break;
      }
    }
    if (sentences.length === 0) return parts.join(" ") || "No summary available.";
    const summaryBody = sentences.slice(0, 4).join(" ");
    const full = (parts.join(" ") + " " + summaryBody).trim();
    return full.slice(0, 600) + (full.length > 600 ? "…" : "");
  }

  async fetchNewsForNote(note, count = 25) {
    if (!note.news || !note.news.enabled || !note.news.keywords || note.news.keywords.length === 0) {
      return [];
    }
    const keywords = note.news.keywords.slice().sort();
    const cacheKey = `news:${keywords.join(",")}:${count}`;
    const cached = cacheService.getNews(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) return cached;
    const realArticles = await this.fetchRealNews(note.news.keywords, count);
    const articles = realArticles
      .map((article) => ({
        ...article,
        relevance: typeof article.relevance === "number" ? article.relevance : this.calculateRelevance(article, note.news.keywords)
      }))
      .sort((a, b) => b.relevance - a.relevance);
    if (articles.length > 0) cacheService.setNews(cacheKey, articles);
    return articles;
  }

  calculateRelevance(article, keywords) {
    const text = `${article.title} ${article.snippet}`.toLowerCase();
    let score = 0;
    keywords.forEach((keyword) => {
      const regex = new RegExp(keyword.toLowerCase(), "gi");
      const matches = text.match(regex);
      if (matches) score += matches.length;
    });
    return Math.min(score / keywords.length, 1);
  }

  async fetchNews(keywords, sources = []) {
    const key = `news:${keywords.slice().sort().join(",")}`;
    const cached = cacheService.getNews(key);
    if (cached && Array.isArray(cached) && cached.length > 0) return cached;
    const real = await this.fetchRealNews(keywords, 10);
    if (real.length > 0) cacheService.setNews(key, real);
    return real;
  }
}

module.exports = new NewsService();
