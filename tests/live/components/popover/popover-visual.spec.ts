import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/popover/visual.html';

/** Opens exactly one popover by index and waits for its panel to be laid out. */
async function openOnly(page: import('@playwright/test').Page, index: number) {
  const pop = page.locator('snice-popover').nth(index);
  await pop.locator('[slot="trigger"]').click();
  await expect.poll(() => pop.evaluate((el: any) => {
    const r = el.shadowRoot.querySelector('.popover__panel').getBoundingClientRect();
    return el.open && r.width > 0 && r.height > 0;
  })).toBe(true);
  await page.waitForTimeout(250); // let the open transition settle
  return pop;
}

test.describe('Snice Popover visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('an opened panel is a sane size, fully on screen, and holds its content', async ({ page }) => {
    const count = await page.locator('snice-popover').count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const pop = await openOnly(page, i);
      const problems = await pop.evaluate((el: any) => {
        const found: string[] = [];
        const label = el.getAttribute('placement') || '(default)';
        const panel = el.shadowRoot.querySelector('.popover__panel') as HTMLElement;
        const pr = panel.getBoundingClientRect();

        if (pr.width < 40 || pr.height < 20) {
          found.push(`${label}: panel is ${Math.round(pr.width)}x${Math.round(pr.height)}`);
        }
        if (pr.left < 0 || pr.top < 0
            || pr.right > window.innerWidth + 1 || pr.bottom > window.innerHeight + 1) {
          found.push(`${label}: panel ${Math.round(pr.left)},${Math.round(pr.top)}..`
            + `${Math.round(pr.right)},${Math.round(pr.bottom)} leaves the `
            + `${window.innerWidth}x${window.innerHeight} viewport`);
        }
        // Slotted body sits inside the panel it was projected into.
        const body = el.querySelector('.panel-body') as HTMLElement | null;
        if (body) {
          const br = body.getBoundingClientRect();
          if (br.left < pr.left - 1 || br.right > pr.right + 1
              || br.top < pr.top - 1 || br.bottom > pr.bottom + 1) {
            found.push(`${label}: slotted body escapes the panel`);
          }
        }
        return found;
      });
      expect(problems).toEqual([]);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(150);
    }
  });

  // BUG: only `bottom-start` honours its placement. Measured on this showcase
  // at 1280x720:
  //   placement="top"   panel 58,261..276,302 sits ON TOP OF its trigger
  //                     (32,267..84,300) instead of above it.
  //   placement="left"  panel 275,284..493,325 is laid out to the RIGHT of its
  //                     trigger (281,267..332,300) - the panel width is never
  //                     subtracted, so it uses trigger.left - 6 as its own left.
  //   placement="right" panel top is set to the trigger's centre-Y (283.5)
  //                     instead of being centred on it, so it hangs ~20px low.
  //   default bottom-end aligns the panel's LEFT edge to the trigger's RIGHT
  //                     edge instead of aligning the two right edges.
  test.fixme('each placement puts the panel on the named side of its trigger', async ({ page }) => {
    const count = await page.locator('snice-popover').count();
    const problems: string[] = [];

    for (let i = 0; i < count; i++) {
      const pop = await openOnly(page, i);
      problems.push(...await pop.evaluate((el: any) => {
        const found: string[] = [];
        const placement = el.getAttribute('placement') || 'bottom-end';
        const t = (el.querySelector('[slot="trigger"]') as HTMLElement).getBoundingClientRect();
        const p = (el.shadowRoot.querySelector('.popover__panel') as HTMLElement)
          .getBoundingClientRect();
        const side = placement.split('-')[0];
        const align = placement.split('-')[1];

        const overlaps = p.left < t.right && p.right > t.left
          && p.top < t.bottom && p.bottom > t.top;
        if (overlaps) found.push(`${placement}: panel overlaps its trigger`);

        if (side === 'top' && p.bottom > t.top + 1) found.push(`${placement}: panel is not above the trigger`);
        if (side === 'bottom' && p.top < t.bottom - 1) found.push(`${placement}: panel is not below the trigger`);
        if (side === 'left' && p.right > t.left + 1) found.push(`${placement}: panel is not left of the trigger`);
        if (side === 'right' && p.left < t.right - 1) found.push(`${placement}: panel is not right of the trigger`);

        if (align === 'start' && Math.abs(p.left - t.left) > 1) {
          found.push(`${placement}: start edges misaligned (${Math.round(p.left)} vs ${Math.round(t.left)})`);
        }
        if (align === 'end' && Math.abs(p.right - t.right) > 1) {
          found.push(`${placement}: end edges misaligned (${Math.round(p.right)} vs ${Math.round(t.right)})`);
        }
        if (!align && (side === 'left' || side === 'right')) {
          const dy = (p.top + p.height / 2) - (t.top + t.height / 2);
          if (Math.abs(dy) > 2) found.push(`${placement}: panel off the trigger's centre by ${dy.toFixed(1)}px`);
        }
        return found;
      }));
      await page.keyboard.press('Escape');
      await page.waitForTimeout(150);
    }

    expect(problems).toEqual([]);
  });
});
