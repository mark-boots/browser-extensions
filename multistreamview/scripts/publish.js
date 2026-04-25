#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __dir = dirname(fileURLToPath(import.meta.url));
const root  = resolve(__dir, '..');

// ── Load .env ────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync(resolve(root, '.env'), 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const CLIENT_ID  = env.EDGE_CLIENT_ID;
const API_KEY    = env.EDGE_API_KEY;
const PRODUCT_ID = env.EDGE_PRODUCT_ID;
const BASE_URL   = 'https://api.addons.microsoftedge.microsoft.com/v1.1';

const headers = {
  'Authorization': `ApiKey ${API_KEY}`,
  'X-ClientID': CLIENT_ID,
};

// ── Interactive prompts ───────────────────────────────
const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(res => {
  rl.question(q, ans => res(ans ?? ''));
  rl.once('close', () => res(''));
});

// ── Read current version ──────────────────────────────
const manifestPath = resolve(root, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const [major, minor, patch] = manifest.version.split('.').map(Number);

console.log(`Current version: ${manifest.version}`);
const bumpAnswer = (await ask('Bump version? (major / minor / patch / no): ')).trim().toLowerCase();
const bump = ['major', 'minor', 'patch'].includes(bumpAnswer) ? bumpAnswer : null;

let newVersion = manifest.version;
if (bump === 'major') newVersion = `${major + 1}.0.0`;
if (bump === 'minor') newVersion = `${major}.${minor + 1}.0`;
if (bump === 'patch') newVersion = `${major}.${minor}.${patch + 1}`;
if (bump) console.log(`Will publish as: ${newVersion}`);

const notesAnswer = (await ask('Release notes (enter to skip): ')).trim();
const notes = notesAnswer || 'Bug fixes and improvements';
rl.close();
process.stdin.destroy();

const zipPath = resolve(root, `multistreamview-${newVersion}.zip`);

// ── Build ─────────────────────────────────────────────
console.log('Building...');
execSync('npm run build', { cwd: root, stdio: ['ignore', 'inherit', 'inherit'] });

// ── Zip ───────────────────────────────────────────────
console.log('Zipping dist/...');
execSync(
  `powershell -Command "Compress-Archive -Path 'dist/*' -DestinationPath '${zipPath}' -Force"`,
  { cwd: root, stdio: ['ignore', 'inherit', 'inherit'] }
);

// ── Upload ────────────────────────────────────────────
console.log('Uploading package...');
const zipData = readFileSync(zipPath);
const uploadRes = await fetch(
  `${BASE_URL}/products/${PRODUCT_ID}/submissions/draft/package`,
  {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/zip' },
    body: zipData,
  }
);
if (!uploadRes.ok) {
  console.error('Upload failed:', await uploadRes.text());
  process.exit(1);
}
const uploadOpId = uploadRes.headers.get('Location')?.split('/').pop();

// ── Poll upload ───────────────────────────────────────
console.log('Waiting for upload to process...');
await poll(`${BASE_URL}/products/${PRODUCT_ID}/submissions/draft/package/operations/${uploadOpId}`);

// ── Publish ───────────────────────────────────────────
console.log('Publishing...');
const pubRes = await fetch(
  `${BASE_URL}/products/${PRODUCT_ID}/submissions`,
  {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'text/plain' },
    body: notes,
  }
);
if (!pubRes.ok) {
  console.error('Publish failed:', await pubRes.text());
  process.exit(1);
}
const pubOpId = pubRes.headers.get('Location')?.split('/').pop();

// ── Poll publish ──────────────────────────────────────
console.log('Waiting for publish to complete...');
await poll(`${BASE_URL}/products/${PRODUCT_ID}/submissions/operations/${pubOpId}`);

// ── Write version only on success ────────────────────
if (bump) {
  manifest.version = newVersion;
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}

console.log(`\nDone! MultiStreamView ${newVersion} submitted for review.`);

// ── Helpers ───────────────────────────────────────────
async function poll(url, interval = 3000, timeout = 120000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    await sleep(interval);
    const res  = await fetch(url, { headers });
    const data = await res.json();
    if (data.status === 'Succeeded') return data;
    if (data.status === 'Failed') {
      console.error('Operation failed:', JSON.stringify(data, null, 2));
      process.exit(1);
    }
    process.stdout.write('.');
  }
  console.error('\nTimed out waiting for operation.');
  process.exit(1);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
