import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/stepper/visual.html';

test.describe('Snice Stepper visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('step indicators are round, sized, and hold their number', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-stepper').forEach((host, s) => {
        const root = (host as HTMLElement).shadowRoot;
        const steps = [...(root?.querySelectorAll('.step') ?? [])] as HTMLElement[];
        if (steps.length === 0) { problems.push(`stepper[${s}]: no steps`); return; }
        steps.forEach((step, i) => {
          const ind = step.querySelector('.step__indicator') as HTMLElement | null;
          if (!ind) { problems.push(`stepper[${s}].step[${i}]: no indicator`); return; }
          const r = ind.getBoundingClientRect();
          if (r.width < 16 || r.height < 16) {
            problems.push(`stepper[${s}].step[${i}]: indicator collapsed`
              + ` (${Math.round(r.width)}x${Math.round(r.height)})`);
          }
          if (Math.abs(r.width - r.height) > 1) {
            problems.push(`stepper[${s}].step[${i}]: indicator not square`
              + ` (${Math.round(r.width)}x${Math.round(r.height)})`);
          }
          // The glyph inside must be centred, not riding an edge.
          const range = document.createRange();
          range.selectNodeContents(ind);
          const gr = range.getBoundingClientRect();
          if (gr.width > 0 && gr.height > 0) {
            const dx = (gr.left + gr.width / 2) - (r.left + r.width / 2);
            const dy = (gr.top + gr.height / 2) - (r.top + r.height / 2);
            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
              problems.push(`stepper[${s}].step[${i}]: indicator glyph off-centre`
                + ` (${dx.toFixed(1)}, ${dy.toFixed(1)})`);
            }
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('horizontal steppers run left-to-right on one shared indicator centre line', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-stepper').forEach((host, s) => {
        const root = (host as HTMLElement).shadowRoot;
        const container = root?.querySelector('.stepper--horizontal') as HTMLElement | null;
        if (!container) return;
        const cr = container.getBoundingClientRect();
        const inds = [...container.querySelectorAll('.step__indicator')] as HTMLElement[];
        if (inds.length < 2) return;

        const rects = inds.map(el => el.getBoundingClientRect());
        const centres = rects.map(r => Math.round(r.top + r.height / 2));
        if (Math.max(...centres) - Math.min(...centres) > 1) {
          problems.push(`stepper[${s}]: indicator centres uneven ${centres.join(',')}`);
        }
        for (let i = 1; i < rects.length; i++) {
          if (rects[i].left < rects[i - 1].right - 1) {
            problems.push(`stepper[${s}]: indicator ${i} is not right of indicator ${i - 1}`);
          }
        }
        rects.forEach((r, i) => {
          if (r.left < cr.left - 1 || r.right > cr.right + 1
              || r.top < cr.top - 1 || r.bottom > cr.bottom + 1) {
            problems.push(`stepper[${s}]: indicator ${i} escapes the stepper box`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('vertical steppers stack steps top-to-bottom with aligned indicators', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-stepper').forEach((host, s) => {
        const root = (host as HTMLElement).shadowRoot;
        const container = root?.querySelector('.stepper--vertical') as HTMLElement | null;
        if (!container) return;
        const inds = [...container.querySelectorAll('.step__indicator')] as HTMLElement[];
        if (inds.length < 2) return;

        const rects = inds.map(el => el.getBoundingClientRect());
        const centres = rects.map(r => Math.round(r.left + r.width / 2));
        if (Math.max(...centres) - Math.min(...centres) > 1) {
          problems.push(`stepper[${s}]: vertical indicators not on one axis ${centres.join(',')}`);
        }
        for (let i = 1; i < rects.length; i++) {
          if (rects[i].top < rects[i - 1].bottom - 1) {
            problems.push(`stepper[${s}]: step ${i} indicator overlaps step ${i - 1}`);
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('only the active panel is shown and it sits below the step rail', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const host = document.querySelector('snice-stepper:has(snice-stepper-panel)') as HTMLElement | null;
      if (!host) { problems.push('showcase has no stepper with panels'); return problems; }
      const rail = host.shadowRoot!.querySelector('.stepper')!.getBoundingClientRect();
      const panels = [...host.querySelectorAll('snice-stepper-panel')] as HTMLElement[];
      const visible = panels.filter(p => p.getBoundingClientRect().height > 0);
      if (visible.length !== 1) {
        problems.push(`${visible.length} panels visible, expected exactly 1`);
        return problems;
      }
      const pr = visible[0].getBoundingClientRect();
      if (pr.top < rail.bottom - 1) {
        problems.push(`active panel (top ${Math.round(pr.top)}) overlaps the rail`
          + ` (bottom ${Math.round(rail.bottom)})`);
      }
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
