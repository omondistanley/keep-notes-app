# Deploy and Test the Latest Updates

This guide covers how to deploy the app and how to test the new features (import with integrations, notifications, Predictive/Nyuzi UI, Calendar/Email/Cloud/Tasks placeholder, and env/docs).

**Quick deploy:** Commit and push to your main branch. If your repo is connected to Vercel, Render, Railway, or Heroku, a new deployment will start automatically. Then use the testing steps below on your deployed URL.

---

## 1. Deploy the changes

The app can be deployed in two ways: **single-server** (backend serves the built frontend) or **split** (frontend on Vercel, backend elsewhere).

### Option A: Single server (Heroku, Railway, Render, Fly.io)

One deployment runs both API and the React app.

1. **Commit and push** your changes:
   ```bash
   git add .
   git status   # review
   git commit -m "Add import integrations, notifications, Predictive/Nyuzi UI, roadmap, .env.example"
   git push origin main
   ```

2. **Connect your repo** to your host (if not already):
   - **Render:** New → Web Service → connect repo → Build: `npm install && npm run build` → Start: `npm start` (or `node server.js`).
   - **Railway:** New Project → deploy from repo → set start: `node server.js`, add build: `npm run build` in settings.
   - **Heroku:** `heroku create` (if needed), then `git push heroku main`. Heroku runs `heroku-postbuild` (npm run build) then `web: node server.js` from Procfile.

3. **Environment variables** (on the host dashboard):
   - Set `NODE_ENV=production`.
   - For **PostgreSQL** on Render/Railway: set `DATABASE_URL` (or `POSTGRES_*`). For SQLite leave unset (uses `./data/notes.db`; may not persist on ephemeral disks).
   - Optional: `PORT` (hosts often set this automatically).

4. **Build** runs on deploy; the server serves the `build` folder at `/` and API at `/api/*`.

### Option B: Split (frontend on Vercel, backend elsewhere)

1. **Deploy backend** (Render, Railway, Fly.io, etc.):
   - Same as Option A: `node server.js`, optional `DATABASE_URL`, enable CORS for your Vercel origin.

2. **Deploy frontend on Vercel:**
   - Connect the repo to Vercel (or run `vercel` from the project root).
   - **Environment variables** in Vercel:
     - `REACT_APP_API_URL` = your backend URL (e.g. `https://your-app.onrender.com`)
     - `REACT_APP_WS_URL` = WebSocket URL (e.g. `wss://your-app.onrender.com`) if different from API.
   - Vercel uses `vercel.json`: build command runs `npm run build`, output is `build`. Rewrites send `/*` to `index.html` for the SPA.

3. **CORS:** On the backend, allow your Vercel origin (e.g. `https://your-project.vercel.app`). The app uses `cors()` with no origin restriction by default; tighten in production if needed.

### Build locally before pushing (optional)

```bash
npm install
npm run fix-build    # if you had build issues before
CI= npm run build    # skip strict lint in CI
```

If `CI=true` (e.g. on Vercel), the build may fail on lint warnings; fixing or relaxing lint for the build is recommended.

---

## 2. How to test the updates

Use either your **deployed URL** or **local** (backend: `node server.js`, frontend: `npm run dev` or open `build/index.html` after `npm run build`).

---

### 2.1 Import preserves integrations

**Goal:** Imported notes keep deadline, news, financial, and social config and data.

1. Create a note with **Enhanced** form: set title, content, **Deadline** (date), **News** (keywords), **Financial** (e.g. Crypto, symbols `bitcoin`), **Social** (X/Reddit keywords). Save.
2. On the note, click **Fetch news**, **Update financial**, **Fetch tweets** (or **Update all**) so it has live data.
3. Go to **Export / Import** → **Export from server (all notes)**. Download the JSON.
4. Delete the note (or use another browser/incognito) so you can confirm re-import.
5. **Import:** Choose the downloaded JSON file → **Import Notes**.
6. **Check:** Re-open the imported note. It should show the same deadline, news articles (or config), financial prices, and social tweets/posts. In the **Enhanced** edit, tabs should still have deadline, news keywords, financial symbols, and social keywords.

---

### 2.2 Notifications (in-app)

**Goal:** Bell icon shows count; opening it lists notifications; new ones arrive via WebSocket (or after cron).

