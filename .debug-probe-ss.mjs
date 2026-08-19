import { chromium } from '@playwright/test';

const url = 'http://localhost:5566/tests/live/fixtures/spreadsheet/visual.html';

const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', e => console.log('PAGE ERROR:', e.message));
page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE ERR:', m.text()); });
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => {
  const el = document.getElementById('frozen-panes');
  return el && el.shadowRoot && el.shadowRoot.querySelector('.spreadsheet-td');
});

const geo = await page.evaluate(() => {
  const root = document.getElementById('frozen-panes').shadowRoot;
  const scroller = root.querySelector('.spreadsheet');
  const headers = [...root.querySelectorAll('thead tr > *')];
  const rows = [...root.querySelectorAll('tbody tr')];
  const cells = [...rows[0].children];
  const out = {
    scrollLeft: scroller.scrollLeft,
    scrollWidth: scroller.scrollWidth,
    clientWidth: scroller.clientWidth,
    row1cells: rows[0].children.length,
    headers: headers.length,
    h: headers.slice(0, 4).map((el, i) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { i, tag: el.tagName, cls: el.className, left: r.left, width: r.width, right: r.right, pos: cs.position, style: el.getAttribute('style') };
    }),
    c: cells.slice(0, 4).map((el, i) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { i, tag: el.tagName, cls: el.className, left: r.left, width: r.width, right: r.right, pos: cs.position, style: el.getAttribute('style') };
    }),
  };
  return out;
});
console.log(JSON.stringify(geo, null, 2));
await browser.close();
