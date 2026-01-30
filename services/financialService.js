/**
 * Financial Service
 * Real data only for stocks (NYSE, NASDAQ, major exchanges) and crypto.
 * - Yahoo Finance (no API key) - stocks, first choice for major exchanges
 * - Alpha Vantage (ALPHA_VANTAGE_API_KEY) - stocks fallback
 * - Finnhub (FINNHUB_API_KEY) - stocks fallback
 * - CoinGecko - crypto, no key
 * Pulled data is cached (see cacheService). No mock/dummy data for stocks.
 */

const axios = require("axios");
const cacheService = require("./cacheService");

/** Major market indexes (US + sector ETFs). Fetched and displayed in Financial modal. */
const MAJOR_INDEXES = [
  { symbol: "SPY", name: "S&P 500" },
  { symbol: "QQQ", name: "NASDAQ 100" },
  { symbol: "DIA", name: "Dow Jones" },
  { symbol: "IWM", name: "Russell 2000" },
  { symbol: "VTI", name: "Total US Market" },
  { symbol: "XLF", name: "Financials" },
  { symbol: "XLK", name: "Technology" },
  { symbol: "XLE", name: "Energy" },
  { symbol: "XLV", name: "Healthcare" },
  { symbol: "XLI", name: "Industrials" },
  { symbol: "XLP", name: "Consumer Staples" },
  { symbol: "XLY", name: "Consumer Discretionary" },
  { symbol: "XLU", name: "Utilities" },
  { symbol: "XLB", name: "Materials" },
  { symbol: "XLRE", name: "Real Estate" },
  { symbol: "EFA", name: "Developed ex-US" },
  { symbol: "EEM", name: "Emerging Markets" },
  { symbol: "VNQ", name: "Real Estate (Vanguard)" },
  { symbol: "BND", name: "Total Bond" }
];

const MAJOR_INDEX_SYMBOLS = MAJOR_INDEXES.map((i) => i.symbol);

/** Curated universe for top 100 gainers/losers/movers (S&P 100–style + tech + major indexes). */
const TOP_MOVERS_UNIVERSE = [
  ...MAJOR_INDEX_SYMBOLS,
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "BRK.B", "TSLA", "JPM", "V", "UNH", "JNJ", "WMT", "PG", "XOM",
  "HD", "MA", "CVX", "ABBV", "MRK", "PEP", "KO", "COST", "AVGO", "LLY", "MCD", "DHR", "ABT", "TMO", "ACN",
  "NEE", "WFC", "DIS", "PM", "CSCO", "ADBE", "CRM", "VZ", "NKE", "CMCSA", "TXN", "INTC", "AMD", "QCOM", "T",
  "ORCL", "AMGN", "HON", "INTU", "AMAT", "IBM", "SBUX", "LOW", "AXP", "BKNG", "GE", "CAT", "DE", "MDLZ",
  "GILD", "ADI", "LMT", "SYK", "BLK", "C", "BA", "PLD", "REGN", "MMC", "ISRG", "VRTX", "MO", "ZTS", "CI",
  "SO", "DUK", "BDX", "BSX", "EOG", "SLB", "EQIX", "CL", "MCK", "CB", "APD", "SHW", "MDT", "WM", "APTV",
  "KLAC", "SNPS", "CDNS", "MAR", "PSA", "ITW", "APTV", "ETN", "HCA", "CME", "PANW", "MU", "NXPI", "AON",
  "SPGI", "ICE", "SO", "FIS", "USB", "PGR", "BDX", "CMG", "ECL", "AIG", "MMC", "AFL", "NOC", "FCX", "EMR",
  "COF", "IT", "MNST", "PSX", "GS", "MS", "RTX", "CARR", "ORLY", "PCAR", "AJG", "MET", "AEP", "GM", "F"
];

