/**
 * Financial Service
 * Handles stock and crypto data from multiple free sources:
 * - Alpha Vantage (ALPHA_VANTAGE_API_KEY) - stocks, 25 req/day free
 * - Finnhub (FINNHUB_API_KEY) - stocks, 60/min free
 * - CoinGecko - crypto, no key for basic use
 * Falls back to mock data when no keys / rate limits.
 */

const axios = require("axios");

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
   * Stocks: try Alpha Vantage, then Finnhub
   */
  async fetchRealStockPrices(symbols) {
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

  async fetchStockPrices(symbols) {
    const real = await this.fetchRealStockPrices(symbols);
    if (real && real.length > 0) return real;
    return symbols.map((s) => this.generateMockStockPrice(s));
  }

  async fetchCryptoPrices(symbols) {
    const real = await this.fetchRealCryptoPrices(symbols);
    if (real && real.length > 0) return real;
    return symbols.map((s) => this.generateMockCryptoPrice(s));
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
