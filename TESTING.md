# Testing the Keep Notes App

## 1. Start the app

You need **two terminals**: backend and frontend.

### Terminal 1 – Backend (API + WebSocket)

```bash
cd /path/to/keep-notes-app
npm install   # if you haven't (installs dotenv, rss-parser, etc.)
node server.js
```

- API: **http://localhost:3050**
- WebSocket: **ws://localhost:3051**
- Ensure DB is configured (see `config/database.js`); server will sync tables on start.

### Terminal 2 – Frontend (React)

```bash
cd /path/to/keep-notes-app
npm start
```

- App: **http://localhost:3000** (or the port shown in the terminal).

---

## 2. Test without API keys (mocks + free sources)

No `.env` keys are required for these to work:

- **News:** Google News RSS (no key). Other news sources use **mock** data if keys are missing.
- **Financial – stocks:** Mock data if no Alpha Vantage / Finnhub keys.
- **Financial – crypto:** **CoinGecko** (no key).
- **Social:** **RSS** (Nitter/Reddit) + **mock** tweets if no Twitter key.

### Quick UI checks

1. **Notes list** – Create a note with the simple form; it appears in the list.
2. **Enhanced note** – Click **"+ Enhanced"** → fill title/content → open **Deadline**, **News**, **Financial**, **Social** tabs and set:
   - Deadline: pick a date.
   - News: enable, add keywords (e.g. `tech, AI`).
   - Financial: enable, type **Stock** or **Crypto**, add symbols (e.g. `AAPL` or `bitcoin, ethereum`).
   - Social: enable, add keywords (e.g. `crypto`).
   - Save.
3. **Integration buttons on the note** – On the saved note you should see **Integrations** with:
   - **Fetch news** – Click; after a moment the note should show a news section (RSS or mock).
   - **Fetch tweets** – Click; note should show social/RSS or mock tweets.
   - **Update financial** – Click (for a note with financial symbols); note should show prices (CoinGecko for crypto, or mock for stocks if no keys).
   - **Update all** – Runs news + financial + social in one go.
4. **Deadlines** – Nav → **Deadlines**. Add a note with a deadline in the next 7–14 days; it should appear under **Upcoming**. Overdue notes appear under **Overdue**; you can change status (Pending / Completed / Cancelled).
5. **Export** – Nav → **Export/Import** → **Export from server (all notes)**. A JSON file should download.
6. **Command palette** – **Ctrl+K** (or **Cmd+K**) → try **Search** (focuses search), **Toggle Dark Mode**, **Open Deadlines**, **Focus Mode**.
7. **Edit (Enhanced)** – On any note, click **EDIT (ENHANCED)**; the enhanced form opens with that note’s data.

---

## 3. Test with API keys (real news, stocks, Twitter)

Copy `.env.example` to `.env` and add keys you have:

```bash
cp .env.example .env
# Edit .env and add at least one key per category if you want real data.
```

Restart the backend after changing `.env`.

### News (at least one key for real articles)