// Common crypto symbol -> CoinGecko id
const CRYPTO_IDS = {
  btc: "bitcoin",
  bitcoin: "bitcoin",
  eth: "ethereum",
  ethereum: "ethereum",
  usdt: "tether",
  tether: "tether",
  bnb: "binancecoin",
  sol: "solana",
  solana: "solana",
  xrp: "ripple",
  ripple: "ripple",
  usdc: "usd-coin",
  ada: "cardano",
  cardano: "cardano",
  doge: "dogecoin",
  dogecoin: "dogecoin",
  avax: "avalanche-2",
  trx: "tron",
  link: "chainlink",
  dot: "polkadot",
  matic: "matic-network",
  ltc: "litecoin",
  litecoin: "litecoin",
  shib: "shiba-inu",
  uni: "uniswap",
  atom: "cosmos",
  xlm: "stellar"
};

class FinancialService {
  /**
   * Alpha Vantage - stocks (free: 25 req/day)
   */
  async fetchAlphaVantageStocks(symbols) {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey || !symbols.length) return null;
    const results = [];
    for (const symbol of symbols.slice(0, 5)) {
      try {
        const res = await axios.get("https://www.alphavantage.co/query", {
          params: { function: "GLOBAL_QUOTE", symbol: symbol, apikey: apiKey },
          timeout: 8000
        });
        const q = res.data && res.data["Global Quote"];
        if (q && q["05. price"]) {
          const price = parseFloat(q["05. price"]);
          const change = parseFloat(q["09. change"] || "0");
          results.push({
            symbol: q["01. symbol"] || symbol,
            price,
            change,
            changePercent: parseFloat(String(q["10. change percent"] || "0").replace("%", "")) || 0,
            volume: parseInt(q["06. volume"] || "0", 10),
            high: parseFloat(q["03. high"] || price),
            low: parseFloat(q["04. low"] || price),
            timestamp: new Date(),
            source: "Alpha Vantage"
          });
        }
      } catch (err) {
        console.error("Alpha Vantage error for", symbol, err.message);
      }
    }
    return results.length ? results : null;
  }

  /**
   * Yahoo Finance public chart API - stocks (no API key), NYSE, NASDAQ, major exchanges
   * Uses query1.finance.yahoo.com/v8/finance/chart for current price and change.
   */
  async fetchYahooChartStocks(symbols) {
    if (!symbols.length) return null;
    const results = [];
    const syms = symbols.slice(0, 15).map((s) => String(s).trim().toUpperCase()).filter(Boolean);
    for (const symbol of syms) {
      try {
        const res = await axios.get(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
          {
            params: { interval: "1d", range: "5d" },
            timeout: 10000,
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
          }
        );
        const chartResult = res.data?.chart?.result?.[0];
        if (!chartResult) continue;
        const meta = chartResult.meta || {};
        const price = meta.regularMarketPrice;
        const prevClose = meta.previousClose ?? meta.chartPreviousClose ?? price;
        if (typeof price !== "number" || !Number.isFinite(price)) continue;
        const change = typeof prevClose === "number" ? price - prevClose : 0;
        const changePercent = prevClose && prevClose !== 0 ? (change / prevClose) * 100 : 0;
        const quote = chartResult.indicators?.quote?.[0];
        const closes = quote?.close?.filter((c) => c != null) || [];
        const highs = quote?.high?.filter((h) => h != null) || [];
        const lows = quote?.low?.filter((l) => l != null) || [];
        const vols = quote?.volume?.filter((v) => v != null) || [];
        results.push({
          symbol: (meta.symbol || symbol).toUpperCase(),
          price,
          change: Number(change.toFixed(4)),
          changePercent: Number(changePercent.toFixed(2)),
          volume: meta.regularMarketVolume ?? (vols.length ? vols[vols.length - 1] : 0),
          high: highs.length ? Math.max(...highs) : price,
          low: lows.length ? Math.min(...lows) : price,
          timestamp: new Date(),
          source: "Yahoo Finance"
        });
        await new Promise((resolve) => setTimeout(resolve, 150));
      } catch (err) {
        console.error("Yahoo Finance chart error for", symbol, err.message);
      }
    }
    return results.length ? results : null;
  }

  /**
   * Finnhub - stocks (free: 60 calls/min)
   */
  async fetchFinnhubStocks(symbols) {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey || !symbols.length) return null;
    const results = [];
    for (const symbol of symbols.slice(0, 10)) {
      try {
        const res = await axios.get("https://finnhub.io/api/v1/quote", {
          params: { symbol: symbol, token: apiKey },
          timeout: 8000
        });
        const d = res.data;
        if (d && typeof d.c === "number") {
          results.push({
            symbol: symbol.toUpperCase(),
            price: d.c,
            change: (d.d != null ? d.d : 0),
            changePercent: (d.dp != null ? d.dp : 0),
            volume: d.v != null ? d.v : 0,
            high: d.h != null ? d.h : d.c,
            low: d.l != null ? d.l : d.c,
            timestamp: new Date(),
            source: "Finnhub"
          });
        }
      } catch (err) {
        console.error("Finnhub error for", symbol, err.message);
      }
    }
    return results.length ? results : null;
  }

  /**
   * CoinGecko - crypto (no key for simple/price)
   */
  async fetchCoinGeckoCrypto(symbols) {
    if (!symbols.length) return null;
    const ids = [];
    const symbolToId = {};
    for (const s of symbols.slice(0, 15)) {
      const id = CRYPTO_IDS[s.toLowerCase().trim()] || s.toLowerCase();
      if (!ids.includes(id)) {
        ids.push(id);
        symbolToId[id] = s.toUpperCase();
      }
    }
    if (!ids.length) return null;
    try {
      const res = await axios.get("https://api.coingecko.com/api/v3/simple/price", {
        params: {
          ids: ids.join(","),
          vs_currencies: "usd",
          include_24hr_change: "true",
          include_24hr_vol: "true",
          include_market_cap: "true"
        },
        timeout: 10000
      });
      const data = res.data || {};
      const results = [];
      for (const id of ids) {
        const v = data[id];
        if (v && typeof v.usd === "number") {
          const change = v.usd_24h_change != null ? v.usd_24h_change : 0;
          results.push({
            symbol: (symbolToId[id] || id).toUpperCase(),
            price: v.usd,
            change: 0,
            changePercent: change,
            volume: v.usd_24h_vol || 0,
            marketCap: v.usd_market_cap || 0,
            timestamp: new Date(),
            source: "CoinGecko"
          });
        }
      }
      return results.length ? results : null;
    } catch (err) {
      console.error("CoinGecko error:", err.message);
      return null;
    }
  }

  /**
   * Stocks: try Yahoo (no key, major exchanges), then Alpha Vantage, then Finnhub.
   * Returns only real data; no mock.
   */
  async fetchRealStockPrices(symbols) {
    const yahoo = await this.fetchYahooChartStocks(symbols);
    if (yahoo && yahoo.length > 0) return yahoo;
    const alpha = await this.fetchAlphaVantageStocks(symbols);
    if (alpha && alpha.length > 0) return alpha;
    const finn = await this.fetchFinnhubStocks(symbols);
    if (finn && finn.length > 0) return finn;
    return null;
  }

  /**
   * Crypto: CoinGecko (no key)
   */
  async fetchRealCryptoPrices(symbols) {
    return this.fetchCoinGeckoCrypto(symbols);
  }

  generateMockStockPrice(symbol) {
    const basePrice = 100 + Math.random() * 200;
    const change = (Math.random() - 0.5) * 10;
    const changePercent = (change / basePrice) * 100;
    return {
      symbol: symbol,
      price: parseFloat(basePrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000),
      high: parseFloat((basePrice + Math.random() * 5).toFixed(2)),
      low: parseFloat((basePrice - Math.random() * 5).toFixed(2)),
      timestamp: new Date()
    };
  }

  generateMockCryptoPrice(symbol) {
    const basePrice = 1000 + Math.random() * 50000;
    const change = (Math.random() - 0.5) * 500;
    const changePercent = (change / basePrice) * 100;
    return {
      symbol: symbol.toUpperCase(),
      price: parseFloat(basePrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      marketCap: Math.floor(Math.random() * 1000000000000),
      volume: Math.floor(Math.random() * 5000000000),
      timestamp: new Date()
    };
  }

  /**
   * Alpha Vantage TOP_GAINERS_LOSERS - returns top 20 gainers, 20 losers, 20 most actively traded (US).
   */
  async fetchTopGainersLosersAlphaVantage() {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) return null;
    try {
      const res = await axios.get("https://www.alphavantage.co/query", {
        params: { function: "TOP_GAINERS_LOSERS", apikey: apiKey },
        timeout: 12000
      });
      const topGainers = (res.data && res.data.top_gainers) || [];
      const topLosers = (res.data && res.data.top_losers) || [];
      const mostActive = (res.data && res.data.most_actively_traded) || [];
      const toPrice = (item) => ({
        symbol: (item.ticker || item.symbol || "").toUpperCase(),
        price: parseFloat(item.price) || 0,
        change: parseFloat(item.change_amount) || 0,
        changePercent: parseFloat(String(item.change_percentage || "0").replace("%", "")) || 0,
        volume: parseInt(item.volume, 10) || 0,
        timestamp: new Date(),
        source: "Alpha Vantage"
      });
      return {
        topGainers: topGainers.map(toPrice).filter((p) => p.symbol),
        topLosers: topLosers.map(toPrice).filter((p) => p.symbol),
        largestMovers: mostActive.map(toPrice).filter((p) => p.symbol)
      };
    } catch (err) {
      console.error("Alpha Vantage TOP_GAINERS_LOSERS error:", err.message);
      return null;
    }
  }

  /**
   * Score 0–1: how closely a stock (symbol/name) ties to the note content and attached news.
   * Used to prefer "relevant to your note" in top gainers/losers/movers.
   */
  scoreRelevanceToNote(priceItem, note = {}, news = {}) {
    const text = [
      (note.title || "").trim(),
      (note.content || "").trim().slice(0, 2000),
      (note.tags || []).join(" "),
      (note.news?.keywords || []).join(" "),
      ...((news.articles || []).map((a) => (a.title || "") + " " + (a.snippet || "")).slice(0, 25))
    ].join(" ").toLowerCase();
    const symbol = (priceItem.symbol || "").toUpperCase();
    const name = (priceItem.name || "").toLowerCase();
    let score = 0;
    if (symbol && text.includes(symbol.toLowerCase())) score += 0.5;
    if (name && text.includes(name)) score += 0.4;
    const tickerInText = new RegExp("\\b" + symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i");
    if (symbol && tickerInText.test(text)) score = Math.max(score, 0.6);
    const sectorBoosts = [
      { words: ["nvidia", "nvda", "gpu", "ai chip", "semiconductor"], symbols: ["NVDA", "AMD", "INTC", "QCOM", "AVGO"] },
      { words: ["apple", "aapl", "iphone", "mac"], symbols: ["AAPL"] },
      { words: ["tesla", "tsla", "ev", "electric vehicle"], symbols: ["TSLA", "RIVN", "LCID", "GM", "F"] },
      { words: ["microsoft", "msft", "azure", "cloud"], symbols: ["MSFT", "AMZN", "GOOGL"] },
      { words: ["amazon", "amzn", "aws", "retail"], symbols: ["AMZN"] },
      { words: ["google", "goog", "alphabet", "search"], symbols: ["GOOGL"] },
      { words: ["meta", "facebook", "fb", "instagram"], symbols: ["META"] },
      { words: ["oil", "energy", "exxon", "chevron"], symbols: ["XOM", "CVX", "COP", "EOG"] },
      { words: ["bank", "jpm", "finance", "interest rate"], symbols: ["JPM", "BAC", "WFC", "C", "GS", "MS"] }
    ];
    for (const { words, symbols } of sectorBoosts) {
      if (words.some((w) => text.includes(w)) && symbols.includes(symbol)) score = Math.max(score, 0.7);
    }
    return Math.min(score, 1);
  }

  /**
   * Fetch top 100 gainers, losers, and largest movers from a curated universe; score by relevance to note + news.
   * Prefer Alpha Vantage TOP_GAINERS_LOSERS when key is set (20 each); otherwise fetch universe via Yahoo and sort.
   */
  async fetchTopMoversForNote(note, limit = 100) {
    const noteData = typeof note === "object" && note !== null ? note : {};
    const news = noteData.news || {};
    const userSymbols = new Set((noteData.financial?.symbols || []).map((s) => String(s).trim().toUpperCase()).filter(Boolean));

    let topGainers = [];
    let topLosers = [];
    let largestMovers = [];

    const av = await this.fetchTopGainersLosersAlphaVantage();
    if (av && (av.topGainers.length || av.topLosers.length || av.largestMovers.length)) {
      const score = (p) => ({ ...p, relevanceScore: this.scoreRelevanceToNote(p, noteData, news), inUserList: userSymbols.has((p.symbol || "").toUpperCase()) });
      topGainers = av.topGainers.slice(0, 20).map(score);
      topLosers = av.topLosers.slice(0, 20).map(score);
      largestMovers = av.largestMovers.slice(0, 20).map(score);
    }

    const cacheKey = "top_movers:universe";
    let universePrices = cacheService.getFinancial(cacheKey);
    if (!universePrices || !Array.isArray(universePrices) || universePrices.length < 50) {
      const unique = [...new Set(TOP_MOVERS_UNIVERSE)].slice(0, 120);
      universePrices = await this.fetchRealStockPrices(unique);
      if (universePrices && universePrices.length > 0) {
        cacheService.setFinancial(cacheKey, universePrices);
      }
    }
    if (universePrices && universePrices.length > 0) {
      const withRelevance = universePrices.map((p) => ({
        ...p,
        relevanceScore: this.scoreRelevanceToNote(p, noteData, news),
        inUserList: userSymbols.has((p.symbol || "").toUpperCase())
      }));
      const byGain = [...withRelevance].sort((a, b) => (Number(b.changePercent) ?? 0) - (Number(a.changePercent) ?? 0));
      const byLoss = [...withRelevance].sort((a, b) => (Number(a.changePercent) ?? 0) - (Number(b.changePercent) ?? 0));
      const byMove = [...withRelevance].sort((a, b) => Math.abs(Number(b.changePercent) ?? 0) - Math.abs(Number(a.changePercent) ?? 0));
      const merge = (existing, fromUniverse, cap) => {
        const seen = new Set((existing || []).map((p) => p.symbol));
        const out = [...(existing || [])];
        for (const p of fromUniverse) {
          if (out.length >= cap) break;
          if (!seen.has(p.symbol)) {
            seen.add(p.symbol);
            out.push(p);
          }
        }
        return out.slice(0, cap);
      };
      topGainers = merge(topGainers, byGain, limit);
      topLosers = merge(topLosers, byLoss, limit);
      largestMovers = merge(largestMovers, byMove, limit);
    }

    const sortRelevanceFirst = (arr) =>
      [...arr].sort((a, b) => {
        const ra = a.relevanceScore ?? 0;
        const rb = b.relevanceScore ?? 0;
        if (Math.abs(ra - rb) > 0.01) return rb - ra;
        const inA = a.inUserList ? 1 : 0;
        const inB = b.inUserList ? 1 : 0;
        if (inA !== inB) return inB - inA;
        return (Number(b.changePercent) ?? 0) - (Number(a.changePercent) ?? 0);
      });

    return {
      topGainers: sortRelevanceFirst(topGainers).slice(0, limit).map((p) => ({ ...p, relevanceScore: p.relevanceScore ?? 0 })),
      topLosers: sortRelevanceFirst(topLosers).slice(0, limit).map((p) => ({ ...p, relevanceScore: p.relevanceScore ?? 0 })),
      largestMovers: sortRelevanceFirst(largestMovers).slice(0, limit).map((p) => ({ ...p, relevanceScore: p.relevanceScore ?? 0 }))
    };
  }

  /**
   * Fetch prices for major indexes (SPY, QQQ, sector ETFs, etc.). Cached 5 min.
   */
  async fetchMajorIndexes() {
    const key = "financial:major_indexes";
    const cached = cacheService.getFinancial(key);
    if (cached && Array.isArray(cached) && cached.length > 0) return cached;
    const prices = await this.fetchRealStockPrices(MAJOR_INDEX_SYMBOLS);
    if (prices && prices.length > 0) {
      const withNames = prices.map((p) => {
        const info = MAJOR_INDEXES.find((i) => i.symbol === (p.symbol || "").toUpperCase());
        return { ...p, name: info?.name || p.symbol };
      });
      cacheService.setFinancial(key, withNames);
      return withNames;
    }
    return [];
  }

  /**
   * Fetch stock prices: check cache first (TTL 5 min), then real APIs only. No mock data.
   */
  async fetchStockPrices(symbols) {
    const key = `stock:${symbols.map((s) => String(s).trim().toUpperCase()).sort().join(",")}`;
    const cached = cacheService.getFinancial(key);
    if (cached && Array.isArray(cached) && cached.length > 0) return cached;
    const real = await this.fetchRealStockPrices(symbols);
    if (real && real.length > 0) {
      cacheService.setFinancial(key, real);
      return real;
    }
    return [];
  }

  /**
   * Fetch crypto prices: check cache first (TTL 5 min), then CoinGecko. No mock data.
   */
  async fetchCryptoPrices(symbols) {
    const key = `crypto:${symbols.map((s) => String(s).trim().toUpperCase()).sort().join(",")}`;
    const cached = cacheService.getFinancial(key);
    if (cached && Array.isArray(cached) && cached.length > 0) return cached;
    const real = await this.fetchRealCryptoPrices(symbols);
    if (real && real.length > 0) {
      cacheService.setFinancial(key, real);
      return real;
    }
    return [];
  }

  calculatePortfolioPerformance(holdings, currentPrices) {
    let totalCostBasis = 0;
    let totalCurrentValue = 0;
    const performance = holdings.map((holding) => {
      const priceData = currentPrices.find((p) => p.symbol === holding.symbol);
      if (!priceData) return null;
      const currentValue = priceData.price * holding.quantity;
      const costBasis = holding.purchasePrice * holding.quantity;
      const gain = currentValue - costBasis;
      const gainPercent = costBasis ? (gain / costBasis) * 100 : 0;
      totalCostBasis += costBasis;
      totalCurrentValue += currentValue;
      return {
        symbol: holding.symbol,
        quantity: holding.quantity,
        purchasePrice: holding.purchasePrice,
        currentPrice: priceData.price,
        costBasis,
        currentValue,
        gain,
        gainPercent: parseFloat(gainPercent.toFixed(2))
      };
    }).filter(Boolean);
    const totalGain = totalCurrentValue - totalCostBasis;
    const totalGainPercent = totalCostBasis ? (totalGain / totalCostBasis) * 100 : 0;
    return {
      holdings: performance,
      summary: {
        totalCostBasis: parseFloat(totalCostBasis.toFixed(2)),
        totalCurrentValue: parseFloat(totalCurrentValue.toFixed(2)),
        totalGain: parseFloat(totalGain.toFixed(2)),
        totalGainPercent: parseFloat(totalGainPercent.toFixed(2))
      }
    };
  }
}

module.exports = new FinancialService();
