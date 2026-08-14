import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/camera/demo.html';

test.describe('Snice Camera visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-camera'));
    await page.waitForTimeout(300);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('video fills its container and the control overlay stays inside the frame', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const cams = [...document.querySelectorAll('snice-camera')] as any[];
      if (cams.length === 0) problems.push('no cameras on page');

      cams.forEach((cam, i) => {
        const sr = cam.shadowRoot;
        const container = sr?.querySelector('.camera-container') as HTMLElement | null;
        const video = sr?.querySelector('video') as HTMLElement | null;
        if (!container || !video) { problems.push(`cam[${i}]: missing container/video`); return; }

        const cr = container.getBoundingClientRect();
        const vr = video.getBoundingClientRect();
        if (cr.width < 40 || cr.height < 40) {
          problems.push(`cam[${i}]: container collapsed (${Math.round(cr.width)}x${Math.round(cr.height)})`);
          return;
        }
        // The video is the frame: it must fill the container, not float inside it.
        if (Math.abs(vr.width - cr.width) > 1 || Math.abs(vr.height - cr.height) > 1) {
          problems.push(`cam[${i}]: video ${Math.round(vr.width)}x${Math.round(vr.height)}`
            + ` != container ${Math.round(cr.width)}x${Math.round(cr.height)}`);
        }

        const controls = sr.querySelector('.camera-controls') as HTMLElement | null;
        if (!controls) return; // show-controls="false" variants
        const kr = controls.getBoundingClientRect();
        if (kr.left < cr.left - 1 || kr.right > cr.right + 1
            || kr.top < cr.top - 1 || kr.bottom > cr.bottom + 1) {
          problems.push(`cam[${i}]: control overlay escapes the video frame`);
        }

        const btn = sr.querySelector('.camera-btn.capture') as HTMLElement | null;
        if (!btn) { problems.push(`cam[${i}]: no capture button`); return; }
        const br = btn.getBoundingClientRect();
        // Shutter must be a real, round, tappable target inside the frame.
        if (br.width < 24 || br.width > 96 || Math.abs(br.width - br.height) > 1) {
          problems.push(`cam[${i}]: capture button ${Math.round(br.width)}x${Math.round(br.height)}`);
        }
        if (br.left < cr.left - 1 || br.right > cr.right + 1
            || br.top < cr.top - 1 || br.bottom > cr.bottom + 1) {
          problems.push(`cam[${i}]: capture button escapes the video frame`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('controls-position anchors the overlay to the named edge', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const cams = [...document.querySelectorAll('snice-camera[controls-position]')] as any[];
      if (cams.length === 0) problems.push('no positioned cameras');

      cams.forEach(cam => {
        const pos = cam.getAttribute('controls-position')!;
        const sr = cam.shadowRoot;
        const container = sr?.querySelector('.camera-container') as HTMLElement | null;
        const controls = sr?.querySelector('.camera-controls') as HTMLElement | null;
        if (!container || !controls) { problems.push(`${pos}: missing nodes`); return; }
        const cr = container.getBoundingClientRect();
        const kr = controls.getBoundingClientRect();
        const cx = kr.left + kr.width / 2;
        const cy = kr.top + kr.height / 2;
        const midX = cr.left + cr.width / 2;
        const midY = cr.top + cr.height / 2;

        if (pos.includes('top') && cy >= midY) problems.push(`${pos}: overlay is not in the top half`);
        if (pos.includes('bottom') && cy <= midY) problems.push(`${pos}: overlay is not in the bottom half`);
        if (pos.includes('left') && cx >= midX) problems.push(`${pos}: overlay is not in the left half`);
        if (pos.includes('right') && cx <= midX) problems.push(`${pos}: overlay is not in the right half`);
        // Edge-only values must span that edge rather than hug a corner.
        if (pos === 'top' || pos === 'bottom') {
          if (kr.width < cr.width - 2) problems.push(`${pos}: overlay does not span the edge`);
        }
        if (pos === 'left' || pos === 'right') {
          if (kr.height < cr.height - 2) problems.push(`${pos}: overlay does not span the edge`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
