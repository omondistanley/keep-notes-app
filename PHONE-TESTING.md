# Test Keep Notes on Your Phone (Add to Home Screen)

You can use your deployed app on your phone **like an app** without publishing to the App Store. Apple (and Android) let you **add a website to your home screen** so it opens in a standalone window with no browser UI—same idea as a “linked” or installed web app.

---

## What you need

- The app **deployed and reachable over HTTPS** (e.g. `https://your-app.herokuapp.com`).  
  **Important:** “Add to Home Screen” works best over HTTPS. Localhost won’t work on your phone unless you use something like ngrok.

---

## iPhone / iPad (Safari)

1. Open **Safari** on your iPhone or iPad.
2. Go to your app’s URL (e.g. `https://your-app.herokuapp.com`).
3. Tap the **Share** button (square with arrow pointing up).
4. Scroll down and tap **“Add to Home Screen”**.
5. Edit the name if you want (e.g. “Keep Notes”) and tap **Add**.

A **Keep Notes** icon appears on your home screen. When you tap it:

- The app opens **full screen** (no Safari address bar or tabs).
- It uses the **theme color** (yellow/gold) for the status bar.
- It feels like a normal app; you’re not “in Safari” anymore.

This uses Apple’s built-in “Add to Home Screen” and the meta tags / manifest we added (`apple-mobile-web-app-capable`, `manifest.json`, etc.). **No App Store or Apple Developer account** is required.

---

## Android (Chrome)

1. Open **Chrome** and go to your app’s URL.
2. Tap the **menu** (⋮) → **“Add to Home screen”** or **“Install app”**.
3. Confirm the name and tap **Add** or **Install**.

The app is added to your home screen and can open in a standalone window (depending on device and Chrome version).

---

## Optional: icon on home screen

The project includes:

- **`public/manifest.json`** – app name, theme color, standalone display.
- **`public/icon.svg`** – simple “K” icon used for **Apple Touch Icon** (home screen icon on iOS).

If you want a custom PNG icon (e.g. 192×192 and 512×512):

1. Add **`icon-192.png`** and **`icon-512.png`** to the **`public/`** folder.
2. The manifest already points to `/icon-192.png` and `/icon-512.png`; they’ll be used when available.

Until then, iOS may use the SVG or a generic bookmark icon; the app will still open in standalone mode.

---

## Testing on the same Wi‑Fi (no deploy yet)

If the app is only running on your computer:

1. Find your computer’s **local IP** (e.g. System Settings → Wi‑Fi → your network → IP, or `ifconfig` / `ipconfig`).
2. On your phone (same Wi‑Fi), open Safari and go to `http://YOUR_IP:3050` (or whatever port the server uses).

**Note:** Browsers and “Add to Home Screen” often require **HTTPS** for standalone behavior and some features. For the best “app-like” experience, use a deployed HTTPS URL (e.g. Heroku). For quick UI checks, the IP method is fine.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Deploy the app (e.g. Heroku) so you have an HTTPS URL. |
| 2 | On iPhone: Safari → your URL → Share → **Add to Home Screen**. |
| 3 | Name it “Keep Notes” (or anything) and tap Add. |
| 4 | Open the new home screen icon; the app runs in standalone, app-like mode. |

No publishing, no App Store, no Apple Developer account—just “Add to Home Screen” on your phone.
