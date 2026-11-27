import { test, expect } from '@playwright/test';
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer as createViteServer, type ViteDevServer } from 'vite';
import sniceVite from '../../packages/plugin/src/vite';

const ROOT = process.cwd();

test.describe('Real Vite Dev Server HMR Flow (Chromium, Firefox, WebKit)', () => {
  let tempDir: string;
  let viteServer: ViteDevServer;
  let url: string;
  let counterFile: string;

  test.beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'snice-hmr-live-'));
    mkdirSync(join(tempDir, 'node_modules'), { recursive: true });
    symlinkSync(ROOT, join(tempDir, 'node_modules', 'snice'), 'junction');
    for (const pkg of ['tslib', 'pica-route']) {
      const p = join(ROOT, 'node_modules', pkg);
      if (existsSync(p)) symlinkSync(p, join(tempDir, 'node_modules', pkg), 'junction');
    }
    writeFileSync(join(tempDir, 'package.json'), JSON.stringify({ name: 'hmr-live-app', type: 'module' }));
    mkdirSync(join(tempDir, 'src'), { recursive: true });

    writeFileSync(
      join(tempDir, 'index.html'),
      `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>Snice HMR Live</title></head>
  <body>
    <hmr-counter id="counter"></hmr-counter>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`
    );

    counterFile = join(tempDir, 'src/hmr-counter.ts');
    writeFileSync(
      counterFile,
      `import { element, property, render, styles, html, css } from 'snice';

@element('hmr-counter')
export class HmrCounter extends HTMLElement {
  @property({ type: Number }) count = 0;

  increment() {
    this.count++;
  }

  @styles()
  componentStyles() {
    return css\`
      :host { display: block; }
      .panel {
        background-color: rgb(254, 226, 226);
        padding: 12px;
      }
    \`;
  }

  @render()
  renderContent() {
    return html\`
      <div class="panel">
        <span class="ver">v1</span>
        <span class="val">\${this.count}</span>
        <button id="inc" @click=\${() => this.increment()}>+1</button>
      </div>
    \`;
  }
}
`
    );

    writeFileSync(
      join(tempDir, 'src/main.ts'),
      `import './hmr-counter';\n`
    );

    viteServer = await createViteServer({
      root: tempDir,
      logLevel: 'silent',
      optimizeDeps: { noDiscovery: true, include: [] },
      server: {
        host: '127.0.0.1',
        port: 0,
        fs: { allow: [tempDir, ROOT] },
      },
      plugins: [sniceVite()],
    });
    await viteServer.listen();
    const addr = viteServer.httpServer!.address() as { port: number };
    url = `http://127.0.0.1:${addr.port}`;
  });

  test.afterEach(async () => {
    await viteServer?.close();
    if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  });

  test('hot-updates @render template and @styles CSS in live browser while preserving instance state with zero reload or errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
    });

    await page.goto(url);
    await page.evaluate(async () => {
      await customElements.whenDefined('hmr-counter');
      const el = document.querySelector('#counter') as any;
      await el.ready;
      (window as any).__noReloadToken = 'token-preserved-12345';
    });

    // Mutate live instance state via real clicks: 0 -> 7
    const incBtn = page.locator('hmr-counter #inc');
    for (let i = 0; i < 7; i++) {
      await incBtn.click();
    }

    const before = await page.evaluate(() => {
      const el = document.querySelector('#counter') as any;
      const panel = el.shadowRoot.querySelector('.panel') as HTMLElement;
      return {
        ver: el.shadowRoot.querySelector('.ver')?.textContent,
        val: el.shadowRoot.querySelector('.val')?.textContent,
        count: el.count,
        bg: getComputedStyle(panel).backgroundColor,
        token: (window as any).__noReloadToken,
      };
    });
    expect(before).toEqual({
      ver: 'v1',
      val: '7',
      count: 7,
      bg: 'rgb(254, 226, 226)',
      token: 'token-preserved-12345',
    });

    // Edit @render template and @styles CSS on disk to trigger Vite HMR
    writeFileSync(
      counterFile,
      `import { element, property, render, styles, html, css } from 'snice';

@element('hmr-counter')
export class HmrCounter extends HTMLElement {
  @property({ type: Number }) count = 0;

  increment() {
    this.count++;
  }

  @styles()
  componentStyles() {
    return css\`
      :host { display: block; }
      .panel {
        background-color: rgb(220, 252, 231);
        padding: 12px;
      }
    \`;
  }

  @render()
  renderContent() {
    return html\`
      <div class="panel">
        <span class="ver">v2-hot</span>
        <span class="val">\${this.count}</span>
        <button id="inc" @click=\${() => this.increment()}>+1</button>
      </div>
    \`;
  }
}
`
    );

    // Wait for hot update to reflect in the live shadow DOM
    await expect.poll(async () => {
      return page.evaluate(() => {
        const el = document.querySelector('#counter') as any;
        return el?.shadowRoot?.querySelector('.ver')?.textContent ?? null;
      });
    }, { timeout: 15_000 }).toBe('v2-hot');

    const afterV2 = await page.evaluate(() => {
      const el = document.querySelector('#counter') as any;
      const panel = el.shadowRoot.querySelector('.panel') as HTMLElement;
      return {
        ver: el.shadowRoot.querySelector('.ver')?.textContent,
        val: el.shadowRoot.querySelector('.val')?.textContent,
        count: el.count,
        bg: getComputedStyle(panel).backgroundColor,
        token: (window as any).__noReloadToken,
      };
    });

    expect(afterV2).toEqual({
      ver: 'v2-hot',
      val: '7',
      count: 7,
      bg: 'rgb(220, 252, 231)',
      token: 'token-preserved-12345',
    });

    // Verify interactivity still works after HMR (7 -> 8)
    await page.locator('hmr-counter #inc').click();
    await expect.poll(async () => {
      return page.evaluate(() => (document.querySelector('#counter') as any).count);
    }).toBe(8);

    // Verify a second consecutive HMR edit preserves count === 8
    writeFileSync(
      counterFile,
      `import { element, property, render, styles, html, css } from 'snice';

@element('hmr-counter')
export class HmrCounter extends HTMLElement {
  @property({ type: Number }) count = 0;

  increment() {
    this.count++;
  }

  @styles()
  componentStyles() {
    return css\`
      :host { display: block; }
      .panel {
        background-color: rgb(219, 234, 254);
        padding: 12px;
      }
    \`;
  }

  @render()
  renderContent() {
    return html\`
      <div class="panel">
        <span class="ver">v3-hot</span>
        <span class="val">\${this.count}</span>
        <button id="inc" @click=\${() => this.increment()}>+1</button>
      </div>
    \`;
  }
}
`
    );

    await expect.poll(async () => {
      return page.evaluate(() => (document.querySelector('#counter') as any)?.shadowRoot?.querySelector('.ver')?.textContent);
    }, { timeout: 15_000 }).toBe('v3-hot');

    const afterV3 = await page.evaluate(() => {
      const el = document.querySelector('#counter') as any;
      const panel = el.shadowRoot.querySelector('.panel') as HTMLElement;
      return {
        val: el.shadowRoot.querySelector('.val')?.textContent,
        count: el.count,
        bg: getComputedStyle(panel).backgroundColor,
        token: (window as any).__noReloadToken,
      };
    });

    expect(afterV3).toEqual({
      val: '8',
      count: 8,
      bg: 'rgb(219, 234, 254)',
      token: 'token-preserved-12345',
    });
    expect(errors).toEqual([]);
  });
});
