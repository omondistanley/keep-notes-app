# Phase 2 & Phase 5 Setup Instructions

## Installation

The dependencies have been added to `package.json`. You need to install them:

```bash
npm install
```

If you encounter permission errors, try:
```bash
sudo npm install
```

Or if using nvm:
```bash
# Make sure you're using the correct node version
nvm use 20.19.4  # or your version
npm install
```

## Required Dependencies

The following new dependencies were added:

### Backend:
- `node-cron` - For scheduled tasks
- `sentiment` - For sentiment analysis

### Frontend:
- `fuse.js` - For fuzzy search in command palette
- `date-fns` - For date manipulation
- `react-datepicker` - For date picker component
- `recharts` - For charts (optional, for future use)
- `fabric` - For drawing canvas (optional, for future use)
- `react-speech-recognition` - For voice notes

## After Installation

1. **Start the server:**
   ```bash
   node server.js
   ```

2. **Start the React app:**
   ```bash
   npm start
   ```

## Features Available

### Phase 2 Integrations:
- ✅ Deadline tracking with reminders
- ✅ News integration (mocked)
- ✅ Financial data (stocks/crypto, mocked)
- ✅ Predictive markets (Polymarket/Kalshi/PredictIt, mocked)
- ✅ X/Twitter integration (mocked)
- ✅ Nyuzi intelligence platform (mocked)
- ✅ Cross-domain intelligence engine
- ✅ Automated cron jobs for updates

### Phase 5 Features:
- ✅ Command Palette (Cmd+K / Ctrl+K)
- ✅ Split View for side-by-side note management
- ✅ Focus Mode for distraction-free writing
- ✅ Voice Recorder with speech-to-text
- ✅ Drawing Canvas for sketches
- ✅ Enhanced Note Form with all integrations
- ✅ Calendar integration (mocked)
- ✅ Email integration (mocked)
- ✅ Cloud storage integration (mocked)
- ✅ Task management integration (mocked)

## Usage

1. **Command Palette:** Press `Cmd+K` (Mac) or `Ctrl+K` (Windows) to open
2. **Enhanced Notes:** Click "+ Enhanced" button to create notes with all integrations
3. **Split View:** Click "Split View" button for side-by-side note management
4. **Voice Notes:** Click "🎤 Voice" button to record and transcribe
5. **Drawing:** Click "✏️ Draw" button to sketch

## Troubleshooting

If you see "Module not found" errors:
1. Make sure you've run `npm install`
2. Check that `node_modules` folder exists
3. Try deleting `node_modules` and `package-lock.json`, then run `npm install` again

If react-datepicker styles don't load:
- The CSS is imported in `EnhancedNoteForm.jsx`
- If issues persist, add to `src/index.js`: `import "react-datepicker/dist/react-datepicker.css";`

