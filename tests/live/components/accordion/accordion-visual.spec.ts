import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/accordion/visual.html';

test.describe('Snice Accordion visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('items stack in a uniform column inside every accordion', async ({ page }) => {
    // The `elevated` variant lifts open items with a small scale transform, so
    // measure the *layout* box (offsetWidth/Height) rather than the painted one.
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-accordion').forEach((acc, ai) => {
        const items = [...acc.querySelectorAll('snice-accordion-item')] as HTMLElement[];
        if (items.length === 0) { problems.push(`acc[${ai}]: no items`); return; }
        const inner = (acc as HTMLElement).shadowRoot!.querySelector('.accordion') as HTMLElement;
        if (!inner) { problems.push(`acc[${ai}]: no .accordion`); return; }
        const accWidth = inner.clientWidth; // content box: excludes the bordered variant's frame

        const widths = items.map(i => i.offsetWidth);
        if (Math.max(...widths) - Math.min(...widths) > 1) {
          problems.push(`acc[${ai}]: items differ in width ${widths.join(',')}`);
        }
        if (Math.abs(widths[0] - accWidth) > 1) {
          problems.push(`acc[${ai}]: item width ${widths[0]} != accordion width ${Math.round(accWidth)}`);
        }

        // Untransformed layout tops/bottoms, derived from the painted box minus
        // the transform inflation, keep the seam check honest for both variants.
        const seams: number[] = [];
        for (let i = 0; i < items.length; i++) {
          const r = items[i].getBoundingClientRect();
          const inflate = (r.height - items[i].offsetHeight) / 2;
          if (items[i].offsetHeight < 20) {
            problems.push(`acc[${ai}] item[${i}]: collapsed to ${items[i].offsetHeight}px`);
          }
          if (i > 0) {
            const prev = items[i - 1].getBoundingClientRect();
            const prevInflate = (prev.height - items[i - 1].offsetHeight) / 2;
            seams.push((r.top + inflate) - (prev.bottom - prevInflate));
          }
        }
        seams.forEach((s, i) => {
          if (s < -0.5) problems.push(`acc[${ai}] item[${i + 1}]: overlaps previous by ${(-s).toFixed(1)}px`);
          if (Math.abs(s - seams[0]) > 1) {
            problems.push(`acc[${ai}] item[${i + 1}]: uneven seam ${s.toFixed(1)} vs ${seams[0].toFixed(1)}`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('header title never collides with the chevron and open panels have height', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-accordion-item').forEach((item, i) => {
        const root = (item as HTMLElement).shadowRoot!;
        const header = root.querySelector('.accordion-item__header') as HTMLElement;
        const title = root.querySelector('.accordion-item__title') as HTMLElement;
        const chevron = root.querySelector('.accordion-item__header svg') as SVGElement | null;
        const content = root.querySelector('.accordion-item__content') as HTMLElement;
        if (!header || !title || !content) { problems.push(`item[${i}]: missing parts`); return; }

        const hr = header.getBoundingClientRect();
        const tr = title.getBoundingClientRect();
        if (tr.left < hr.left - 1 || tr.right > hr.right + 1 || tr.height > hr.height + 1) {
          problems.push(`item[${i}]: title spills its header`);
        }
        if (chevron) {
          const cr = chevron.getBoundingClientRect();
          if (cr.width < 8 || cr.height < 8) {
            problems.push(`item[${i}]: chevron collapsed (${Math.round(cr.width)}x${Math.round(cr.height)})`);
          }
          if (tr.right > cr.left + 1) problems.push(`item[${i}]: title overlaps chevron`);
          const chevronMid = cr.top + cr.height / 2;
          const headerMid = hr.top + hr.height / 2;
          if (Math.abs(chevronMid - headerMid) > 1.5) {
            problems.push(`item[${i}]: chevron off-center by ${(chevronMid - headerMid).toFixed(1)}px`);
          }
        }

        // Open items must show a panel with height; closed items must be fully collapsed.
        const cr2 = content.getBoundingClientRect();
        const open = (item as any).open === true || item.hasAttribute('open');
        if (open && item.textContent!.trim().length > 0 && cr2.height < 1) {
          problems.push(`item[${i}]: marked open but panel is 0 high`);
        }
        if (!open && cr2.height > 1) {
          problems.push(`item[${i}]: closed but panel is ${Math.round(cr2.height)}px high`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('clicking a closed header expands it within its accordion', async ({ page }) => {
    const item = page.locator('snice-accordion-item[item-id="s2"]');
    const before = await item.evaluate(el => el.getBoundingClientRect().height);
    await item.locator('.accordion-item__header').click();
    await page.waitForTimeout(400);
    const after = await item.evaluate(el => ({
      h: el.getBoundingClientRect().height,
      panel: el.shadowRoot!.querySelector('.accordion-item__content')!.getBoundingClientRect(),
      host: el.getBoundingClientRect()
    }));
    expect(after.h).toBeGreaterThan(before);
    expect(after.panel.bottom).toBeLessThanOrEqual(after.host.bottom + 1);
    expect(after.panel.right).toBeLessThanOrEqual(after.host.right + 1);
  });
});
