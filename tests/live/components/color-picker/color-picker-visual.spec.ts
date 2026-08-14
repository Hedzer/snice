import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/color-picker/demo.html';

test.describe('Snice Color Picker visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('swatch is square, centered on the text input row, and scales with size', async ({ page }) => {
    const result = await page.evaluate(() => {
      const problems: string[] = [];
      const bySize: Record<string, number[]> = { small: [], medium: [], large: [] };
      const pickers = [...document.querySelectorAll('snice-color-picker')] as any[];
      if (!pickers.length) problems.push('no snice-color-picker on page');

      pickers.forEach((p, i) => {
        const root = p.shadowRoot;
        const swatch = root?.querySelector('.color-swatch') as HTMLElement | null;
        if (!swatch) { problems.push(`picker[${i}]: no .color-swatch`); return; }
        const sr = swatch.getBoundingClientRect();
        if (sr.width < 16 || sr.height < 16) {
          problems.push(`picker[${i}]: swatch ${Math.round(sr.width)}x${Math.round(sr.height)} too small`);
        }
        if (Math.abs(sr.width - sr.height) > 1) {
          problems.push(`picker[${i}]: swatch not square (${Math.round(sr.width)}x${Math.round(sr.height)})`);
        }

        const size = p.getAttribute('size');
        if (size && size in bySize) bySize[size].push(Math.round(sr.width));

        // The colour fill must cover the swatch, never spill past its border.
        const inner = swatch.querySelector('.swatch-inner') as HTMLElement | null;
        if (inner) {
          const ir = inner.getBoundingClientRect();
          if (ir.left < sr.left - 1 || ir.right > sr.right + 1
              || ir.top < sr.top - 1 || ir.bottom > sr.bottom + 1) {
            problems.push(`picker[${i}]: swatch fill spills the swatch`);
          }
        }

        const input = root.querySelector('.color-input') as HTMLElement | null;
        if (p.getAttribute('show-input') === 'false') {
          if (input && input.getBoundingClientRect().width > 0) {
            problems.push(`picker[${i}]: show-input=false still renders the text input`);
          }
          return;
        }
        if (!input) return;
        const ir = input.getBoundingClientRect();
        if (ir.width === 0) return;
        const dy = (ir.top + ir.height / 2) - (sr.top + sr.height / 2);
        if (Math.abs(dy) > 1.5) {
          problems.push(`picker[${i}]: input/swatch centers off by ${dy.toFixed(1)}px`);
        }
        if (ir.left < sr.right - 1) {
          problems.push(`picker[${i}]: input overlaps the swatch`);
        }
      });

      // Size variants must actually differ, monotonically.
      const avg = (a: number[]) => a.reduce((s, n) => s + n, 0) / a.length;
      if (bySize.small.length && bySize.medium.length && bySize.large.length) {
        const [s, m, l] = [avg(bySize.small), avg(bySize.medium), avg(bySize.large)];
        if (!(s < m && m < l)) problems.push(`swatch sizes not monotonic: ${s}/${m}/${l}`);
      }
      return problems;
    });
    expect(result).toEqual([]);
  });

  test('preset swatches wrap inside their row and never overflow the picker', async ({ page }) => {
    const result = await page.evaluate(() => {
      const problems: string[] = [];
      const pickers = ([...document.querySelectorAll('snice-color-picker')] as any[])
        .filter(p => p.hasAttribute('show-presets'));
      if (!pickers.length) problems.push('showcase has no show-presets picker');

      pickers.forEach((p, i) => {
        const presets = p.shadowRoot?.querySelector('.presets') as HTMLElement | null;
        if (!presets) { problems.push(`presets[${i}]: not rendered`); return; }
        const pr = presets.getBoundingClientRect();
        const hostRect = p.getBoundingClientRect();
        if (pr.right > hostRect.right + 1) problems.push(`presets[${i}]: row overflows the host`);

        const swatches = [...presets.querySelectorAll('.preset')] as HTMLElement[];
        if (!swatches.length) { problems.push(`presets[${i}]: empty preset row`); return; }
        swatches.forEach((sw, s) => {
          const r = sw.getBoundingClientRect();
          if (r.width < 12 || r.height < 12) {
            problems.push(`presets[${i}] swatch[${s}]: ${Math.round(r.width)}x${Math.round(r.height)} too small`);
          }
          if (r.left < pr.left - 1 || r.right > pr.right + 1
              || r.top < pr.top - 1 || r.bottom > pr.bottom + 1) {
            problems.push(`presets[${i}] swatch[${s}]: escapes the preset row`);
          }
        });
        // Swatches on the same visual line must share a top edge.
        const lines = new Map<number, number[]>();
        swatches.forEach(sw => {
          const r = sw.getBoundingClientRect();
          const key = Math.round(r.top / 4);
          lines.set(key, [...(lines.get(key) ?? []), Math.round(r.height)]);
        });
        lines.forEach((heights, key) => {
          if (Math.max(...heights) - Math.min(...heights) > 1) {
            problems.push(`presets[${i}] line ${key}: uneven swatch heights ${heights.join(',')}`);
          }
        });
      });
      return problems;
    });
    expect(result).toEqual([]);
  });
});
