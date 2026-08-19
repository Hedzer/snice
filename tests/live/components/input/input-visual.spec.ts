import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/input/visual.html';

test.describe('Snice Input visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-input'));
    await page.waitForFunction(() =>
      !!document.querySelector('snice-input')?.shadowRoot?.querySelector('input'));
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('label, field and help text stack without overlapping', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-input').forEach((host: any, i) => {
        const root = host.shadowRoot;
        const field = root.querySelector('.input') as HTMLElement;
        const fr = field.getBoundingClientRect();
        const label = root.querySelector('.label') as HTMLElement | null;
        const help = root.querySelector('.helper-text, .error-text') as HTMLElement | null;

        if (label) {
          const lr = label.getBoundingClientRect();
          if (lr.bottom > fr.top + 0.5) {
            problems.push(`input[${i}] "${host.getAttribute('label')}": label overlaps the field`);
          }
          if (lr.left < host.getBoundingClientRect().left - 1) {
            problems.push(`input[${i}]: label escapes the host on the left`);
          }
        }
        if (help) {
          const hr = help.getBoundingClientRect();
          if (hr.top < fr.bottom - 0.5) {
            problems.push(`input[${i}]: helper/error text overlaps the field`);
          }
          if (hr.right > host.getBoundingClientRect().right + 1) {
            problems.push(`input[${i}]: helper/error text escapes the host on the right`);
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('size variants hit their documented control heights', async ({ page }) => {
    const heights = await page.evaluate(() => {
      const of = (size: string) => {
        const host = document.querySelector(`snice-input[size="${size}"]`) as any;
        return host.shadowRoot.querySelector('.input').getBoundingClientRect().height;
      };
      return { small: of('small'), medium: of('medium'), large: of('large') };
    });
    expect(heights.small).toBeGreaterThanOrEqual(32);
    expect(heights.medium).toBeGreaterThanOrEqual(40);
    expect(heights.large).toBeGreaterThanOrEqual(48);
    expect(heights.medium).toBeGreaterThan(heights.small);
    expect(heights.large).toBeGreaterThan(heights.medium);
  });

  test('prefix/suffix affordances are centred inside the field, not over the text', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-input').forEach((host: any, i) => {
        const root = host.shadowRoot;
        const field = root.querySelector('.input') as HTMLElement;
        const fr = field.getBoundingClientRect();
        const overlays = [
          ...root.querySelectorAll('.icon-slot, .password-toggle, .spinner')
        ] as HTMLElement[];
        overlays.forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return; // empty slot, collapsed by design
          const name = el.className.split(' ')[0];
          if (r.left < fr.left - 1 || r.right > fr.right + 1
              || r.top < fr.top - 1 || r.bottom > fr.bottom + 1) {
            problems.push(`input[${i}] .${name}: sits outside the field box`);
          }
          const dy = (r.top + r.height / 2) - (fr.top + fr.height / 2);
          if (Math.abs(dy) > 1.5) {
            problems.push(`input[${i}] .${name}: off vertical centre by ${dy.toFixed(1)}px`);
          }
          if (r.width > fr.height + 4) {
            problems.push(`input[${i}] .${name}: ${Math.round(r.width)}px wide, larger than the field is tall`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('the clear button reveals inside the field and clears it', async ({ page }) => {
    const host = page.locator('snice-input[clearable][value]').first();
    await host.locator('input').hover();
    await expect.poll(() => host.evaluate((el: any) =>
      getComputedStyle(el.shadowRoot.querySelector('.clear-button')).visibility)).toBe('visible');
    const geometry = await host.evaluate((el: any) => {
      const field = el.shadowRoot.querySelector('.input').getBoundingClientRect();
      const btn = el.shadowRoot.querySelector('.clear-button');
      const r = btn.getBoundingClientRect();
      return {
        width: r.width, height: r.height,
        insideRight: r.right <= field.right + 1 && r.left >= field.left,
        dy: (r.top + r.height / 2) - (field.top + field.height / 2)
      };
    });
    expect(geometry.width).toBeGreaterThanOrEqual(16);
    expect(geometry.height).toBeGreaterThanOrEqual(16);
    expect(geometry.insideRight).toBe(true);
    expect(Math.abs(geometry.dy)).toBeLessThanOrEqual(1.5);

    await host.evaluate((el: any) => el.shadowRoot.querySelector('.clear-button').click());
    await expect.poll(() => host.evaluate((el: any) => el.value)).toBe('');
  });

  test('stretch fills the tall host while the default sibling keeps its control height', async ({ page }) => {
    const measured = await page.evaluate(() => {
      const read = (el: any) => {
        const host = el.getBoundingClientRect();
        const field = el.shadowRoot.querySelector('.input').getBoundingClientRect();
        const label = el.shadowRoot.querySelector('.label').getBoundingClientRect();
        return {
          hostHeight: host.height,
          fieldHeight: field.height,
          fieldWidth: field.width,
          hostWidth: host.width,
          fits: field.bottom <= host.bottom + 1 && field.top >= label.bottom - 1
        };
      };
      const stretch = read(document.querySelector('snice-input[stretch]'));
      const plain = read(document.querySelector('snice-input[label="Default (no stretch)"]'));
      return { stretch, plain };
    });

    expect(measured.stretch.hostHeight).toBeGreaterThan(150);
    // The stretched field should take everything the label leaves behind.
    expect(measured.stretch.fieldHeight).toBeGreaterThan(measured.stretch.hostHeight * 0.7);
    expect(measured.stretch.fits).toBe(true);
    // ...and the un-stretched control in the same row must not follow it.
    expect(measured.plain.fieldHeight).toBeLessThan(60);
    // Both stay within their host horizontally.
    expect(measured.stretch.fieldWidth).toBeLessThanOrEqual(measured.stretch.hostWidth + 1);
  });

  test('align=top/center/bottom actually move the control within a tall host', async ({ page }) => {
    const offsets = await page.evaluate(() => {
      const centreOf = (align: string) => {
        const el = document.querySelector(`snice-input[align="${align}"]`) as any;
        const host = el.getBoundingClientRect();
        // The wrapper is always height:100%; `align` moves the control inside it.
        const control = el.shadowRoot.querySelector('.input-container').getBoundingClientRect();
        // `align` positions the label + control group as a unit.
        const label = el.shadowRoot.querySelector('.label').getBoundingClientRect();
        return {
          fromTop: control.top - host.top,
          groupTop: label.top - host.top,
          groupBottom: host.bottom - control.bottom,
          contained: label.top >= host.top - 1 && control.bottom <= host.bottom + 1
        };
      };
      return { top: centreOf('top'), center: centreOf('center'), bottom: centreOf('bottom') };
    });

    for (const key of ['top', 'center', 'bottom'] as const) {
      expect(offsets[key].contained, `${key} stays inside the host`).toBe(true);
    }
    expect(offsets.top.fromTop).toBeLessThan(offsets.center.fromTop);
    expect(offsets.center.fromTop).toBeLessThan(offsets.bottom.fromTop);
    expect(Math.abs(offsets.center.groupTop - offsets.center.groupBottom)).toBeLessThanOrEqual(2);
    expect(offsets.bottom.groupBottom).toBeLessThanOrEqual(2);
    expect(offsets.top.groupTop).toBeLessThanOrEqual(2);
  });
});
