import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/approval-flow/demo.html';

test.describe('Snice Approval Flow visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('steps tile along the flow axis without gaps or overhang', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-approval-flow').forEach((host, hi) => {
        const flow = (host as any).shadowRoot?.querySelector('.flow');
        if (!flow) { problems.push(`flow[${hi}]: no .flow`); return; }
        const flowRect = flow.getBoundingClientRect();
        const steps = [...flow.querySelectorAll('.step')] as HTMLElement[];
        if (steps.length === 0) { problems.push(`flow[${hi}]: no steps`); return; }
        const vertical = flow.classList.contains('flow--vertical');
        const rects = steps.map(s => s.getBoundingClientRect());

        rects.forEach((r, i) => {
          if (r.right > flowRect.right + 1 || r.left < flowRect.left - 1
              || r.bottom > flowRect.bottom + 1 || r.top < flowRect.top - 1) {
            problems.push(`flow[${hi}] step ${i}: overhangs the flow box`);
          }
        });

        for (let i = 1; i < rects.length; i++) {
          const prev = rects[i - 1], cur = rects[i];
          if (vertical) {
            // Vertical steps stack: shared left edge, rows abut.
            if (Math.abs(cur.left - prev.left) > 1) {
              problems.push(`flow[${hi}] step ${i}: left ${Math.round(cur.left)} != ${Math.round(prev.left)}`);
            }
            if (Math.abs(cur.top - prev.bottom) > 1) {
              problems.push(`flow[${hi}] step ${i}: row seam ${Math.round(prev.bottom)} -> ${Math.round(cur.top)}`);
            }
          } else {
            // Horizontal steps share a baseline row and abut side by side.
            if (Math.abs(cur.top - prev.top) > 1) {
              problems.push(`flow[${hi}] step ${i}: top ${Math.round(cur.top)} != ${Math.round(prev.top)}`);
            }
            if (Math.abs(cur.left - prev.right) > 1) {
              problems.push(`flow[${hi}] step ${i}: column seam ${Math.round(prev.right)} -> ${Math.round(cur.left)}`);
            }
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('status badge and avatar render at sane sizes inside their step', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-approval-flow').forEach((host, hi) => {
        const root = (host as any).shadowRoot;
        if (!root) return;
        [...root.querySelectorAll('.step')].forEach((step: Element, si: number) => {
          const sr = step.getBoundingClientRect();
          const avatar = step.querySelector('.step__avatar');
          if (avatar) {
            const ar = avatar.getBoundingClientRect();
            if (Math.abs(ar.width - ar.height) > 1) {
              problems.push(`flow[${hi}] step ${si}: avatar not square (${Math.round(ar.width)}x${Math.round(ar.height)})`);
            }
            if (ar.width < 16 || ar.width > 96) {
              problems.push(`flow[${hi}] step ${si}: avatar size ${Math.round(ar.width)}px out of range`);
            }
            if (ar.top < sr.top - 1 || ar.bottom > sr.bottom + 1) {
              problems.push(`flow[${hi}] step ${si}: avatar escapes step vertically`);
            }
          }
          const icon = step.querySelector('.step__status-icon');
          if (icon) {
            const ir = icon.getBoundingClientRect();
            if (ir.width < 8 || ir.width > 32) {
              problems.push(`flow[${hi}] step ${si}: status icon ${Math.round(ir.width)}px out of range`);
            }
          }
          const content = step.querySelector('.step__content');
          if (content) {
            const cr = content.getBoundingClientRect();
            if (cr.right > sr.right + 1 || cr.left < sr.left - 1) {
              problems.push(`flow[${hi}] step ${si}: content escapes step horizontally`);
            }
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
