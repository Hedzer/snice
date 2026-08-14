import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/drawer/demo.html';

test.describe('Snice Drawer visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    // Let the open/slide transitions settle.
    await page.waitForTimeout(500);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  // The host is `overflow: clip` in contained mode, so a panel wider than its
  // box is deliberately cropped rather than overflowing the page. The anchored
  // edge and the cross axis are what must line up exactly.
  test('contained drawers pin flush to their edge and span the full cross axis', async ({ page }) => {
    const result = await page.evaluate(() => {
      const problems: string[] = [];
      const drawers = ([...document.querySelectorAll('snice-drawer')] as any[])
        .filter(d => d.hasAttribute('contained') && d.hasAttribute('open') && !d.hasAttribute('inline'));
      if (!drawers.length) problems.push('no contained open drawers on page');

      drawers.forEach((d, i) => {
        const panel = d.shadowRoot?.querySelector('.drawer') as HTMLElement | null;
        if (!panel) { problems.push(`drawer[${i}]: no .drawer panel`); return; }
        const hr = d.getBoundingClientRect();
        const pr = panel.getBoundingClientRect();
        const pos = d.getAttribute('position') || 'right';
        const tag = `drawer[${i}] ${pos}/${d.getAttribute('size')}`;

        if (pr.width < 20 || pr.height < 20) {
          problems.push(`${tag}: panel ${Math.round(pr.width)}x${Math.round(pr.height)}`);
          return;
        }
        if (pos === 'left' || pos === 'right') {
          const edge = pos === 'left' ? pr.left - hr.left : hr.right - pr.right;
          if (Math.abs(edge) > 1) problems.push(`${tag}: not flush to the ${pos} edge (${edge.toFixed(1)}px)`);
          if (Math.abs(pr.height - hr.height) > 1) {
            problems.push(`${tag}: panel height ${Math.round(pr.height)} != host ${Math.round(hr.height)}`);
          }
          if (pr.top < hr.top - 1 || pr.bottom > hr.bottom + 1) {
            problems.push(`${tag}: panel spills the host vertically`);
          }
        } else {
          const edge = pos === 'top' ? pr.top - hr.top : hr.bottom - pr.bottom;
          if (Math.abs(edge) > 1) problems.push(`${tag}: not flush to the ${pos} edge (${edge.toFixed(1)}px)`);
          if (Math.abs(pr.width - hr.width) > 1) {
            problems.push(`${tag}: panel width ${Math.round(pr.width)} != host ${Math.round(hr.width)}`);
          }
          if (pr.left < hr.left - 1 || pr.right > hr.right + 1) {
            problems.push(`${tag}: panel spills the host horizontally`);
          }
        }
      });
      return problems;
    });
    expect(result).toEqual([]);
  });

  test('left-drawer size variants grow monotonically and "full" covers the host', async ({ page }) => {
    const result = await page.evaluate(() => {
      const problems: string[] = [];
      const widths: Record<string, number> = {};
      let fullRatio = NaN;
      ([...document.querySelectorAll('snice-drawer[position="left"][contained][open]')] as any[]).forEach(d => {
        const size = d.getAttribute('size');
        const panel = d.shadowRoot?.querySelector('.drawer') as HTMLElement | null;
        if (!size || !panel) return;
        const w = panel.getBoundingClientRect().width;
        if (widths[size] === undefined) widths[size] = Math.round(w);
        if (size === 'full' && Number.isNaN(fullRatio)) {
          fullRatio = w / d.getBoundingClientRect().width;
        }
      });
      const { small, medium, large, full } = widths;
      if ([small, medium, large, full].some(v => v === undefined)) {
        problems.push(`missing size variants: ${JSON.stringify(widths)}`);
        return problems;
      }
      if (!(small < medium && medium < large)) {
        problems.push(`size widths not monotonic: ${JSON.stringify(widths)}`);
      }
      if (Math.abs(fullRatio - 1) > 0.02) {
        problems.push(`size=full covers only ${(fullRatio * 100).toFixed(1)}% of the host`);
      }
      return problems;
    });
    expect(result).toEqual([]);
  });

  test('header, body and footer stack without overlap inside the panel', async ({ page }) => {
    const result = await page.evaluate(() => {
      const problems: string[] = [];
      ([...document.querySelectorAll('snice-drawer[open]')] as any[]).forEach((d, i) => {
        const root = d.shadowRoot;
        const panel = root?.querySelector('.drawer') as HTMLElement | null;
        if (!panel) return;
        const pr = panel.getBoundingClientRect();
        if (pr.height === 0) return;
        const parts = ['.drawer-header', '.drawer-body', '.drawer-footer']
          .map(sel => root.querySelector(sel) as HTMLElement | null)
          .filter((el): el is HTMLElement => !!el && el.getBoundingClientRect().height > 0);

        parts.forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.top < pr.top - 1 || r.bottom > pr.bottom + 1
              || r.left < pr.left - 1 || r.right > pr.right + 1) {
            problems.push(`drawer[${i}] ${el.className}: escapes the panel`);
          }
        });
        for (let k = 1; k < parts.length; k++) {
          const prev = parts[k - 1].getBoundingClientRect();
          const cur = parts[k].getBoundingClientRect();
          if (cur.top < prev.bottom - 1) {
            problems.push(`drawer[${i}] ${parts[k].className}: overlaps ${parts[k - 1].className}`);
          }
        }
      });
      return problems;
    });
    expect(result).toEqual([]);
  });
});
