import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/leaderboard/visual.html';

test.describe('Snice Leaderboard visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('entry rows tile down the list with no gaps and no overhang', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-leaderboard').forEach((host, li) => {
        const list = (host as any).shadowRoot?.querySelector('.leaderboard__list');
        if (!list) return; // empty-state boards render no list
        const lr = list.getBoundingClientRect();
        const rects = [...list.querySelectorAll('.leaderboard__entry')]
          .map(e => e.getBoundingClientRect());
        if (rects.length === 0) return;
        rects.forEach((r, i) => {
          if (Math.abs(r.left - lr.left) > 1 || Math.abs(r.width - lr.width) > 1) {
            problems.push(`board[${li}] entry ${i}: ${Math.round(r.width)}px wide at ${Math.round(r.left)}, list ${Math.round(lr.width)}px at ${Math.round(lr.left)}`);
          }
          if (r.top < lr.top - 1 || r.bottom > lr.bottom + 1) {
            problems.push(`board[${li}] entry ${i}: overhangs the list box`);
          }
          if (i > 0 && Math.abs(r.top - rects[i - 1].bottom) > 1) {
            problems.push(`board[${li}] entry ${i}: row seam ${Math.round(rects[i - 1].bottom)} -> ${Math.round(r.top)}`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('rank, avatar, name, score and change sit in one centered row without overlapping', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const order = ['.leaderboard__rank', '.leaderboard__avatar-placeholder, .leaderboard__avatar',
        '.leaderboard__info', '.leaderboard__score', '.leaderboard__change'];
      document.querySelectorAll('snice-leaderboard').forEach((host, li) => {
        const root = (host as any).shadowRoot;
        if (!root) return;
        [...root.querySelectorAll('.leaderboard__entry')].forEach((entry: Element, ei: number) => {
          const er = entry.getBoundingClientRect();
          const parts: { sel: string; r: DOMRect }[] = [];
          order.forEach(sel => {
            const el = entry.querySelector(sel);
            if (el) parts.push({ sel, r: el.getBoundingClientRect() });
          });
          parts.forEach(({ sel, r }) => {
            if (r.left < er.left - 1 || r.right > er.right + 1
                || r.top < er.top - 1 || r.bottom > er.bottom + 1) {
              problems.push(`board[${li}] entry ${ei}: ${sel} escapes the row`);
            }
            const dy = (r.top + r.height / 2) - (er.top + er.height / 2);
            if (Math.abs(dy) > 2) {
              problems.push(`board[${li}] entry ${ei}: ${sel} off row center by ${dy.toFixed(1)}px`);
            }
          });
          for (let i = 1; i < parts.length; i++) {
            if (parts[i].r.left < parts[i - 1].r.right - 1) {
              problems.push(`board[${li}] entry ${ei}: ${parts[i].sel} overlaps ${parts[i - 1].sel}`);
            }
          }
          const avatar = entry.querySelector('.leaderboard__avatar-placeholder, .leaderboard__avatar');
          if (avatar) {
            const ar = avatar.getBoundingClientRect();
            if (Math.abs(ar.width - ar.height) > 1 || ar.width < 16 || ar.width > 80) {
              problems.push(`board[${li}] entry ${ei}: avatar ${Math.round(ar.width)}x${Math.round(ar.height)} is not a sane square`);
            }
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('podium puts first place centered, tallest and largest', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const boards = [...document.querySelectorAll('snice-leaderboard[variant="podium"]')];
      if (boards.length === 0) problems.push('no podium boards in showcase');
      boards.forEach((host, bi) => {
        const podium = (host as any).shadowRoot?.querySelector('.leaderboard__podium');
        if (!podium) { problems.push(`podium[${bi}]: no podium block`); return; }
        const pr = podium.getBoundingClientRect();
        const get = (n: number) => podium.querySelector(`.leaderboard__podium-entry--${n}`);
        const [first, second, third] = [get(1), get(2), get(3)];
        if (!first || !second || !third) { problems.push(`podium[${bi}]: fewer than 3 places`); return; }
        const [f, s, t] = [first, second, third].map(e => e.getBoundingClientRect());

        // Rendering order across the podium is 2, 1, 3.
        if (!(s.left < f.left && f.left < t.left)) {
          problems.push(`podium[${bi}]: places not ordered 2-1-3 (${Math.round(s.left)}, ${Math.round(f.left)}, ${Math.round(t.left)})`);
        }
        // First place stands highest.
        if (f.top >= s.top || f.top >= t.top) {
          problems.push(`podium[${bi}]: first place not raised above 2nd/3rd`);
        }
        // ...and its avatar is the biggest.
        const av = (e: Element) => e.querySelector('.leaderboard__podium-avatar-placeholder, .leaderboard__podium-avatar');
        const sizes = [first, second, third].map(e => {
          const a = av(e);
          return a ? a.getBoundingClientRect() : null;
        });
        if (sizes.every(Boolean)) {
          const [fa, sa, ta] = sizes as DOMRect[];
          if (!(fa.width > sa.width && fa.width > ta.width)) {
            problems.push(`podium[${bi}]: first avatar ${Math.round(fa.width)} not larger than ${Math.round(sa.width)}/${Math.round(ta.width)}`);
          }
          sizes.forEach((a, i) => {
            if (Math.abs(a!.width - a!.height) > 1) {
              problems.push(`podium[${bi}] place ${i + 1}: avatar not square`);
            }
          });
        }
        // Everything stays inside the podium block.
        [f, s, t].forEach((r, i) => {
          if (r.left < pr.left - 1 || r.right > pr.right + 1 || r.bottom > pr.bottom + 1) {
            problems.push(`podium[${bi}] place ${i + 1}: escapes the podium block`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
