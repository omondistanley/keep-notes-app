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
