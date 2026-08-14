import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/tag-input/demo.html';

test.describe('Snice Tag Input visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-tag-input'));
    await page.waitForFunction(() =>
      (document.querySelector('#many-tags') as any)?.shadowRoot?.querySelectorAll('.tag').length === 10);
    // Chip widths keep growing until webfonts land; measure only after that.
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('tag chips wrap inside the field without overflowing or overlapping', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-tag-input').forEach((host: any, i) => {
        const container = host.shadowRoot.querySelector('.tag-input-container') as HTMLElement;
        const cr = container.getBoundingClientRect();
        if (cr.height < 40 - 1) {
          problems.push(`tagInput[${i}]: container only ${Math.round(cr.height)}px tall`);
        }
        const tags = [...container.querySelectorAll('.tag')] as HTMLElement[];
        const rects = tags.map(t => t.getBoundingClientRect());

        rects.forEach((r, n) => {
          if (r.left < cr.left - 0.5 || r.right > cr.right + 0.5
              || r.top < cr.top - 0.5 || r.bottom > cr.bottom + 0.5) {
            problems.push(`tagInput[${i}] tag[${n}] "${tags[n].textContent!.trim()}": escapes the field`);
          }
          if (r.height < 16) {
            problems.push(`tagInput[${i}] tag[${n}]: only ${Math.round(r.height)}px tall`);
          }
        });

        // Group into visual rows, then check each row abuts without overlap.
        const rows = new Map<number, DOMRect[]>();
        rects.forEach(r => {
          const key = [...rows.keys()].find(k => Math.abs(k - r.top) <= 2) ?? r.top;
          rows.set(key, [...(rows.get(key) ?? []), r]);
        });
        for (const row of rows.values()) {
          const sorted = [...row].sort((a, b) => a.left - b.left);
          for (let n = 1; n < sorted.length; n++) {
            const gap = sorted[n].left - sorted[n - 1].right;
            if (gap < -0.5) problems.push(`tagInput[${i}]: chips overlap`);
            if (gap > 10) problems.push(`tagInput[${i}]: ${gap.toFixed(1)}px gap between chips`);
          }
          const centres = sorted.map(r => r.top + r.height / 2);
          if (Math.max(...centres) - Math.min(...centres) > 1) {
            problems.push(`tagInput[${i}]: chips in one row are not vertically aligned`);
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('each chip keeps its text and remove button side by side inside the chip', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-tag-input').forEach((host: any, i) => {
        [...host.shadowRoot.querySelectorAll('.tag')].forEach((tag: any, n) => {
          const tr = tag.getBoundingClientRect();
          const text = tag.querySelector('.tag-text').getBoundingClientRect();
          if (text.left < tr.left - 0.5 || text.right > tr.right + 0.5) {
            problems.push(`tagInput[${i}] tag[${n}]: text escapes the chip`);
          }
          const remove = tag.querySelector('.tag-remove');
          if (!remove) return; // disabled / readonly chips carry no remove button
          const rr = remove.getBoundingClientRect();
          if (rr.left < text.right - 0.5) {
            problems.push(`tagInput[${i}] tag[${n}]: remove button overlaps the text`);
          }
          if (rr.right > tr.right + 0.5 || rr.top < tr.top - 0.5 || rr.bottom > tr.bottom + 0.5) {
            problems.push(`tagInput[${i}] tag[${n}]: remove button escapes the chip`);
          }
          if (rr.width < 10 || rr.height < 10) {
            problems.push(`tagInput[${i}] tag[${n}]: remove button ${Math.round(rr.width)}x${Math.round(rr.height)} too small`);
          }
          const dy = (rr.top + rr.height / 2) - (tr.top + tr.height / 2);
          if (Math.abs(dy) > 1.5) {
            problems.push(`tagInput[${i}] tag[${n}]: remove button off centre by ${dy.toFixed(1)}px`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('typing opens a suggestion list flush under the field', async ({ page }) => {
    const host = page.locator('#with-suggestions');
    await host.locator('input').fill('ja');
    await expect
      .poll(() => host.evaluate((el: any) => el.shadowRoot.querySelectorAll('.tag-suggestion-item').length))
      .toBeGreaterThan(0);

    const geometry = await host.evaluate((el: any) => {
      const container = el.shadowRoot.querySelector('.tag-input-container').getBoundingClientRect();
      const panel = el.shadowRoot.querySelector('.tag-suggestions').getBoundingClientRect();
      const items = [...el.shadowRoot.querySelectorAll('.tag-suggestion-item')]
        .map((i: any) => i.getBoundingClientRect());
      let seams = 0;
      for (let n = 1; n < items.length; n++) {
        if (Math.abs(items[n].top - items[n - 1].bottom) > 0.5) seams++;
      }
      return {
        panelWidth: panel.width,
        containerWidth: container.width,
        dropGap: panel.top - container.bottom,
        panelHeight: panel.height,
        itemCount: items.length,
        firstItemHeight: items[0].height,
        itemsInside: items.every(r => r.left >= panel.left - 0.5 && r.right <= panel.right + 0.5),
        seams
      };
    });

    // Spans the field (the panel is inset -1px on each side to cover the border).
    expect(Math.abs(geometry.panelWidth - geometry.containerWidth)).toBeLessThanOrEqual(3);
    expect(geometry.dropGap).toBeGreaterThanOrEqual(0);
    expect(geometry.dropGap).toBeLessThanOrEqual(6);
    expect(geometry.panelHeight).toBeLessThanOrEqual(200);
    expect(geometry.firstItemHeight).toBeGreaterThanOrEqual(20);
    expect(geometry.itemsInside).toBe(true);
    // Options tile the panel with no gaps between them.
    expect(geometry.seams).toBe(0);
  });

  test('removing a chip reflows the remaining ones without leaving a hole', async ({ page }) => {
    const host = page.locator('#prepop');
    const before = await host.evaluate((el: any) =>
      [...el.shadowRoot.querySelectorAll('.tag')].map((t: any) => t.textContent.trim()));
    expect(before).toHaveLength(3);

    await host.evaluate((el: any) =>
      (el.shadowRoot.querySelectorAll('.tag-remove')[0] as HTMLElement).click());
    await expect.poll(() => host.evaluate((el: any) => el.value.length)).toBe(2);
    // Re-rendered chips replay the 150ms `tag-appear` scale; measure at rest.
    await host.evaluate((el: any) => Promise.all(
      [...el.shadowRoot.querySelectorAll('.tag')]
        .flatMap((t: any) => t.getAnimations().map((a: Animation) => a.finished))));

    const after = await host.evaluate((el: any) => {
      const cr = el.shadowRoot.querySelector('.tag-input-container').getBoundingClientRect();
      const tags = [...el.shadowRoot.querySelectorAll('.tag')].map((t: any) => t.getBoundingClientRect());
      return {
        count: tags.length,
        firstOffset: tags[0].left - cr.left,
        gap: tags[1].left - tags[0].right,
        containerHeight: cr.height
      };
    });

    expect(after.count).toBe(2);
    // The survivors slide back to the field's padding edge — no gap where the
    // removed chip used to be.
    expect(after.firstOffset).toBeLessThanOrEqual(10);
    expect(after.gap).toBeLessThanOrEqual(10);
    expect(after.containerHeight).toBeGreaterThanOrEqual(39);
  });
});
