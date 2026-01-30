#!/usr/bin/env node
/**
 * Verify API keys and integration services (no server required).
 * Loads .env from project root and calls news, financial, and social services.
 *
 * Usage: node scripts/verify-api-keys.js
 * From project root. Create .env from .env.example and add your keys.
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const newsService = require("../services/newsService");
const financialService = require("../services/financialService");
const twitterService = require("../services/twitterService");

function hasKey(name) {
  const v = process.env[name];
  return v && String(v).trim().length > 0;
}

async function main() {
  console.log("=== API keys status ===\n");
  console.log("News:    GNEWS_API_KEY=" + (hasKey("GNEWS_API_KEY") ? "set" : "not set"));
  console.log("         GUARDIAN_API_KEY=" + (hasKey("GUARDIAN_API_KEY") ? "set" : "not set"));
  console.log("         NYT_API_KEY=" + (hasKey("NYT_API_KEY") ? "set" : "not set"));
  console.log("         NEWS_API_KEY=" + (hasKey("NEWS_API_KEY") ? "set" : "not set"));
  console.log("Financial: ALPHA_VANTAGE_API_KEY=" + (hasKey("ALPHA_VANTAGE_API_KEY") ? "set" : "not set"));
  console.log("           FINNHUB_API_KEY=" + (hasKey("FINNHUB_API_KEY") ? "set" : "not set"));
  console.log("Social:  TWITTER_BEARER_TOKEN=" + (hasKey("TWITTER_BEARER_TOKEN") ? "set" : "not set"));
  console.log("");

  const keywords = ["technology", "AI"];
  const stockSymbols = ["AAPL", "GOOGL"];
  const cryptoSymbols = ["BTC", "ETH"];
  const socialKeywords = ["crypto", "tech"];

  console.log("--- News (keywords: " + keywords.join(", ") + ") ---");
  try {
    const articles = await newsService.fetchRealNews(keywords, 5);
    console.log("Articles returned:", articles.length);
    if (articles.length > 0) {
      console.log("Sample:", articles[0].title?.substring(0, 60) + "...");
      console.log("Source:", articles[0].source);
    } else {
      console.log("No articles (RSS/APIs may need keys or returned empty).");
    }
  } catch (e) {
    console.log("Error:", e.message);
  }

  console.log("\n--- Stocks (symbols: " + stockSymbols.join(", ") + ") ---");
  try {
    const prices = await financialService.fetchStockPrices(stockSymbols);
    console.log("Prices returned:", prices.length);
    if (prices.length > 0) {
      prices.forEach((p) => console.log("  " + p.symbol + ": " + p.price + " (" + (p.changePercent >= 0 ? "+" : "") + p.changePercent + "%) [" + (p.source || "?") + "]"));
    } else {
      console.log("No stock data (Yahoo/Alpha Vantage/Finnhub).");
    }
  } catch (e) {
    console.log("Error:", e.message);
  }

  console.log("\n--- Crypto (symbols: " + cryptoSymbols.join(", ") + ") ---");
  try {
    const prices = await financialService.fetchCryptoPrices(cryptoSymbols);
    console.log("Prices returned:", prices.length);
    if (prices.length > 0) {
      prices.forEach((p) => console.log("  " + p.symbol + ": " + p.price + " (" + (p.changePercent >= 0 ? "+" : "") + p.changePercent + "%)"));
    } else {
      console.log("No crypto data (CoinGecko).");
    }
  } catch (e) {
    console.log("Error:", e.message);
  }

  console.log("\n--- Social / X (keywords: " + socialKeywords.join(", ") + ") ---");
  try {
    const result = await twitterService.searchTweets(socialKeywords, { maxResults: 5 });
    const tweets = result.tweets || [];
    console.log("Tweets/posts returned:", tweets.length);
    if (tweets.length > 0) {
      console.log("Sample:", tweets[0].text?.substring(0, 60) + "...");
    } else {
      console.log("No tweets (RSS or Twitter API).");
    }
  } catch (e) {
    console.log("Error:", e.message);
  }

  console.log("\nDone. If you see real data above, your keys and free sources are working.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
