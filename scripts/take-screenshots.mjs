#!/usr/bin/env node
/**
 * Screenshots every component demo and creates a bin-packed composite.
 *
 * Usage:
 *   node scripts/take-screenshots.mjs [--url=https://snice.dev/components.html]
 *
 * Output:
 *   marketing/screenshots/<component>.png  — individual demos
 *   marketing/screenshots/birds-eye.png    — bin-packed landscape composite
 */

import { chromium } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const BASE_URL = process.argv.find(a => a.startsWith('--url='))?.split('=')[1]
  || 'https://snice.dev/components.html';
const OUT_DIR = resolve(__dirname, '..', 'marketing', 'screenshots');

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// These components need their overlay/panel opened via JS before screenshot
const OPEN_VIA_JS = {
  'modal': `
    await customElements.whenDefined('snice-modal');
    const m = document.querySelector('#demo-modal');
    if (!m) throw new Error('modal #demo-modal not found');
    m.show();
    return 'modal opened';
  `,
  'drawer': `
    await customElements.whenDefined('snice-drawer');
    const d = document.querySelector('#drawer-push-demo');
    if (!d) throw new Error('drawer #drawer-push-demo not found');
    d.show();
    return 'drawer opened';
  `,
  'command-palette': `
    await customElements.whenDefined('snice-command-palette');
    const cp = document.querySelector('#cmd-palette');
    if (!cp) throw new Error('command-palette #cmd-palette not found');
    cp.commands = [
      { id: 'new-file', label: 'New File', shortcut: 'Ctrl+N', category: 'File' },
      { id: 'open', label: 'Open...', shortcut: 'Ctrl+O', category: 'File' },
      { id: 'save', label: 'Save', shortcut: 'Ctrl+S', category: 'File' },
      { id: 'settings', label: 'Settings', shortcut: 'Ctrl+,', category: 'Preferences' },
      { id: 'theme', label: 'Toggle Theme', category: 'Preferences' },
    ];
    cp.show();
    return 'command-palette opened';
  `,
  'notification-center': `
    await customElements.whenDefined('snice-notification-center');
    const nc = document.querySelector('#demo-notif');
    if (!nc) throw new Error('notification-center #demo-notif not found');
    nc.notifications = [
      { id: '1', title: 'New comment', message: 'Alice commented on your pull request', timestamp: '2 min ago', icon: 'chat_bubble', type: 'info' },
      { id: '2', title: 'Deploy succeeded', message: 'Production build v2.4.1 is live', timestamp: '15 min ago', icon: 'check_circle', type: 'success', read: true },
      { id: '3', title: 'Disk space warning', message: 'Server storage is at 92%', timestamp: '1 hr ago', icon: 'warning', type: 'warning' },
    ];
    nc.open = true;
    return 'notification-center opened';
  `,
  'toast': `
    await customElements.whenDefined('snice-toast-container');
    const tc = document.querySelector('#toast-container') || document.querySelector('snice-toast-container');
    if (!tc) throw new Error('toast container not found');
    tc.show('Changes saved!', {type:'success'});
    tc.show('Review input', {type:'warning'});
    tc.show('Error occurred', {type:'error'});
    return 'toasts shown';
  `,
};

// These components are just trigger buttons — skip individual shots but still
// try to open them for the overlay screenshot
const OVERLAY_KEYS = ['modal', 'command-palette', 'notification-center', 'drawer', 'toast'];
function isOverlay(slug) {
  return OVERLAY_KEYS.some(key => slug.includes(key));
}

