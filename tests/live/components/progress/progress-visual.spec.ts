import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/progress/visual.html';

test.describe('Snice Progress visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    // Fill transitions settle before geometry is measured.
    await page.waitForTimeout(600);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('linear fill width matches value/max and never leaves its track', async ({ page }) => {
    const result = await page.evaluate(() => {
      const problems: string[] = [];
      const bars = ([...document.querySelectorAll('snice-progress')] as any[])
        .filter(p => (p.getAttribute('variant') || 'linear') === 'linear' && !p.hasAttribute('indeterminate'));
      if (!bars.length) problems.push('no determinate linear progress on page');

      bars.forEach((host, i) => {
        const track = host.shadowRoot?.querySelector('.progress--linear') as HTMLElement | null;
        const fill = host.shadowRoot?.querySelector('.progress__bar') as HTMLElement | null;
        if (!track || !fill) { problems.push(`linear[${i}]: missing track or fill`); return; }
        const tr = track.getBoundingClientRect();
        const fr = fill.getBoundingClientRect();
        const value = parseFloat(host.getAttribute('value') || '0');
        const max = parseFloat(host.getAttribute('max') || '100');
        const expected = tr.width * (value / max);
        const tag = `linear[${i}] value=${value}/${max}`;

        if (tr.height < 2) problems.push(`${tag}: track only ${tr.height.toFixed(1)}px tall`);
        if (Math.abs(fr.width - expected) > 1.5) {
          problems.push(`${tag}: fill ${Math.round(fr.width)}px, expected ${Math.round(expected)}px`);
        }
        if (fr.left < tr.left - 1 || fr.right > tr.right + 1
            || fr.top < tr.top - 1 || fr.bottom > tr.bottom + 1) {
          problems.push(`${tag}: fill escapes the track`);
        }
      });
      return problems;
    });
    expect(result).toEqual([]);
  });

  test('circular ring is square, scales by size, and centers its label', async ({ page }) => {
    const result = await page.evaluate(() => {
      const problems: string[] = [];
      const bySize: Record<string, number> = {};
      // Indeterminate rings spin (rotate animation), so their layout box is
      // intentionally larger than the host mid-rotation.
      const rings = [...document.querySelectorAll(
        'snice-progress[variant="circular"]:not([indeterminate])')] as any[];
      if (!rings.length) problems.push('no circular progress on page');

      rings.forEach((host, i) => {
        const svg = host.shadowRoot?.querySelector('.progress__circle') as SVGElement | null;
        if (!svg) { problems.push(`circular[${i}]: no .progress__circle`); return; }
        const sr = svg.getBoundingClientRect();
        const hr = host.getBoundingClientRect();
        const size = host.getAttribute('size') || 'medium';
        const tag = `circular[${i}] ${size}`;

        if (Math.abs(sr.width - sr.height) > 1) {
          problems.push(`${tag}: ring not square (${Math.round(sr.width)}x${Math.round(sr.height)})`);
        }
        if (sr.width < 16) problems.push(`${tag}: ring only ${Math.round(sr.width)}px wide`);
        if (sr.left < hr.left - 1 || sr.right > hr.right + 1
            || sr.top < hr.top - 1 || sr.bottom > hr.bottom + 1) {
          problems.push(`${tag}: ring escapes the host`);
        }
        if (bySize[size] === undefined) bySize[size] = Math.round(sr.width);

        const label = host.shadowRoot?.querySelector('.progress__circle-label') as HTMLElement | null;
        if (label) {
          const lr = label.getBoundingClientRect();
          if (lr.width > 0) {
            const dx = (lr.left + lr.width / 2) - (sr.left + sr.width / 2);
            const dy = (lr.top + lr.height / 2) - (sr.top + sr.height / 2);
            if (Math.abs(dx) > 1.5 || Math.abs(dy) > 1.5) {
              problems.push(`${tag}: label off-center by (${dx.toFixed(1)}, ${dy.toFixed(1)})`);
            }
            if (lr.width > sr.width + 1 || lr.height > sr.height + 1) {
              problems.push(`${tag}: label wider than the ring`);
            }
          }
        }
      });

      const order = ['small', 'medium', 'large', 'xl', 'xxl', 'xxxl'].filter(s => bySize[s] !== undefined);
      for (let k = 1; k < order.length; k++) {
        if (!(bySize[order[k - 1]] < bySize[order[k]])) {
          problems.push(`ring sizes not monotonic: ${JSON.stringify(bySize)}`);
          break;
        }
      }
      return problems;
    });
    expect(result).toEqual([]);
  });

  test('thickness attribute changes the ring stroke without changing its diameter', async ({ page }) => {
    const result = await page.evaluate(() => {
      const problems: string[] = [];
      const thin = document.querySelector('snice-progress[variant="circular"][thickness="2"]') as any;
      const thick = document.querySelector('snice-progress[variant="circular"][thickness="8"]') as any;
      if (!thin || !thick) return ['showcase lost its thickness=2/8 rings'];
      const stroke = (el: any) => {
        const bar = el.shadowRoot?.querySelector('.progress__circle-bar') as SVGElement | null;
        return bar ? parseFloat(getComputedStyle(bar).strokeWidth) : NaN;
      };
      const diameter = (el: any) =>
        (el.shadowRoot?.querySelector('.progress__circle') as SVGElement).getBoundingClientRect().width;

      if (!(stroke(thin) < stroke(thick))) {
        problems.push(`stroke widths not ordered: ${stroke(thin)} vs ${stroke(thick)}`);
      }
      if (Math.abs(diameter(thin) - diameter(thick)) > 1) {
        problems.push(`thickness changed the diameter: ${diameter(thin)} vs ${diameter(thick)}`);
      }
      return problems;
    });
    expect(result).toEqual([]);
  });
});
