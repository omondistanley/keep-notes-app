# Keep Notes App

A full-stack notes application with integrations for news, financial data, social feeds (X, Reddit), major indexes, deadlines, and more.

**Deployed:** https://dev-tech-topaz.vercel.app/

---

## What kind of product is this?

**Keep Notes App** is a **context-aware research and note-taking product** that ties each note to live, external context:

- **Research / note-taking:** You write notes (titles, content, tags, deadlines) and attach **integrations** per note: news keywords, financial symbols, and social keywords (X/Twitter and Reddit).
- **Live context per note:** Each note can pull in **news** (top articles + subject summary), **financials** (your symbols + major indexes + top 100 movers ordered by relevance to the note), and **social** (X and Reddit posts by keyword, with sentiment). So the note becomes a small hub for “everything about this topic” instead of a static text blob.
- **Personal intelligence layer:** The app doesn’t just store text—it correlates news, markets, and social sentiment with the note’s subject, surfaces top movers and indexes, and (with “Update all”) refreshes news, financials, and social in one go. That makes it useful for **research, due-diligence, and tracking themes** (e.g. a note on “AI chips” gets relevant news, NVDA/AMD in movers, and X/Reddit buzz).
- **Product category:** It sits between a **smart notebook** and a **lightweight research dashboard**: notes are first-class, but each note is augmented by configurable, refreshable context from news, markets, and multiple social platforms.

---

## Tech Stack

- **Frontend:** React (Create React App)
- **Backend:** Node.js, Express
- **Database:** SQLite (default) or PostgreSQL
- **Real-time:** WebSocket support

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Start backend (API + WebSocket)

```bash
node server.js
```

- API: **http://localhost:3050**
- WebSocket: **ws://localhost:3050** (same host/port as API)

### 3. Start frontend

```bash
npm start
```

- App: **http://localhost:3000**

---

## Database

The app supports **SQLite** (default) or **PostgreSQL**. No setup is required for SQLite; a file is created at `./data/notes.db`.

### PostgreSQL (optional)

Create a `.env` file:

```bash
DATABASE_TYPE=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=notes
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
```

Tables are created automatically on first run. See `config/database.js` for the schema (title, content, tags, deadline, news, financial, social, etc.).

---

## API Keys (optional)

The app works **without any API keys** using free sources:

- **News:** Google News RSS
- **Stocks:** Yahoo Finance
- **Crypto:** CoinGecko
- **Social:** Nitter/Reddit RSS

Copy `.env.example` to `.env` and add keys only if you want more sources (see `.env.example` for all optional variables):

| Category | Env variable | Service |
|----------|--------------|---------|
| News | `GNEWS_API_KEY`, `GUARDIAN_API_KEY`, `NYT_API_KEY`, `NEWS_API_KEY` | GNews, Guardian, NYT, NewsAPI |
| Stocks | `ALPHA_VANTAGE_API_KEY`, `FINNHUB_API_KEY` | Alpha Vantage, Finnhub |
| Social | `TWITTER_BEARER_TOKEN` | X (Twitter) API v2 |

Verify keys: `node scripts/verify-api-keys.js`  
Test integrations (with server running): `node scripts/test-integrations.js`

---

## Features

- **Notes:** Create, edit, delete; simple and enhanced forms
- **Deadlines:** Track due dates; view Upcoming / Overdue (Nav → Deadlines)
- **Integrations (per note):** News by keywords, stocks/crypto symbols, social (X + Reddit) by keywords
- **Financial – Major indexes + top 100 movers (stocks):** For stock notes, “Update financial” fetches **major indexes** (S&P 500, NASDAQ 100, Dow, Russell 2000, sector ETFs like XLF/XLK/XLE, EFA/EEM, etc.) and shows them in the Financial modal. It also fetches up to **100** largest movers, top gainers, and top losers (market-wide), **relevance-ordered** to the note and its news. Use “Load top 100 movers” to refresh.
- **Social – Multiple platforms:** **X (Twitter)** and **Reddit** are supported per note. Enable one or both in Integrations, add shared keywords, and use “Fetch social” to pull posts from both; each platform shows its own sentiment and snippets on the note.
- **Command palette:** `Ctrl+K` / `Cmd+K` — search, dark mode, deadlines, focus mode
- **Split view:** Side-by-side note management
- **Focus mode:** Distraction-free writing
- **Voice recorder:** Speech-to-text notes
- **Drawing canvas:** Sketches on notes
- **Export/Import:** Export all notes from server as JSON; import notes
- **Trash:** Soft-deleted notes; restore or purge
- **Responsive:** Mobile-friendly layout and touch targets

