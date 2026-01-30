/** Symbol -> company/index name for display in Financial modal (no API). */
export const SYMBOL_NAMES = {
  SPY: "S&P 500", QQQ: "NASDAQ 100", DIA: "Dow Jones", IWM: "Russell 2000", VTI: "Total US Market",
  XLF: "Financials", XLK: "Technology", XLE: "Energy", XLV: "Healthcare", XLI: "Industrials",
  XLP: "Consumer Staples", XLY: "Consumer Discretionary", XLU: "Utilities", XLB: "Materials",
  XLRE: "Real Estate", EFA: "Developed ex-US", EEM: "Emerging Markets", VNQ: "Real Estate (Vanguard)", BND: "Total Bond",
  AAPL: "Apple Inc.", MSFT: "Microsoft", GOOGL: "Alphabet (Google)", AMZN: "Amazon", NVDA: "NVIDIA", META: "Meta Platforms",
  "BRK.B": "Berkshire Hathaway", TSLA: "Tesla", JPM: "JPMorgan Chase", V: "Visa", UNH: "UnitedHealth", JNJ: "Johnson & Johnson",
  WMT: "Walmart", PG: "Procter & Gamble", XOM: "Exxon Mobil", HD: "Home Depot", MA: "Mastercard", CVX: "Chevron",
  ABBV: "AbbVie", MRK: "Merck", PEP: "PepsiCo", KO: "Coca-Cola", COST: "Costco", AVGO: "Broadcom", LLY: "Eli Lilly",
  MCD: "McDonald's", DHR: "Danaher", ABT: "Abbott", TMO: "Thermo Fisher", ACN: "Accenture", NEE: "NextEra Energy",
  WFC: "Wells Fargo", DIS: "Walt Disney", PM: "Philip Morris", CSCO: "Cisco", ADBE: "Adobe", CRM: "Salesforce",
  VZ: "Verizon", NKE: "Nike", CMCSA: "Comcast", TXN: "Texas Instruments", INTC: "Intel", AMD: "AMD", QCOM: "Qualcomm", T: "AT&T",
  ORCL: "Oracle", AMGN: "Amgen", HON: "Honeywell", INTU: "Intuit", AMAT: "Applied Materials", IBM: "IBM", SBUX: "Starbucks",
  LOW: "Lowe's", AXP: "American Express", BKNG: "Booking Holdings", GE: "General Electric", CAT: "Caterpillar", DE: "Deere",
  MDLZ: "Mondelez", GILD: "Gilead", ADI: "Analog Devices", LMT: "Lockheed Martin", SYK: "Stryker", BLK: "BlackRock",
  C: "Citigroup", BA: "Boeing", PLD: "Prologis", REGN: "Regeneron", MMC: "Marsh & McLennan", ISRG: "Intuitive Surgical",
  VRTX: "Vertex", MO: "Altria", ZTS: "Zoetis", CI: "Cigna", SO: "Southern Co", DUK: "Duke Energy", BDX: "Becton Dickinson",
  BSX: "Boston Scientific", EOG: "EOG Resources", SLB: "Schlumberger", EQIX: "Equinix", CL: "Colgate-Palmolive",
  MCK: "McKesson", CB: "Chubb", APD: "Air Products", SHW: "Sherwin-Williams", MDT: "Medtronic", WM: "Waste Management",
  KLAC: "KLA", SNPS: "Synopsys", CDNS: "Cadence", MAR: "Marriott", PSA: "Public Storage", ITW: "Illinois Tool Works",
  ETN: "Eaton", HCA: "HCA Healthcare", CME: "CME Group", PANW: "Palo Alto Networks", MU: "Micron", NXPI: "NXP",
  AON: "Aon", SPGI: "S&P Global", ICE: "Intercontinental Exchange", FIS: "FIS", USB: "U.S. Bancorp", PGR: "Progressive",
  CMG: "Chipotle", ECL: "Ecolab", AIG: "AIG", AFL: "Aflac", NOC: "Northrop Grumman", FCX: "Freeport-McMoRan",
  EMR: "Emerson Electric", COF: "Capital One", MNST: "Monster Beverage", PSX: "Phillips 66", GS: "Goldman Sachs",
  MS: "Morgan Stanley", RTX: "RTX", CARR: "Carrier", ORLY: "O'Reilly Auto", PCAR: "PACCAR", AJG: "Arthur J. Gallagher",
  MET: "MetLife", AEP: "American Electric Power", GM: "General Motors", F: "Ford"
};

export function getSymbolDisplay(symbol, nameFromApi) {
  const sym = (symbol || "").trim().toUpperCase();
  const name = nameFromApi || SYMBOL_NAMES[sym];
  return name ? `${name} (${sym})` : sym;
}
