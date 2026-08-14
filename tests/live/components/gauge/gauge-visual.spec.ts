import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/gauge/demo.html';

test.describe('Snice Gauge visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('arc, value readout and label stack inside the gauge without overlap', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-gauge').forEach((host, i) => {
        const root = (host as HTMLElement).shadowRoot;
        const base = root?.querySelector('.gauge') as HTMLElement | null;
        if (!base) { problems.push(`gauge[${i}]: no .gauge`); return; }
        const br = base.getBoundingClientRect();
        const svg = root!.querySelector('.gauge__svg') as SVGElement | null;
        if (!svg) { problems.push(`gauge[${i}]: no svg`); return; }
        const sr = svg.getBoundingClientRect();

        if (sr.width < 40 || sr.height < 20) {
          problems.push(`gauge[${i}]: arc collapsed (${Math.round(sr.width)}x${Math.round(sr.height)})`);
        }
        if (sr.left < br.left - 1 || sr.right > br.right + 1
            || sr.top < br.top - 1 || sr.bottom > br.bottom + 1) {
          problems.push(`gauge[${i}]: arc escapes the gauge box`);
        }

        const value = root!.querySelector('.gauge__value-text') as HTMLElement | null;
        if (value) {
          const vr = value.getBoundingClientRect();
          // The readout is centred under the arc.
          const dx = (vr.left + vr.width / 2) - (sr.left + sr.width / 2);
          if (Math.abs(dx) > 2) {
            problems.push(`gauge[${i}]: value readout off-centre by ${dx.toFixed(1)}px`);
          }
          if (vr.left < br.left - 1 || vr.right > br.right + 1 || vr.bottom > br.bottom + 1) {
            problems.push(`gauge[${i}]: value readout escapes the gauge box`);
          }
        }

        const label = root!.querySelector('.gauge__label') as HTMLElement | null;
        if (label && value) {
          const lr = label.getBoundingClientRect();
          const vr = value.getBoundingClientRect();
          if (lr.top < vr.bottom - 1) {
            problems.push(`gauge[${i}]: label overlaps the value readout`);
          }
          if (lr.left < br.left - 1 || lr.right > br.right + 1 || lr.bottom > br.bottom + 1) {
            problems.push(`gauge[${i}]: label escapes the gauge box`);
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('arc fill length tracks the value', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-gauge').forEach((host, i) => {
        const fill = (host as HTMLElement).shadowRoot
          ?.querySelector('.gauge__fill') as SVGPathElement | null;
        if (!fill) return;
        const total = parseFloat(fill.getAttribute('stroke-dasharray') || '0');
        const offset = parseFloat(fill.getAttribute('stroke-dashoffset') || '0');
        if (!(total > 0)) { problems.push(`gauge[${i}]: fill dasharray ${total}`); return; }
        const min = parseFloat(host.getAttribute('min') ?? '0');
        const max = parseFloat(host.getAttribute('max') ?? '100');
        const value = parseFloat(host.getAttribute('value') ?? '0');
        const expected = Math.min(1, Math.max(0, (value - min) / (max - min)));
        const shown = (total - offset) / total;
        if (Math.abs(shown - expected) > 0.02) {
          problems.push(`gauge[${i}]: arc shows ${(shown * 100).toFixed(0)}%`
            + ` for value ${value} (expected ${(expected * 100).toFixed(0)}%)`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
