import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/step-input/visual.html';

type Part = { r: DOMRect; name: string };

test.describe('Snice Step Input visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('decrement, field and increment abut in one flush row', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-step-input').forEach((host, si) => {
        const root = (host as any).shadowRoot;
        const wrap = root?.querySelector('.step-input');
        if (!wrap) { problems.push(`step[${si}]: no wrapper`); return; }
        const wr = wrap.getBoundingClientRect();
        const dec = wrap.querySelector('.step-input__button--decrement');
        const field = wrap.querySelector('.step-input__input');
        const inc = wrap.querySelector('.step-input__button--increment');
        if (!dec || !field || !inc) { problems.push(`step[${si}]: missing parts`); return; }
        const parts = [
          { name: 'decrement', r: dec.getBoundingClientRect() },
          { name: 'field', r: field.getBoundingClientRect() },
          { name: 'increment', r: inc.getBoundingClientRect() },
        ];

        parts.forEach(({ name, r }) => {
          if (r.left < wr.left - 1 || r.right > wr.right + 1
              || r.top < wr.top - 1 || r.bottom > wr.bottom + 1) {
            problems.push(`step[${si}]: ${name} escapes the control box`);
          }
        });
        const tops = parts.map(p => Math.round(p.r.top));
        const bottoms = parts.map(p => Math.round(p.r.bottom));
        if (Math.max(...tops) - Math.min(...tops) > 1 || Math.max(...bottoms) - Math.min(...bottoms) > 1) {
          problems.push(`step[${si}]: parts not on one row (tops ${tops.join(',')} bottoms ${bottoms.join(',')})`);
        }
        for (let i = 1; i < parts.length; i++) {
          const seam = parts[i].r.left - parts[i - 1].r.right;
          if (Math.abs(seam) > 1) {
            problems.push(`step[${si}]: ${parts[i - 1].name}/${parts[i].name} seam ${seam.toFixed(1)}px`);
          }
        }
        // The two steppers are the same square size on either end.
        const [d, , u] = parts.map(p => p.r);
        if (Math.abs(d.width - u.width) > 1 || Math.abs(d.height - u.height) > 1) {
          problems.push(`step[${si}]: stepper buttons differ (${Math.round(d.width)}x${Math.round(d.height)} vs ${Math.round(u.width)}x${Math.round(u.height)})`);
        }
        if (Math.abs(d.width - d.height) > 1) {
          problems.push(`step[${si}]: stepper not square (${Math.round(d.width)}x${Math.round(d.height)})`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('stepper glyphs render and stay centered in their button', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-step-input').forEach((host, si) => {
        const root = (host as any).shadowRoot;
        if (!root) return;
        [...root.querySelectorAll('.step-input__button')].forEach((btn: Element, bi: number) => {
          const br = btn.getBoundingClientRect();
          const svg = btn.querySelector('svg');
          if (!svg) { problems.push(`step[${si}] button ${bi}: no glyph`); return; }
          const sr = svg.getBoundingClientRect();
          if (sr.width < 8 || sr.height < 8) {
            problems.push(`step[${si}] button ${bi}: glyph collapsed to ${Math.round(sr.width)}x${Math.round(sr.height)}`);
          }
          if (sr.width > br.width || sr.height > br.height) {
            problems.push(`step[${si}] button ${bi}: glyph ${Math.round(sr.width)} larger than button ${Math.round(br.width)}`);
          }
          const dx = (sr.left + sr.width / 2) - (br.left + br.width / 2);
          const dy = (sr.top + sr.height / 2) - (br.top + br.height / 2);
          if (Math.abs(dx) > 1.5 || Math.abs(dy) > 1.5) {
            problems.push(`step[${si}] button ${bi}: glyph off center by ${dx.toFixed(1)},${dy.toFixed(1)}`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('stepping the value keeps the control geometry flush', async ({ page }) => {
    const target = 'snice-step-input[min="0"][max="10"][value="5"]';
    const before = await page.evaluate((sel) => {
      const host = document.querySelector(sel) as any;
      return {
        value: (host.shadowRoot.querySelector('.step-input__input') as HTMLInputElement).value,
        width: host.getBoundingClientRect().width,
      };
    }, target);

    await page.evaluate((sel) => {
      const host = document.querySelector(sel) as any;
      (host.shadowRoot.querySelector('.step-input__button--increment') as HTMLElement).click();
    }, target);
    await page.waitForTimeout(200);

    const after = await page.evaluate((sel) => {
      const host = document.querySelector(sel) as any;
      const root = host.shadowRoot;
      const wr = root.querySelector('.step-input').getBoundingClientRect();
      const dec = root.querySelector('.step-input__button--decrement').getBoundingClientRect();
      const field = root.querySelector('.step-input__input').getBoundingClientRect();
      const inc = root.querySelector('.step-input__button--increment').getBoundingClientRect();
      return {
        value: (root.querySelector('.step-input__input') as HTMLInputElement).value,
        width: host.getBoundingClientRect().width,
        seams: [field.left - dec.right, inc.left - field.right],
        contained: dec.left >= wr.left - 1 && inc.right <= wr.right + 1,
      };
    }, target);

    expect(after.value).not.toBe(before.value);
    expect(after.width).toBeCloseTo(before.width, 0);
    after.seams.forEach(s => expect(Math.abs(s)).toBeLessThanOrEqual(1));
    expect(after.contained).toBe(true);
  });
});