- `GNEWS_API_KEY` – [GNews](https://gnews.io/)
- `GUARDIAN_API_KEY` – [Guardian](https://open-platform.theguardian.com/access)
- `NYT_API_KEY` – [NYT](https://developer.nytimes.com/)
- `NEWS_API_KEY` – [NewsAPI](https://newsapi.org/register) (optional)

Then: create/enhance a note with **News** enabled and keywords → **Fetch news**. You should see real headlines and links.

### Financial – stocks (one key)

- `ALPHA_VANTAGE_API_KEY` – [Alpha Vantage](https://www.alphavantage.co/support/#api-key) and/or  
- `FINNHUB_API_KEY` – [Finnhub](https://finnhub.io/)

Create a note with **Financial** type **Stock**, symbols e.g. `AAPL, MSFT` → **Update financial**. You should see real prices.

### Financial – crypto (no key)

Use type **Crypto**, symbols e.g. `bitcoin, ethereum`. **Update financial** uses CoinGecko; no key needed.

### Social

- `TWITTER_BEARER_TOKEN` – [Twitter API v2](https://developer.twitter.com/) for real tweets.
- Without it, **Fetch tweets** uses RSS (Nitter/Reddit) or mock.

Create a note with **Social** enabled and keywords → **Fetch tweets**. With a key you get real tweets; without, RSS or mock.

---

## 4. Test API endpoints directly (optional)

You can call the backend from the command line to verify integrations without the UI.

**Create a note (get its ID from the response):**

```bash
curl -X POST http://localhost:3050/api/notes/AddNote \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Note","content":"Test","tags":["test"],"news":{"enabled":true,"keywords":["technology"]},"financial":{"enabled":true,"type":"crypto","symbols":["bitcoin","ethereum"]},"social":{"x":{"enabled":true,"keywords":["crypto"]}}}'
```

Replace `NOTE_ID` below with the `id` or `_id` from the response (e.g. `1`).

**Fetch news for that note:**

```bash
curl -X POST http://localhost:3050/api/notes/NOTE_ID/fetch-news
```

**Update financial (crypto – no key):**

```bash
curl -X POST http://localhost:3050/api/notes/NOTE_ID/update-financial
```

**Fetch tweets (RSS or mock if no Twitter key):**

```bash
curl -X POST http://localhost:3050/api/notes/NOTE_ID/fetch-tweets
```

**Get the note again (see updated news/financial/social):**

```bash
curl "http://localhost:3050/api/notes/GetNotes" | head -c 2000
```

**Upcoming deadlines:**

```bash
curl "http://localhost:3050/api/notes/upcoming-deadlines?days=14"
```

**Export (all notes as JSON):**

```bash
curl -o exported-notes.json "http://localhost:3050/api/notes/export"
```

### Run the integration test script (Node 18+)

With the server already running:

```bash
node scripts/test-integrations.js
```

This creates a test note, calls **fetch-news**, **update-financial**, and **fetch-tweets**, then prints counts. Use it to confirm the backend integrations without opening the UI.

---

## 5. Checklist summary

| What to test              | How | No keys | With keys |
|---------------------------|-----|--------|-----------|
| Create / edit note        | UI  | ✓      | ✓        |
| Fetch news                | Note → Integrations → Fetch news | RSS or mock | GNews/Guardian/NYT/NewsAPI + RSS |
| Update financial (stocks) | Note → Update financial | Mock | Alpha Vantage / Finnhub |
| Update financial (crypto) | Note → Update financial | CoinGecko | CoinGecko |
| Fetch tweets              | Note → Fetch tweets | RSS or mock | Twitter API + RSS |
| Deadlines view            | Nav → Deadlines | ✓ | ✓ |
| Export from server        | Export/Import → Export from server | ✓ | ✓ |
| Command palette           | Ctrl+K / Cmd+K | ✓ | ✓ |
| Edit (Enhanced)            | Note → EDIT (ENHANCED) | ✓ | ✓ |

---

## 6. Troubleshooting

- **"Failed to fetch" / CORS** – Backend must be running on port 3050; frontend should call `http://localhost:3050`.
- **News/tweets empty** – With no keys you still get RSS (Google News, Nitter/Reddit) or mocks; if RSS fails (e.g. Nitter down), you’ll get mocks. Check server console for "News RSS error" or "Social RSS error".
- **Financial "Update financial" does nothing** – Note must have **Financial** enabled and **symbols** (e.g. `AAPL` or `bitcoin`). For crypto, symbols like `bitcoin`, `ethereum` work with CoinGecko.
- **Database errors** – See `README_DATABASE.md` and `config/database.js`; run migrations/sync as required for your DB (e.g. SQLite/PostgreSQL).
- **`Cannot find module './_getRawTag'` (server)** – Corrupted or incomplete `lodash` (often after cancelling `npm install`). Fix: remove `node_modules` and reinstall: `rm -rf node_modules package-lock.json && npm install`. Then run `node server.js` again.
- **`setIsFullscreen is not defined` (FocusMode)** – Fixed in `FocusMode.jsx`; remove the stray `setIsFullscreen(false)` call if it reappears.
