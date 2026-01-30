#!/usr/bin/env node
/**
 * Applies patches to node_modules so react-scripts build works with current Node/npm.
 * Run after: rm -rf node_modules && npm install
 * Or add to package.json: "postinstall": "node scripts/fix-build-patches.js"
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const crossSpawnPath = path.join(root, 'node_modules/react-dev-utils/node_modules/cross-spawn/index.js');
const envPath = path.join(root, 'node_modules/react-scripts/config/env.js');

function patchCrossSpawn() {
  if (!fs.existsSync(crossSpawnPath)) return;
  let content = fs.readFileSync(crossSpawnPath, 'utf8');
  if (content.includes('parseModule')) return; // already patched
  content = content.replace(
    "const parse = require('./lib/parse');",
    "const parseModule = require('./lib/parse');\nconst parse = typeof parseModule === 'function' ? parseModule : (parseModule.default || parseModule.parse);"
  );
  fs.writeFileSync(crossSpawnPath, content);
  console.log('Patched cross-spawn');
}

function patchEnv() {
  if (!fs.existsSync(envPath)) return;
  let content = fs.readFileSync(envPath, 'utf8');
  if (content.includes('dotenvConfig')) return; // already patched
  content = content.replace(
    "dotenvFiles.forEach(dotenvFile => {\n  if (fs.existsSync(dotenvFile)) {\n    require('dotenv-expand')(\n      require('dotenv').config({\n        path: dotenvFile,\n      })\n    );\n  }\n});",
    "const dotenv = require('dotenv');\nconst dotenvConfig = typeof dotenv.config === 'function' ? dotenv.config : (dotenv.default && dotenv.default.config);\ndotenvFiles.forEach(dotenvFile => {\n  if (fs.existsSync(dotenvFile)) {\n    require('dotenv-expand')(\n      dotenvConfig({\n        path: dotenvFile,\n      })\n    );\n  }\n});"
  );
  fs.writeFileSync(envPath, content);
  console.log('Patched react-scripts/config/env.js');
}

function patchRenderkid() {
  const rulePath = path.join(root, 'node_modules/renderkid/lib/renderKid/styles/Rule.js');
  if (!fs.existsSync(rulePath)) return;
  let content = fs.readFileSync(rulePath, 'utf8');
  if (content.includes("Selector.default")) return; // already patched
  content = content.replace(
    "Selector = require('./rule/Selector');\nDeclarationBlock = require('./rule/DeclarationBlock');",
    "Selector = require('./rule/Selector');\nif (typeof Selector !== 'function' && Selector && Selector.default) Selector = Selector.default;\nDeclarationBlock = require('./rule/DeclarationBlock');"
  );
  fs.writeFileSync(rulePath, content);
  console.log('Patched renderkid Rule.js');
}

patchCrossSpawn();
patchEnv();
patchRenderkid();
