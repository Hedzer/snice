import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/paint/visual.html';

test.describe('Snice Paint visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('toolbar column and canvas wrap tile the host with no overlap or dead space', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const hosts = [...document.querySelectorAll('snice-paint')] as HTMLElement[];
      if (hosts.length === 0) problems.push('no paint hosts rendered');

      hosts.forEach((host, i) => {
        const root = host.shadowRoot!;
        const container = root.querySelector('.paint-container') as HTMLElement | null;
        const wrap = root.querySelector('.paint-canvas-wrap') as HTMLElement | null;
        if (!container || !wrap) { problems.push(`paint[${i}]: missing container or canvas wrap`); return; }
        const hr = host.getBoundingClientRect();
        const cr = container.getBoundingClientRect();
        const wr = wrap.getBoundingClientRect();

        // The container fills the host's content box exactly. (The showcase
        // puts a 1px border on the host, so compare inside that border.)
        const hcs = getComputedStyle(host);
        const inset = (a: string, b: string) =>
          parseFloat(hcs.getPropertyValue(a)) + parseFloat(hcs.getPropertyValue(b));
        const contentW = hr.width - inset('border-left-width', 'border-right-width')
          - inset('padding-left', 'padding-right');
        const contentH = hr.height - inset('border-top-width', 'border-bottom-width')
          - inset('padding-top', 'padding-bottom');
        if (Math.abs(cr.width - contentW) > 1 || Math.abs(cr.height - contentH) > 1) {
          problems.push(`paint[${i}]: container ${Math.round(cr.width)}x${Math.round(cr.height)} vs host content box ${Math.round(contentW)}x${Math.round(contentH)}`);
        }

        const toolbar = root.querySelector('.paint-toolbar') as HTMLElement | null;
        if (toolbar) {
          const tr = toolbar.getBoundingClientRect();
          // Toolbar is a fixed-width column to the left of the drawing surface;
          // the two must abut, never overlap and never leave a gap.
          if (Math.abs(tr.right - wr.left) > 1) {
            problems.push(`paint[${i}]: toolbar/canvas seam ${Math.round(tr.right)} -> ${Math.round(wr.left)}`);
          }
          if (Math.abs(tr.height - cr.height) > 1) {
            problems.push(`paint[${i}]: toolbar height ${Math.round(tr.height)} != container ${Math.round(cr.height)}`);
          }
          // Every control stays inside the narrow toolbar column.
          toolbar.querySelectorAll('.paint-btn, .paint-swatches, .paint-size-slider').forEach(ctl => {
            const r = ctl.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) return;
            if (r.left < tr.left - 1 || r.right > tr.right + 1) {
              problems.push(`paint[${i}] ${ctl.className}: ${Math.round(r.left)}-${Math.round(r.right)} outside toolbar ${Math.round(tr.left)}-${Math.round(tr.right)}`);
            }
          });
        } else if (Math.abs(wr.left - cr.left) > 1) {
          problems.push(`paint[${i}]: no toolbar but canvas wrap is inset from the container`);
        }

        // The wrap consumes all remaining width and the full height.
        if (Math.abs(wr.right - cr.right) > 1 || Math.abs(wr.height - cr.height) > 1) {
          problems.push(`paint[${i}]: canvas wrap does not fill the remaining container area`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('canvas fills its wrap and its backing store matches CSS size times DPR', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const dpr = window.devicePixelRatio || 1;
      document.querySelectorAll('snice-paint').forEach((host, i) => {
        const root = (host as HTMLElement).shadowRoot!;
        const wrap = root.querySelector('.paint-canvas-wrap') as HTMLElement | null;
        const canvas = root.querySelector('canvas.paint-canvas') as HTMLCanvasElement | null;
        if (!wrap || !canvas) { problems.push(`paint[${i}]: no canvas`); return; }
        const wr = wrap.getBoundingClientRect();
        const kr = canvas.getBoundingClientRect();

        if (kr.width < 10 || kr.height < 10) {
          problems.push(`paint[${i}]: canvas laid out at ${Math.round(kr.width)}x${Math.round(kr.height)}`);
          return;
        }
        if (kr.left < wr.left - 1 || kr.right > wr.right + 1
          || kr.top < wr.top - 1 || kr.bottom > wr.bottom + 1) {
          problems.push(`paint[${i}]: canvas escapes its wrap`);
        }
        // A mismatched backing store is what makes strokes land offset from
        // the cursor or render blurry.
        if (Math.abs(canvas.width - kr.width * dpr) > 2) {
          problems.push(`paint[${i}]: backing width ${canvas.width} != css ${Math.round(kr.width)} x dpr ${dpr}`);
        }
        if (Math.abs(canvas.height - kr.height * dpr) > 2) {
          problems.push(`paint[${i}]: backing height ${canvas.height} != css ${Math.round(kr.height)} x dpr ${dpr}`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('a stroke lands under the pointer, not offset from it', async ({ page }) => {
    const canvas = page.locator('snice-paint:not([disabled]) canvas.paint-canvas').first();
    const box = (await canvas.boundingBox())!;
    // Drag a short horizontal stroke through the middle of the surface.
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width * 0.35, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.5, y, { steps: 8 });
    await page.mouse.move(box.x + box.width * 0.65, y, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(150);

    const probe = await canvas.evaluate((el: HTMLCanvasElement) => {
      const ctx = el.getContext('2d')!;
      const sample = (fx: number, fy: number) => {
        const d = ctx.getImageData(Math.round(el.width * fx), Math.round(el.height * fy), 1, 1).data;
        return `${d[0]},${d[1]},${d[2]}`;
      };
      return {
        onStroke: sample(0.5, 0.5),
        // Well away from the stroke, both vertically and horizontally.
        offStroke: sample(0.5, 0.15),
        corner: sample(0.05, 0.05),
      };
    });

    // Ink is present where the pointer went...
    expect(probe.onStroke).not.toBe(probe.corner);
    // ...and nowhere it did not.
    expect(probe.offStroke).toBe(probe.corner);
  });
});
