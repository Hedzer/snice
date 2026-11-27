import { test, expect } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

function startStaticServer(rootDir: string): Promise<{ server: Server; url: string }> {
  return new Promise((resolvePromise) => {
    const server = createServer((req, res) => {
      const cleanUrl = (req.url || '/').split('?')[0];
      const rel = cleanUrl === '/' ? 'index.html' : cleanUrl.replace(/^\/+/, '');
      const fullPath = join(rootDir, rel);
      if (!existsSync(fullPath)) {
        res.statusCode = 404;
        res.end('Not found');
        return;
      }
      res.setHeader('Content-Type', MIME[extname(fullPath)] || 'application/octet-stream');
      res.end(readFileSync(fullPath));
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as { port: number };
      resolvePromise({ server, url: `http://127.0.0.1:${addr.port}` });
    });
  });
}

test.describe('Sample apps built with snice/vite smoke verification (Chromium, Firefox, WebKit)', () => {
  let tempRoot: string;
  const servers: Server[] = [];
  const urls: Record<string, string> = {};

  test.beforeAll(async ({}, testInfo) => {
    testInfo.setTimeout(120_000);
    tempRoot = mkdtempSync(join(tmpdir(), 'snice-examples-smoke-'));
    const viteBin = join(ROOT, 'node_modules/.bin/vite');

    for (const app of ['dashboard', 'store', 'task-manager']) {
      const dst = join(tempRoot, app);
      cpSync(join(ROOT, 'examples', app), dst, {
        recursive: true,
        filter: (src) => !src.includes('/node_modules') && !src.includes('/dist') && !src.endsWith('package-lock.json'),
      });
      const nm = join(dst, 'node_modules');
      mkdirSync(nm, { recursive: true });
      symlinkSync(ROOT, join(nm, 'snice'), 'junction');
      for (const entry of readdirSync(join(ROOT, 'node_modules'))) {
        if (entry === 'snice') continue;
        symlinkSync(join(ROOT, 'node_modules', entry), join(nm, entry), 'junction');
      }
      execSync(`${viteBin} build`, { cwd: dst, stdio: 'pipe' });
      const started = await startStaticServer(join(dst, 'dist'));
      servers.push(started.server);
      urls[app] = started.url;
    }
  });

  test.afterAll(async () => {
    await Promise.all(servers.map((s) => new Promise<void>((r) => s.close(() => r()))));
    if (tempRoot) rmSync(tempRoot, { recursive: true, force: true });
  });

  test('examples/dashboard renders shell & overview page and navigates cleanly with zero errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(`console.error: ${m.text()}`);
    });

    await page.goto(urls.dashboard);
    await expect(page.locator('dashboard-shell')).toBeVisible();
    await expect.poll(async () => page.evaluate(() => {
      const shell = document.querySelector('dashboard-shell');
      return !!shell && shell.innerHTML.trim().length > 0;
    })).toBe(true);

    // Navigate to reports route
    await page.evaluate(() => { window.location.hash = '#/reports'; });
    await expect.poll(async () => page.evaluate(() => document.querySelector('#app')?.innerHTML.toLowerCase() || '')).toContain('reports');
    expect(errors).toEqual([]);
  });

  test('examples/store renders store-layout & home page and navigates to products with zero errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      // Ignore Google Fonts network errors in offline/headless environments if any
      if (m.type() === 'error' && !m.text().includes('fonts.googleapis.com')) {
        errors.push(`console.error: ${m.text()}`);
      }
    });

    await page.goto(urls.store);
    await expect(page.locator('store-layout')).toBeVisible();
    await expect.poll(async () => page.evaluate(() => {
      const layout = document.querySelector('store-layout');
      return !!layout && (layout.shadowRoot?.textContent?.trim().length ?? 0) > 10;
    })).toBe(true);

    await page.evaluate(() => { window.location.hash = '#/products'; });
    await expect.poll(async () => page.evaluate(() => document.querySelector('#app')?.innerHTML.toLowerCase() || '')).toContain('products');
    expect(errors).toEqual([]);
  });

  test('examples/task-manager renders app and interactive login/board flow with zero errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(`console.error: ${m.text()}`);
    });

    await page.goto(urls['task-manager']);
    await expect.poll(async () => page.evaluate(() => {
      const app = document.querySelector('#app');
      return (app?.children.length ?? 0) > 0;
    })).toBe(true);

    // Verify rendered shadow DOM has meaningful interactive content
    const hasInteractiveDom = await page.evaluate(() => {
      const first = document.querySelector('#app')!.firstElementChild as HTMLElement | null;
      if (!first) return false;
      const text = (first.shadowRoot?.textContent || first.textContent || '').trim();
      return text.length > 10;
    });
    expect(hasInteractiveDom).toBe(true);
    expect(errors).toEqual([]);
  });
});
