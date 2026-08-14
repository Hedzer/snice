import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/camera-annotate/demo.html';

// The showcase creates instances lazily (camera capture needs user activation),
// so every assertion runs after opening one. A synthetic camera keeps the
// capture pipeline deterministic in headless Chromium.
test.use({
  launchOptions: {
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  },
});

test.describe('Snice Camera Annotate visual integrity', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['camera']);
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.locator('button.open-cam').first().click();
    await page.waitForFunction(() =>
      !!document.querySelector('snice-camera-annotate')?.shadowRoot?.querySelector('.ca-layout'));
    await page.waitForTimeout(400);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('opened annotator spans its host box and keeps the toolbar inside the main column', async ({ page }) => {
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

  test('sidebar and canvas area tile the layout without overlapping', async ({ page }) => {
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
