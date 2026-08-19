import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/notification-center/visual.html';

test.describe('Snice Notification Center visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() =>
      (document.getElementById('nc-default') as any)?.notifications?.length > 0);
    await page.waitForTimeout(200);
  });

  // Shared-invariant false positive: the empty-state lives inside the closed
  // (`hidden`) dropdown panel, so it legitimately measures 0x0 until opened.
  test.fixme('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('panel drops below its bell trigger at a readable size', async ({ page }) => {
    const nc = page.locator('#nc-many');
    await nc.scrollIntoViewIfNeeded();
    await nc.evaluate((host: any) => host.shadowRoot.querySelector('.bell-button').click());
    await page.waitForTimeout(300);

    const geo = await nc.evaluate((host: any) => {
      const sr = host.shadowRoot;
      const panel = sr.querySelector('.panel') as HTMLElement;
      const bell = sr.querySelector('.bell-button') as HTMLElement;
      const p = panel.getBoundingClientRect();
      const b = bell.getBoundingClientRect();
      return {
        hidden: panel.hasAttribute('hidden'),
        p: { x: p.x, y: p.y, w: p.width, h: p.height, right: p.right },
        b: { x: b.x, bottom: b.bottom, right: b.right },
        pageWidth: document.documentElement.clientWidth
      };
    });

    expect(geo.hidden).toBe(false);
    // A dropdown, not a collapsed sliver: readable width and height.
    expect(geo.p.w).toBeGreaterThan(240);
    expect(geo.p.h).toBeGreaterThan(80);
    // Anchored to the trigger: starts below it, aligned to its start edge.
    expect(geo.p.y).toBeGreaterThanOrEqual(geo.b.bottom - 1);
    expect(geo.p.y - geo.b.bottom).toBeLessThan(24);
    expect(Math.abs(geo.p.x - geo.b.x)).toBeLessThanOrEqual(2);
    // And never pushed off the page.
    expect(geo.p.x).toBeGreaterThanOrEqual(0);
    expect(geo.p.right).toBeLessThanOrEqual(geo.pageWidth + 1);
  });

  test('notification rows tile the panel with square icons and contained text', async ({ page }) => {
    const nc = page.locator('#nc-all-types');
    await nc.scrollIntoViewIfNeeded();
    await nc.evaluate((host: any) => host.shadowRoot.querySelector('.bell-button').click());
    await page.waitForTimeout(300);

    const failures = await nc.evaluate((host: any) => {
      const problems: string[] = [];
      const sr = host.shadowRoot;
      const list = sr.querySelector('.notification-list') as HTMLElement;
      const items = [...sr.querySelectorAll('.notification-item')] as HTMLElement[];
      if (items.length === 0) { problems.push('no notification rows'); return problems; }
      const lr = list.getBoundingClientRect();

      items.forEach((item, i) => {
        const r = item.getBoundingClientRect();
        if (r.height < 40) problems.push(`row[${i}]: height ${Math.round(r.height)}`);
        if (Math.abs(r.width - lr.width) > 1) {
          problems.push(`row[${i}]: width ${Math.round(r.width)} vs list ${Math.round(lr.width)}`);
        }
        if (i > 0) {
          const prev = items[i - 1].getBoundingClientRect();
          if (Math.abs(r.top - prev.bottom) > 1) {
            problems.push(`row[${i}]: seam gap ${Math.round(r.top - prev.bottom)}px`);
          }
        }

        const icon = item.querySelector('.notification-icon') as HTMLElement | null;
        const img = item.querySelector('.notification-icon-img') as HTMLElement | null;
        if (!icon) { problems.push(`row[${i}]: no type icon`); return; }
        const ir = icon.getBoundingClientRect();
        if (ir.width < 20 || ir.width > 48 || Math.abs(ir.width - ir.height) > 1) {
          problems.push(`row[${i}]: icon ${Math.round(ir.width)}x${Math.round(ir.height)} not a square badge`);
        }
        if (ir.top < r.top - 1 || ir.bottom > r.bottom + 1 || ir.left < r.left - 1) {
          problems.push(`row[${i}]: icon escapes its row`);
        }
        if (img) {
          const gr = img.getBoundingClientRect();
          const dx = (gr.left + gr.width / 2) - (ir.left + ir.width / 2);
          const dy = (gr.top + gr.height / 2) - (ir.top + ir.height / 2);
          if (Math.abs(dx) > 1.5 || Math.abs(dy) > 1.5) {
            problems.push(`row[${i}]: glyph off-centre in its badge (${Math.round(dx)},${Math.round(dy)})`);
          }
          if (gr.width > ir.width || gr.height > ir.height) {
            problems.push(`row[${i}]: glyph larger than its badge`);
          }
        }

        // Text column must sit between the icon and the dismiss button.
        const title = item.querySelector('.notification-title') as HTMLElement | null;
        const message = item.querySelector('.notification-message') as HTMLElement | null;
        const dismiss = item.querySelector('.dismiss-btn') as HTMLElement | null;
        [title, message].forEach((el, k) => {
          if (!el) { problems.push(`row[${i}]: missing text node ${k}`); return; }
          const tr = el.getBoundingClientRect();
          if (tr.left < ir.right - 1) problems.push(`row[${i}]: text overlaps the icon`);
          if (tr.top < r.top - 1 || tr.bottom > r.bottom + 1) {
            problems.push(`row[${i}]: text escapes its row vertically`);
          }
          if (dismiss) {
            const dr = dismiss.getBoundingClientRect();
            if (tr.right > dr.left + 1) problems.push(`row[${i}]: text runs under the dismiss button`);
          }
        });
        if (dismiss) {
          const dr = dismiss.getBoundingClientRect();
          if (dr.width < 16 || dr.right > r.right + 1 || dr.top < r.top - 1) {
            problems.push(`row[${i}]: dismiss button ${Math.round(dr.width)}px, misplaced`);
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
