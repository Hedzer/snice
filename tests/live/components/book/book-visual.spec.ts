import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/book/visual.html';

test.describe('Snice Book visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('every book renders a symmetric two-page spread that meets at the spine', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const books = [...document.querySelectorAll('snice-book')] as HTMLElement[];
      if (books.length === 0) problems.push('no books rendered');
      books.forEach((bk, i) => {
        const sr = bk.shadowRoot!;
        const spread = sr.querySelector('.book') as HTMLElement;
        if (!spread) { problems.push(`book[${i}]: no .book`); return; }
        const sp = spread.getBoundingClientRect();
        if (sp.width < 100 || sp.height < 100) {
          problems.push(`book[${i}]: spread collapsed (${Math.round(sp.width)}x${Math.round(sp.height)})`);
          return;
        }
        // The "no pages" edge case renders the empty spread box only.
        if (bk.querySelectorAll('snice-book-page').length === 0) return;
        const left = sr.querySelector('.book__page--1') as HTMLElement;
        const right = sr.querySelector('.book__page--4') as HTMLElement;
        if (!left || !right) { problems.push(`book[${i}]: missing spread halves`); return; }
        const lr = left.getBoundingClientRect();
        const rr = right.getBoundingClientRect();

        // Halves are equal in size...
        if (Math.abs(lr.width - rr.width) > 1 || Math.abs(lr.height - rr.height) > 1) {
          problems.push(`book[${i}]: halves differ `
            + `(${Math.round(lr.width)}x${Math.round(lr.height)} vs ${Math.round(rr.width)}x${Math.round(rr.height)})`);
        }
        // ...each is exactly half the spread, full height...
        if (Math.abs(lr.width * 2 - sp.width) > 2) {
          problems.push(`book[${i}]: half width ${Math.round(lr.width)} != spread/2 ${Math.round(sp.width / 2)}`);
        }
        if (Math.abs(lr.height - sp.height) > 2) {
          problems.push(`book[${i}]: half height ${Math.round(lr.height)} != spread ${Math.round(sp.height)}`);
        }
        // ...they abut with no gap or overlap, on the spread's centre line...
        if (Math.abs(lr.right - rr.left) > 1) {
          problems.push(`book[${i}]: spine seam ${lr.right.toFixed(1)} -> ${rr.left.toFixed(1)}`);
        }
        if (Math.abs(lr.right - (sp.left + sp.width / 2)) > 1) {
          problems.push(`book[${i}]: spine off-centre by ${(lr.right - (sp.left + sp.width / 2)).toFixed(1)}px`);
        }
        // ...and share top and bottom edges.
        if (Math.abs(lr.top - rr.top) > 1 || Math.abs(lr.bottom - rr.bottom) > 1) {
          problems.push(`book[${i}]: halves not vertically aligned`);
        }

        // Turnable leaves stack on one half of the spread, never wider than it.
        [...sr.querySelectorAll('.book__page--2')].forEach((leaf, j) => {
          const r = (leaf as HTMLElement).getBoundingClientRect();
          if (Math.abs(r.width - lr.width) > 2 || Math.abs(r.height - lr.height) > 2) {
            problems.push(`book[${i}] leaf[${j}]: ${Math.round(r.width)}x${Math.round(r.height)}`
              + ` != page ${Math.round(lr.width)}x${Math.round(lr.height)}`);
          }
          if (r.left < sp.left - 1 || r.right > sp.right + 1) {
            problems.push(`book[${i}] leaf[${j}]: sticks out of the spread`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('cover artwork fills its page without overflowing it', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-book[cover-image]').forEach((bk, i) => {
        if (bk.querySelectorAll('snice-book-page').length === 0) return; // empty book has no page to cover
        const sr = (bk as HTMLElement).shadowRoot!;
        const img = sr.querySelector('img') as HTMLImageElement | null;
        if (!img) { problems.push(`book[${i}]: cover-image set but no <img>`); return; }
        const ir = img.getBoundingClientRect();
        if (ir.width < 40 || ir.height < 40) {
          problems.push(`book[${i}]: cover ${Math.round(ir.width)}x${Math.round(ir.height)} is too small`);
        }
        const page = img.closest('.book__page') as HTMLElement | null;
        if (!page) { problems.push(`book[${i}]: cover is not inside a page`); return; }
        const pr = page.getBoundingClientRect();
        if (ir.width > pr.width + 1 || ir.height > pr.height + 1) {
          problems.push(`book[${i}]: cover ${Math.round(ir.width)}x${Math.round(ir.height)}`
            + ` overflows page ${Math.round(pr.width)}x${Math.round(pr.height)}`);
        }
        if (img.naturalWidth > 0 && Math.abs(ir.width - pr.width) > 1) {
          problems.push(`book[${i}]: cover does not span the page width`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('turning a leaf flips it in place without disturbing the spread', async ({ page }) => {
    const book = page.locator('snice-book').first();
    const before = await book.evaluate(el => {
      const sr = (el as HTMLElement).shadowRoot!;
      return sr.querySelector('.book')!.getBoundingClientRect().toJSON();
    });

    await book.locator('.book__page--4').first().click({ position: { x: 20, y: 20 } });
    await page.waitForTimeout(900);

    const after = await book.evaluate(el => {
      const sr = (el as HTMLElement).shadowRoot!;
      const spread = sr.querySelector('.book')!.getBoundingClientRect().toJSON();
      const flipped = [...sr.querySelectorAll('.book__page--2')].filter(p => {
        const t = getComputedStyle(p as HTMLElement).transform;
        return t.startsWith('matrix3d');
      }).length;
      return { spread, flipped };
    });

    expect(after.flipped).toBeGreaterThan(0);
    expect(Math.round(after.spread.width)).toBe(Math.round(before.width));
    expect(Math.round(after.spread.height)).toBe(Math.round(before.height));
    expect(Math.round(after.spread.left)).toBe(Math.round(before.left));
  });
});
