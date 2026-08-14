import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/alert/demo.html';

test.describe('Snice Alert visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('alert content and icon stay inside the alert box', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-alert').forEach((alert, i) => {
        const rect = alert.getBoundingClientRect();
        if (rect.width === 0) return;
        const inner = (alert as any).shadowRoot?.querySelector('.alert');
        if (!inner) { problems.push(`alert[${i}]: no .alert`); return; }
        const ir = inner.getBoundingClientRect();
        if (ir.right > rect.right + 1 || ir.bottom > rect.bottom + 1) {
          problems.push(`alert[${i}]: body escapes host`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
