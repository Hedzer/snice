import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/checkbox/demo.html';

test.describe('Snice Checkbox visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-checkbox'));
    await page.waitForFunction(() =>
      !!document.querySelector('snice-checkbox')?.shadowRoot?.querySelector('.checkbox'));
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('every box is square, its glyph is centred inside it, and the label sits beside it', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const boxes = [...document.querySelectorAll('snice-checkbox')] as HTMLElement[];
      if (boxes.length === 0) problems.push('no snice-checkbox on the page');

      boxes.forEach((cb, i) => {
        const root = cb.shadowRoot;
        const box = root?.querySelector('.checkbox') as HTMLElement | null;
        if (!box) { problems.push(`checkbox[${i}]: no .checkbox`); return; }
        const br = box.getBoundingClientRect();
        const id = `checkbox[${i}](${cb.getAttribute('label') ?? 'no-label'})`;

        if (br.width < 10 || br.height < 10) {
          problems.push(`${id}: box ${Math.round(br.width)}x${Math.round(br.height)}`);
          return;
        }
        if (Math.abs(br.width - br.height) > 1) {
          problems.push(`${id}: box not square (${Math.round(br.width)}x${Math.round(br.height)})`);
        }

        // The tick / dash glyph must be centred inside the box and never
        // larger than it.
        const glyphClass = cb.hasAttribute('indeterminate')
          ? '.checkbox-icon--indeterminate' : '.checkbox-icon--check';
        const glyph = box.querySelector(glyphClass) as SVGElement | null;
        if (glyph) {
          const gr = glyph.getBoundingClientRect();
          if (gr.width > 0 && gr.height > 0) {
            if (gr.width > br.width + 1 || gr.height > br.height + 1) {
              problems.push(`${id}: glyph ${Math.round(gr.width)}x${Math.round(gr.height)} exceeds box`);
            }
            const dx = (gr.left + gr.width / 2) - (br.left + br.width / 2);
            const dy = (gr.top + gr.height / 2) - (br.top + br.height / 2);
            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
              problems.push(`${id}: glyph off centre by (${dx.toFixed(1)}, ${dy.toFixed(1)})`);
            }
          }
        }

        // A label must sit to the right of the box without overlapping it,
        // and its first text line must line up with the box's centre.
        const label = root!.querySelector('.checkbox-label') as HTMLElement | null;
        if (label) {
          const lr = label.getBoundingClientRect();
          if (lr.left < br.right - 1) {
            problems.push(`${id}: label overlaps the box`);
          }
          const range = document.createRange();
          range.selectNodeContents(label);
          const line = range.getBoundingClientRect();
          if (line.height > 0 && line.height < br.height * 2) {
            // Single-line labels only: their line box must centre on the box.
            const dy = (line.top + line.height / 2) - (br.top + br.height / 2);
            if (Math.abs(dy) > 2) {
              problems.push(`${id}: single-line label off box centre by ${dy.toFixed(1)}px`);
            }
          }
          const host = cb.getBoundingClientRect();
          if (lr.right > host.right + 1) {
            problems.push(`${id}: label overflows the host`);
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('size variants scale the box monotonically', async ({ page }) => {
    const sizes = await page.evaluate(() => {
      const pick = (size: string) => {
        const el = document.querySelector(`snice-checkbox[size="${size}"]`) as HTMLElement;
        const box = el.shadowRoot!.querySelector('.checkbox') as HTMLElement;
        return box.getBoundingClientRect().width;
      };
      return { small: pick('small'), medium: pick('medium'), large: pick('large') };
    });

    expect(sizes.small).toBeGreaterThan(8);
    expect(sizes.medium).toBeGreaterThan(sizes.small);
    expect(sizes.large).toBeGreaterThan(sizes.medium);
  });

  test('clicking an unchecked box checks it and reveals a centred tick', async ({ page }) => {
    const target = page.locator('snice-checkbox[label="Unchecked"]');
    await expect(target).toHaveCount(1);
    expect(await target.evaluate((el: any) => el.checked)).toBeFalsy();

    await target.click();
    await page.waitForFunction(() =>
      (document.querySelector('snice-checkbox[label="Unchecked"]') as any).checked === true);
    await page.waitForTimeout(250);

    const state = await target.evaluate((el: any) => {
      const box = el.shadowRoot.querySelector('.checkbox') as HTMLElement;
      const tick = box.querySelector('.checkbox-icon--check') as SVGElement;
      const br = box.getBoundingClientRect();
      const tr = tick.getBoundingClientRect();
      return {
        checked: el.checked,
        opacity: Number(getComputedStyle(tick).opacity),
        tickWidth: tr.width,
        fitsInBox: tr.width <= br.width + 1 && tr.height <= br.height + 1,
        dx: (tr.left + tr.width / 2) - (br.left + br.width / 2),
        dy: (tr.top + tr.height / 2) - (br.top + br.height / 2)
      };
    });

    expect(state.checked).toBe(true);
    expect(state.opacity).toBeGreaterThan(0.9);
    expect(state.tickWidth).toBeGreaterThan(4);
    expect(state.fitsInBox).toBe(true);
    expect(Math.abs(state.dx)).toBeLessThanOrEqual(1);
    expect(Math.abs(state.dy)).toBeLessThanOrEqual(1);
  });
});
