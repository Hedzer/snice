import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/kanban/visual.html';

test.describe('Snice Kanban visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('columns tile across the board at a uniform top, height, and pitch', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const boards = [...document.querySelectorAll('snice-kanban')] as HTMLElement[];
      if (boards.length === 0) problems.push('no snice-kanban on page');

      boards.forEach(board => {
        const id = board.id;
        const root = board.shadowRoot!;
        const cols = [...root.querySelectorAll('.column')] as HTMLElement[];
        if (cols.length === 0) { problems.push(`${id}: no columns`); return; }

        const boardRect = (root.querySelector('.kanban') ?? board).getBoundingClientRect();
        const rects = cols.map(c => c.getBoundingClientRect());

        const tops = rects.map(r => Math.round(r.top));
        if (Math.max(...tops) - Math.min(...tops) > 1) {
          problems.push(`${id}: columns start at different tops ${tops.join(',')}`);
        }
        const heights = rects.map(r => Math.round(r.height));
        if (Math.max(...heights) - Math.min(...heights) > 1) {
          problems.push(`${id}: columns have different heights ${heights.join(',')}`);
        }

        // Consecutive columns advance by a constant pitch and never overlap.
        const gaps: number[] = [];
        for (let i = 1; i < rects.length; i++) {
          const gap = rects[i].left - rects[i - 1].right;
          if (gap < -1) problems.push(`${id}: columns ${i - 1}/${i} overlap`);
          gaps.push(Math.round(gap));
        }
        if (gaps.length && Math.max(...gaps) - Math.min(...gaps) > 1) {
          problems.push(`${id}: uneven column gaps ${gaps.join(',')}`);
        }

        rects.forEach((r, i) => {
          if (r.top < boardRect.top - 1 || r.bottom > boardRect.bottom + 1) {
            problems.push(`${id}: column ${i} escapes the board vertically`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('cards and their contents stay inside the column card area', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      ([...document.querySelectorAll('snice-kanban')] as HTMLElement[]).forEach(board => {
        const id = board.id;
        const root = board.shadowRoot!;
        [...root.querySelectorAll('.column')].forEach((col, ci) => {
          const area = col.querySelector('.column__cards');
          const header = col.querySelector('.column__header');
          if (!area) { problems.push(`${id} col ${ci}: no card area`); return; }
          const a = area.getBoundingClientRect();

          // Header band must sit above the card area and abut it.
          if (header) {
            const h = header.getBoundingClientRect();
            if (Math.abs(a.top - h.bottom) > 1) {
              problems.push(`${id} col ${ci}: seam between header and cards`);
            }
            const count = header.querySelector('.column__count');
            if (count) {
              const c = count.getBoundingClientRect();
              if (c.width > 0 && (c.right > h.right + 1 || c.top < h.top - 1 || c.bottom > h.bottom + 1)) {
                problems.push(`${id} col ${ci}: card-count badge escapes the header`);
              }
            }
          }

          const cards = [...col.querySelectorAll('.card')] as HTMLElement[];
          cards.forEach((card, n) => {
            const r = card.getBoundingClientRect();
            if (r.width === 0) return;
            // The card list may scroll vertically, so only the horizontal
            // containment is unconditional.
            if (r.left < a.left - 1 || r.right > a.right + 1) {
              problems.push(`${id} col ${ci} card ${n}: escapes the column horizontally`);
            }
            if (r.height < 24) {
              problems.push(`${id} col ${ci} card ${n}: collapsed to ${Math.round(r.height)}px tall`);
            }
            ['.card__title', '.card__description', '.card__meta'].forEach(sel => {
              const part = card.querySelector(sel);
              if (!part) return;
              const p = part.getBoundingClientRect();
              if (p.height === 0) return;
              if (p.right > r.right + 1 || p.bottom > r.bottom + 1 || p.left < r.left - 1) {
                problems.push(`${id} col ${ci} card ${n}: ${sel} escapes the card`);
              }
            });
            // Cards in a column must not overlap each other.
            if (n > 0) {
              const prev = cards[n - 1].getBoundingClientRect();
              if (r.top < prev.bottom - 1) {
                problems.push(`${id} col ${ci}: cards ${n - 1}/${n} overlap`);
              }
            }
          });
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
