import { test, expect } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
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

function makeProject(rootDir: string, files: Record<string, string>) {
  mkdirSync(join(rootDir, 'node_modules'), { recursive: true });
  symlinkSync(ROOT, join(rootDir, 'node_modules', 'snice'), 'junction');
  for (const pkg of ['tslib', 'pica-route']) {
    const p = join(ROOT, 'node_modules', pkg);
    if (existsSync(p)) symlinkSync(p, join(rootDir, 'node_modules', pkg), 'junction');
  }
  writeFileSync(join(rootDir, 'package.json'), JSON.stringify({ name: 'theme-e2e', type: 'module' }));
  for (const [rel, content] of Object.entries(files)) {
    const full = join(rootDir, rel);
    mkdirSync(resolve(full, '..'), { recursive: true });
    writeFileSync(full, content);
  }
}

function readAllCss(distDir: string): string {
  const assetsDir = join(distDir, 'assets');
  return readdirSync(assetsDir)
    .filter((f) => f.endsWith('.css'))
    .map((f) => readFileSync(join(assetsDir, f), 'utf8'))
    .join('\n');
}

function parseRgb(colorStr: string): [number, number, number] {
  const srgb = colorStr.match(/color\(\s*srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/i);
  if (srgb) {
    return [Number(srgb[1]) * 255, Number(srgb[2]) * 255, Number(srgb[3]) * 255];
  }
  const m = colorStr.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
  if (!m) throw new Error(`Could not parse RGB from: ${colorStr}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

test.describe('Custom Themes & Modular theme/*.css Slices in Real Browsers (Chromium, Firefox, WebKit)', () => {
  let tempRoot: string;
  let servers: Server[] = [];
  let urlSeed: string;
  let urlNamed: string;
  let urlPruned: string;
  let prunedCssText: string;

  test.beforeAll(async () => {
    tempRoot = mkdtempSync(join(tmpdir(), 'snice-theme-live-'));

    // App A: core.css + purple primary seed (NO effects.css, NO dark.css)
    const dirSeed = join(tempRoot, 'seed');
    makeProject(dirSeed, {
      'index.html': `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>Core Slice Seed</title></head>
  <body>
    <snice-button id="btn" variant="primary">Purple Primary</snice-button>
    <snice-card id="card" variant="elevated">Elevated Card</snice-card>
    <div id="swatch-primary"></div>
    <div id="swatch-hover"></div>
    <div id="swatch-subtle"></div>
    <div id="swatch-border-focus"></div>
    <div id="swatch-focus-ring"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`,
      'src/brand.css': `
        :root {
          --snice-color-primary: #7c3aed;
        }
        #swatch-primary { background-color: var(--snice-color-primary); }
        #swatch-hover { background-color: var(--snice-color-primary-hover); }
        #swatch-subtle { background-color: var(--snice-color-primary-subtle); }
        #swatch-border-focus { border: 2px solid var(--snice-color-border-focus); }
        #swatch-focus-ring { outline: 2px solid var(--snice-focus-ring-color); }
      `,
      'src/main.ts': `
        import 'snice/components/theme/core.css';
        import './brand.css';
        import 'snice/components/button/snice-button';
        import 'snice/components/card/snice-card';
      `,
    });

    // App B: named [data-theme="ocean"] and [data-theme="terminal"] with theme.prune: true, dark: false
    const dirNamed = join(tempRoot, 'named');
    makeProject(dirNamed, {
      'index.html': `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>Named Themes</title></head>
  <body>
    <snice-button id="btn" variant="primary">Action</snice-button>
    <snice-card id="card">Themed Card</snice-card>
    <div id="probe">Probe</div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`,
      'src/themes.css': `
        [data-theme="ocean"] {
          --snice-color-primary: rgb(14, 116, 144);
          --snice-color-surface: rgb(240, 249, 255);
          --snice-color-text: rgb(12, 74, 110);
          --snice-font-family: Georgia, serif;
        }
        [data-theme="terminal"] {
          --snice-color-primary: rgb(34, 197, 94);
          --snice-color-surface: rgb(10, 14, 10);
          --snice-color-text: rgb(134, 239, 172);
          --snice-font-family: "Courier New", monospace;
        }
        #probe {
          background-color: var(--snice-color-surface);
          color: var(--snice-color-text);
          font-family: var(--snice-font-family);
        }
      `,
      'src/main.ts': `
        import 'snice/components/theme/core.css';
        import './themes.css';
        import 'snice/components/button/snice-button';
        import 'snice/components/card/snice-card';
      `,
    });

    // App C: full theme.css with { prune: true, dark: 'manual', density: false, print: false }
    const dirPruned = join(tempRoot, 'pruned');
    makeProject(dirPruned, {
      'index.html': `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>Pruned Theme</title></head>
  <body>
    <snice-card id="card">Manual Dark Card</snice-card>
    <div id="surface-probe">Surface</div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`,
      'src/app.css': `
        #surface-probe {
          background-color: var(--snice-color-surface);
          color: var(--snice-color-text);
        }
      `,
      'src/main.ts': `
        import 'snice/components/theme/theme.css';
        import './app.css';
        import 'snice/components/card/snice-card';
      `,
    });

    await Promise.all([
      viteBuild({ root: dirSeed, logLevel: 'silent', plugins: [sniceVite()] }),
      viteBuild({ root: dirNamed, logLevel: 'silent', plugins: [sniceVite({ theme: { prune: true, dark: false } })] }),
      viteBuild({
        root: dirPruned,
        logLevel: 'silent',
        plugins: [sniceVite({ theme: { prune: true, dark: 'manual', density: false, print: false } })],
      }),
    ]);

    prunedCssText = readAllCss(join(dirPruned, 'dist'));

    const [sA, sB, sC] = await Promise.all([
      startStaticServer(join(dirSeed, 'dist')),
      startStaticServer(join(dirNamed, 'dist')),
      startStaticServer(join(dirPruned, 'dist')),
    ]);
    servers = [sA.server, sB.server, sC.server];
    urlSeed = sA.url;
    urlNamed = sB.url;
    urlPruned = sC.url;
  });

  test.afterAll(async () => {
    await Promise.all(servers.map((s) => new Promise<void>((r) => s.close(() => r()))));
    if (tempRoot) rmSync(tempRoot, { recursive: true, force: true });
  });

  test('core.css + purple primary seed derives hover/subtle/border-focus/focus-ring AND keeps omitted effects.css shadow fallbacks', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto(urlSeed);
    await page.evaluate(async () => {
      await Promise.all([
        customElements.whenDefined('snice-button'),
        customElements.whenDefined('snice-card'),
      ]);
      await Promise.all(Array.from(document.querySelectorAll('snice-button, snice-card')).map((el: any) => el.ready));
    });

    const snap = await page.evaluate(() => {
      const btnInner = document.querySelector('#btn')!.shadowRoot!.querySelector('.button')!;
      const cardInner = document.querySelector('#card')!.shadowRoot!.querySelector('.card')!;
      return {
        btnBg: getComputedStyle(btnInner).backgroundColor,
        cardShadow: getComputedStyle(cardInner).boxShadow,
        primary: getComputedStyle(document.querySelector('#swatch-primary')!).backgroundColor,
        hover: getComputedStyle(document.querySelector('#swatch-hover')!).backgroundColor,
        subtle: getComputedStyle(document.querySelector('#swatch-subtle')!).backgroundColor,
        borderFocus: getComputedStyle(document.querySelector('#swatch-border-focus')!).borderTopColor,
        focusRing: getComputedStyle(document.querySelector('#swatch-focus-ring')!).outlineColor,
      };
    });

    // #7c3aed === rgb(124, 58, 237)
    expect(snap.primary).toBe('rgb(124, 58, 237)');
    expect(snap.btnBg).toBe('rgb(124, 58, 237)');

    // Derived hover is darkened purple (not default blue rgb(29, 78, 216), and R > G, B > R)
    const [hr, hg, hb] = parseRgb(snap.hover);
    expect(hr).toBeGreaterThan(80);
    expect(hr).toBeLessThan(124);
    expect(hr).toBeGreaterThan(hg);
    expect(hb).toBeGreaterThan(hr);

    // Derived subtle is light lavender tint (R > G, B > R, all high)
    const [sr, sg, sb] = parseRgb(snap.subtle);
    expect(sr).toBeGreaterThan(230);
    expect(sb).toBeGreaterThan(sg);
    expect(sr).toBeGreaterThan(sg);

    // Derived border-focus is lightened purple (R > G, B > R, not blue)
    const [br, bg, bb] = parseRgb(snap.borderFocus);
    expect(br).toBeGreaterThan(120);
    expect(br).toBeGreaterThan(bg);
    expect(bb).toBeGreaterThan(br);

    // Derived focus-ring is semi-transparent purple (R > G, B > R)
    const [fr, fg, fb] = parseRgb(snap.focusRing);
    expect(fr).toBeGreaterThan(100);
    expect(fr).toBeGreaterThan(fg);
    expect(fb).toBeGreaterThan(fr);

    // Omitted effects.css shadow fallback on elevated snice-card still renders!
    expect(snap.cardShadow).not.toBe('none');
    expect(snap.cardShadow).toContain('px');
    expect(errors).toEqual([]);
  });

  test('named [data-theme="ocean"] and [data-theme="terminal"] survive pruning and switch computed colors/surfaces/fonts at runtime', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto(urlNamed);
    await page.evaluate(async () => {
      await Promise.all([customElements.whenDefined('snice-button'), customElements.whenDefined('snice-card')]);
      await Promise.all(Array.from(document.querySelectorAll('snice-button, snice-card')).map((el: any) => el.ready));
    });

    const readThemeState = () =>
      page.evaluate(() => {
        const btn = document.querySelector('#btn')!.shadowRoot!.querySelector('.button')!;
        const probe = document.querySelector('#probe')!;
        return {
          btnBg: getComputedStyle(btn).backgroundColor,
          surface: getComputedStyle(probe).backgroundColor,
          text: getComputedStyle(probe).color,
          font: getComputedStyle(probe).fontFamily.toLowerCase(),
        };
      });

    const initial = await readThemeState();

    // Switch to ocean (poll past button's CSS color transition)
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'ocean';
    });
    await expect.poll(readThemeState).toMatchObject({
      btnBg: 'rgb(14, 116, 144)',
      surface: 'rgb(240, 249, 255)',
      text: 'rgb(12, 74, 110)',
    });
    const ocean = await readThemeState();
    expect(ocean.font).toContain('georgia');
    expect(ocean.btnBg).not.toBe(initial.btnBg);

    // Switch to terminal
    await page.evaluate(() => {
      document.documentElement.dataset.theme = 'terminal';
    });
    await expect.poll(readThemeState).toMatchObject({
      btnBg: 'rgb(34, 197, 94)',
      surface: 'rgb(10, 14, 10)',
      text: 'rgb(134, 239, 172)',
    });
    const terminal = await readThemeState();
    expect(terminal.font).toContain('courier');
    expect(errors).toEqual([]);
  });

  test('pruned theme.css (dark: manual, density: false, print: false) strips unwanted blocks while applying [data-theme="dark"] at runtime', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    // Verify stripped blocks are absent from emitted CSS
    expect(prunedCssText).not.toContain('data-density');
    expect(prunedCssText).not.toContain('@media print');
    expect(prunedCssText).not.toContain('prefers-color-scheme:dark');
    expect(prunedCssText).not.toContain('prefers-color-scheme: dark');
    expect(prunedCssText).toContain('data-theme=dark');

    await page.goto(urlPruned);
    await page.evaluate(async () => {
      await customElements.whenDefined('snice-card');
      await (document.querySelector('#card') as any).ready;
    });

    const readSurface = () =>
      page.evaluate(() => {
        const probe = document.querySelector('#surface-probe')!;
        return {
          bg: getComputedStyle(probe).backgroundColor,
          color: getComputedStyle(probe).color,
        };
      });

    const light = await readSurface();
    expect(light.bg).toBe('rgb(255, 255, 255)');

    await page.evaluate(async () => {
      document.documentElement.dataset.theme = 'dark';
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    });

    const dark = await readSurface();
    expect(dark.bg).not.toBe(light.bg);
    expect(dark.color).not.toBe(light.color);
    const [r, g, b] = parseRgb(dark.bg);
    expect(r).toBeLessThan(60);
    expect(g).toBeLessThan(60);
    expect(b).toBeLessThan(60);
    expect(errors).toEqual([]);
  });
});
