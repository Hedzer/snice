import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/action-bar/visual.html';

test.describe('Snice Action Bar visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-action-bar'));
    await page.waitForFunction(() =>
      !!document.querySelector('snice-action-bar[no-animation]')?.shadowRoot?.querySelector('.action-bar'));
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('visible bars stay inside their host card and their buttons tile in one row', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const bars = [...document.querySelectorAll('snice-action-bar[no-animation], snice-action-bar[open]')] as HTMLElement[];
      if (bars.length === 0) problems.push('no always-visible action bars on the page');

      bars.forEach((bar, i) => {
        const card = bar.closest('.card') as HTMLElement | null;
        const inner = bar.shadowRoot?.querySelector('.action-bar') as HTMLElement | null;
        if (!card) { problems.push(`bar[${i}]: no .card ancestor`); return; }
        if (!inner) { problems.push(`bar[${i}]: no .action-bar`); return; }

        const cr = card.getBoundingClientRect();
        const br = inner.getBoundingClientRect();
        if (br.width < 20 || br.height < 20) {
          problems.push(`bar[${i}]: collapsed (${Math.round(br.width)}x${Math.round(br.height)})`);
          return;
        }
        // The bar is an absolutely-positioned overlay, but it must stay
        // within the card it decorates.
        if (br.left < cr.left - 1 || br.right > cr.right + 1
            || br.top < cr.top - 1 || br.bottom > cr.bottom + 1) {
          problems.push(`bar[${i}] (${bar.getAttribute('position')}): escapes its card`);
        }

        // Slotted buttons sit inside the bar, share a baseline, and are
        // ordered left-to-right without overlapping each other.
        const buttons = [...bar.querySelectorAll('snice-button')] as HTMLElement[];
        const rects = buttons.map(b => b.getBoundingClientRect());
        rects.forEach((r, bi) => {
          if (r.width < 8 || r.height < 8) {
            problems.push(`bar[${i}] button[${bi}]: ${Math.round(r.width)}x${Math.round(r.height)}`);
          }
          if (r.left < br.left - 1 || r.right > br.right + 1
              || r.top < br.top - 1 || r.bottom > br.bottom + 1) {
            problems.push(`bar[${i}] button[${bi}]: outside the bar box`);
          }
        });
        for (let bi = 1; bi < rects.length; bi++) {
          if (Math.abs(rects[bi].top - rects[bi - 1].top) > 1) {
            problems.push(`bar[${i}] button[${bi}]: not aligned with its neighbour`);
          }
          if (rects[bi].left < rects[bi - 1].right - 1) {
            problems.push(`bar[${i}] button[${bi}]: overlaps button[${bi - 1}]`);
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('show() reveals a hidden bottom bar centred inside its card', async ({ page }) => {
    // First card on the page is the hover-to-show pill at position="bottom".
    const before = await page.evaluate(() => {
      const bar = document.querySelector('snice-action-bar:not([no-animation]):not([open])') as HTMLElement;
      return { found: !!bar, visibility: bar ? getComputedStyle(bar).visibility : '' };
    });
    expect(before.found).toBe(true);
    expect(before.visibility).toBe('hidden');

    await page.evaluate(() => {
      const bar = document.querySelector('snice-action-bar:not([no-animation]):not([open])') as any;
      bar.show();
    });
    await page.waitForTimeout(500);

    const after = await page.evaluate(() => {
      const bar = document.querySelector('snice-action-bar[open]') as HTMLElement;
      const card = bar.closest('.card') as HTMLElement;
      const inner = bar.shadowRoot!.querySelector('.action-bar') as HTMLElement;
      const cr = card.getBoundingClientRect();
      const br = inner.getBoundingClientRect();
      return {
        position: bar.getAttribute('position'),
        visibility: getComputedStyle(bar).visibility,
        opacity: Number(getComputedStyle(bar).opacity),
        width: br.width,
        height: br.height,
        contained: br.left >= cr.left - 1 && br.right <= cr.right + 1
          && br.top >= cr.top - 1 && br.bottom <= cr.bottom + 1,
        // a position="bottom" bar must be horizontally centred on its card
        centerOffset: (br.left + br.width / 2) - (cr.left + cr.width / 2),
        // ...and sit in the lower half of the card
        inLowerHalf: br.top > cr.top + cr.height / 2
      };
    });

    expect(after.position).toBe('bottom');
    expect(after.visibility).toBe('visible');
    expect(after.opacity).toBeGreaterThan(0.9);
    expect(after.width).toBeGreaterThan(60);
    expect(after.height).toBeGreaterThan(20);
    expect(after.contained).toBe(true);
    expect(Math.abs(after.centerOffset)).toBeLessThanOrEqual(1.5);
    expect(after.inLowerHalf).toBe(true);
  });
});
