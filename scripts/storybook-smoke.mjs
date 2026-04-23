#!/usr/bin/env node
/**
 * Storybook smoke test: loads every story's iframe and reports any console
 * error, unhandled exception, or render failure. Catches runtime bugs that
 * `build-storybook` misses (e.g. classList.add('') throwing at mount time).
 *
 * Assumes `npm run build-storybook` has been run and `storybook-static/` exists.
 *
 * Usage: node scripts/storybook-smoke.mjs [--concurrency N] [--filter substring]
 */
import { readFileSync } from 'fs';
import { chromium } from 'playwright';
import http from 'http';
import path from 'path';
import fs from 'fs';

const CONCURRENCY = Number(argVal('--concurrency', 6));
const FILTER = argVal('--filter', '');
const ROOT = 'storybook-static';
const MIME = {
  '.html': 'text/html', '.js': 'application/javascript',
  '.mjs': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2',
  '.ico': 'image/x-icon', '.map': 'application/json',
};

function argVal(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = (req.url || '/').split('?')[0];
      let filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(ROOT, 'index.html');
      }
      const ext = path.extname(filePath).toLowerCase();
      res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

async function checkStory(browser, baseUrl, story) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  const consoleErrors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  // Filter noise unrelated to render bugs — stories that demonstrate broken
  // images or unreachable URLs intentionally log ERR_NAME_NOT_RESOLVED /
  // ERR_CONNECTION_REFUSED / 404 resource failures.
  const IGNORE = [
    /Failed to load resource: net::ERR_NAME_NOT_RESOLVED/,
    /Failed to load resource: net::ERR_CONNECTION_REFUSED/,
    /Failed to load resource: the server responded with a status of (4|5)\d\d/,
    /Failed to load resource: net::ERR_CERT/,
  ];
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (IGNORE.some(re => re.test(text))) return;
    consoleErrors.push(text);
  });
  try {
    // `load` (not `networkidle`) — media stories (audio/video) buffer forever
    // and would never reach idle. Render errors fire well before `load`.
    await page.goto(`${baseUrl}/iframe.html?id=${story.id}&viewMode=story`, {
      waitUntil: 'load',
      timeout: 15_000,
    });
    // Give stories a moment to fully render (some use async update()).
    // Bump higher to catch lazy/runtime errors (e.g. pdfjs worker failure,
    // async data fetches) that surface only once the component starts work.
    await page.waitForTimeout(1000);
  } catch (e) {
    errors.push(`navigation: ${e.message}`);
  } finally {
    await context.close();
  }
  return { id: story.id, title: story.title, name: story.name, errors, consoleErrors };
}

async function main() {
  const index = JSON.parse(readFileSync(path.join(ROOT, 'index.json'), 'utf8'));
  let stories = Object.values(index.entries).filter((e) => e.type === 'story');
  if (FILTER) stories = stories.filter((s) => s.id.includes(FILTER) || s.title.includes(FILTER));
  console.log(`Checking ${stories.length} stories with concurrency ${CONCURRENCY}...`);

  const { server, baseUrl } = await startServer();
  const browser = await chromium.launch();

  const broken = [];
  let done = 0;
  const queue = [...stories];

  async function worker() {
    while (queue.length) {
      const story = queue.shift();
      const res = await checkStory(browser, baseUrl, story);
      done++;
      if (res.errors.length || res.consoleErrors.length) broken.push(res);
      if (done % 50 === 0) {
        process.stdout.write(`  progress: ${done}/${stories.length} (${broken.length} broken)\n`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  await browser.close();
  server.close();

  console.log(`\nTotal: ${stories.length}  Broken: ${broken.length}\n`);
  for (const b of broken) {
    console.log(`─── ${b.id}  (${b.title} / ${b.name})`);
    for (const e of b.errors) console.log(`  pageerror: ${e}`);
    for (const e of b.consoleErrors) console.log(`  console.error: ${e}`);
  }
  process.exit(broken.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