// Skip components that produce boring screenshots (just buttons, no visual)
const SKIP = new Set([
  'qr-reader-docs-showcase',     // needs camera
  'camera-docs-showcase',         // needs camera
  'camera-annotate-docs-showcase', // needs camera
  'audio-recorder-docs-showcase',  // needs mic
]);

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1568, height: 900 },
    colorScheme: 'dark',
  });
  const page = await context.newPage();

  console.log(`Loading ${BASE_URL}`);
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3000);

  // CSS to strip page chrome (shared between main and isolated pages)
  const STRIP_CHROME_CSS = `
    .comp-split-code, .comp-split-stacked .comp-split-code,
    .comp-section > h3, .comp-section > .comp-desc,
    .comp-sidebar, .comp-search, nav, header, footer,
    .category-header { display: none !important; }

    .comp-section {
      border: none !important;
      background: transparent !important;
      padding: 0 !important;
      margin: 0 !important;
      box-shadow: none !important;
      min-height: 0 !important;
      height: auto !important;
    }

    .comp-split {
      border: none !important;
      background: transparent !important;
      min-height: 0 !important;
      height: auto !important;
    }

    .comp-split-demo {
      border: none !important;
      background: transparent !important;
      padding: 4px !important;
      min-height: 0 !important;
    }
  `;

  // Main page: strip chrome + hide all overlays to prevent bleed
  await page.addStyleTag({ content: STRIP_CHROME_CSS + `
    snice-modal, snice-drawer, snice-command-palette,
    snice-notification-center .notification-panel,
    snice-toast-container { display: none !important; }
  `});

  await page.waitForTimeout(500);

  // Discover sections
  const sections = await page.$$eval('.comp-section', els =>
    els.map((el, i) => {
      const h3 = el.querySelector('h3');
      const name = h3?.textContent?.trim() || `section-${i}`;
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      return { name, slug, index: i };
    })
  );

  console.log(`Found ${sections.length} components\n`);

  const screenshotFiles = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const filename = `${section.slug}.png`;
    const filepath = join(OUT_DIR, filename);
    const sectionEl = page.locator('.comp-section').nth(i);

    if (SKIP.has(`${section.slug}-docs-showcase`) || SKIP.has(section.slug)) {
      console.log(`[${i + 1}/${sections.length}] ${section.name} — skipped`);
      continue;
    }

    console.log(`[${i + 1}/${sections.length}] ${section.name}`);

    try {
      // Overlay components: open in a completely isolated page
      if (isOverlay(section.slug)) {
        const isoCtx = await browser.newContext({
          viewport: { width: 1568, height: 900 },
          colorScheme: 'dark',
        });
        const isoPage = await isoCtx.newPage();
        await isoPage.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 });
        await isoPage.waitForTimeout(4000); // extra wait for all components to register
        // Strip chrome on isolated page
        await isoPage.addStyleTag({ content: STRIP_CHROME_CSS });
        // Hide all sections except the current one so overlay panels aren't covered
        // Hide other sections. For notification-center, only hide sections AFTER it
        // (needs prior sections for page context) and elevate z-index
        if (section.slug.includes('notification-center')) {
          await isoPage.evaluate((idx) => {
            document.querySelectorAll('.comp-section').forEach((el, j) => {
              if (j > idx) el.style.display = 'none';
            });
            // Elevate the NC section's stacking context
            const ncSection = document.querySelectorAll('.comp-section')[idx];
            if (ncSection) ncSection.style.zIndex = '99999';
            ncSection.style.position = 'relative';
          }, i);
        } else {
          await isoPage.evaluate((idx) => {
            document.querySelectorAll('.comp-section').forEach((el, j) => {
              if (j !== idx) el.style.display = 'none';
            });
          }, i);
        }
        // Scroll to section so showcase script initializes it
        await isoPage.locator('.comp-section').nth(i).scrollIntoViewIfNeeded({ timeout: 5000 });
        await isoPage.waitForTimeout(1000);
        // Open the overlay
        const jsOpen = Object.entries(OPEN_VIA_JS).find(([key]) => section.slug.includes(key));
        if (jsOpen) {
          try {
            const result = await isoPage.evaluate(`(async () => { ${jsOpen[1]} })()`);
            console.log(`  Open result: ${result}`);
            await isoPage.waitForTimeout(1500); // wait for animation
          } catch (openErr) {
            console.warn(`  Failed to open ${section.slug}: ${openErr.message}`);
          }
        }
        // For overlays, try element-level screenshot first, fall back to viewport
        let captured = false;
        const matchedKey = OVERLAY_KEYS.find(k => section.slug.includes(k));

        // Modal + command palette: use locator to screenshot just the panel
        if (matchedKey === 'modal' || matchedKey === 'command-palette') {
          const sel = matchedKey === 'modal'
            ? '#demo-modal >> .modal__panel'
            : '#cmd-palette >> .command-palette__container';
          try {
            const loc = isoPage.locator(sel).first();
            if (await loc.isVisible({ timeout: 2000 })) {
              await loc.screenshot({ path: filepath, type: 'png' });
              captured = true;
            }
          } catch (e) {
            console.warn(`  Locator failed: ${e.message.split('\n')[0]}`);
          }
        }
        // Toast: clip to just the toast items
        else if (matchedKey === 'toast') {
          const clip = await isoPage.evaluate(() => {
            const host = document.querySelector('#toast-container') || document.querySelector('snice-toast-container');
            if (!host?.shadowRoot) return null;
            const items = [...host.shadowRoot.querySelectorAll('[class*="toast"]')].filter(e => e.offsetHeight > 0);
            if (items.length === 0) return null;
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const e of items) {
              const r = e.getBoundingClientRect();
              minX = Math.min(minX, r.left); minY = Math.min(minY, r.top);
              maxX = Math.max(maxX, r.right); maxY = Math.max(maxY, r.bottom);
            }
            const pad = 16;
            return { x: Math.max(0, minX - pad), y: Math.max(0, minY - pad),
              width: (maxX - minX) + pad * 2, height: (maxY - minY) + pad * 2 };
          });
          if (clip && clip.width > 10 && clip.height > 10) {
            await isoPage.screenshot({ path: filepath, type: 'png', clip });
            captured = true;
          }
        }
        // Notification center: ensure panel isn't clipped by parent overflow
        else if (matchedKey === 'notification-center') {
          await isoPage.addStyleTag({ content: `
            .comp-section, .comp-split, .comp-split-demo,
            .comp-split-stacked, main, body {
              overflow: visible !important;
            }
          `});
          // Scroll the bell into the upper part of viewport so panel has room below
          await isoPage.evaluate(() => {
            const nc = document.querySelector('#demo-notif');
            if (nc) nc.scrollIntoView({ block: 'start' });
          });
          await isoPage.waitForTimeout(500);
          // Clip to bell + panel
          const clip = await isoPage.evaluate(() => {
            const host = document.querySelector('#demo-notif');
            if (!host?.shadowRoot) return { debug: 'no shadow root' };
            const s = host.shadowRoot;
            const bell = s.querySelector('.bell-button');
            const panel = s.querySelector('.panel');
            const bellRect = bell?.getBoundingClientRect();
            const panelRect = panel?.getBoundingClientRect();
            const hostRect = host.getBoundingClientRect();
            const panelStyle = panel ? getComputedStyle(panel) : null;
            const els = [bell, panel].filter(e => e && e.offsetHeight > 0);
            if (els.length === 0) return null;
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const e of els) {
              const r = e.getBoundingClientRect();
              minX = Math.min(minX, r.left); minY = Math.min(minY, r.top);
              maxX = Math.max(maxX, r.right); maxY = Math.max(maxY, r.bottom);
            }
            const pad = 16;
            return { x: Math.max(0, minX - pad), y: Math.max(0, minY - pad),
              width: (maxX - minX) + pad * 2, height: (maxY - minY) + pad * 2 };
          });
          if (clip && clip.width > 10 && clip.height > 10) {
            await isoPage.screenshot({ path: filepath, type: 'png', clip });
            captured = true;
          }
        }
        // Drawer: full page screenshot (other sections hidden)
        else if (matchedKey === 'drawer') {
          await isoPage.screenshot({ path: filepath, type: 'png', fullPage: true });
          captured = true;
        }

        if (!captured) {
          console.log(`  Fallback: full viewport for ${section.slug}`);
          await isoPage.screenshot({ path: filepath, type: 'png' });
        }
        await isoCtx.close();
      } else {
        await sectionEl.scrollIntoViewIfNeeded({ timeout: 5000 });
        await page.waitForTimeout(300);

        // Accordion — expand first item
        if (section.slug.includes('accordion')) {
          try {
            const item = sectionEl.locator('snice-accordion-item').first();
            if (await item.isVisible({ timeout: 500 })) {
              await item.click({ timeout: 1000 });
              await page.waitForTimeout(400);
            }
          } catch {}
        }

        // Get tight bounding box around actual snice-* elements in the demo
        const clip = await page.evaluate((idx) => {
          const section = document.querySelectorAll('.comp-section')[idx];
          if (!section) return null;
          const demo = section.querySelector('.comp-split-demo') || section;
          const els = [...demo.querySelectorAll('*')].filter(el => {
            const tag = el.tagName.toLowerCase();
            const isSnice = tag.startsWith('snice-');
            const isVisualChild = el.parentElement === demo && el.offsetHeight > 0 && el.offsetWidth > 0;
            return (isSnice || isVisualChild) && el.offsetHeight > 0 && el.offsetWidth > 0;
          });
          if (els.length === 0) return null;
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          for (const el of els) {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
            minX = Math.min(minX, r.left);
            minY = Math.min(minY, r.top);
            maxX = Math.max(maxX, r.right);
            maxY = Math.max(maxY, r.bottom);
          }
          if (minX >= maxX || minY >= maxY) return null;
          const pad = 8;
          return {
            x: Math.max(0, minX - pad),
            y: Math.max(0, minY - pad),
            width: (maxX - minX) + pad * 2,
            height: (maxY - minY) + pad * 2,
          };
        }, i);

        if (clip && clip.width > 10 && clip.height > 10) {
          await page.screenshot({ path: filepath, type: 'png', clip });
        } else {
          await sectionEl.screenshot({ path: filepath, type: 'png' });
        }
      }

      screenshotFiles.push({ name: section.name, slug: section.slug, filepath, filename });
    } catch (err) {
      console.warn(`  Skipped: ${err.message}`);
    }
  }

  console.log(`\nCaptured ${screenshotFiles.length} screenshots`);

  if (screenshotFiles.length > 0) {
    console.log('\nCreating bird\'s-eye composites...');
    await createBirdsEye(browser, screenshotFiles, {
      name: 'birds-eye-landscape', columns: 12, width: 3600, maxImgHeight: 300,
    });
    await createBirdsEye(browser, screenshotFiles, {
      name: 'birds-eye-portrait', columns: 8, width: 2400, maxImgHeight: 250,
    });
  }

  await browser.close();
  console.log('Done!');
}