---

## Backend (server.js)

### Notes
- **POST** `/api/notes/AddNote` — create note
- **GET** `/api/notes/GetNotes` — list notes (see [filters & pagination](#getnotes--search-filters-and-pagination) below)
- **GET** `/api/notes/search?q=...` — search notes by query (same query params as GetNotes)
- **PUT** `/api/notes/UpdateNote/:id` — update note
- **DELETE** `/api/notes/DeleteNote/:id` — delete note
- **GET** `/api/notes/export` — export all notes as JSON (includes integrations)
- **POST** `/api/notes/import` — import notes from JSON (preserves deadline, news, financial, social, etc.)

### Integrations
- **POST** `/api/notes/:id/fetch-news` — fetch news for note
- **POST** `/api/notes/:id/update-financial` — update financial data
- **POST** `/api/notes/:id/fetch-tweets` — fetch social (X + Reddit when enabled)
- **POST** `/api/notes/:id/update-all` — refresh news + financial + social + intelligence
- **GET** `/api/notes/:id/top-movers` — load top 100 movers for note
- **GET** `/api/notes/upcoming-deadlines?days=14` — upcoming deadlines
- **GET** `/api/notes/overdue` — overdue notes
- **PATCH** `/api/notes/:id/deadline-status` — set deadline status (body: `{ status }`)
- **GET** `/api/predictive/search?q=...` — search predictive markets
- **POST** `/api/notes/:id/link-predictive-market` — link market (body: `{ platform, marketId }`)
- **GET** `/api/nyuzi/search?q=...` — search Nyuzi markets
- **POST** `/api/notes/:id/nyuzi-market` — link Nyuzi market (body: `{ marketId }`)

### Notifications (in-app)
- **GET** `/api/notifications?unreadOnly=true` — list notifications
- **GET** `/api/notifications/unread-count` — unread count
- **PATCH** `/api/notifications/:id/read` — mark one read
- **PATCH** `/api/notifications/read-all` — mark all read

### GetNotes / search – filters and pagination
- **Query params (optional):** `tags` (array or repeated), `priority`, `isArchived`, `isPinned`, `sortBy` (`title` \| `createdAt` \| `updatedAt` \| `priority`), `sortOrder` (`asc` \| `desc`), `page`, `limit`.
- **Search** (`/api/notes/search`): same params plus `q` for full-text search in title, content, tags.
- **Pagination:** Frontend sends `page` and `limit`; backend returns all matching notes (server-side pagination can be added later). Sorted notes are returned; pinned notes appear first.

---

## Deploying

- **Frontend:** Deploy the React app to Vercel (build: `npm run build`, output: `build`). Set `REACT_APP_API_URL` and optionally `REACT_APP_WS_URL` (defaults to same host as API, using `ws://`/`wss://`) to your backend URL.
- **Backend:** Deploy Express + DB to Render, Railway, Fly.io, or similar. Use `DATABASE_TYPE=postgres` and set CORS to your Vercel frontend origin.

---

## Troubleshooting

- **"Failed to fetch" / CORS:** Ensure backend is running on port 3050 and frontend uses `http://localhost:3050` (or your API URL).
- **npm start slow or stuck:** Try `rm -rf node_modules package-lock.json && npm install`. For Node 20+, consider `npm install react-scripts@5.0.1` and remove `--openssl-legacy-provider` from start script if present.
- **Port in use:** `lsof -ti:3000` then `kill -9 $(lsof -ti:3000)` for frontend port.
- **Module not found / lodash errors:** Clean install: `rm -rf node_modules package-lock.json && npm install`.
- **News/tweets empty without keys:** App falls back to RSS or mock data; check server console for RSS errors.

---

## Fixes and improvements applied

- React warnings resolved (useCallback/useEffect deps, unused state in SplitView, VoiceRecorder, FocusMode, DrawingCanvas, App.jsx).
- Emoji accessibility: emojis wrapped in `<span role="img" aria-label="...">` in Note.jsx, App.jsx, TemplateSelector.jsx.
- Notes save all fields: `createNote` / database service persist deadline, news, financial, social, intelligence, attachments, drawings.
- Mobile: viewport meta, responsive CSS, touch-friendly targets (min 44px), print styles.
- Database migrated from MongoDB to SQLite/PostgreSQL with `config/database.js` and `databaseService`.
