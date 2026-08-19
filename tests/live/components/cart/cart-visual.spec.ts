import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/cart/visual.html';

test.describe('Snice Cart visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('line items tile vertically inside the list with no gaps or overlap', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const carts = [...document.querySelectorAll('snice-cart')] as HTMLElement[];
      if (carts.length === 0) problems.push('no carts rendered');

      carts.forEach(cart => {
        const id = cart.id || 'cart';
        const list = cart.shadowRoot?.querySelector('.cart__items') as HTMLElement | null;
        const items = [...(cart.shadowRoot?.querySelectorAll('.cart__item') ?? [])] as HTMLElement[];
        if (!list) {
          // Empty cart renders a placeholder instead of a list — that's fine.
          if (!cart.shadowRoot?.querySelector('.cart__empty')) {
            problems.push(`${id}: neither .cart__items nor .cart__empty`);
          }
          return;
        }
        const lr = list.getBoundingClientRect();

        items.forEach((item, k) => {
          const r = item.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) { problems.push(`${id} item[${k}]: 0-sized`); return; }
          if (r.left < lr.left - 1 || r.right > lr.right + 1) {
            problems.push(`${id} item[${k}]: overhangs list horizontally`);
          }
          if (k > 0) {
            const prev = items[k - 1].getBoundingClientRect();
            const seam = r.top - prev.bottom;
            if (seam < -1) problems.push(`${id} item[${k}]: overlaps previous row by ${Math.round(-seam)}px`);
            if (seam > 40) problems.push(`${id} item[${k}]: ${Math.round(seam)}px gap after previous row`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('item thumbnails render at a sane, square-ish size inside their row', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      let seen = 0;
      document.querySelectorAll('snice-cart').forEach(cart => {
        const id = (cart as HTMLElement).id || 'cart';
        cart.shadowRoot?.querySelectorAll('.cart__item').forEach((item, k) => {
          const img = item.querySelector('.cart__item-image') as HTMLElement | null;
          if (!img) return;
          seen++;
          const r = img.getBoundingClientRect();
          const ir = item.getBoundingClientRect();
          if (r.width < 24 || r.width > 160 || r.height < 24 || r.height > 160) {
            problems.push(`${id} item[${k}] thumb: ${Math.round(r.width)}x${Math.round(r.height)} out of range`);
          }
          if (Math.abs(r.width - r.height) > 2) {
            problems.push(`${id} item[${k}] thumb: not square ${Math.round(r.width)}x${Math.round(r.height)}`);
          }
          if (r.top < ir.top - 1 || r.bottom > ir.bottom + 1 || r.left < ir.left - 1) {
            problems.push(`${id} item[${k}] thumb: escapes its row`);
          }
        });
      });
      if (seen === 0) problems.push('no thumbnails found — showcase should include image items');
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('summary rows put the label left of the value without collision', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-cart').forEach(cart => {
        const id = (cart as HTMLElement).id || 'cart';
        const summary = cart.shadowRoot?.querySelector('.cart__summary') as HTMLElement | null;
        if (!summary) return;
        const sr = summary.getBoundingClientRect();
        summary.querySelectorAll('.cart__summary-row').forEach((row, k) => {
          const label = row.querySelector('.cart__summary-label') as HTMLElement | null;
          const value = row.querySelector('.cart__summary-value') as HTMLElement | null;
          if (!label || !value) return;
          const a = label.getBoundingClientRect();
          const b = value.getBoundingClientRect();
          if (a.right > b.left + 1) {
            problems.push(`${id} summary[${k}]: label "${label.textContent?.trim()}" collides with value`);
          }
          if (b.right > sr.right + 1) {
            problems.push(`${id} summary[${k}]: value overhangs summary box`);
          }
          // Label and value share a line: their centers must agree.
          if (Math.abs((a.top + a.height / 2) - (b.top + b.height / 2)) > 3) {
            problems.push(`${id} summary[${k}]: label/value baselines diverge`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
