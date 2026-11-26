import { test, expect } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { build as viteBuild } from 'vite';
import sniceVite from '../../packages/plugin/src/vite';

const ROOT = process.cwd();

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
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

function createParityApp(dir: string) {
  mkdirSync(join(dir, 'node_modules'), { recursive: true });
  symlinkSync(ROOT, join(dir, 'node_modules', 'snice'), 'junction');
  for (const pkg of ['tslib', 'pica-route']) {
    const p = join(ROOT, 'node_modules', pkg);
    if (existsSync(p)) symlinkSync(p, join(dir, 'node_modules', pkg), 'junction');
  }
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'css-parity', type: 'module' }));
  mkdirSync(join(dir, 'src'), { recursive: true });
  writeFileSync(
    join(dir, 'index.html'),
    `<!doctype html>
<html data-motion="off">
  <head><meta charset="utf-8"><title>CSS Parity</title></head>
  <body>
    <snice-button id="btn-primary" variant="primary">Primary</snice-button>
    <snice-button id="btn-default">Default</snice-button>
    <snice-card id="card" variant="elevated" accent="success">
      <div slot="header">Card Header</div>
      <p>Card body</p>
    </snice-card>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`
  );
  writeFileSync(
    join(dir, 'src/main.ts'),
    `
      import 'snice/components/button/snice-button';
      import 'snice/components/card/snice-card';
      import 'snice/components/theme/theme.css';
    `
  );
}

test.describe('BS-08 AC-8: Computed style parity (fallback-stripped + theme-pruned vs unstripped)', () => {
  let tempRoot: string;
  let serverBaseline: Server;
  let serverOptimized: Server;
  let urlBaseline: string;
  let urlOptimized: string;

  test.beforeAll(async () => {
    tempRoot = mkdtempSync(join(tmpdir(), 'snice-bs08-pw-'));
    const dirBaseline = join(tempRoot, 'baseline');
    const dirOptimized = join(tempRoot, 'optimized');
    mkdirSync(dirBaseline, { recursive: true });
    mkdirSync(dirOptimized, { recursive: true });
    createParityApp(dirBaseline);
    createParityApp(dirOptimized);

    await Promise.all([
      viteBuild({
        root: dirBaseline,
        logLevel: 'silent',
        plugins: [sniceVite({ stripCssFallbacks: false, pruneTheme: false })],
      }),
      viteBuild({
        root: dirOptimized,
        logLevel: 'silent',
        plugins: [sniceVite({ stripCssFallbacks: 'auto', pruneTheme: true })],
      }),
    ]);

    const s1 = await startStaticServer(join(dirBaseline, 'dist'));
    const s2 = await startStaticServer(join(dirOptimized, 'dist'));
    serverBaseline = s1.server;
    urlBaseline = s1.url;
    serverOptimized = s2.server;
    urlOptimized = s2.url;
  });

  test.afterAll(async () => {
    await Promise.all([
      new Promise<void>((r) => serverBaseline?.close(() => r())),
      new Promise<void>((r) => serverOptimized?.close(() => r())),
    ]);
    if (tempRoot) rmSync(tempRoot, { recursive: true, force: true });
  });

  async function captureStyles(page: any, url: string) {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      await Promise.all([
        customElements.whenDefined('snice-button'),
        customElements.whenDefined('snice-card'),
      ]);
      const els = Array.from(document.querySelectorAll('snice-button, snice-card')) as any[];
      await Promise.all(els.map((e) => e.ready));
    });

    const readSnapshot = async () =>
      page.evaluate(() => {
        const readProps = (el: Element | null) => {
          if (!el) return null;
          const cs = getComputedStyle(el);
          return {
            color: cs.color,
            backgroundColor: cs.backgroundColor,
            fontFamily: cs.fontFamily,
            borderRadius: cs.borderRadius,
            boxShadow: cs.boxShadow,
            borderTopColor: cs.borderTopColor,
          };
        };
        const btnP = document.querySelector('#btn-primary')?.shadowRoot?.querySelector('.button') ?? null;
        const btnD = document.querySelector('#btn-default')?.shadowRoot?.querySelector('.button') ?? null;
        const card = document.querySelector('#card')?.shadowRoot?.querySelector('.card') ?? null;
        return {
          btnPrimary: readProps(btnP),
          btnDefault: readProps(btnD),
          card: readProps(card),
        };
      });

    const light = await readSnapshot();

    // Switch to dark mode via [data-theme="dark"] and let layout/styles settle
    await page.evaluate(async () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    });
    const dark = await readSnapshot();
    return { light, dark };
  }

  test('computed styles match identically in light and [data-theme="dark"] modes', async ({ page }) => {
    const baseline = await captureStyles(page, urlBaseline);
    const optimized = await captureStyles(page, urlOptimized);

    expect(baseline.light.btnPrimary).not.toBeNull();
    expect(optimized.light).toEqual(baseline.light);
    expect(optimized.dark).toEqual(baseline.dark);
    // Sanity check that dark mode actually changed colors vs light mode
    expect(optimized.dark.btnDefault?.backgroundColor).not.toBe(optimized.light.btnDefault?.backgroundColor);
  });
});
