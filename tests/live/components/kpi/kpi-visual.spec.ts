import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/kpi/visual.html';

test.describe('Snice KPI visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-kpi'));
    await page.waitForFunction(() =>
      !!document.querySelector('snice-kpi')?.shadowRoot?.querySelector('.kpi__value'));
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('label stacks above the value and the trend badge sits to their right, all inside the card', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const kpis = [...document.querySelectorAll('snice-kpi')] as HTMLElement[];
      if (kpis.length === 0) problems.push('no snice-kpi on the page');

      kpis.forEach((kpi, i) => {
        const root = kpi.shadowRoot!;
        const card = root.querySelector('.kpi') as HTMLElement;
        const label = root.querySelector('.kpi__label') as HTMLElement;
        const value = root.querySelector('.kpi__value') as HTMLElement;
        const id = `kpi[${i}](${kpi.getAttribute('label')})`;
        if (!card || !label || !value) { problems.push(`${id}: missing parts`); return; }

        const cr = card.getBoundingClientRect();
        const lr = label.getBoundingClientRect();
        const vr = value.getBoundingClientRect();

        if (cr.width < 60 || cr.height < 40) {
          problems.push(`${id}: card ${Math.round(cr.width)}x${Math.round(cr.height)}`);
          return;
        }
        // Label sits above the value, sharing a left edge.
        if (vr.top < lr.bottom - 1) problems.push(`${id}: value not below the label`);
        if (Math.abs(vr.left - lr.left) > 1) {
          problems.push(`${id}: label/value left edges differ by ${Math.round(vr.left - lr.left)}px`);
        }
        // Value must be visually bigger than the label.
        if (parseFloat(getComputedStyle(value).fontSize) <= parseFloat(getComputedStyle(label).fontSize)) {
          problems.push(`${id}: value font is not larger than the label font`);
        }

        // Everything the card draws stays inside the card box.
        [label, value].forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.left < cr.left - 1 || r.right > cr.right + 1
              || r.top < cr.top - 1 || r.bottom > cr.bottom + 1) {
            problems.push(`${id}: ${el.className} escapes the card`);
          }
        });

        // The trend badge sits right of the label/value block and inside the
        // header row, never overlapping the value.
        const trend = root.querySelector('.kpi__trend') as HTMLElement | null;
        if (trend) {
          const tr = trend.getBoundingClientRect();
          if (tr.width === 0 || tr.height === 0) {
            problems.push(`${id}: trend badge collapsed`);
          } else {
            if (tr.left < vr.right - 1) problems.push(`${id}: trend badge overlaps the value`);
            if (tr.right > cr.right + 1 || tr.top < cr.top - 1 || tr.bottom > cr.bottom + 1) {
              problems.push(`${id}: trend badge escapes the card`);
            }
            const icon = trend.querySelector('svg') as SVGElement | null;
            if (icon) {
              const ir = icon.getBoundingClientRect();
              if (ir.width < 8 || ir.width > 40) {
                problems.push(`${id}: trend icon ${Math.round(ir.width)}px wide`);
              }
              if (Math.abs(ir.width - ir.height) > 1) {
                problems.push(`${id}: trend icon not square`);
              }
            }
          }
        }

        // A sparkline must be a real strip inside the card, never overflowing.
        const spark = root.querySelector('.kpi__sparkline') as HTMLElement | null;
        if (spark) {
          const sr = spark.getBoundingClientRect();
          if (sr.height < 10) problems.push(`${id}: sparkline ${Math.round(sr.height)}px tall`);
          if (sr.left < cr.left - 1 || sr.right > cr.right + 1 || sr.bottom > cr.bottom + 1) {
            problems.push(`${id}: sparkline escapes the card`);
          }
          if (sr.top < vr.bottom - 1) problems.push(`${id}: sparkline overlaps the value`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('size variants scale the value type and the card', async ({ page }) => {
    const sizes = await page.evaluate(() => {
      const read = (size: string) => {
        const el = document.querySelector(
          `snice-kpi[size="${size}"][label="Revenue"]`) as HTMLElement;
        const root = el.shadowRoot!;
        const value = root.querySelector('.kpi__value') as HTMLElement;
        return {
          font: parseFloat(getComputedStyle(value).fontSize),
          height: (root.querySelector('.kpi') as HTMLElement).getBoundingClientRect().height
        };
      };
      return { small: read('small'), medium: read('medium'), large: read('large') };
    });

    expect(sizes.medium.font).toBeGreaterThan(sizes.small.font);
    expect(sizes.large.font).toBeGreaterThan(sizes.medium.font);
    expect(sizes.medium.height).toBeGreaterThan(sizes.small.height);
    expect(sizes.large.height).toBeGreaterThan(sizes.medium.height);
  });

  // BUG: the `trend-value` attribute never reaches the `trendValue` property.
  // `@property({}) trendValue?: string | number;` in snice-kpi.ts has no
  // initializer, so no attribute converter is inferred and the property stays
  // `undefined`. Visually, the trend percentage is missing from EVERY KPI on
  // the showcase, and the "Trend Value Only (no sentiment)" card renders with
  // no trend element at all (`hasTrend` is false, so `.kpi__trend` is never
  // created) even though the markup supplies `trend-value`.
  test.fixme('trend-value text renders next to the trend arrow', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const kpis = [...document.querySelectorAll('snice-kpi[trend-value]')] as HTMLElement[];
      kpis.forEach((kpi, i) => {
        const expected = kpi.getAttribute('trend-value')!;
        const el = kpi.shadowRoot!.querySelector('.kpi__trend-value') as HTMLElement | null;
        if (!el) { problems.push(`kpi[${i}]: no .kpi__trend-value for "${expected}"`); return; }
        if (el.textContent?.trim() !== expected) {
          problems.push(`kpi[${i}]: rendered "${el.textContent?.trim()}", expected "${expected}"`);
        }
        const r = el.getBoundingClientRect();
        if (r.width < 4 || r.height < 4) problems.push(`kpi[${i}]: trend text collapsed`);
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
