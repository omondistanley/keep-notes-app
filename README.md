# Keep Notes App

A full-stack notes application with integrations for news, financial data, social feeds, deadlines, and more.

**Deployed:** https://dev-tech-topaz.vercel.app/

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

Copy `.env.example` to `.env` and add keys only if you want more sources:

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
- **Integrations (per note):** News by keywords, stocks/crypto symbols, social/X by keywords
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

- **POST** `/api/notes/AddNote` — create note
- **GET** `/api/notes/GetNotes` — list notes
- **PUT** `/api/notes/UpdateNote/:id` — update note
- **DELETE** `/api/notes/DeleteNote/:id` — delete note
- **POST** `/api/notes/:id/fetch-news` — fetch news for note
- **POST** `/api/notes/:id/update-financial` — update financial data
- **POST** `/api/notes/:id/fetch-tweets` — fetch social/tweets
- **GET** `/api/notes/upcoming-deadlines?days=14` — upcoming deadlines
- **GET** `/api/notes/export` — export all notes as JSON

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
