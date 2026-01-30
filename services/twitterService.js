/**
 * Multi-platform Social Service (X/Twitter, Reddit, RSS fallbacks)
 * - X/Twitter: API v2 when TWITTER_BEARER_TOKEN is set; else Nitter RSS
 * - Reddit: search RSS (no API key)
 * Falls back to mock when no data returned.
 */

const Sentiment = require("sentiment");
const axios = require("axios");
const Parser = require("rss-parser");
const sentiment = new Sentiment();
const rssParser = new Parser({ timeout: 10000 });

// Nitter instances (Twitter front-end with RSS); first working one is used
const NITTER_RSS_BASE = process.env.NITTER_RSS_BASE || "https://nitter.poast.org";

function addSentiment(tweet) {
  const text = tweet.text || tweet.title || "";
  const analysis = sentiment.analyze(text);
  return {
    ...tweet,
    sentiment: {
      score: analysis.score,
      comparative: analysis.comparative,
      classification: analysis.score > 0 ? "positive" : analysis.score < 0 ? "negative" : "neutral"
    }
  };
}

class TwitterService {
  /**
   * Twitter API v2 (requires TWITTER_BEARER_TOKEN)
   */
  async fetchRealTweets(keywords, maxResults = 20) {
    const token = process.env.TWITTER_BEARER_TOKEN;
    if (!token || !keywords.length) return null;
    const query = keywords.slice(0, 2).map((k) => `"${k}"`).join(" OR ");
    try {
      const res = await axios.get("https://api.twitter.com/2/tweets/search/recent", {
        params: {
          query: query + " -is:retweet lang:en",
          max_results: Math.min(maxResults, 100),
          "tweet.fields": "created_at,public_metrics,author_id",
          "user.fields": "username,verified"
        },
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      const tweets = res.data?.data || [];
      return tweets.map((t, i) => {
        const analysis = sentiment.analyze(t.text);
        return addSentiment({
          id: t.id,
          text: t.text,
          author: { username: res.data?.includes?.users?.[i]?.username || "unknown", verified: false },
          createdAt: t.created_at ? new Date(t.created_at) : new Date(),
          metrics: t.public_metrics || {},
          source: "Twitter API"
        });
      });
    } catch (err) {
      console.error("Twitter API error:", err.response?.data || err.message);
      return null;
    }
  }

  /**
   * Reddit-only: search r/all via RSS (no API key). Returns posts with source "Reddit".
   */
  async fetchRedditOnly(keywords, maxResults = 30) {
    if (!keywords.length) return [];
    const query = encodeURIComponent(keywords.slice(0, 3).join(" "));
    try {
      const feed = await rssParser.parseURL(
        `https://www.reddit.com/r/all/search.rss?q=${query}&restrict_sr=on&sort=relevance`
      );
      const items = (feed && feed.items) || [];
      return items.slice(0, maxResults).map((i, idx) => {
        const title = i.title || "";
        const content = (i.contentSnippet || i.content || title).slice(0, 500);
        return addSentiment({
          id: `reddit_${Date.now()}_${idx}`,
          text: content || title,
          title,
          author: { username: (i.creator || i["dc:creator"] || "u/reddit").toString().slice(0, 50) },
          createdAt: i.pubDate ? new Date(i.pubDate) : new Date(),
          metrics: {},
          source: "Reddit",
          link: i.link
        });
      });
    } catch (err) {
      console.error("Reddit RSS error:", err.message);
      return [];
    }
  }

  /**
   * X/Twitter-only RSS: Nitter search (no API key).
   */
  async fetchNitterRss(keywords, maxResults = 20) {
    if (!keywords.length) return [];
    const query = encodeURIComponent(keywords.slice(0, 2).join(" "));
    try {
      const feed = await rssParser.parseURL(`${NITTER_RSS_BASE}/search/rss?f=tweets&q=${query}`);
      const items = (feed && feed.items) || [];
      return items.slice(0, maxResults).map((i, idx) => {
        const title = i.title || "";
        const content = (i.contentSnippet || i.content || title).slice(0, 280);
        return addSentiment({
          id: `nitter_${Date.now()}_${idx}`,
          text: content || title,
          author: { username: (i.creator || i["dc:creator"] || "X").toString().slice(0, 50) },
          createdAt: i.pubDate ? new Date(i.pubDate) : new Date(),
          metrics: {},
          source: "X (RSS)",
          link: i.link
        });
      });
    } catch (err) {
      console.error("Nitter RSS error:", err.message);
      return [];
    }
  }

  /**
   * Social RSS: Nitter first (X), then Reddit fallback. Used for single "tweets" search.
   */
  async fetchRssSocial(keywords, maxResults = 20) {
    if (!keywords.length) return [];
    const fromNitter = await this.fetchNitterRss(keywords, maxResults);
    if (fromNitter.length > 0) return fromNitter;
    const fromReddit = await this.fetchRedditOnly(keywords, maxResults);
    return fromReddit.slice(0, maxResults);
  }

  /**
   * Search Reddit by keywords; returns { posts, sentiment }.
   */
  async searchReddit(keywords, options = {}) {
    const maxResults = options.maxResults || 30;
    let posts = await this.fetchRedditOnly(keywords, maxResults);
    if (posts.length === 0) {
      const mock = this.generateMockTweets(keywords, Math.min(5, maxResults));
      posts = mock.map((m) => ({ ...m, source: "Reddit (mock)", id: m.id.replace("tweet_", "reddit_") }));
    }
    const sentiment = this.analyzeSentiment({ tweets: posts });
    return { posts, sentiment };
  }

  generateMockTweets(keywords, count = 10) {
    const users = ["@techguru", "@financeexpert", "@newsanalyst", "@marketwatch", "@cryptotrader"];
    const tweets = [];
    for (let i = 0; i < count; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const keyword = keywords[Math.floor(Math.random() * keywords.length)];
      const tweetText = `Just read about ${keyword}. This is really interesting! #${keyword.replace(/\s+/g, "")} ${Math.random() > 0.5 ? "🚀" : "📈"}`;
      const analysis = sentiment.analyze(tweetText);
      tweets.push({
        id: `tweet_${Date.now()}_${i}`,
        text: tweetText,
        author: { username: user, verified: Math.random() > 0.5, followers: Math.floor(Math.random() * 1000000) },
        createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        metrics: { likes: Math.floor(Math.random() * 10000), retweets: Math.floor(Math.random() * 5000), replies: Math.floor(Math.random() * 1000) },
        sentiment: {
          score: analysis.score,
          comparative: analysis.comparative,
          classification: analysis.score > 0 ? "positive" : analysis.score < 0 ? "negative" : "neutral"
        },
        entities: { hashtags: [keyword.replace(/\s+/g, "")], mentions: [user], urls: [] },
        source: "mock"
      });
    }
    return tweets;
  }

  /**
   * Fetch from all enabled social platforms (X, Reddit). Returns per-platform results.
   * socialConfig: { x: { enabled, keywords }, reddit: { enabled, keywords } }
   */
  async searchAllPlatforms(socialConfig, options = {}) {
    const maxResults = options.maxResults || 50;
    const result = { x: { tweets: [], sentiment: null }, reddit: { posts: [], sentiment: null } };
    const xConfig = socialConfig?.x || {};
    const redditConfig = socialConfig?.reddit || {};
    const xKeywords = Array.isArray(xConfig.keywords) && xConfig.keywords.length ? xConfig.keywords : [];
    const redditKeywords = Array.isArray(redditConfig.keywords) && redditConfig.keywords.length ? redditConfig.keywords : xKeywords;

    if (xConfig.enabled && xKeywords.length > 0) {
      const xResult = await this.searchTweets(xKeywords, { maxResults });
      result.x = { tweets: xResult.tweets || [], sentiment: xResult.sentiment || null };
    }
    if (redditConfig.enabled && redditKeywords.length > 0) {
      const redditResult = await this.searchReddit(redditKeywords, { maxResults });
      result.reddit = { posts: redditResult.posts || [], sentiment: redditResult.sentiment || null };
    }
    return result;
  }

  /**
   * Search: try RSS first (no API key) for real, up-to-date social data;
   * then Twitter API if configured. Only use mock when both return nothing.
   */
  async searchTweets(keywords, options = {}) {
    const maxResults = options.maxResults || 50;
    // Try free RSS first (Nitter / Reddit) so we get real data without Twitter API key
    let fromRss = [];
    try {
      fromRss = await this.fetchRssSocial(keywords, maxResults);
    } catch (e) {
      console.error("Social RSS (first try):", e.message);
    }
    const fromTwitter = await this.fetchRealTweets(keywords, maxResults);
    const combined = [];
    const seen = new Set();
    fromRss.forEach((t) => {
      const key = (t.text || "").substring(0, 80);
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(t);
      }
    });
    if (fromTwitter && fromTwitter.length > 0) {
      fromTwitter.forEach((t) => {
        const key = (t.text || "").substring(0, 80);
        if (!seen.has(key)) {
          seen.add(key);
          combined.push(t);
        }
      });
    }
    combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const tweets = combined.slice(0, maxResults);
    if (tweets.length > 0) {
      const sentimentResult = this.analyzeSentiment({ tweets });
      return { tweets, sentiment: sentimentResult };
    }
    const mockTweets = this.generateMockTweets(keywords, maxResults);
    const sentimentResult = this.analyzeSentiment({ tweets: mockTweets });
    return {
      tweets: mockTweets,
      sentiment: sentimentResult,
      meta: { result_count: mockTweets.length, next_token: null }
    };
  }

  analyzeSentiment(tweets) {
    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    const list = Array.isArray(tweets) ? tweets : (tweets && tweets.tweets) || [];
    list.forEach((tweet) => {
      const c = tweet.sentiment && tweet.sentiment.classification;
      if (c && sentimentCounts[c] !== undefined) sentimentCounts[c]++;
    });
    const total = list.length || 1;
    const overall =
      sentimentCounts.positive > sentimentCounts.negative
        ? "positive"
        : sentimentCounts.negative > sentimentCounts.positive
          ? "negative"
          : "neutral";
    return {
      overall,
      positive: sentimentCounts.positive / total,
      negative: sentimentCounts.negative / total,
      neutral: sentimentCounts.neutral / total
    };
  }

  async getTrendingTopics() {
    const topics = ["Technology", "Finance", "Crypto", "AI", "Markets", "News"];
    return topics.map((topic) => ({
      name: topic,
      tweetVolume: Math.floor(Math.random() * 100000),
      url: `https://twitter.com/search?q=${encodeURIComponent(topic)}`
    }));
  }
}

module.exports = new TwitterService();
