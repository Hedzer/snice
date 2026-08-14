import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/theme/demo.html';

// The theme showcase has no custom elements — it is the token system itself
// rendered as swatches, scales and type samples. The geometry that can break
// here is the tiling of those sample grids and the token values the samples
// resolve to, so that is what these assertions pin down.
test.describe('Snice Theme showcase visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!document.querySelector('.scale-row .scale-cell'));
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('colour scale rows tile edge to edge with equal cells', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const rows = [...document.querySelectorAll('.scale-row')] as HTMLElement[];
      if (rows.length === 0) problems.push('no colour scale rows on the page');

      rows.forEach((row, ri) => {
        const rr = row.getBoundingClientRect();
        const cells = [...row.querySelectorAll('.scale-cell')] as HTMLElement[];
        if (cells.length !== 11) problems.push(`scale ${ri}: ${cells.length} cells, expected 11 (50-950)`);
        const rects = cells.map(c => c.getBoundingClientRect());

        const widths = rects.map(r => r.width);
        if (Math.max(...widths) - Math.min(...widths) > 1) {
          problems.push(`scale ${ri}: uneven cell widths ${Math.min(...widths).toFixed(1)}..${Math.max(...widths).toFixed(1)}`);
        }
        const heights = rects.map(r => Math.round(r.height));
        if (Math.max(...heights) - Math.min(...heights) > 1) {
          problems.push(`scale ${ri}: uneven cell heights`);
        }
        rects.forEach((r, ci) => {
          if (r.height < 20) problems.push(`scale ${ri} cell ${ci}: ${Math.round(r.height)}px tall`);
          if (Math.round(r.top) !== Math.round(rects[0].top)) {
            problems.push(`scale ${ri} cell ${ci}: off the row's top edge`);
          }
          if (ci > 0) {
            const gap = r.left - rects[ci - 1].right;
            if (gap < -0.5 || gap > 3) {
              problems.push(`scale ${ri} cell ${ci}: seam gap ${gap.toFixed(1)}px`);
            }
          }
        });
        // The strip spans its container from edge to edge.
        if (Math.abs(rects[0].left - rr.left) > 1) problems.push(`scale ${ri}: left edge not flush`);
        if (Math.abs(rects[rects.length - 1].right - rr.right) > 1) {
          problems.push(`scale ${ri}: right edge not flush`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('swatch grids wrap into aligned columns without overlapping', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const grids = [...document.querySelectorAll('.swatch-grid, .interactive-grid, .shadow-grid')] as HTMLElement[];
      if (grids.length === 0) problems.push('no swatch grids on the page');

      grids.forEach((grid, gi) => {
        const gr = grid.getBoundingClientRect();
        const items = [...grid.children] as HTMLElement[];
        const rects = items.map(i => i.getBoundingClientRect());

        const widths = rects.map(r => r.width);
        if (Math.max(...widths) - Math.min(...widths) > 1) {
          problems.push(`grid ${gi}: uneven item widths`);
        }
        rects.forEach((r, i) => {
          if (r.width < 60 || r.height < 20) {
            problems.push(`grid ${gi} item ${i}: ${Math.round(r.width)}x${Math.round(r.height)}`);
          }
          if (r.left < gr.left - 1 || r.right > gr.right + 1) {
            problems.push(`grid ${gi} item ${i}: overflows the grid`);
          }
        });
        // Items sharing a row share a top edge and never overlap.
        const byRow = new Map<number, DOMRect[]>();
        rects.forEach(r => {
          const key = Math.round(r.top);
          if (!byRow.has(key)) byRow.set(key, []);
          byRow.get(key)!.push(r);
        });
        byRow.forEach((rowRects, top) => {
          const sorted = [...rowRects].sort((a, b) => a.left - b.left);
          for (let i = 1; i < sorted.length; i++) {
            if (sorted[i].left < sorted[i - 1].right - 1) {
              problems.push(`grid ${gi}: items overlap on row ${top}`);
              break;
            }
          }
        });
        // Labels stay inside their swatch.
        items.forEach((item, i) => {
          const code = item.querySelector('code');
          if (!code) return;
          const r = code.getBoundingClientRect();
          const ir = rects[i];
          if (r.left < ir.left - 1 || r.right > ir.right + 1 || r.bottom > ir.bottom + 1) {
            problems.push(`grid ${gi} item ${i}: token name escapes its swatch`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('spacing and font-size scales render in strictly increasing order', async ({ page }) => {
    const scales = await page.evaluate(() => ({
      spacing: [...document.querySelectorAll('.spacing-bar')]
        .map(b => b.getBoundingClientRect().width),
      fonts: [...document.querySelectorAll('.type-sample')]
        .map(p => parseFloat(getComputedStyle(p).fontSize)),
      zBars: [...document.querySelectorAll('.z-bar')]
        .map(b => b.getBoundingClientRect().width)
    }));

    expect(scales.spacing.length).toBeGreaterThanOrEqual(9);
    for (let i = 1; i < scales.spacing.length; i++) {
      expect(scales.spacing[i]).toBeGreaterThan(scales.spacing[i - 1]);
    }
    expect(scales.fonts.length).toBeGreaterThanOrEqual(9);
    for (let i = 1; i < scales.fonts.length; i++) {
      expect(scales.fonts[i]).toBeGreaterThan(scales.fonts[i - 1]);
    }
    for (let i = 1; i < scales.zBars.length; i++) {
      expect(scales.zBars[i]).toBeGreaterThan(scales.zBars[i - 1]);
    }
  });

  test('focus ring paints at the token width and offset', async ({ page }) => {
    const input = page.locator('input.focus-demo');
    const before = await input.evaluate(el => getComputedStyle(el).outlineStyle);

    await input.focus();
    await page.waitForTimeout(150);

    const ring = await input.evaluate(el => {
      const cs = getComputedStyle(el);
      const root = getComputedStyle(document.documentElement);
      return {
        style: cs.outlineStyle,
        width: parseFloat(cs.outlineWidth),
        offset: parseFloat(cs.outlineOffset),
        tokenWidth: root.getPropertyValue('--snice-focus-ring-width').trim(),
        tokenOffset: root.getPropertyValue('--snice-focus-ring-offset').trim(),
        colour: cs.outlineColor
      };
    });

    expect(before).not.toBe('solid');
    expect(ring.style).toBe('solid');
    expect(ring.width).toBe(parseFloat(ring.tokenWidth));
    expect(ring.offset).toBe(parseFloat(ring.tokenOffset));
    expect(ring.colour).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('toggling data-theme repaints surface and text tokens', async ({ page }) => {
    const read = () => page.evaluate(() => {
      const cs = getComputedStyle(document.body);
      return {
        theme: document.documentElement.getAttribute('data-theme'),
        background: cs.backgroundColor,
        color: cs.color
      };
    });

    const before = await read();
    await page.locator('#toggle').click();
    await page.waitForFunction(prev =>
      document.documentElement.getAttribute('data-theme') !== prev, before.theme);
    await page.waitForTimeout(200);
    const after = await read();

    expect(after.theme).not.toBe(before.theme);
    expect(after.background).not.toBe(before.background);
    expect(after.color).not.toBe(before.color);
    // The toggle button itself stays pinned in the viewport's top-right.
    const btn = await page.locator('#toggle').boundingBox();
    const vp = page.viewportSize()!;
    expect(btn!.x + btn!.width).toBeLessThanOrEqual(vp.width);
    expect(btn!.y).toBeLessThan(100);
  });
});
