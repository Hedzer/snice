import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/pricing-table/demo.html';

test.describe('Snice Pricing Table visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('plan cards sit side by side on a shared mid-line without overlapping', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-pricing-table[variant="cards"]').forEach((host, ti) => {
        const rail = (host as any).shadowRoot?.querySelector('.pricing__cards');
        if (!rail) { problems.push(`table[${ti}]: no card rail`); return; }
        const rr = rail.getBoundingClientRect();
        const cards = [...rail.querySelectorAll('.pricing__card')] as HTMLElement[];
        if (cards.length === 0) { problems.push(`table[${ti}]: no cards`); return; }
        const rects = cards.map(c => c.getBoundingClientRect());
        const centers = rects.map(r => r.top + r.height / 2);
        // The highlighted plan is deliberately scaled up, so cards share a
        // vertical mid-line rather than a top edge.
        if (Math.max(...centers) - Math.min(...centers) > 1) {
          problems.push(`table[${ti}]: card mid-lines diverge ${centers.map(c => Math.round(c)).join(',')}`);
        }
        rects.forEach((r, i) => {
          if (r.left < rr.left - 1 || r.right > rr.right + 1) {
            problems.push(`table[${ti}] card ${i}: escapes the rail horizontally`);
          }
          if (i > 0 && r.left < rects[i - 1].right - 1) {
            problems.push(`table[${ti}] card ${i}: overlaps the previous card`);
          }
        });

        cards.forEach((card, i) => {
          const cr = rects[i];
          const cta = card.querySelector('.pricing__cta');
          if (cta) {
            const br = cta.getBoundingClientRect();
            if (br.left < cr.left - 1 || br.right > cr.right + 1 || br.bottom > cr.bottom + 1) {
              problems.push(`table[${ti}] card ${i}: CTA escapes the card`);
            }
            if (br.height < 24) {
              problems.push(`table[${ti}] card ${i}: CTA only ${Math.round(br.height)}px tall`);
            }
          }
          const badge = card.querySelector('.pricing__badge');
          if (badge) {
            const br = badge.getBoundingClientRect();
            const dx = (br.left + br.width / 2) - (cr.left + cr.width / 2);
            if (Math.abs(dx) > 1.5) {
              problems.push(`table[${ti}] card ${i}: badge off card center by ${dx.toFixed(1)}px`);
            }
            if (br.left < cr.left || br.right > cr.right) {
              problems.push(`table[${ti}] card ${i}: badge wider than its card`);
            }
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('feature rows keep their check icon at a sane size and clear of the label', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-pricing-table[variant="cards"]').forEach((host, ti) => {
        const root = (host as any).shadowRoot;
        if (!root) return;
        [...root.querySelectorAll('.pricing__features')].forEach((list: Element, li: number) => {
          const items = [...list.querySelectorAll('.pricing__feature')] as HTMLElement[];
          const rects = items.map(i => i.getBoundingClientRect());
          const listRect = list.getBoundingClientRect();
          const gaps: number[] = [];
          rects.forEach((r, i) => {
            if (r.left < listRect.left - 1 || r.right > listRect.right + 1) {
              problems.push(`table[${ti}] list ${li} row ${i}: escapes the feature list`);
            }
            if (i > 0) gaps.push(r.top - rects[i - 1].bottom);
          });
          if (gaps.length > 1 && Math.max(...gaps) - Math.min(...gaps) > 1) {
            problems.push(`table[${ti}] list ${li}: uneven feature pitch ${gaps.map(g => g.toFixed(1)).join(',')}`);
          }
          items.forEach((item, i) => {
            const icon = item.querySelector('svg');
            if (!icon) return;
            const ir = icon.getBoundingClientRect();
            const rr = rects[i];
            if (ir.width < 10 || ir.width > 32) {
              problems.push(`table[${ti}] list ${li} row ${i}: icon ${Math.round(ir.width)}px out of range`);
            }
            if (ir.height > rr.height + 1) {
              problems.push(`table[${ti}] list ${li} row ${i}: icon taller than its row`);
            }
            const label = item.querySelector('span');
            if (label) {
              const lr = label.getBoundingClientRect();
              if (lr.left < ir.right - 1) {
                problems.push(`table[${ti}] list ${li} row ${i}: label overlaps the icon`);
              }
            }
          });
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('the table variant keeps every column aligned across header and body', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-pricing-table[variant="table"]').forEach((host, ti) => {
        const table = (host as any).shadowRoot?.querySelector('.pricing__table');
        if (!table) { problems.push(`table[${ti}]: no table`); return; }
        const heads = [...table.querySelectorAll('thead th')].map(h => h.getBoundingClientRect());
        if (heads.length === 0) { problems.push(`table[${ti}]: no header cells`); return; }
        const rows = [...table.querySelectorAll('tbody tr')];
        rows.forEach((row, ri) => {
          const cells = [...row.querySelectorAll('td')].map(c => c.getBoundingClientRect());
          if (cells.length !== heads.length) {
            problems.push(`table[${ti}] row ${ri}: ${cells.length} cells for ${heads.length} columns`);
            return;
          }
          cells.forEach((c, ci) => {
            if (Math.abs(c.left - heads[ci].left) > 1 || Math.abs(c.width - heads[ci].width) > 1) {
              problems.push(`table[${ti}] row ${ri} col ${ci}: ${Math.round(c.left)}+${Math.round(c.width)} vs header ${Math.round(heads[ci].left)}+${Math.round(heads[ci].width)}`);
            }
          });
          const tops = cells.map(c => Math.round(c.top));
          if (Math.max(...tops) - Math.min(...tops) > 1) {
            problems.push(`table[${ti}] row ${ri}: uneven cell tops`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('switching to annual billing rebuilds prices without disturbing the card rail', async ({ page }) => {
    const before = await page.evaluate(() => {
      const host = document.querySelector('snice-pricing-table[variant="cards"]') as any;
      const root = host.shadowRoot;
      return {
        amounts: [...root.querySelectorAll('.pricing__amount')].map(a => a.textContent!.trim()),
        active: [...root.querySelectorAll('.pricing__toggle-btn')]
          .findIndex(b => b.classList.contains('pricing__toggle-btn--active')),
      };
    });
    expect(before.active).toBe(0);

    await page.evaluate(() => {
      const host = document.querySelector('snice-pricing-table[variant="cards"]') as any;
      const btns = [...host.shadowRoot.querySelectorAll('.pricing__toggle-btn')];
      (btns[1] as HTMLElement).click();
    });
    await page.waitForTimeout(300);

    const after = await page.evaluate(() => {
      const host = document.querySelector('snice-pricing-table[variant="cards"]') as any;
      const root = host.shadowRoot;
      const rail = root.querySelector('.pricing__cards').getBoundingClientRect();
      const cards = [...root.querySelectorAll('.pricing__card')].map(c => c.getBoundingClientRect());
      const centers = cards.map(c => c.top + c.height / 2);
      return {
        amounts: [...root.querySelectorAll('.pricing__amount')].map(a => a.textContent!.trim()),
        active: [...root.querySelectorAll('.pricing__toggle-btn')]
          .findIndex(b => b.classList.contains('pricing__toggle-btn--active')),
        centersAligned: Math.max(...centers) - Math.min(...centers) <= 1,
        inRail: cards.every(c => c.left >= rail.left - 1 && c.right <= rail.right + 1),
        priceInsideCard: [...root.querySelectorAll('.pricing__card')].every(card => {
          const cr = card.getBoundingClientRect();
          const p = card.querySelector('.pricing__price');
          if (!p) return true;
          const pr = p.getBoundingClientRect();
          return pr.left >= cr.left - 1 && pr.right <= cr.right + 1 && pr.bottom <= cr.bottom + 1;
        }),
      };
    });

    expect(after.active).toBe(1);
    expect(after.amounts).not.toEqual(before.amounts);
    expect(after.centersAligned).toBe(true);
    expect(after.inRail).toBe(true);
    expect(after.priceInsideCard).toBe(true);
  });
});
