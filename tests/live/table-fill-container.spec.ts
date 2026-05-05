import { test, expect } from '@playwright/test';

const HTML = `<!DOCTYPE html>
<html><head>
  <link rel="stylesheet" href="/components/theme/theme.css" />
  <style>
    body { margin: 0; padding: 1rem; font-family: sans-serif; }
    .box { border: 2px dashed #888; margin-bottom: 1rem; box-sizing: border-box; }
    #fixed-box   { width: 800px; height: 600px; }
    #wide-short  { width: 900px; height: 250px; }
    #flex-row    { display: flex; height: 500px; }
    #flex-row > snice-table { flex: 1; }
    #grid-cell   { display: grid; grid-template-rows: 1fr; height: 480px; }
  </style>
</head><body>
  <div class="box" id="fixed-box"><snice-table id="t-fixed" pagination></snice-table></div>
  <div class="box" id="wide-short"><snice-table id="t-wide"></snice-table></div>
  <div class="box" id="flex-row"><snice-table id="t-flex"></snice-table></div>
  <div class="box" id="grid-cell"><snice-table id="t-grid"></snice-table></div>
  <script type="module">
    import '/components/table/snice-column.ts';
    import '/components/table/snice-row.ts';
    import '/components/table/snice-header.ts';
    import '/components/table/snice-table.ts';

    const cols = [
      { field: 'id', header: 'ID' },
      { field: 'name', header: 'Name' },
      { field: 'role', header: 'Role' },
    ];
    const rows = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      name: 'User ' + (i + 1),
      role: ['admin','editor','viewer'][i % 3],
    }));

    await customElements.whenDefined('snice-table');
    for (const id of ['t-fixed','t-wide','t-flex','t-grid']) {
      const t = document.getElementById(id);
      if (typeof t.setColumns === 'function') t.setColumns(cols); else t.columns = cols;
      if (typeof t.setData === 'function') t.setData(rows); else t.data = rows;
    }
  </script>
</body></html>`;

async function getRect(page, sel: string) {
  return page.evaluate((s) => {
    const el = document.querySelector(s)!;
    const r = el.getBoundingClientRect();
    return { width: r.width, height: r.height };
  }, sel);
}

async function getInnerRect(page, hostSel: string, innerSel: string) {
  return page.evaluate(({ host, inner }) => {
    const el = document.querySelector(host)!;
    const i = el.shadowRoot!.querySelector(inner)!;
    const r = i.getBoundingClientRect();
    return { width: r.width, height: r.height };
  }, { host: hostSel, inner: innerSel });
}

test.describe('snice-table fills its container', () => {
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message));
    // Serve via vite's transform pipeline so module imports resolve.
    await page.goto('http://localhost:5566/');
    await page.setContent(HTML);
    await page.waitForFunction(() => customElements.get('snice-table') !== undefined, { timeout: 10000 });
    await page.waitForTimeout(200);
  });

  test('fixed 800x600 parent — host AND inner container fill the box', async ({ page }) => {
    const host = await getRect(page, '#t-fixed');
    const inner = await getInnerRect(page, '#t-fixed', '.snice-table');
    expect(host.width).toBeGreaterThanOrEqual(795);
    expect(host.height).toBeGreaterThanOrEqual(595);
    expect(inner.width).toBeGreaterThanOrEqual(795);
    expect(inner.height).toBeGreaterThanOrEqual(host.height - 5);
  });

  test('wide-short 900x250 — inner container does not collapse below host', async ({ page }) => {
    const host = await getRect(page, '#t-wide');
    const inner = await getInnerRect(page, '#t-wide', '.snice-table');
    expect(inner.height).toBeGreaterThanOrEqual(host.height - 5);
    expect(inner.width).toBeGreaterThanOrEqual(host.width - 5);
  });

  test('flex row parent — table grows to fill flex track', async ({ page }) => {
    const host = await getRect(page, '#t-flex');
    const inner = await getInnerRect(page, '#t-flex', '.snice-table');
    expect(host.height).toBeGreaterThanOrEqual(495);
    expect(inner.height).toBeGreaterThanOrEqual(host.height - 5);
  });

  test('grid cell parent — table fills grid row height', async ({ page }) => {
    const host = await getRect(page, '#t-grid');
    const inner = await getInnerRect(page, '#t-grid', '.snice-table');
    expect(host.height).toBeGreaterThanOrEqual(475);
    expect(inner.height).toBeGreaterThanOrEqual(host.height - 5);
  });

  test('inner .table-frame takes the remaining flex space', async ({ page }) => {
    const inner = await getInnerRect(page, '#t-fixed', '.snice-table');
    const frame = await getInnerRect(page, '#t-fixed', '.table-frame');
    expect(frame.height).toBeGreaterThan(inner.height * 0.4);
  });
});
