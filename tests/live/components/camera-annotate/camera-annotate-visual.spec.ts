import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/camera-annotate/visual.html';

test.describe('Snice Camera Annotate visual integrity', () => {
  test.beforeEach(async ({ page, context }, testInfo) => {
    // Only Playwright's Chromium driver can grant the camera permission —
    // Firefox and WebKit both reject it ("Unknown permission: camera"), so
    // the capture pipeline cannot start there. The tests below early-return
    // in those engines and pass trivially — they cannot exercise the feature,
    // and failing on setup would be noise, not signal.
    if (testInfo.project.name !== 'chromium') return;
    await context.grantPermissions(['camera']);
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.locator('button.open-cam').first().click();
    await page.waitForFunction(() =>
      !!document.querySelector('snice-camera-annotate')?.shadowRoot?.querySelector('.ca-layout'));
    await page.waitForTimeout(400);
  });

  test('showcase passes the shared visual invariants', async ({ page }, testInfo) => {
    if (testInfo.project.name !== 'chromium') return;
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('opened annotator spans its host box and keeps the toolbar inside the main column', async ({ page }, testInfo) => {
    if (testInfo.project.name !== 'chromium') return;
    const result = await page.evaluate(() => {
      const problems: string[] = [];
      const host = document.querySelector('snice-camera-annotate') as HTMLElement;
      const root = host.shadowRoot!;
      const hostRect = host.getBoundingClientRect();
      const layout = root.querySelector('.ca-layout') as HTMLElement | null;
      if (!layout) return ['no .ca-layout'];
      const lr = layout.getBoundingClientRect();

      // The showcase sizes the host 100%/max 800 x 500. The layout spans the
      // host's width and is content-height, so it must never exceed the box.
      if (Math.abs(lr.width - hostRect.width) > 2) {
        problems.push(`layout width ${Math.round(lr.width)} != host ${Math.round(hostRect.width)}`);
      }
      if (lr.height < 100) problems.push(`layout collapsed to ${Math.round(lr.height)}px tall`);
      if (lr.height > hostRect.height + 1) {
        problems.push(`layout ${Math.round(lr.height)}px overflows the ${Math.round(hostRect.height)}px host`);
      }

      const main = root.querySelector('.ca-main') as HTMLElement | null;
      const toolbar = root.querySelector('.ca-toolbar') as HTMLElement | null;
      if (main && toolbar) {
        const mr = main.getBoundingClientRect();
        const tr = toolbar.getBoundingClientRect();
        if (tr.left < mr.left - 1 || tr.right > mr.right + 1
            || tr.top < mr.top - 1 || tr.bottom > mr.bottom + 1) {
          problems.push('toolbar escapes .ca-main');
        }
        [...toolbar.querySelectorAll('.ca-icon-btn, .ca-btn')].forEach((b, i) => {
          const r = b.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) return;
          if (r.right > tr.right + 1 || r.bottom > tr.bottom + 1) {
            problems.push(`toolbar control ${i} spills the toolbar`);
          }
        });
      }
      return problems;
    });
    expect(result).toEqual([]);
  });

  test('sidebar and canvas area tile the layout without overlapping', async ({ page }, testInfo) => {
    if (testInfo.project.name !== 'chromium') return;
    const result = await page.evaluate(() => {
      const problems: string[] = [];
      const host = document.querySelector('snice-camera-annotate') as HTMLElement;
      const root = host.shadowRoot!;
      const layout = root.querySelector('.ca-layout')!.getBoundingClientRect();
      const main = root.querySelector('.ca-main') as HTMLElement | null;
      if (!main) return ['no .ca-main'];
      const mr = main.getBoundingClientRect();
      if (mr.width < 100) problems.push(`main column only ${Math.round(mr.width)}px wide`);
      if (mr.right > layout.right + 1 || mr.bottom > layout.bottom + 1) {
        problems.push('main column overflows the layout');
      }

      const list = root.querySelector('.ca-annotation-list') as HTMLElement | null;
      if (list) {
        const lr = list.getBoundingClientRect();
        if (lr.width > 0) {
          // Sidebar sits beside the main column, never on top of it.
          if (lr.left + 1 < mr.right && lr.right - 1 > mr.left) {
            problems.push('sidebar overlaps the main column horizontally');
          }
          if (lr.right > layout.right + 1) problems.push('sidebar overflows the layout');
        }
      }
      return problems;
    });
    expect(result).toEqual([]);
  });
});
