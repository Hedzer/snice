import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/image/demo.html';

test.describe('Snice Image visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-image'));
    await page.waitForTimeout(400);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('explicit width/height are honoured and the frame clips its image', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-image').forEach((img, i) => {
        const label = img.getAttribute('alt') || `image[${i}]`;
        const root = (img as HTMLElement).shadowRoot;
        if (!root) { problems.push(`${label}: no shadow root`); return; }
        const container = root.querySelector('.image-container') as HTMLElement | null;
        if (!container) { problems.push(`${label}: no .image-container`); return; }
        const box = container.getBoundingClientRect();

        // A declared width/height must be exactly what the frame measures.
        const declW = img.getAttribute('width');
        const declH = img.getAttribute('height');
        if (declW?.endsWith('px') && Math.abs(box.width - parseFloat(declW)) > 1) {
          problems.push(`${label}: width ${Math.round(box.width)} != declared ${declW}`);
        }
        if (declH?.endsWith('px') && Math.abs(box.height - parseFloat(declH)) > 1) {
          problems.push(`${label}: height ${Math.round(box.height)} != declared ${declH}`);
        }

        // Frames always occupy a visible area, loaded or not.
        if (box.width < 20 || box.height < 20) {
          problems.push(`${label}: frame collapsed (${Math.round(box.width)}x${Math.round(box.height)})`);
        }

        // The image (or placeholder) never paints outside its frame — the
        // container clips overflow, so its own box must still fit.
        const inner = root.querySelector('.image') as HTMLElement | null;
        if (inner) {
          const ir = inner.getBoundingClientRect();
          if (ir.width > box.width + 1 || ir.height > box.height + 1) {
            problems.push(
              `${label}: inner ${Math.round(ir.width)}x${Math.round(ir.height)}`
              + ` exceeds frame ${Math.round(box.width)}x${Math.round(box.height)}`);
          }
          if (ir.left < box.left - 1 || ir.top < box.top - 1) {
            problems.push(`${label}: inner image starts outside the frame`);
          }
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  // BUG: size="large" renders SMALLER than size="medium" and identical to
  // size="small". snice-image.css `.image--large` reads
  // `var(--snice-spacing-3xl, 12rem)` — the same token `.image--small` uses
  // (--snice-spacing-3xl = 4rem/64px) instead of a larger one, so the
  // showcase's "All Sizes Compared" row measures 64 / 128 / 64 px.
  test.fixme('size presets scale small < medium < large', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const boxOf = (el: Element) => (el as HTMLElement).shadowRoot!
        .querySelector('.image')!.getBoundingClientRect();

      // "All Sizes Compared" row: identical sources, only `size` differs.
      const byAlt: Record<string, number> = {};
      [...document.querySelectorAll('snice-image')]
        .filter(el => ['Small', 'Medium', 'Large'].includes(el.getAttribute('alt') || '')
          && !el.hasAttribute('width'))
        .forEach(el => { byAlt[el.getAttribute('alt')!] = boxOf(el).width; });
      if (byAlt.Small === undefined || byAlt.Medium === undefined || byAlt.Large === undefined) {
        problems.push(`size row incomplete: ${JSON.stringify(byAlt)}`);
      } else if (!(byAlt.Small < byAlt.Medium && byAlt.Medium < byAlt.Large)) {
        problems.push(`size presets do not scale: ${JSON.stringify(byAlt)}`);
      }
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('circle frames are square with a fully round radius', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-image[variant="circle"]').forEach((el, i) => {
        const inner = (el as HTMLElement).shadowRoot!.querySelector('.image') as HTMLElement;
        const r = inner.getBoundingClientRect();
        if (Math.abs(r.width - r.height) > 1) {
          problems.push(`circle[${i}]: not square (${Math.round(r.width)}x${Math.round(r.height)})`);
        }
        if (!getComputedStyle(inner).borderRadius.includes('50%')
          && parseFloat(getComputedStyle(inner).borderTopLeftRadius) < r.width / 2 - 1) {
          problems.push(`circle[${i}]: border-radius is not circular`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