async function createBirdsEye(browser, files, { name = 'birds-eye', columns = 12, width = 3600, maxImgHeight = 300 } = {}) {
  const images = [];
  for (const f of files) {
    try {
      const data = await readFile(f.filepath);
      images.push({ name: f.name, b64: data.toString('base64') });
    } catch (err) {
      console.warn(`  Could not load ${f.filename}: ${err.message}`);
    }
  }

  if (images.length === 0) return;

  // Strip "Docs + Showcase" suffix from labels
  const cleanName = (n) => n.replace(/\s*Docs?\s*\+?\s*Showcase\s*/i, '').trim();

  const imgTags = images.map(({ name, b64 }) =>
    `<div class="cell">
      <img src="data:image/png;base64,${b64}">
      <div class="label">${cleanName(name)}</div>
    </div>`
  ).join('\n');

  const html = `<!DOCTYPE html>
<html><head><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #1a1a2e; font-family: system-ui, sans-serif; }
  .pack {
    column-count: ${columns};
    column-gap: 4px;
    padding: 4px;
    width: ${width}px;
  }
  .cell {
    break-inside: avoid;
    margin-bottom: 4px;
    background: #0d0d1a;
    border-radius: 3px;
    overflow: hidden;
    position: relative;
    display: inline-block;
    width: 100%;
  }
  .cell img {
    display: block;
    width: 100%;
    height: auto;
    max-height: ${maxImgHeight}px;
    object-fit: cover;
    object-position: top left;
  }
  .label {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    background: linear-gradient(transparent, rgba(0,0,0,0.85));
    color: #ccc;
    font-size: 9px;
    padding: 12px 6px 3px;
    text-align: center;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
</style></head>
<body><div class="pack">${imgTags}</div></body>
</html>`;

  const ctx = await browser.newContext({ colorScheme: 'dark' });
  const compositePage = await ctx.newPage();
  await compositePage.setContent(html, { waitUntil: 'load' });
  await compositePage.waitForTimeout(1500);

  const pack = compositePage.locator('.pack');
  const outPath = join(OUT_DIR, `${name}.png`);
  await pack.screenshot({ path: outPath, type: 'png' });

  const box = await pack.boundingBox();
  console.log(`  Saved: ${outPath} (${Math.round(box.width)}x${Math.round(box.height)}px)`);
  await ctx.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
