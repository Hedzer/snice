import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/countdown/visual.html';

test.describe('Snice Countdown visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-countdown'));
    await page.waitForTimeout(300);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('segments match the format, tile left-to-right and stay row-aligned', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const expected: Record<string, number> = { dhms: 4, hms: 3, ms: 2 };
      document.querySelectorAll('snice-countdown').forEach((cd, i) => {
        const id = (cd as HTMLElement).id || `countdown[${i}]`;
        const root = (cd as HTMLElement).shadowRoot;
        if (!root) { problems.push(`${id}: no shadow root`); return; }
        const segments = [...root.querySelectorAll('.segment')] as HTMLElement[];
        const seps = [...root.querySelectorAll('.separator')] as HTMLElement[];
        const format = (cd as any).format ?? 'dhms';

        if (segments.length !== expected[format]) {
          problems.push(`${id}: ${segments.length} segments for format="${format}"`);
          return;
        }
        if (seps.length !== segments.length - 1) {
          problems.push(`${id}: ${seps.length} separators for ${segments.length} segments`);
        }

        const rects = segments.map(s => s.getBoundingClientRect());
        rects.forEach((r, s) => {
          if (r.width < 8 || r.height < 8) {
            problems.push(`${id} segment ${s}: collapsed (${Math.round(r.width)}x${Math.round(r.height)})`);
          }
          // Segments sit on one row.
          if (Math.abs(r.top - rects[0].top) > 1) {
            problems.push(`${id} segment ${s}: top ${Math.round(r.top)} != first ${Math.round(rects[0].top)}`);
          }
          // Strict left-to-right order, no overlap.
          if (s > 0 && r.left < rects[s - 1].right - 1) {
            problems.push(`${id} segment ${s}: overlaps segment ${s - 1}`);
          }
        });

        // Each separator sits in the gap between the segments it divides.
        seps.forEach((sep, s) => {
          const sr = sep.getBoundingClientRect();
          if (sr.left < rects[s].right - 1 || sr.right > rects[s + 1].left + 1) {
            problems.push(`${id} separator ${s}: not between segments ${s} and ${s + 1}`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('value and label are centered inside their segment', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-countdown').forEach((cd, i) => {
        const id = (cd as HTMLElement).id || `countdown[${i}]`;
        const root = (cd as HTMLElement).shadowRoot;
        if (!root) return;
        [...root.querySelectorAll('.segment')].forEach((seg, s) => {
          const segRect = seg.getBoundingClientRect();
          if (segRect.width === 0) return;
          const value = seg.querySelector('.value');
          const label = seg.querySelector('.label');
          [['value', value], ['label', label]].forEach(([name, el]) => {
            if (!el) { problems.push(`${id} segment ${s}: missing .${name}`); return; }
            const r = (el as Element).getBoundingClientRect();
            if (r.width === 0 || r.height === 0) {
              problems.push(`${id} segment ${s} .${name}: zero size`);
              return;
            }
            if (r.left < segRect.left - 1 || r.right > segRect.right + 1
              || r.top < segRect.top - 1 || r.bottom > segRect.bottom + 1) {
              problems.push(`${id} segment ${s} .${name}: escapes its segment`);
              return;
            }
            const dx = (r.left + r.width / 2) - (segRect.left + segRect.width / 2);
            if (Math.abs(dx) > 1.5) {
              problems.push(`${id} segment ${s} .${name}: off-center by ${dx.toFixed(1)}px`);
            }
          });
          // The label reads under the value, never across it.
          if (value && label) {
            const vr = value.getBoundingClientRect();
            const lr = label.getBoundingClientRect();
            if (lr.top < vr.bottom - 2) {
              problems.push(`${id} segment ${s}: label overlaps value`);
            }
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
