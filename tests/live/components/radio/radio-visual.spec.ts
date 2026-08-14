import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/radio/demo.html';

test.describe('Snice Radio visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-radio'));
    await page.waitForFunction(() =>
      !!document.querySelector('snice-radio')?.shadowRoot?.querySelector('.radio'));
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('the control is a size-correct circle with a centred dot', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const expected: Record<string, number> = { small: 16, medium: 20, large: 24 };
      document.querySelectorAll('snice-radio').forEach((host: any, i) => {
        const size = host.getAttribute('size') ?? 'medium';
        const control = host.shadowRoot.querySelector('.radio') as HTMLElement;
        const r = control.getBoundingClientRect();
        const cs = getComputedStyle(control);
        // The size tokens set the content box; the 2px ring sits outside it.
        const border = parseFloat(cs.borderTopWidth) * 2;
        if (Math.abs(r.width - (expected[size] + border)) > 1
            || Math.abs(r.height - r.width) > 0.5) {
          problems.push(`radio[${i}] size=${size}: control ${Math.round(r.width)}x${Math.round(r.height)},`
            + ` expected a ${expected[size] + border}px square`);
        }
        if (cs.borderRadius !== '50%') {
          problems.push(`radio[${i}]: control is not a circle`);
        }

        const dot = host.shadowRoot.querySelector('.radio-dot') as HTMLElement | null;
        if (!dot) return; // loading state swaps the dot for a spinner
        const dr = dot.getBoundingClientRect();
        if (host.checked) {
          if (dr.width < 4 || dr.width > r.width - 4) {
            problems.push(`radio[${i}]: checked dot ${Math.round(dr.width)}px inside a ${Math.round(r.width)}px control`);
          }
          const dx = (dr.left + dr.width / 2) - (r.left + r.width / 2);
          const dy = (dr.top + dr.height / 2) - (r.top + r.height / 2);
          if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
            problems.push(`radio[${i}]: dot off centre by (${dx.toFixed(1)},${dy.toFixed(1)})`);
          }
        } else if (dr.width > 1 || dr.height > 1) {
          problems.push(`radio[${i}]: unchecked dot still ${Math.round(dr.width)}x${Math.round(dr.height)}`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('inline labels sit beside the control on its vertical centre', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-radio:not([variant="block"])').forEach((host: any, i) => {
        const control = host.shadowRoot.querySelector('.radio').getBoundingClientRect();
        const label = host.shadowRoot.querySelector('.radio-label') as HTMLElement | null;
        if (!label) return; // no-label variants
        const lr = label.getBoundingClientRect();
        if (lr.left < control.right - 0.5) {
          problems.push(`radio[${i}] "${host.label}": label overlaps the control`);
        }
        if (lr.left - control.right > 16) {
          problems.push(`radio[${i}] "${host.label}": ${Math.round(lr.left - control.right)}px gap to the control`);
        }
        const dy = (lr.top + lr.height / 2) - (control.top + control.height / 2);
        if (Math.abs(dy) > 1.5) {
          problems.push(`radio[${i}] "${host.label}": label off centre by ${dy.toFixed(1)}px`);
        }
        const hr = host.getBoundingClientRect();
        if (lr.right > hr.right + 1) {
          problems.push(`radio[${i}] "${host.label}": label escapes the host`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('block cards fill their row and stack label above description', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-radio[variant="block"]').forEach((host: any, i) => {
        const wrapper = host.shadowRoot.querySelector('.radio-wrapper--block') as HTMLElement;
        const wr = wrapper.getBoundingClientRect();
        const hr = host.getBoundingClientRect();
        if (Math.abs(wr.width - hr.width) > 1) {
          problems.push(`block[${i}]: card ${Math.round(wr.width)} != host ${Math.round(hr.width)}`);
        }
        const control = host.shadowRoot.querySelector('.radio').getBoundingClientRect();
        if (control.left < wr.left + 1 || control.top < wr.top || control.bottom > wr.bottom) {
          problems.push(`block[${i}]: control not padded inside the card`);
        }

        const label = host.shadowRoot.querySelector('.radio-content .radio-label') as HTMLElement | null;
        const desc = host.shadowRoot.querySelector('.radio-description') as HTMLElement | null;
        if (label && desc) {
          const lr = label.getBoundingClientRect();
          const dr = desc.getBoundingClientRect();
          if (dr.top < lr.bottom - 0.5) {
            problems.push(`block[${i}]: description overlaps the label`);
          }
          if (Math.abs(dr.left - lr.left) > 1) {
            problems.push(`block[${i}]: description not left-aligned with the label`);
          }
          if (dr.bottom > wr.bottom - 1 || lr.top < wr.top + 1) {
            problems.push(`block[${i}]: text escapes the card padding`);
          }
        }

        const suffix = host.querySelector('[slot="suffix"]') as HTMLElement | null;
        if (suffix) {
          const sr = suffix.getBoundingClientRect();
          if (sr.right > wr.right - 1) {
            problems.push(`block[${i}]: suffix escapes the card's right padding`);
          }
          if (label) {
            const lr = label.getBoundingClientRect();
            if (sr.left < lr.right - 0.5) problems.push(`block[${i}]: suffix overlaps the label`);
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('selecting another option in a group moves the single visible dot', async ({ page }) => {
    const dotWidths = async () => page.evaluate(() =>
      [...document.querySelectorAll('snice-radio[name="v-default"]')].map((r: any) =>
        Math.round(r.shadowRoot.querySelector('.radio-dot').getBoundingClientRect().width)));

    expect((await dotWidths()).filter(w => w > 1)).toHaveLength(1);

    await page.locator('snice-radio[name="v-default"][value="c"]').click();
    await expect
      .poll(() => page.locator('snice-radio[name="v-default"][value="c"]').evaluate((el: any) => el.checked))
      .toBe(true);
    // Let the dot's scale transition settle before measuring.
    await page.waitForTimeout(300);

    const after = await dotWidths();
    expect(after.filter(w => w > 1)).toHaveLength(1);
    expect(after[2]).toBeGreaterThan(1);
    expect(after[0]).toBeLessThanOrEqual(1);
  });
});
