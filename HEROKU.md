# Deploy Keep Notes App to Heroku

Single-app deploy: Heroku builds the React app and runs the Node server. The server serves the built frontend and the API. Use **Heroku Postgres** for persistent data (recommended); without it, SQLite uses the ephemeral filesystem and data is lost on restart.

---

## 1. Prerequisites

- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed and logged in (`heroku login`)
- Git repo with your latest code

---

## 2. Create the app and add Postgres

```bash
cd /path/to/keep-notes-app

# Create Heroku app (use a unique name or leave blank for a generated one)
heroku create your-app-name

# Add Heroku Postgres (recommended; DATABASE_URL is set automatically)
heroku addons:create heroku-postgresql:mini
```

If you skip Postgres, the app will use SQLite and **data will not persist** across dyno restarts.

---

## 3. (Optional) Set config vars

Set any optional env vars (API keys for news, financial, social):

```bash
# Optional – more news sources
heroku config:set GNEWS_API_KEY=your_key
heroku config:set GUARDIAN_API_KEY=your_key

# Optional – real stock data
heroku config:set ALPHA_VANTAGE_API_KEY=your_key
heroku config:set FINNHUB_API_KEY=your_key

# Optional – X (Twitter) API
heroku config:set TWITTER_BEARER_TOKEN=your_token
```

You can add these later in **Dashboard → your app → Settings → Config Vars**.

---

## 4. Deploy

```bash
git add .
git status
git commit -m "Prepare Heroku deploy"
git push heroku main
```

If your default branch is `master`:

```bash
git push heroku master
```

Or from another branch:

```bash
git push heroku your-branch:main
```

Heroku will:

1. Run `npm install`
2. Run `postinstall` (fix-build-patches if present)
3. Run `heroku-postbuild` → **npm run build** (React production build)
4. Start the app with **Procfile**: `web: node server.js`

---

## 5. Open the app

```bash
heroku open
```

Or visit `https://your-app-name.herokuapp.com`.

The server uses `PORT` from Heroku and serves:

- **API:** `https://your-app-name.herokuapp.com/api/*`
- **App:** `https://your-app-name.herokuapp.com/` (built React app from `build/`)

Database tables (notes, notifications) are created automatically on first start via `dbService.syncDatabase()`.

---

## 6. If the build fails

- **"Treating warnings as errors" (CI):** Heroku may set `CI=true`. To avoid failing on lint warnings during build, you can set:
  ```bash
  heroku config:set CI=false
  ```
  Then redeploy. Or change `package.json`:
  ```json
  "heroku-postbuild": "CI= npm run build"
  ```
- **"Cannot find module" / build errors:** Run locally:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  npm run fix-build
  CI= npm run build
  ```
  Fix any errors, then commit and push again.

---

## 7. Useful commands

| Command | Description |
|--------|-------------|
| `heroku logs --tail` | Stream app logs |
| `heroku run node -e "require('./config/database').testConnection().then(console.log)"` | Test DB connection |
| `heroku config` | List config vars |
| `heroku restart` | Restart the dyno |

---

## 8. WebSocket on Heroku

The app runs WebSocket on the same port as HTTP (server.js attaches the WS server to the same HTTP server). Heroku’s routing supports this; no extra setup is needed. The frontend uses the same host for API and WS (e.g. `wss://your-app-name.herokuapp.com`). If `REACT_APP_API_URL` is not set in the build, the React app uses relative URLs and will work when served from the same Heroku app.

---

## Summary

1. `heroku create` (and optionally `heroku addons:create heroku-postgresql:mini`)
2. Optionally `heroku config:set` for API keys
3. `git push heroku main`
4. `heroku open`

For testing the new features after deploy, see **DEPLOY-AND-TEST.md**.
