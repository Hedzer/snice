import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/order-tracker/demo.html';

test.describe('Snice Order Tracker visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-order-tracker'));
    await page.waitForFunction(() =>
      (document.querySelector('#ot-many') as any)?.shadowRoot
        ?.querySelectorAll('[part="step"]').length === 7);
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  // Horizontal trackers tile their steps across one row: equal widths, shared
  // top edge, strictly increasing left edges, no overlap, no overhang, and
  // step indicators aligned on a single baseline.
  test('horizontal trackers tile steps evenly across one row', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-order-tracker[variant="horizontal"]').forEach((host, i) => {
        const root = (host as any).shadowRoot as ShadowRoot;
        const list = root.querySelector('[part="steps"]') as HTMLElement | null;
        if (!list) { problems.push(`h[${i}]: no steps container`); return; }
        const lr = list.getBoundingClientRect();
        const steps = [...root.querySelectorAll('[part="step"]')] as HTMLElement[];
        if (steps.length === 0) return; // the "Empty (no steps)" tracker

        const rects = steps.map(s => s.getBoundingClientRect());
        const widths = rects.map(r => r.width);
        if (Math.max(...widths) - Math.min(...widths) > 1) {
          problems.push(`h[${i}]: uneven step widths ${widths.map(w => Math.round(w)).join(',')}`);
        }
        const tops = rects.map(r => Math.round(r.top));
        if (Math.max(...tops) - Math.min(...tops) > 1) {
          problems.push(`h[${i}]: steps not on one row (tops ${tops.join(',')})`);
        }
        rects.forEach((r, s) => {
          if (r.left < lr.left - 1 || r.right > lr.right + 1) {
            problems.push(`h[${i}] step ${s}: overhangs the steps container`);
          }
          if (s > 0 && r.left < rects[s - 1].right - 1) {
            problems.push(`h[${i}] step ${s}: overlaps step ${s - 1}`);
          }
        });

        // Indicators share one horizontal baseline and are round badges.
        const inds = steps.map(s => s.querySelector('.tracker__step-indicator')!.getBoundingClientRect());
        const centers = inds.map(r => Math.round(r.top + r.height / 2));
        if (Math.max(...centers) - Math.min(...centers) > 1) {
          problems.push(`h[${i}]: indicators off a shared baseline (${centers.join(',')})`);
        }
        inds.forEach((r, s) => {
          if (r.width < 12 || Math.abs(r.width - r.height) > 1) {
            problems.push(`h[${i}] step ${s}: indicator ${Math.round(r.width)}x${Math.round(r.height)}`);
          }
          const sr = rects[s];
          const dx = (r.left + r.width / 2) - (sr.left + sr.width / 2);
          if (Math.abs(dx) > 1.5) {
            problems.push(`h[${i}] step ${s}: indicator off-centre by ${dx.toFixed(1)}px`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  // Vertical trackers stack steps down one column: shared indicator x, strictly
  // increasing tops, no overlap, and labels to the right of the indicator.
  test('vertical trackers stack steps down one aligned column', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-order-tracker[variant="vertical"]').forEach((host, i) => {
        const root = (host as any).shadowRoot as ShadowRoot;
        const steps = [...root.querySelectorAll('[part="step"]')] as HTMLElement[];
        if (steps.length === 0) return;
        const rects = steps.map(s => s.getBoundingClientRect());

        const indLefts = steps.map(s =>
          Math.round(s.querySelector('.tracker__step-indicator')!.getBoundingClientRect().left));
        if (Math.max(...indLefts) - Math.min(...indLefts) > 1) {
          problems.push(`v[${i}]: indicator column not aligned (${indLefts.join(',')})`);
        }

        rects.forEach((r, s) => {
          if (s > 0 && r.top < rects[s - 1].top + 1) {
            problems.push(`v[${i}] step ${s}: not below step ${s - 1}`);
          }
          if (s > 0 && r.top < rects[s - 1].bottom - 1) {
            problems.push(`v[${i}] step ${s}: overlaps step ${s - 1}`);
          }
          const ind = steps[s].querySelector('.tracker__step-indicator')!.getBoundingClientRect();
          const content = steps[s].querySelector('.tracker__step-content')!.getBoundingClientRect();
          if (content.left < ind.right - 1) {
            problems.push(`v[${i}] step ${s}: label overlaps the indicator`);
          }
          if (content.right > r.right + 1) {
            problems.push(`v[${i}] step ${s}: content escapes the step box`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
