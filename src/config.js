/**
 * API and WebSocket base URLs. Use env in production (e.g. Vercel), localhost in dev.
 * Set REACT_APP_API_URL and REACT_APP_WS_URL in Vercel (or .env) when backend is hosted elsewhere.
 */
const getApiBase = () => {
  if (typeof process !== "undefined" && process.env?.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/$/, "");
  }
  return "http://localhost:3050";
};

const getWsUrl = () => {
  if (typeof process !== "undefined" && process.env?.REACT_APP_WS_URL) {
    return process.env.REACT_APP_WS_URL;
  }
  return "ws://localhost:3051";
};

export const API_BASE = getApiBase();
export const WS_URL = getWsUrl();
