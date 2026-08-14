import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/weather/demo.html';

test.describe('Snice Weather visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('the current-conditions block keeps its icon and readings inside the card', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const cards = [...document.querySelectorAll('snice-weather')] as any[];
      if (cards.length === 0) problems.push('no weather cards on page');

      cards.forEach(card => {
        const id = card.id || '(anon)';
        const shell = card.shadowRoot?.querySelector('.weather') as HTMLElement | null;
        if (!shell) { problems.push(`${id}: no .weather`); return; }
        const current = shell.querySelector('.current') as HTMLElement | null;
        if (!current || current.getBoundingClientRect().height === 0) return; // no-data card

        const sr = shell.getBoundingClientRect();
        const cr = current.getBoundingClientRect();
        if (cr.left < sr.left - 1 || cr.right > sr.right + 1
            || cr.top < sr.top - 1 || cr.bottom > sr.bottom + 1) {
          problems.push(`${id}: .current escapes the card`);
        }

        const icon = current.querySelector('.icon') as HTMLElement | null;
        const temp = current.querySelector('.temp') as HTMLElement | null;
        const condition = current.querySelector('.condition') as HTMLElement | null;
        if (!icon || !temp || !condition) { problems.push(`${id}: incomplete current block`); return; }

        const ir = icon.getBoundingClientRect();
        const tr = temp.getBoundingClientRect();
        const cnr = condition.getBoundingClientRect();

        // The condition glyph is a legible badge, not a collapsed or runaway box.
        if (ir.width < 12 || ir.height < 12 || ir.width > 120 || ir.height > 120) {
          problems.push(`${id}: icon ${Math.round(ir.width)}x${Math.round(ir.height)}`);
        }
        // Icon on the left, readings to its right - never overlapping.
        if (ir.right > tr.left + 1) problems.push(`${id}: icon overlaps the temperature`);
        // Temperature above condition text, both inside the block.
        if (cnr.top < tr.bottom - 1) problems.push(`${id}: condition overlaps the temperature`);
        [['icon', ir], ['temp', tr], ['condition', cnr]].forEach(([name, r]) => {
          const rect = r as DOMRect;
          if (rect.left < cr.left - 1 || rect.right > cr.right + 1
              || rect.top < cr.top - 1 || rect.bottom > cr.bottom + 1) {
            problems.push(`${id}: ${name} escapes the current block`);
          }
        });
      });
      return problems;
    });

    expect(failures).toEqual([]);
  });

  test('forecast days tile the strip with equal cells and one gutter', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      [...document.querySelectorAll('snice-weather')].forEach((card: any) => {
        const id = card.id || '(anon)';
        const strip = card.shadowRoot?.querySelector('.forecast') as HTMLElement | null;
        if (!strip || strip.getBoundingClientRect().height === 0) return;
        const sr = strip.getBoundingClientRect();
        const days = ([...strip.querySelectorAll('.forecast-day')] as HTMLElement[])
          .filter(d => d.getBoundingClientRect().width > 0);
        if (days.length === 0) { problems.push(`${id}: forecast strip has no days`); return; }

        const rects = days.map(d => d.getBoundingClientRect());

        // Equal cells on one baseline.
        const widths = rects.map(r => Math.round(r.width));
        const tops = rects.map(r => Math.round(r.top));
        if (Math.max(...widths) - Math.min(...widths) > 1) {
          problems.push(`${id}: uneven forecast cells ${widths.join(',')}`);
        }
        if (Math.max(...tops) - Math.min(...tops) > 1) {
          problems.push(`${id}: forecast cells off one baseline ${tops.join(',')}`);
        }

        // One constant gutter, never a collision.
        const gaps: number[] = [];
        for (let i = 1; i < rects.length; i++) gaps.push(rects[i].left - rects[i - 1].right);
        gaps.forEach((g, i) => {
          if (g < 0) problems.push(`${id}: forecast days ${i}/${i + 1} overlap by ${Math.round(-g)}px`);
        });
        if (gaps.length > 1 && Math.max(...gaps) - Math.min(...gaps) > 1) {
          problems.push(`${id}: uneven forecast gutters ${gaps.map(g => Math.round(g)).join(',')}`);
        }

        // The strip is a horizontal scroller (overflow:auto); its scroll extent
        // must cover the cells, and the cells must fit it vertically.
        const contentRight = rects[rects.length - 1].right;
        const reach = sr.left + strip.scrollWidth;
        if (contentRight > reach + 1) {
          problems.push(`${id}: forecast content reaches ${Math.round(contentRight)} but the `
            + `strip only scrolls to ${Math.round(reach)}`);
        }
        rects.forEach((r, i) => {
          if (r.top < sr.top - 1 || r.bottom > sr.bottom + 1) {
            problems.push(`${id}: forecast day ${i} overflows the strip vertically`);
          }
        });

        // Inside each day: name above icon above temps, all contained.
        days.forEach((day, i) => {
          const dr = day.getBoundingClientRect();
          const name = day.querySelector('.forecast-day-name')?.getBoundingClientRect();
          const icon = day.querySelector('.forecast-icon')?.getBoundingClientRect();
          const temps = day.querySelector('.forecast-temps')?.getBoundingClientRect();
          if (!name || !icon || !temps) { problems.push(`${id} day ${i}: incomplete`); return; }
          if (icon.top < name.bottom - 1) problems.push(`${id} day ${i}: icon overlaps the day name`);
          if (temps.top < icon.bottom - 1) problems.push(`${id} day ${i}: temps overlap the icon`);
          [name, icon, temps].forEach(r => {
            if (r.top < dr.top - 1 || r.bottom > dr.bottom + 1) {
              problems.push(`${id} day ${i}: a row escapes the cell`);
            }
          });
        });
      });
      return problems;
    });

    expect(failures).toEqual([]);
  });

  test('the compact variant drops the details and forecast rows', async ({ page }) => {
    const shapes = await page.evaluate(() => {
      const read = (id: string) => {
        const card = document.getElementById(id) as any;
        const root = card.shadowRoot;
        const vis = (sel: string) => {
          const el = root.querySelector(sel);
          return !!el && el.getBoundingClientRect().height > 0;
        };
        return {
          height: Math.round(card.getBoundingClientRect().height),
          details: vis('.details'),
          forecast: vis('.forecast'),
        };
      };
      return { full: read('w-full'), compact: read('w-compact') };
    });

    expect(shapes.full.details).toBe(true);
    expect(shapes.full.forecast).toBe(true);
    expect(shapes.compact.details).toBe(false);
    expect(shapes.compact.forecast).toBe(false);
    expect(shapes.compact.height).toBeLessThan(shapes.full.height);
  });
});
