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

test.describe('Autofocus in Router pages & nested custom elements (Chromium, Firefox, WebKit)', () => {
  let tempDir: string;
  let server: Server;
  let url: string;

  test.beforeAll(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'snice-autofocus-pages-'));
    mkdirSync(join(tempDir, 'node_modules'), { recursive: true });
    symlinkSync(ROOT, join(tempDir, 'node_modules', 'snice'), 'junction');
    for (const pkg of ['tslib', 'pica-route']) {
      const p = join(ROOT, 'node_modules', pkg);
      if (existsSync(p)) symlinkSync(p, join(tempDir, 'node_modules', pkg), 'junction');
    }
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify({ name: 'af-pages-e2e', type: 'module' }));
    mkdirSync(join(tempDir, 'src'), { recursive: true });

    writeFileSync(
      join(tempDir, 'index.html'),
      `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>Autofocus Pages E2E</title></head>
  <body>
    <button id="outside-nav-btn" type="button">Outside Nav</button>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`
    );

    writeFileSync(
      join(tempDir, 'src/main.ts'),
      `
        import { Router, element, layout, render, ready, query, html } from 'snice';
        import { fadeTransition } from 'snice/transitions';
        import 'snice/components/input/snice-input';
        import 'snice/components/textarea/snice-textarea';

        const quickFade = { ...fadeTransition, outDuration: 80, inDuration: 80 };

        const router = Router({
          target: '#app',
          type: 'hash',
          layout: 'app-shell'
        });

        @layout('app-shell')
        class AppShell extends HTMLElement {
          @render()
          template() {
            return html\`
              <nav>
                <a id="link-native" href="#/native">Native Page</a>
                <button id="btn-snice" type="button" @click=\${() => router.navigate('/snice')}>Snice Page</button>
                <button id="btn-transition" type="button" @click=\${() => router.navigate('/transition')}>Transition Page</button>
                <button id="btn-explicit" type="button" @click=\${() => router.navigate('/explicit')}>Explicit Page</button>
              </nav>
              <main><slot name="page"></slot></main>
            \`;
          }
        }

        @router.page({ tag: 'native-af-page', routes: ['/', '/native'] })
        class NativeAfPage extends HTMLElement {
          @render()
          template() {
            return html\`
              <h1>Native</h1>
              <input id="native-af-input" data-test="native-input" autofocus placeholder="Native autofocus" />
            \`;
          }
        }

        @router.page({ tag: 'snice-af-page', routes: ['/snice'] })
        class SniceAfPage extends HTMLElement {
          @render()
          template() {
            return html\`
              <h1>Snice Input</h1>
              <snice-input id="snice-af-input" autofocus label="Search"></snice-input>
            \`;
          }
        }

        @router.page({ tag: 'transition-af-page', routes: ['/transition'], transition: quickFade })
        class TransitionAfPage extends HTMLElement {
          @render()
          template() {
            return html\`
              <h1>Transition</h1>
              <snice-input id="transition-snice-input" autofocus label="Transitioned"></snice-input>
            \`;
          }
        }

        @router.page({ tag: 'explicit-focus-page', routes: ['/explicit'] })
        class ExplicitFocusPage extends HTMLElement {
          @query('#explicit-input')
          explicitInput?: HTMLInputElement;

          @ready()
          async setExplicitFocus() {
            await Promise.resolve();
            this.explicitInput?.focus();
          }

          @render()
          template() {
            return html\`
              <h1>Explicit</h1>
              <snice-input id="ignored-auto" autofocus label="Auto"></snice-input>
              <input id="explicit-input" data-test="explicit-input" placeholder="Explicitly focused" />
            \`;
          }
        }

        document.getElementById('outside-nav-btn')!.addEventListener('click', () => {
          router.navigate('/snice');
        });

        router.initialize();
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

  async function readDeepActive(page: any) {
    return page.evaluate(() => {
      const chain: string[] = [];
      let el: Element | null = document.activeElement;
      while (el) {
        chain.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}`);
        if (el.shadowRoot && el.shadowRoot.activeElement && el.shadowRoot.activeElement !== el) {
          el = el.shadowRoot.activeElement;
        } else {
          break;
        }
      }
      return {
        chain,
        leafTag: el?.tagName.toLowerCase() ?? null,
        leafId: el?.id ?? null,
        leafDataTest: el?.getAttribute('data-test') ?? null,
      };
    });
  }

  test('persistent layout nav clicks focus native and <snice-input autofocus>, transitions, explicit @ready, and back-and-forth visits', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(url);
    await expect.poll(async () => (await readDeepActive(page)).leafId).toBe('native-af-input');

    // 1. Click button inside persistent layout -> page with <snice-input autofocus> gets inner <input> active
    await page.locator('app-shell #btn-snice').click();
    await expect(page.locator('snice-af-page')).toBeVisible();
    await expect.poll(async () => {
      const info = await readDeepActive(page);
      return info.chain.includes('snice-input#snice-af-input') && info.leafTag === 'input';
    }).toBe(true);

    // 2. Click link inside persistent layout -> page with native <input autofocus> gets focused
    await page.locator('app-shell #link-native').click();
    await expect(page.locator('native-af-page')).toBeVisible();
    await expect.poll(async () => (await readDeepActive(page)).leafId).toBe('native-af-input');

    // 3. Click button outside #app -> navigates to <snice-input autofocus> and focuses inner <input>
    await page.locator('#outside-nav-btn').click();
    await expect(page.locator('snice-af-page')).toBeVisible();
    await expect.poll(async () => {
      const info = await readDeepActive(page);
      return info.chain.includes('snice-input#snice-af-input') && info.leafTag === 'input';
    }).toBe(true);

    // 4. Route transition -> incoming page [autofocus] gets focused even while outgoing page transitions out
    await page.locator('app-shell #btn-transition').click();
    await expect(page.locator('transition-af-page')).toBeVisible();
    await expect.poll(async () => {
      const info = await readDeepActive(page);
      return info.chain.includes('snice-input#transition-snice-input') && info.leafTag === 'input';
    }).toBe(true);

    // 5. Incoming page explicitly calling .focus() in @ready() keeps explicit focus
    await page.locator('app-shell #btn-explicit').click();
    await expect(page.locator('explicit-focus-page')).toBeVisible();
    await expect.poll(async () => (await readDeepActive(page)).leafId).toBe('explicit-input');
    // Confirm autofocus did not steal it on a subsequent animation frame
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    expect((await readDeepActive(page)).leafId).toBe('explicit-input');

    // 6. Navigate back and forth between native and snice pages -> focuses properly on every visit
    await page.locator('app-shell #link-native').click();
    await expect.poll(async () => (await readDeepActive(page)).leafId).toBe('native-af-input');

    await page.locator('app-shell #btn-snice').click();
    await expect.poll(async () => {
      const info = await readDeepActive(page);
      return info.chain.includes('snice-input#snice-af-input') && info.leafTag === 'input';
    }).toBe(true);

    expect(errors).toEqual([]);
  });
});
