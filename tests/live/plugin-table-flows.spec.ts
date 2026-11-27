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

function makeProject(dir: string, files: Record<string, string>) {
  mkdirSync(join(dir, 'node_modules'), { recursive: true });
  symlinkSync(ROOT, join(dir, 'node_modules', 'snice'), 'junction');
  for (const pkg of ['tslib', 'pica-route']) {
    const p = join(ROOT, 'node_modules', pkg);
    if (existsSync(p)) symlinkSync(p, join(dir, 'node_modules', pkg), 'junction');
  }
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'table-flow-e2e', type: 'module' }));
  for (const [rel, content] of Object.entries(files)) {
    const full = join(dir, rel);
    mkdirSync(resolve(full, '..'), { recursive: true });
    writeFileSync(full, content);
  }
}

function readBundleJs(distDir: string): { code: string; rawBytes: number } {
  const assetsDir = join(distDir, 'assets');
  let code = '';
  let rawBytes = 0;
  for (const f of readdirSync(assetsDir).filter((f) => f.endsWith('.js'))) {
    const buf = readFileSync(join(assetsDir, f));
    rawBytes += buf.length;
    code += buf.toString('utf8') + '\n';
  }
  return { code, rawBytes };
}

test.describe('snice-table Real-User Flows (auto static, auto dynamic bailout, explicit cells/features, table-core standalone)', () => {
  let tempRoot: string;
  let servers: Server[] = [];
  let urlStaticAuto: string;
  let urlDynamicAuto: string;
  let urlExplicit: string;
  let urlCore: string;
  let staticAutoBundle: { code: string; rawBytes: number };
  let fullBaselineBundle: { code: string; rawBytes: number };
  let explicitBundle: { code: string; rawBytes: number };

  test.beforeAll(async () => {
    tempRoot = mkdtempSync(join(tmpdir(), 'snice-table-live-'));

    // 1. Static auto table (text + number + date + sortable + quick-filter)
    const staticFiles = {
      'index.html': `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>Table Auto Static</title></head>
  <body>
    <static-table-app id="app"></static-table-app>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`,
      'src/main.ts': `
        import { element, render, ready, query, html } from 'snice';
        import 'snice/components/theme/core.css';
        import 'snice/components/table/snice-table';

        const COLUMNS = [
          { key: 'name', label: 'Name', type: 'text', sortable: true, filterable: true },
          { key: 'score', label: 'Score', type: 'number', sortable: true },
          { key: 'joined', label: 'Joined', type: 'date', sortable: true },
        ];
        const DATA = [
          { name: 'Charlie', score: 30, joined: '2026-03-10' },
          { name: 'Alice', score: 90, joined: '2026-01-15' },
          { name: 'Bob', score: 60, joined: '2026-02-20' },
        ];

        @element('static-table-app')
        class StaticTableApp extends HTMLElement {
          @query('#tbl') tbl?: any;

          @ready()
          init() {
            if (this.tbl) {
              this.tbl.columns = COLUMNS;
              this.tbl.data = DATA;
            }
          }

          @render()
          template() {
            return html\`<snice-table id="tbl" sortable quick-filter></snice-table>\`;
          }
        }
      `,
    };
    const dirStaticAuto = join(tempRoot, 'static-auto');
    const dirFullBaseline = join(tempRoot, 'full-baseline');
    makeProject(dirStaticAuto, staticFiles);
    makeProject(dirFullBaseline, staticFiles);

    // 2. Dynamic/fetched columns with table: 'auto' -> conservatively bails out to full snice-table
    const dirDynamicAuto = join(tempRoot, 'dynamic-auto');
    makeProject(dirDynamicAuto, {
      'index.html': `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>Table Auto Dynamic</title></head>
  <body>
    <snice-table id="tbl"></snice-table>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`,
      'src/main.ts': `
        import 'snice/components/theme/core.css';
        import 'snice/components/table/snice-table';

        async function fetchColumns() {
          return [
            { key: 'item', label: 'Item', type: 'text' },
            { key: 'amount', label: 'Amount', type: 'currency' },
            { key: 'status', label: 'Status', type: 'tag' },
            { key: 'done', label: 'Progress', type: 'progress' },
          ];
        }

        (async () => {
          await customElements.whenDefined('snice-table');
          const tbl = document.querySelector('#tbl') as any;
          await tbl.ready;
          tbl.columns = await fetchColumns();
          tbl.data = [
            { item: 'Pro Plan', amount: 1499.5, status: 'Active', done: 75 },
          ];
        })();
      `,
    });

    // 3. Explicit table: { cells: ['text', 'currency'], features: ['export'] }
    const dirExplicit = join(tempRoot, 'explicit');
    makeProject(dirExplicit, {
      'index.html': `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>Table Explicit</title></head>
  <body>
    <snice-table id="tbl"></snice-table>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`,
      'src/main.ts': `
        import 'snice/components/theme/core.css';
        import 'snice/components/table/snice-table';

        (async () => {
          await customElements.whenDefined('snice-table');
          const tbl = document.querySelector('#tbl') as any;
          await tbl.ready;
          tbl.columns = [
            { key: 'sku', label: 'SKU', type: 'text' },
            { key: 'price', label: 'Price', type: 'currency' },
          ];
          tbl.data = [
            { sku: 'WIDGET-1', price: 1250 },
          ];
        })();
      `,
    });

    // 4. Standalone snice-table-core
    const dirCore = join(tempRoot, 'core');
    makeProject(dirCore, {
      'index.html': `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>Table Core Standalone</title></head>
  <body>
    <snice-table id="tbl" selectable></snice-table>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`,
      'src/main.ts': `
        import 'snice/components/theme/core.css';
        import 'snice/components/table/snice-table-core';

        (async () => {
          await customElements.whenDefined('snice-table');
          const tbl = document.querySelector('#tbl') as any;
          await tbl.ready;
          tbl.columns = [
            { key: 'id', label: 'ID', type: 'text' },
            { key: 'title', label: 'Title', type: 'text' },
          ];
          tbl.data = [
            { id: 'T-1', title: 'First row' },
            { id: 'T-2', title: 'Second row' },
          ];
        })();
      `,
    });

    await Promise.all([
      viteBuild({ root: dirStaticAuto, logLevel: 'silent', plugins: [sniceVite({ caching: false, table: 'auto' })] }),
      viteBuild({ root: dirFullBaseline, logLevel: 'silent', plugins: [sniceVite({ caching: false, table: false })] }),
      viteBuild({ root: dirDynamicAuto, logLevel: 'silent', plugins: [sniceVite({ caching: false, table: 'auto' })] }),
      viteBuild({
        root: dirExplicit,
        logLevel: 'silent',
        plugins: [sniceVite({ caching: false, table: { cells: ['text', 'currency'], features: ['export'] } })],
      }),
      viteBuild({ root: dirCore, logLevel: 'silent', plugins: [sniceVite({ caching: false })] }),
    ]);

    staticAutoBundle = readBundleJs(join(dirStaticAuto, 'dist'));
    fullBaselineBundle = readBundleJs(join(dirFullBaseline, 'dist'));
    explicitBundle = readBundleJs(join(dirExplicit, 'dist'));

    const [s1, s2, s3, s4] = await Promise.all([
      startStaticServer(join(dirStaticAuto, 'dist')),
      startStaticServer(join(dirDynamicAuto, 'dist')),
      startStaticServer(join(dirExplicit, 'dist')),
      startStaticServer(join(dirCore, 'dist')),
    ]);
    servers = [s1.server, s2.server, s3.server, s4.server];
    urlStaticAuto = s1.url;
    urlDynamicAuto = s2.url;
    urlExplicit = s3.url;
    urlCore = s4.url;
  });

  test.afterAll(async () => {
    await Promise.all(servers.map((s) => new Promise<void>((r) => s.close(() => r()))));
    if (tempRoot) rmSync(tempRoot, { recursive: true, force: true });
  });

  test('table: "auto" static table builds smaller AND sorts & filters interactively in real browser', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    // Smaller than full snice-table baseline and omits unused sparkline/rating cell registrations
    expect(staticAutoBundle.rawBytes).toBeLessThan(fullBaselineBundle.rawBytes);
    expect(staticAutoBundle.code).not.toContain('element("snice-cell-sparkline")');
    expect(staticAutoBundle.code).not.toContain("element('snice-cell-sparkline')");
    expect(staticAutoBundle.code).not.toContain('element("snice-cell-rating")');
    expect(staticAutoBundle.code).not.toContain("element('snice-cell-rating')");

    await page.goto(urlStaticAuto);
    await expect.poll(async () => {
      return page.evaluate(() => {
        const app = document.querySelector('#app') as any;
        const tbl = app?.shadowRoot?.querySelector('#tbl') as any;
        return tbl?.shadowRoot?.querySelectorAll('tbody tr[part="row"]').length ?? 0;
      });
    }).toBe(3);

    const readNames = () =>
      page.evaluate(() => {
        const tbl = (document.querySelector('#app') as any).shadowRoot.querySelector('#tbl');
        const rows = Array.from(tbl.shadowRoot.querySelectorAll('tbody tr[part="row"]')) as HTMLElement[];
        return rows.map((r) => {
          const td = r.querySelector('td');
          const cell = td?.firstElementChild as HTMLElement | null;
          return (cell?.shadowRoot?.textContent || cell?.textContent || td?.textContent || '').trim();
        });
      });

    expect(await readNames()).toEqual(['Charlie', 'Alice', 'Bob']);

    // Interactive sort by clicking Name column header
    await page.evaluate(async () => {
      const tbl = (document.querySelector('#app') as any).shadowRoot.querySelector('#tbl');
      const nameHeader = tbl.shadowRoot.querySelector('thead th[data-key="name"]') as HTMLElement
        ?? tbl.shadowRoot.querySelector('thead th') as HTMLElement;
      nameHeader.click();
    });
    await expect.poll(readNames).toEqual(['Alice', 'Bob', 'Charlie']);

    // Interactive filter via quick filter
    await page.evaluate(async () => {
      const tbl = (document.querySelector('#app') as any).shadowRoot.querySelector('#tbl') as any;
      tbl.setQuickFilter('Bob');
    });
    await expect.poll(readNames).toEqual(['Bob']);
    expect(errors).toEqual([]);
  });

  test('table: "auto" dynamic/fetched columns conservatively bails out so currency, tag, and progress cells all render', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto(urlDynamicAuto);
    await expect.poll(async () => {
      return page.evaluate(() => {
        const tbl = document.querySelector('#tbl') as any;
        const row = tbl?.shadowRoot?.querySelector('tbody tr[part="row"]');
        if (!row) return null;
        return {
          currency: !!row.querySelector('snice-cell-currency'),
          tag: !!row.querySelector('snice-cell-tag'),
          progress: !!row.querySelector('snice-cell-progress'),
          currencyText: row.querySelector('snice-cell-currency')?.shadowRoot?.textContent?.trim() ?? row.querySelector('snice-cell-currency')?.textContent?.trim() ?? '',
        };
      });
    }).toMatchObject({
      currency: true,
      tag: true,
      progress: true,
    });

    const currencyText = await page.evaluate(() => {
      const tbl = document.querySelector('#tbl') as any;
      const cell = tbl.shadowRoot.querySelector('snice-cell-currency');
      return (cell.shadowRoot?.textContent || cell.textContent || '').trim();
    });
    expect(currencyText).toContain('$1,499.50');
    expect(errors).toEqual([]);
  });

  test('explicit table: { cells: ["text", "currency"], features: ["export"] } renders formatted currency and strips unused features', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    expect(explicitBundle.code).toContain('text/csv;charset=utf-8');
    expect(explicitBundle.code).not.toContain('group-toggle-chevron');
    expect(explicitBundle.code).not.toContain('tree-toggle-btn');
    expect(explicitBundle.code).not.toContain('element("snice-cell-sparkline")');
    expect(explicitBundle.code).not.toContain("element('snice-cell-sparkline')");

    await page.goto(urlExplicit);
    await expect.poll(async () => {
      return page.evaluate(() => {
        const tbl = document.querySelector('#tbl') as any;
        const cell = tbl?.shadowRoot?.querySelector('snice-cell-currency');
        return (cell?.shadowRoot?.textContent || cell?.textContent || '').trim();
      });
    }).toContain('$1,250.00');
    expect(errors).toEqual([]);
  });

  test('snice-table-core standalone renders and selects rows cleanly with native HTML fallbacks', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto(urlCore);
    await expect.poll(async () => {
      return page.evaluate(() => {
        const tbl = document.querySelector('#tbl') as any;
        return tbl?.shadowRoot?.querySelectorAll('tbody tr[part="row"]').length ?? 0;
      });
    }).toBe(2);

    // Click first row checkbox and assert selection state updates
    const selected = await page.evaluate(async () => {
      const tbl = document.querySelector('#tbl') as any;
      const checkbox = tbl.shadowRoot.querySelector('tbody input[type="checkbox"]') as HTMLInputElement;
      checkbox.click();
      await new Promise((r) => setTimeout(r, 50));
      return {
        selectedRows: tbl.selectedRows,
        selectedData: tbl.getSelectedData(),
      };
    });
    expect(selected.selectedRows).toEqual([0]);
    expect(selected.selectedData).toEqual([{ id: 'T-1', title: 'First row' }]);
    expect(errors).toEqual([]);
  });
});
