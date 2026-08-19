import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/banner/visual.html';

test.describe('Snice Banner visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('banner row parts stay inside the bar, never overlap, and sit on one baseline band', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const banners = [...document.querySelectorAll('snice-banner[open]')] as HTMLElement[];
      if (banners.length === 0) problems.push('no open banners rendered');

      banners.forEach((host, i) => {
        const bar = host.shadowRoot?.querySelector('.banner') as HTMLElement | null;
        if (!bar) { problems.push(`banner[${i}]: no .banner`); return; }
        const br = bar.getBoundingClientRect();
        if (br.width === 0 || br.height === 0) { problems.push(`banner[${i}]: bar 0-sized`); return; }

        const label = (sel: string) => `banner[${i}] ${sel}`;
        const parts: { sel: string; el: HTMLElement; rect: DOMRect }[] = [];
        ['.banner__icon', '.banner__message', '.banner__action', '.banner__close'].forEach(sel => {
          const el = bar.querySelector(sel) as HTMLElement | null;
          if (!el) return;
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return;
          parts.push({ sel, el, rect: r });
        });

        // 1. Containment: every part sits inside the bar's box.
        parts.forEach(({ sel, rect }) => {
          if (rect.left < br.left - 1 || rect.right > br.right + 1
            || rect.top < br.top - 1 || rect.bottom > br.bottom + 1) {
            problems.push(`${label(sel)}: escapes bar`);
          }
        });

        // 2. Tiling: parts are laid out left-to-right with no horizontal overlap.
        const ordered = [...parts].sort((a, b) => a.rect.left - b.rect.left);
        for (let k = 1; k < ordered.length; k++) {
          const prev = ordered[k - 1];
          const cur = ordered[k];
          if (cur.rect.left < prev.rect.right - 1) {
            problems.push(`${label(cur.sel)}: overlaps ${prev.sel} horizontally`);
          }
        }

        // 3. Alignment: every part's vertical center is on the bar's center band.
        const barMid = br.top + br.height / 2;
        parts.forEach(({ sel, rect }) => {
          // The message may wrap to several lines and legitimately owns the
          // bar's full height; only single-line-height parts must be centered.
          if (rect.height > br.height - 4) return;
          const mid = rect.top + rect.height / 2;
          if (Math.abs(mid - barMid) > 3) {
            problems.push(`${label(sel)}: center off by ${Math.round(mid - barMid)}px`);
          }
        });

        // 4. Sizing: the leading icon is a sane glyph, never a blown-up replaced box.
        const icon = bar.querySelector('.banner__icon') as HTMLElement | null;
        if (icon) {
          const r = icon.getBoundingClientRect();
          if (r.width > 0 && (r.width > 48 || r.height > 48)) {
            problems.push(`${label('.banner__icon')}: oversized ${Math.round(r.width)}x${Math.round(r.height)}`);
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  // Banners are position:fixed and hide by sliding out with translateY(±100%)
  // rather than display:none, so a closed banner still has a box — it must
  // simply be parked completely outside the viewport.
  test('closed banners slide fully off-screen; open ones land flush against their edge', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const vh = window.innerHeight;
      document.querySelectorAll('snice-banner').forEach((host, i) => {
        const r = host.getBoundingClientRect();
        const open = host.hasAttribute('open');
        const bottomEdge = host.getAttribute('position') === 'bottom';

        if (!open) {
          const offscreen = bottomEdge ? r.top >= vh - 1 : r.bottom <= 1;
          if (!offscreen) {
            problems.push(`banner[${i}]: closed but still on-screen (top ${Math.round(r.top)}, bottom ${Math.round(r.bottom)})`);
          }
          return;
        }

        if (r.height === 0) { problems.push(`banner[${i}]: open but 0 height`); return; }
        // Open banners must be flush with the edge they are anchored to.
        const offset = bottomEdge ? vh - r.bottom : r.top;
        if (Math.abs(offset) > 1) {
          problems.push(`banner[${i}]: open but ${Math.round(offset)}px off its ${bottomEdge ? 'bottom' : 'top'} edge`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
