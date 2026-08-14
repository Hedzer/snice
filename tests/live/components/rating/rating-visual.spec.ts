import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/rating/demo.html';

test.describe('Snice Rating visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('every rating renders max square stars on one baseline at an even pitch', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const ratings = [...document.querySelectorAll('snice-rating')] as HTMLElement[];
      if (ratings.length === 0) problems.push('no snice-rating on page');

      ratings.forEach((rating, i) => {
        const label = `rating[${i}] value=${rating.getAttribute('value')} max=${rating.getAttribute('max') ?? 5}`;
        const root = rating.shadowRoot!;
        const track = root.querySelector('.rating');
        const stars = [...root.querySelectorAll('.star')] as HTMLElement[];
        if (!track) { problems.push(`${label}: no .rating track`); return; }
        const t = track.getBoundingClientRect();

        const max = Number(rating.getAttribute('max') ?? 5);
        if (stars.length !== max) problems.push(`${label}: ${stars.length} stars for max ${max}`);

        const rects = stars.map(s => s.getBoundingClientRect());
        rects.forEach((r, n) => {
          if (Math.abs(r.width - r.height) > 0.5) {
            problems.push(`${label} star ${n}: not square (${r.width.toFixed(1)}x${r.height.toFixed(1)})`);
          }
          if (r.width < 12) problems.push(`${label} star ${n}: only ${r.width.toFixed(1)}px wide`);
          if (r.left < t.left - 0.5 || r.right > t.right + 0.5
              || r.top < t.top - 0.5 || r.bottom > t.bottom + 0.5) {
            problems.push(`${label} star ${n}: escapes the rating track`);
          }
          // Both glyph layers must exactly overlay their star box.
          ['.star-empty', '.star-full'].forEach(sel => {
            const layer = stars[n].querySelector(sel);
            if (!layer) { problems.push(`${label} star ${n}: missing ${sel}`); return; }
            const l = layer.getBoundingClientRect();
            if (Math.abs(l.width - r.width) > 0.5 || Math.abs(l.left - r.left) > 0.5
                || Math.abs(l.top - r.top) > 0.5) {
              problems.push(`${label} star ${n}: ${sel} does not overlay the star box`);
            }
          });
        });

        const tops = rects.map(r => Math.round(r.top));
        if (tops.length && Math.max(...tops) - Math.min(...tops) > 1) {
          problems.push(`${label}: stars off a single baseline ${tops.join(',')}`);
        }
        const pitches: number[] = [];
        for (let n = 1; n < rects.length; n++) pitches.push(+(rects[n].left - rects[n - 1].left).toFixed(1));
        if (pitches.length && Math.max(...pitches) - Math.min(...pitches) > 1) {
          problems.push(`${label}: uneven star pitch ${pitches.join(',')}`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('the clipped fill across the stars adds up to the rating value', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      ([...document.querySelectorAll('snice-rating')] as HTMLElement[]).forEach((rating, i) => {
        const value = Number(rating.getAttribute('value') ?? 0);
        const fills = [...rating.shadowRoot!.querySelectorAll('.star-full')] as HTMLElement[];
        let total = 0;
        for (const f of fills) {
          // `clip-path: inset(0 <right>% 0 0)` — visible fraction is 1 - right/100.
          const m = /inset\(\s*[\d.]+\w*\s+([\d.]+)%/.exec(f.style.clipPath || '');
          if (!m) { problems.push(`rating[${i}]: unparsable clip-path "${f.style.clipPath}"`); return; }
          total += 1 - Number(m[1]) / 100;
        }
        if (Math.abs(total - value) > 0.01) {
          problems.push(`rating[${i}]: painted fill ${total.toFixed(2)} stars for value ${value}`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('the size variants render visibly different star sizes', async ({ page }) => {
    const sizes = await page.evaluate(() => {
      const pick = (size: string) => {
        const el = document.querySelector(`snice-rating[size="${size}"]`) as HTMLElement | null;
        const star = el?.shadowRoot?.querySelector('.star');
        return star ? star.getBoundingClientRect().width : 0;
      };
      return { small: pick('small'), medium: pick('medium'), large: pick('large') };
    });

    expect(sizes.small).toBeGreaterThan(0);
    expect(sizes.medium).toBeGreaterThan(sizes.small);
    expect(sizes.large).toBeGreaterThan(sizes.medium);
  });
});
