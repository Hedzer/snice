import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/qr-reader/demo.html';

test.describe('Snice QrReader visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-qr-reader'));
    await page.waitForTimeout(300);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('viewport keeps its 4:3 frame and the overlay covers it exactly', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-qr-reader').forEach((reader, i) => {
        const root = (reader as HTMLElement).shadowRoot;
        if (!root) { problems.push(`reader[${i}]: no shadow root`); return; }
        const container = root.querySelector('.qr-reader-container') as HTMLElement | null;
        const viewport = root.querySelector('.qr-reader-viewport') as HTMLElement | null;
        if (!container || !viewport) { problems.push(`reader[${i}]: missing container/viewport`); return; }
        const cr = container.getBoundingClientRect();
        const vr = viewport.getBoundingClientRect();

        if (vr.width < 100) {
          problems.push(`reader[${i}]: viewport only ${Math.round(vr.width)}px wide`);
        }
        const ratio = vr.height / vr.width;
        if (Math.abs(ratio - 0.75) > 0.01) {
          problems.push(`reader[${i}]: aspect ${ratio.toFixed(3)} != 4:3`);
        }
        if (Math.abs(vr.width - cr.width) > 1) {
          problems.push(`reader[${i}]: viewport does not fill the container width`);
        }

        const overlay = root.querySelector('.qr-reader-overlay') as HTMLElement | null;
        if (overlay) {
          const or = overlay.getBoundingClientRect();
          if (Math.abs(or.width - vr.width) > 1 || Math.abs(or.height - vr.height) > 1
            || Math.abs(or.top - vr.top) > 1 || Math.abs(or.left - vr.left) > 1) {
            problems.push(`reader[${i}]: idle overlay does not cover the viewport`);
          }
          const message = overlay.querySelector('.qr-reader-message') as HTMLElement | null;
          if (message) {
            const mr = message.getBoundingClientRect();
            const dx = (mr.left + mr.width / 2) - (or.left + or.width / 2);
            const dy = (mr.top + mr.height / 2) - (or.top + or.height / 2);
            if (Math.abs(dx) > 1.5 || Math.abs(dy) > 1.5) {
              problems.push(`reader[${i}]: idle message off-centre (${dx.toFixed(1)}, ${dy.toFixed(1)})`);
            }
            if (mr.width > or.width || mr.height > or.height) {
              problems.push(`reader[${i}]: idle message larger than the viewport`);
            }
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('control buttons form a centred row along the bottom of the viewport', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-qr-reader').forEach((reader, i) => {
        const root = (reader as HTMLElement).shadowRoot;
        const controls = root?.querySelector('.qr-reader-controls') as HTMLElement | null;
        const container = root?.querySelector('.qr-reader-container') as HTMLElement | null;
        if (!controls || !container) return;
        const cr = container.getBoundingClientRect();
        const rr = controls.getBoundingClientRect();

        if (Math.abs(rr.bottom - cr.bottom) > 1) {
          problems.push(`reader[${i}]: controls not anchored to the container bottom`);
        }
        const buttons = [...controls.querySelectorAll('.qr-btn')] as HTMLElement[];
        if (buttons.length === 0) { problems.push(`reader[${i}]: no control buttons`); return; }
        const rects = buttons.map(b => b.getBoundingClientRect());
        rects.forEach((br, b) => {
          if (br.width < 24 || br.height < 24) {
            problems.push(`reader[${i}] btn ${b}: tap target only ${Math.round(br.width)}x${Math.round(br.height)}`);
          }
          if (br.left < cr.left - 1 || br.right > cr.right + 1
            || br.top < cr.top - 1 || br.bottom > cr.bottom + 1) {
            problems.push(`reader[${i}] btn ${b}: escapes the container`);
          }
          if (Math.abs(br.top - rects[0].top) > 1) {
            problems.push(`reader[${i}] btn ${b}: not aligned with the first button`);
          }
          if (b > 0 && br.left < rects[b - 1].right - 1) {
            problems.push(`reader[${i}] btn ${b}: overlaps the previous button`);
          }
        });
        // The button cluster is centred in the frame.
        const clusterMid = (rects[0].left + rects[rects.length - 1].right) / 2;
        const dx = clusterMid - (cr.left + cr.width / 2);
        if (Math.abs(dx) > 1.5) {
          problems.push(`reader[${i}]: controls off-centre by ${dx.toFixed(1)}px`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('starting the camera keeps every state panel inside the frame', async ({ page }) => {
    // No real capture device in the browser used for the run, so start()
    // resolves into either a live viewport or the error panel. Either way the
    // rendered state must stay inside the 4:3 frame.
    const reader = page.locator('snice-qr-reader').first();
    await reader.evaluate(el =>
      ((el as HTMLElement).shadowRoot!.querySelector('.qr-btn.start') as HTMLButtonElement).click());
    await page.waitForTimeout(700);

    const failures = await reader.evaluate(el => {
      const problems: string[] = [];
      const root = (el as HTMLElement).shadowRoot!;
      const container = root.querySelector('.qr-reader-container') as HTMLElement;
      const cr = container.getBoundingClientRect();
      const vr = (root.querySelector('.qr-reader-viewport') as HTMLElement).getBoundingClientRect();
      if (Math.abs(vr.height / vr.width - 0.75) > 0.01) {
        problems.push(`viewport lost its 4:3 frame after start (${vr.width}x${vr.height})`);
      }
      ['.qr-reader-error', '.qr-reader-result', '.qr-reader-message', 'video', 'canvas']
        .forEach(sel => {
          const node = root.querySelector(sel) as HTMLElement | null;
          if (!node) return;
          const r = node.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return;
          if (r.left < cr.left - 1 || r.right > cr.right + 1
            || r.top < cr.top - 1 || r.bottom > cr.bottom + 1) {
            problems.push(`${sel} escapes the reader frame`);
          }
        });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