1. **Unread count:** In the header/sidebar, find the **bell icon**. If there are unread notifications, a red badge with the count appears.
2. **Open panel:** Click the bell. A dropdown lists notifications (e.g. “Deadline soon”, “Deadline overdue”) with title, body, and time. Click **Mark all read**; badge should clear.
3. **Create a notification (manual test):** Use the API to create one (with server running):
   ```bash
   # Replace host/port if deployed (e.g. https://your-app.onrender.com)
   curl -X POST http://localhost:3050/api/notifications \
     -H "Content-Type: application/json" \
     -d '{"type":"info","title":"Test notification","body":"Test body"}'
   ```
   With the app open and WebSocket connected, you should see the **unread count** increase and a **toast** (bottom-right) for the new notification. Open the bell panel to see it and mark it read.
   Alternatively, create a note with a **deadline** in the next 24 hours and **reminder enabled** (Enhanced form → Deadline tab); the **hourly cron** will create “Deadline soon” notifications.
4. **Mark read:** Open the panel, click a notification (or “Mark all read”). Count updates.

---

### 2.3 Predictive / Nyuzi UI (link and show on note)

**Goal:** From the Financial modal you can search and link Predictive and Nyuzi; the note shows linked markets and Nyuzi.

1. Create or open a note that has **Financial** enabled (e.g. add a symbol in Enhanced form and save).
2. Open the note → click the **Financial** section to open the **Financial modal**.
3. Scroll to **“Link Predictive / Nyuzi”**.
4. **Predictive:** Type a query (e.g. “election”), click **Search**. A list of (mock) markets appears. Click **Link** on one. Close the modal; the note should show a **“Predictive Markets”** block with platform, question, and Yes %.
5. **Nyuzi:** Type a query, click **Search**. Click **Link** on a result. The note should show a **“Nyuzi”** block (e.g. early market indicator, catalysts).
6. Re-open the Financial modal; you can link more markets. Re-open the note to see all linked items.

---

### 2.4 Calendar / Email / Cloud / Tasks (placeholder and docs)

**Goal:** Dashboard shows “Coming soon” and roadmap is documented.

1. Open **Dashboard** (nav → Dashboard).
2. Scroll down. You should see **“More integrations (coming soon)”** with Calendar, Email, Cloud Storage, Tasks and a reference to `INTEGRATIONS-ROADMAP.md`.
3. In the repo, open **`INTEGRATIONS-ROADMAP.md`**. It should describe Calendar, Email, Cloud, and Tasks as planned, with current (mock) API behavior and future env vars.

---

### 2.5 Env and API docs

**Goal:** `.env.example` and README reflect current API and options.

1. **.env.example:** In the project root, open **`.env.example`**. It should list optional variables (PORT, DB, REACT_APP_*, news/financial/social keys, NITTER_RSS_BASE, cache TTL) with short comments.
2. **README:** Open **README.md**. Check:
   - **Backend** section lists Notes, Integrations (including predictive/nyuzi, update-all, deadlines), and **Notifications** (GET/PATCH).
   - **“GetNotes / search – filters and pagination”** describes query params: `tags`, `priority`, `isArchived`, `isPinned`, `sortBy`, `sortOrder`, `page`, `limit`, and search `q`.
   - **API Keys** section mentions copying `.env.example` to `.env`.

---

## 3. Quick local test (no deploy)

```bash
# Terminal 1 – backend
cd /path/to/keep-notes-app
npm install
npm run build    # or CI= npm run build
node server.js
# API: http://localhost:3050

# Terminal 2 – frontend (optional; or use backend-served build)
npm run dev
# App: http://localhost:3000 — set REACT_APP_API_URL=http://localhost:3050 in .env if needed
```

If you only run `node server.js`, open **http://localhost:3050** and use the built app served by the server. Then run through the tests above (import, notifications, Predictive/Nyuzi, Dashboard placeholder, and docs).

---

## 4. Checklist summary

| Feature                    | How to test briefly |
|---------------------------|----------------------|
| Import preserves integrations | Export notes → import same JSON → confirm deadline, news, financial, social on note and in Enhanced form. |
| Notifications             | Bell icon, open panel, mark read; create overdue/reminder note and wait for cron or trigger manually. |
| Predictive / Nyuzi UI     | Financial modal → “Link Predictive / Nyuzi” → search → link → confirm blocks on note. |
| Calendar/Email/Cloud/Tasks| Dashboard → “Coming soon” section; repo `INTEGRATIONS-ROADMAP.md`. |
| .env.example & README     | Check `.env.example` and README backend + GetNotes/pagination + API Keys. |
