import { test, expect } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
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

test.describe('BS-09 AC-5: Full plugin-built Snice app E2E (Chromium, Firefox, WebKit)', () => {
  let tempDir: string;
  let server: Server;
  let url: string;

  test.beforeAll(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'snice-bs09-e2e-'));
    mkdirSync(join(tempDir, 'node_modules'), { recursive: true });
    symlinkSync(ROOT, join(tempDir, 'node_modules', 'snice'), 'junction');
    for (const pkg of ['tslib', 'pica-route']) {
      const p = join(ROOT, 'node_modules', pkg);
      if (existsSync(p)) symlinkSync(p, join(tempDir, 'node_modules', pkg), 'junction');
    }
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify({ name: 'bs09-e2e', type: 'module' }));
    mkdirSync(join(tempDir, 'src'), { recursive: true });

    writeFileSync(
      join(tempDir, 'index.html'),
      `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>Snice Plugin E2E</title></head>
  <body>
    <demo-counter id="counter"></demo-counter>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`
    );

    writeFileSync(
      join(tempDir, 'src/main.ts'),
      `
        import { element, property, render, styles, dispatch, html, css } from 'snice';
        import 'snice/components/theme/theme.css';
        import 'snice/components/button/snice-button';
        import 'snice/components/card/snice-card';

        @element('demo-counter')
        export class DemoCounter extends HTMLElement {
          @property({ type: Number }) count = 0;

          @dispatch('counter-change', { bubbles: true, composed: true })
          emitChange() {
            return { count: this.count };
          }

          increment() {
            this.count++;
            this.emitChange();
          }

          @styles()
          componentStyles() {
            return css\`
              /* inline style comment */
              :host {
                display: block;
                padding: var(--snice-spacing-md, 1rem);
              }
              .readout {
                color: var(--snice-color-text, rgb(23 23 23));
                background: var(--snice-color-surface, rgb(255 255 255));
                padding: 8px;
              }
            \`;
          }

          @render()
          renderContent() {
            return html\`
              <!-- static template comment -->
              <snice-card>
                <div class="readout">Count: <span class="val">\${this.count}</span></div>
                <snice-button id="inc" variant="primary" @click=\${() => this.increment()}>Increment</snice-button>
              </snice-card>
            \`;
          }
        }
      `
    );

    await viteBuild({
      root: tempDir,
      logLevel: 'silent',
      plugins: [sniceVite()],
    });

    const started = await startStaticServer(join(tempDir, 'dist'));
    server = started.server;
    url = started.url;
  });

  test.afterAll(async () => {
    await new Promise<void>((r) => server?.close(() => r()));
    if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  });

  test('renders dogfooded + plugin-built app, reacts to clicks & events, switches themes cleanly with zero console/page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(url, { waitUntil: 'networkidle' });

    await page.evaluate(async () => {
      await Promise.all([
        customElements.whenDefined('demo-counter'),
        customElements.whenDefined('snice-button'),
        customElements.whenDefined('snice-card'),
      ]);
      const counter = document.querySelector('#counter') as any;
      await counter.ready;
    });

    const initialVal = await page.evaluate(() =>
      document.querySelector('#counter')!.shadowRoot!.querySelector('.val')!.textContent
    );
    expect(initialVal).toBe('0');

    // Click button and verify both reactive property update and @dispatch custom event
    const result = await page.evaluate(async () => {
      const counter = document.querySelector('#counter') as any;
      let dispatchedDetail: any = null;
      counter.addEventListener('counter-change', (e: any) => {
        dispatchedDetail = e.detail;
      });
      const btn = counter.shadowRoot.querySelector('#inc') as HTMLElement;
      btn.click();
      await counter.rendered;
      const val = counter.shadowRoot.querySelector('.val').textContent;
      return { val, dispatchedDetail };
    });
    expect(result.val).toBe('1');
    expect(result.dispatchedDetail).toEqual({ count: 1 });

    // Light vs dark theme computed styles
    const lightBg = await page.evaluate(() =>
      getComputedStyle(document.querySelector('#counter')!.shadowRoot!.querySelector('.readout')!).backgroundColor
    );
    await page.evaluate(async () => {
      document.documentElement.setAttribute('data-theme', 'dark');
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    });
    const darkBg = await page.evaluate(() =>
      getComputedStyle(document.querySelector('#counter')!.shadowRoot!.querySelector('.readout')!).backgroundColor
    );
    expect(darkBg).not.toBe(lightBg);
    expect(errors).toEqual([]);
  });
});
