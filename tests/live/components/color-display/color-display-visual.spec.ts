import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/color-display/visual.html';

test.describe('Snice Color Display visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('swatch renders square at a visible size and stays inside the container', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-color-display').forEach((host, i) => {
        const root = (host as HTMLElement).shadowRoot;
        const container = root?.querySelector('.color-display');
        if (!container) { problems.push(`display[${i}]: no container`); return; }
        const cr = container.getBoundingClientRect();
        const swatch = root!.querySelector('.color-swatch') as HTMLElement | null;
        if (!swatch) return; // swatch can be switched off by config
        const sr = swatch.getBoundingClientRect();

        if (sr.width < 8 || sr.height < 8) {
          problems.push(`display[${i}]: swatch collapsed (${Math.round(sr.width)}x${Math.round(sr.height)})`);
        }
        if (Math.abs(sr.width - sr.height) > 1) {
          problems.push(`display[${i}]: swatch not square (${Math.round(sr.width)}x${Math.round(sr.height)})`);
        }
        if (sr.left < cr.left - 1 || sr.right > cr.right + 1
            || sr.top < cr.top - 1 || sr.bottom > cr.bottom + 1) {
          problems.push(`display[${i}]: swatch escapes its container`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('label sits beside the swatch on a shared centre line, inside the container', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-color-display').forEach((host, i) => {
        const root = (host as HTMLElement).shadowRoot;
        const container = root?.querySelector('.color-display');
        const swatch = root?.querySelector('.color-swatch') as HTMLElement | null;
        const label = root?.querySelector('.color-label') as HTMLElement | null;
        if (!container || !swatch || !label) return;
        const cr = container.getBoundingClientRect();
        const sr = swatch.getBoundingClientRect();
        const lr = label.getBoundingClientRect();
        // An empty `value` legitimately renders an empty label box.
        if (lr.width === 0 && !label.textContent?.trim()) return;
        if (lr.width === 0) { problems.push(`display[${i}]: non-empty label has zero width`); return; }

        if (lr.left < sr.right - 1) {
          problems.push(`display[${i}]: label overlaps the swatch`
            + ` (label.left ${Math.round(lr.left)} < swatch.right ${Math.round(sr.right)})`);
        }
        const dy = (lr.top + lr.height / 2) - (sr.top + sr.height / 2);
        if (Math.abs(dy) > 2) {
          problems.push(`display[${i}]: label off the swatch centre line by ${dy.toFixed(1)}px`);
        }
        if (lr.right > cr.right + 1 || lr.top < cr.top - 1 || lr.bottom > cr.bottom + 1) {
          problems.push(`display[${i}]: label escapes its container`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
