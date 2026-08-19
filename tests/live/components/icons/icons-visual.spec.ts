import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/icons/visual.html';

test.describe('Snice icon catalogue visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-empty-state'));
    await page.waitForFunction(() => {
      const tiles = document.querySelectorAll('figure.icon snice-empty-state');
      return tiles.length > 0 && [...tiles].every(t =>
        !!(t as any).shadowRoot?.querySelector('.empty-state__icon-wrapper'));
    });
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  // Every catalogued name must resolve to a registry SVG — not fall through to
  // the ligature/text fallback, which paints the raw name as words.
  test('every catalogued name resolves to a registry SVG glyph', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const figures = [...document.querySelectorAll('figure.icon')];
      if (figures.length < 60) problems.push(`only ${figures.length} catalogue tiles`);
      figures.forEach(fig => {
        const name = fig.querySelector('figcaption')!.textContent!.trim();
        const root = (fig.querySelector('snice-empty-state') as any).shadowRoot as ShadowRoot;
        const span = root.querySelector('.empty-state__icon');
        if (!span) { problems.push(`${name}: no icon rendered`); return; }
        if (span.classList.contains('snice-icon-ligature')) {
          problems.push(`${name}: fell through to the icon-font ligature fallback`);
          return;
        }
        if (!span.querySelector('svg')) problems.push(`${name}: no <svg> in the glyph`);
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  // The catalogue is a uniform grid: every glyph must render at the same,
  // visible size and sit centred inside its tile, above its caption.
  test('glyphs render at a uniform, visible size centred in their tile', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const widths: number[] = [];
      [...document.querySelectorAll('figure.icon')].forEach(fig => {
        const name = fig.querySelector('figcaption')!.textContent!.trim();
        const caption = fig.querySelector('figcaption')!.getBoundingClientRect();
        const tile = fig.getBoundingClientRect();
        const root = (fig.querySelector('snice-empty-state') as any).shadowRoot as ShadowRoot;
        const svg = root.querySelector('.empty-state__icon svg');
        if (!svg) return; // reported by the registry test
        const r = svg.getBoundingClientRect();

        if (r.width < 12 || r.height < 12) {
          problems.push(`${name}: glyph too small (${r.width.toFixed(1)}x${r.height.toFixed(1)})`);
        }
        if (Math.abs(r.width - r.height) > 1) {
          problems.push(`${name}: glyph not square (${r.width.toFixed(1)}x${r.height.toFixed(1)})`);
        }
        if (r.left < tile.left - 1 || r.right > tile.right + 1 || r.top < tile.top - 1) {
          problems.push(`${name}: glyph escapes its tile`);
        }
        if (r.bottom > caption.top + 1) {
          problems.push(`${name}: glyph overlaps its caption`);
        }
        const dx = (r.left + r.width / 2) - (tile.left + tile.width / 2);
        if (Math.abs(dx) > 1.5) problems.push(`${name}: glyph off-centre by ${dx.toFixed(1)}px`);
        widths.push(r.width);
      });
      if (widths.length) {
        const spread = Math.max(...widths) - Math.min(...widths);
        if (spread > 1) problems.push(`glyph widths vary by ${spread.toFixed(1)}px across the catalogue`);
      }
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
