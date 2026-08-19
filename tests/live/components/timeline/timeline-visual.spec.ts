import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/timeline/visual.html';

test.describe('Snice Timeline visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('items tile along the timeline axis without gaps or overlap', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const timelines = [...document.querySelectorAll('snice-timeline')] as any[];
      if (timelines.length === 0) problems.push('no timelines on page');

      timelines.forEach(host => {
        const id = host.id || '(anon)';
        const rail = host.shadowRoot?.querySelector('.timeline') as HTMLElement | null;
        if (!rail) { problems.push(`${id}: no .timeline`); return; }
        const items = [...rail.querySelectorAll('.timeline-item')] as HTMLElement[];
        if (items.length === 0) return; // the empty-items showcase draws nothing
        const rr = rail.getBoundingClientRect();
        const horizontal = rail.classList.contains('timeline--horizontal');
        const rects = items.map(i => i.getBoundingClientRect());

        // Items are laid out inside the rail.
        rects.forEach((r, i) => {
          if (r.left < rr.left - 1 || r.right > rr.right + 1
              || r.top < rr.top - 1 || r.bottom > rr.bottom + 1) {
            problems.push(`${id} item ${i}: escapes the timeline box`);
          }
        });

        if (horizontal) {
          // One row: shared top, advancing left to right with a constant gutter.
          const tops = rects.map(r => Math.round(r.top));
          if (Math.max(...tops) - Math.min(...tops) > 1) {
            problems.push(`${id}: horizontal items off one baseline ${tops.join(',')}`);
          }
          const sorted = [...rects].sort((a, b) => a.left - b.left);
          const gaps: number[] = [];
          for (let i = 1; i < sorted.length; i++) gaps.push(sorted[i].left - sorted[i - 1].right);
          gaps.forEach((g, i) => {
            if (g < 0) problems.push(`${id}: items ${i}/${i + 1} overlap by ${Math.round(-g)}px`);
          });
          if (gaps.length > 1 && Math.max(...gaps) - Math.min(...gaps) > 2) {
            problems.push(`${id}: uneven horizontal gutters ${gaps.map(g => Math.round(g)).join(',')}`);
          }
        } else {
          // One column: entries abut vertically with no seam. `reverse` uses
          // flex-direction: column-reverse, so measure in painted order.
          const stacked = [...rects].sort((a, b) => a.top - b.top);
          for (let i = 1; i < stacked.length; i++) {
            const seam = stacked[i].top - stacked[i - 1].bottom;
            if (Math.abs(seam) > 1) {
              problems.push(`${id} item ${i}: seam of ${Math.round(seam)}px`);
            }
          }
        }
      });
      return problems;
    });

    expect(failures).toEqual([]);
  });

  test('markers are uniform badges on a single axis and never cover the entry text', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      [...document.querySelectorAll('snice-timeline')].forEach((host: any) => {
        const id = host.id || '(anon)';
        const rail = host.shadowRoot?.querySelector('.timeline') as HTMLElement | null;
        if (!rail) return;
        const items = [...rail.querySelectorAll('.timeline-item')] as HTMLElement[];
        if (items.length === 0) return;
        const horizontal = rail.classList.contains('timeline--horizontal');

        const markerRects: DOMRect[] = [];
        items.forEach((item, i) => {
          const marker = item.querySelector('.timeline-item__marker') as HTMLElement | null;
          if (!marker) { problems.push(`${id} item ${i}: no marker`); return; }
          const mr = marker.getBoundingClientRect();
          markerRects.push(mr);

          // A marker is a small square badge with a visible glyph inside it.
          if (Math.abs(mr.width - mr.height) > 1 || mr.width < 12 || mr.width > 56) {
            problems.push(`${id} item ${i}: marker ${Math.round(mr.width)}x${Math.round(mr.height)}`);
          }
          const glyph = marker.querySelector('.timeline-item__icon') as HTMLElement | null;
          if (glyph) {
            const gr = glyph.getBoundingClientRect();
            if (gr.width < 6 || gr.width > mr.width + 1 || gr.height > mr.height + 1) {
              problems.push(`${id} item ${i}: icon ${Math.round(gr.width)}x${Math.round(gr.height)} `
                + `in a ${Math.round(mr.width)}px marker`);
            }
          }

          // Text runs must clear the marker badge entirely.
          ['.timeline-item__timestamp', '.timeline-item__title', '.timeline-item__description']
            .forEach(sel => {
              const run = item.querySelector(sel) as HTMLElement | null;
              if (!run) return;
              const tr = run.getBoundingClientRect();
              if (tr.width === 0 || tr.height === 0) return;
              const hits = tr.left < mr.right - 1 && tr.right > mr.left + 1
                && tr.top < mr.bottom - 1 && tr.bottom > mr.top + 1;
              if (hits) problems.push(`${id} item ${i}: ${sel} runs under the marker`);
            });
        });

        // Markers form one straight rail: a shared column (vertical) or a
        // shared row (horizontal). `alternate` deliberately flips sides, so
        // allow at most two distinct rail positions.
        if (markerRects.length > 1) {
          const axis = markerRects.map(r => Math.round(horizontal ? r.top : r.left));
          const distinct = [...new Set(axis)];
          const allowed = rail.classList.contains('timeline--alternate') ? 2 : 1;
          if (distinct.length > allowed) {
            problems.push(`${id}: markers on ${distinct.length} rails (${distinct.join(',')}), `
              + `expected at most ${allowed}`);
          }
        }
      });
      return problems;
    });

    expect(failures).toEqual([]);
  });

  // BUG: `reverse` reverses twice and so paints nothing differently. The rail
  // both emits the items in reversed DOM order AND sets
  // `flex-direction: column-reverse`, so #tl-reverse renders top-to-bottom as
  // "Project Created, Design Review, Development Started, Bug Found, Deadline
  // Warning" - byte-identical to #tl-left. The attribute is a visual no-op.
  test.fixme('reverse flips the painted entry order', async ({ page }) => {
    const orders = await page.evaluate(() => {
      // Painted order, not DOM order: read the titles sorted by y.
      const titles = (id: string) => {
        const host = document.getElementById(id) as any;
        return ([...host.shadowRoot.querySelectorAll('.timeline-item')] as HTMLElement[])
          .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)
          .map(i => i.querySelector('.timeline-item__title')?.textContent?.trim() ?? '');
      };
      return { forward: titles('tl-left'), reversed: titles('tl-reverse') };
    });

    expect(orders.forward.length).toBeGreaterThan(1);
    expect(orders.reversed).toEqual([...orders.forward].reverse());
  });
});
