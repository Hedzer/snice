const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'mui-datagrid');
fs.mkdirSync(outDir, { recursive: true });

const pages = [
  '/x/react-data-grid/',
  '/x/react-data-grid/getting-started/',
  '/x/react-data-grid/column-definition/',
  '/x/react-data-grid/column-header/',
  '/x/react-data-grid/column-dimensions/',
  '/x/react-data-grid/column-visibility/',
  '/x/react-data-grid/column-ordering/',
  '/x/react-data-grid/column-pinning/',
  '/x/react-data-grid/column-groups/',
  '/x/react-data-grid/column-spanning/',
  '/x/react-data-grid/row-definition/',
  '/x/react-data-grid/row-height/',
  '/x/react-data-grid/row-spanning/',
  '/x/react-data-grid/row-ordering/',
  '/x/react-data-grid/row-pinning/',
  '/x/react-data-grid/master-detail/',
  '/x/react-data-grid/row-grouping/',
  '/x/react-data-grid/tree-data/',
  '/x/react-data-grid/sorting/',
  '/x/react-data-grid/filtering/',
  '/x/react-data-grid/filtering/quick-filter/',
  '/x/react-data-grid/filtering/multi-filters/',
  '/x/react-data-grid/filtering/server-side/',
  '/x/react-data-grid/pagination/',
  '/x/react-data-grid/selection/',
  '/x/react-data-grid/cell-selection/',
  '/x/react-data-grid/editing/',
  '/x/react-data-grid/export/',
  '/x/react-data-grid/clipboard/',
  '/x/react-data-grid/virtualization/',
  '/x/react-data-grid/accessibility/',
  '/x/react-data-grid/performance/',
  '/x/react-data-grid/scrolling/',
  '/x/react-data-grid/aggregation/',
  '/x/react-data-grid/pivoting/',
  '/x/react-data-grid/events/',
  '/x/react-data-grid/features/',
  '/x/api/data-grid/data-grid/',
  '/x/api/data-grid/data-grid-pro/',
  '/x/api/data-grid/data-grid-premium/',
];

(async () => {
  const browser = await chromium.launch({
    executablePath: '/home/hedzer/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
    headless: true,
  });
  const context = await browser.newContext();

  for (const pagePath of pages) {
    const url = 'https://mui.com' + pagePath;
    const filename = pagePath
      .replace(/\/x\/react-data-grid\//g, '')
      .replace(/\/x\/api\/data-grid\//g, 'api-')
      .replace(/\//g, '-')
      .replace(/^-/, '')
      .replace(/-$/, '') || 'index';

    try {
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      const content = await page.evaluate(() => {
        const main = document.querySelector('main') || document.body;
        const elements = main.querySelectorAll('h1, h2, h3, h4, h5, p, li, td, th, .MuiAlert-message');
        let text = '';
        for (const el of elements) {
          const tag = el.tagName.toLowerCase();
          const c = el.textContent.trim();
          if (!c) continue;
          if (tag.startsWith('h')) {
            const level = parseInt(tag[1]);
            text += '\n' + '#'.repeat(level) + ' ' + c + '\n';
          } else if (tag === 'li') {
            text += '- ' + c + '\n';
          } else if (tag === 'td' || tag === 'th') {
            text += '| ' + c + ' ';
          } else {
            text += c + '\n';
          }
        }
        return text;
      });

      fs.writeFileSync(path.join(outDir, filename + '.md'), content);
      console.log('OK: ' + filename);
      await page.close();
    } catch (err) {
      console.error('FAIL: ' + pagePath + ' - ' + err.message);
    }
  }

  await browser.close();
  console.log('Done!');
})().catch(e => console.error(e));
