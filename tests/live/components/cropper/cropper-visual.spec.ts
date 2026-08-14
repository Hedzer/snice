import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/cropper/demo.html';

test.describe('Snice Cropper visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-cropper'));
    // The crop box is only sized once the source image has decoded.
    await page.waitForFunction(() => {
      const imgs = [...document.querySelectorAll('snice-cropper')]
        .map((c: any) => c.shadowRoot?.querySelector('img'))
        .filter((i: any) => i && i.getAttribute('src'));
      return imgs.length > 0 && imgs.every((i: any) => i.complete);
    }, undefined, { timeout: 30_000 });
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('crop box is centred inside the frame and honours aspect-ratio', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-cropper').forEach((host: any, i) => {
        if (!host.getAttribute('src')) return; // empty-state cropper has no crop box
        const cropper = host.shadowRoot.querySelector('.cropper') as HTMLElement;
        const area = host.shadowRoot.querySelector('.crop-area') as HTMLElement;
        const fr = cropper.getBoundingClientRect();
        const ar = area.getBoundingClientRect();

        if (ar.width < 20 || ar.height < 20) {
          problems.push(`cropper[${i}]: crop box collapsed to ${Math.round(ar.width)}x${Math.round(ar.height)}`);
          return;
        }
        // Never larger than, nor outside, the frame.
        if (ar.left < fr.left - 1 || ar.right > fr.right + 1
            || ar.top < fr.top - 1 || ar.bottom > fr.bottom + 1) {
          problems.push(`cropper[${i}]: crop box escapes the frame`);
        }
        // Centred on the frame.
        const dx = (ar.left + ar.width / 2) - (fr.left + fr.width / 2);
        const dy = (ar.top + ar.height / 2) - (fr.top + fr.height / 2);
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
          problems.push(`cropper[${i}]: crop box off centre by (${dx.toFixed(1)},${dy.toFixed(1)})`);
        }
        // Declared aspect ratio respected.
        const declared = Number(host.getAttribute('aspect-ratio') ?? 0);
        if (declared > 0) {
          const actual = ar.width / ar.height;
          if (Math.abs(actual - declared) > 0.03) {
            problems.push(`cropper[${i}]: ratio ${actual.toFixed(3)} != aspect-ratio ${declared}`);
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('all eight resize handles sit on the crop box edges at a grabbable size', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const expected: Record<string, [number, number]> = {
        nw: [0, 0], n: [0.5, 0], ne: [1, 0],
        w: [0, 0.5], e: [1, 0.5],
        sw: [0, 1], s: [0.5, 1], se: [1, 1]
      };
      document.querySelectorAll('snice-cropper').forEach((host: any, i) => {
        if (!host.getAttribute('src')) return;
        const area = host.shadowRoot.querySelector('.crop-area') as HTMLElement;
        const ar = area.getBoundingClientRect();
        const handles = [...host.shadowRoot.querySelectorAll('.handle')] as HTMLElement[];
        if (handles.length !== 8) {
          problems.push(`cropper[${i}]: ${handles.length} handles, expected 8`);
          return;
        }
        handles.forEach(h => {
          const key = h.dataset.handle!;
          const [fx, fy] = expected[key];
          const r = h.getBoundingClientRect();
          if (r.width < 8 || r.height < 8) {
            problems.push(`cropper[${i}] handle ${key}: ${Math.round(r.width)}x${Math.round(r.height)} too small to grab`);
          }
          const wantX = ar.left + ar.width * fx;
          const wantY = ar.top + ar.height * fy;
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          // Tolerance covers the crop box's own 2px border: the handles are
          // offset from the padding box, so their centres land ~3px inside
          // the border-box edge measured here.
          if (Math.abs(cx - wantX) > 4 || Math.abs(cy - wantY) > 4) {
            problems.push(`cropper[${i}] handle ${key}: centre (${Math.round(cx)},${Math.round(cy)})`
              + ` != edge point (${Math.round(wantX)},${Math.round(wantY)})`);
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('the image is letterboxed inside the frame, never cropped by it', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-cropper').forEach((host: any, i) => {
        if (!host.getAttribute('src')) return;
        const cropper = host.shadowRoot.querySelector('.cropper') as HTMLElement;
        const img = host.shadowRoot.querySelector('img') as HTMLImageElement;
        const fr = cropper.getBoundingClientRect();
        const ir = img.getBoundingClientRect();
        if (ir.width < 10 || ir.height < 10) {
          problems.push(`cropper[${i}]: image renders at ${Math.round(ir.width)}x${Math.round(ir.height)}`);
          return;
        }
        if (ir.width > fr.width + 1 || ir.height > fr.height + 1) {
          problems.push(`cropper[${i}]: image ${Math.round(ir.width)}x${Math.round(ir.height)}`
            + ` overflows frame ${Math.round(fr.width)}x${Math.round(fr.height)}`);
        }
        // Aspect ratio of the source must be preserved by the fit.
        const natural = img.naturalWidth / img.naturalHeight;
        if (Math.abs(ir.width / ir.height - natural) > 0.02) {
          problems.push(`cropper[${i}]: image distorted (${(ir.width / ir.height).toFixed(3)} vs ${natural.toFixed(3)})`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
