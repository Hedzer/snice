import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/select/demo.html';

test.describe('Snice Select visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('trigger keeps its value text and icons on one contained line', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-select').forEach((host, i) => {
        const root = (host as HTMLElement).shadowRoot;
        const trigger = root?.querySelector('.select-trigger') as HTMLElement | null;
        if (!trigger) return; // editable/combobox variants render an input instead
        const tr = trigger.getBoundingClientRect();
        if (tr.height < 24) {
          problems.push(`select[${i}]: trigger too short (${Math.round(tr.height)}px)`);
        }
        const value = trigger.querySelector('.select-value') as HTMLElement | null;
        const icons = trigger.querySelector('.select-icons') as HTMLElement | null;
        [['value', value], ['icons', icons]].forEach(([what, el]) => {
          if (!el) return;
          const r = (el as HTMLElement).getBoundingClientRect();
          if (r.width === 0) return;
          if (r.left < tr.left - 1 || r.right > tr.right + 1
              || r.top < tr.top - 1 || r.bottom > tr.bottom + 1) {
            problems.push(`select[${i}]: ${what} escapes the trigger`);
          }
        });
        if (value && icons) {
          // `.select-icons` is absolutely positioned over the trigger's right
          // padding by design, so compare against the *rendered* value text
          // rather than the value box.
          const walker = document.createTreeWalker(value, NodeFilter.SHOW_TEXT);
          let textRight = -Infinity;
          let node: Node | null;
          while ((node = walker.nextNode())) {
            if (!node.textContent?.trim()) continue;
            const range = document.createRange();
            range.selectNodeContents(node);
            textRight = Math.max(textRight, range.getBoundingClientRect().right);
          }
          const ir = icons.getBoundingClientRect();
          if (ir.width > 0 && textRight > -Infinity && ir.left < textRight - 1) {
            problems.push(`select[${i}]: arrow/clear icons overlap the value text`
              + ` (icons.left ${Math.round(ir.left)} < text.right ${Math.round(textRight)})`);
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('opened dropdown anchors to its trigger at a sane size', async ({ page }) => {
    await page.locator('#basic-select').evaluate((host: HTMLElement) => {
      (host.shadowRoot!.querySelector('.select-trigger') as HTMLElement).click();
    });
    await page.waitForTimeout(250);

    const geo = await page.evaluate(() => {
      const host = document.querySelector('#basic-select') as HTMLElement;
      const root = host.shadowRoot!;
      const dd = root.querySelector('.select-dropdown--open') as HTMLElement | null;
      if (!dd) return null;
      const trigger = root.querySelector('.select-trigger')!.getBoundingClientRect();
      const d = dd.getBoundingClientRect();
      const options = [...dd.querySelectorAll('.select-option')] as HTMLElement[];
      return {
        trigger: { left: trigger.left, right: trigger.right, bottom: trigger.bottom, width: trigger.width },
        dropdown: { left: d.left, right: d.right, top: d.top, width: d.width, height: d.height },
        optionCount: options.length,
        firstOption: options[0] ? {
          left: options[0].getBoundingClientRect().left,
          right: options[0].getBoundingClientRect().right,
          height: options[0].getBoundingClientRect().height,
        } : null,
        viewportWidth: window.innerWidth,
      };
    });

    expect(geo, 'dropdown did not open').not.toBeNull();
    // Anchored: same column as the trigger, immediately below it.
    expect(Math.abs(geo!.dropdown.left - geo!.trigger.left)).toBeLessThanOrEqual(2);
    expect(Math.abs(geo!.dropdown.width - geo!.trigger.width)).toBeLessThanOrEqual(2);
    expect(geo!.dropdown.top).toBeGreaterThanOrEqual(geo!.trigger.bottom - 1);
    expect(geo!.dropdown.top - geo!.trigger.bottom).toBeLessThanOrEqual(16);
    // Sane size, on screen, with options inside it.
    expect(geo!.dropdown.height).toBeGreaterThan(40);
    expect(geo!.dropdown.right).toBeLessThanOrEqual(geo!.viewportWidth + 1);
    expect(geo!.optionCount).toBeGreaterThan(0);
    expect(geo!.firstOption!.height).toBeGreaterThan(16);
    expect(geo!.firstOption!.left).toBeGreaterThanOrEqual(geo!.dropdown.left - 1);
    expect(geo!.firstOption!.right).toBeLessThanOrEqual(geo!.dropdown.right + 1);
  });

  test('searchable dropdown puts the search row above a scrollable option list', async ({ page }) => {
    const failures = await page.evaluate(async () => {
      const problems: string[] = [];
      const host = document.querySelector('#searchable-select') as HTMLElement | null;
      if (!host) { problems.push('showcase has no #searchable-select'); return problems; }
      const root = host.shadowRoot!;
      (root.querySelector('.select-trigger') as HTMLElement).click();
      await new Promise(r => setTimeout(r, 250));

      const dd = root.querySelector('.select-dropdown--open') as HTMLElement | null;
      if (!dd) { problems.push('dropdown did not open'); return problems; }
      const dr = dd.getBoundingClientRect();
      const search = root.querySelector('.select-search') as HTMLElement | null;
      const list = root.querySelector('.select-options') as HTMLElement | null;
      if (!search || search.hasAttribute('hidden')) { problems.push('search row is hidden'); return problems; }
      if (!list) { problems.push('no option list'); return problems; }
      const sr = search.getBoundingClientRect();
      const lr = list.getBoundingClientRect();

      if (sr.left < dr.left - 1 || sr.right > dr.right + 1 || sr.top < dr.top - 1) {
        problems.push('search row escapes the dropdown');
      }
      if (lr.top < sr.bottom - 1) {
        problems.push(`option list (top ${Math.round(lr.top)}) overlaps the search row`
          + ` (bottom ${Math.round(sr.bottom)})`);
      }
      if (lr.bottom > dr.bottom + 1) {
        problems.push('option list overflows the dropdown panel');
      }
      // An over-long list must scroll, not grow past the panel.
      if (list.scrollHeight > list.clientHeight + 1
          && getComputedStyle(list).overflowY === 'visible') {
        problems.push('option list overflows without scrolling');
      }
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
