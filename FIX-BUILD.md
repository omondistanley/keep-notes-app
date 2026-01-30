# Fix build (cross-spawn / dotenv / corrupted node_modules)

If `npm run build` fails with errors like:

- `TypeError: parse is not a function` (cross-spawn)
- `require(...).config is not a function` (dotenv)
- `Unexpected end of JSON input` (corrupted package.json)
- `Cannot find module 'is-extendable'` or similar

**Recommended fix: clean reinstall**

```bash
rm -rf node_modules
npm cache clean --force
npm install
npm run fix-build
npm run build
```

- **postinstall** runs `scripts/fix-build-patches.js` after `npm install`, which patches:
  - `react-dev-utils/node_modules/cross-spawn` (parse export)
  - `react-scripts/config/env.js` (dotenv.config)
- **fix-build** re-applies the same patches if you need to run them again.

If build still fails after a clean install, try:

- Node 18 LTS: `nvm use 18` (if using nvm) then `npm install` and `npm run build`
- Or ensure no other Node/npm version is affecting the project.
