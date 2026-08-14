import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/link/demo.html';

test.describe('Snice Link visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('the anchor hit area covers the whole rendered link text', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-link').forEach((host, i) => {
        const anchor = (host as HTMLElement).shadowRoot?.querySelector('a') as HTMLElement | null;
        if (!anchor) { problems.push(`link[${i}]: no anchor`); return; }
        const ar = anchor.getBoundingClientRect();
        const label = (host.textContent ?? '').trim();
        if (!label) return;

        if (ar.width < 4 || ar.height < 8) {
          problems.push(`link[${i}] "${label}": anchor collapsed`
            + ` (${Math.round(ar.width)}x${Math.round(ar.height)})`);
          return;
        }
        // Measure the slotted text's own line box: it must sit inside the
        // clickable anchor, not spill past it.
        const range = document.createRange();
        range.selectNodeContents(host);
        const tr = range.getBoundingClientRect();
        if (tr.width === 0) return;
        if (tr.left < ar.left - 1 || tr.right > ar.right + 1
            || tr.top < ar.top - 1 || tr.bottom > ar.bottom + 1) {
          problems.push(`link[${i}] "${label}": text escapes the anchor`
            + ` (text ${Math.round(tr.left)}-${Math.round(tr.right)},`
            + ` anchor ${Math.round(ar.left)}-${Math.round(ar.right)})`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('external links append an icon that is sized and sits after the text', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const externals = [...document.querySelectorAll('snice-link[external]')];
      if (externals.length === 0) {
        problems.push('showcase has no external links');
        return problems;
      }
      externals.forEach((host, i) => {
        const anchor = (host as HTMLElement).shadowRoot?.querySelector('a') as HTMLElement | null;
        if (!anchor) { problems.push(`external[${i}]: no anchor`); return; }
        const icon = anchor.querySelector('.link__external-icon') as HTMLElement | null;
        if (!icon) { problems.push(`external[${i}]: no external-link icon`); return; }
        const ar = anchor.getBoundingClientRect();
        const ir = icon.getBoundingClientRect();

        if (ir.width < 6 || ir.height < 6) {
          problems.push(`external[${i}]: icon collapsed (${Math.round(ir.width)}x${Math.round(ir.height)})`);
        }
        if (ir.width > 32 || ir.height > 32) {
          problems.push(`external[${i}]: icon oversized (${Math.round(ir.width)}x${Math.round(ir.height)})`);
        }
        if (ir.right > ar.right + 1 || ir.left < ar.left - 1
            || ir.top < ar.top - 2 || ir.bottom > ar.bottom + 2) {
          problems.push(`external[${i}]: icon escapes the anchor`);
        }
        const range = document.createRange();
        range.selectNodeContents(host);
        const tr = range.getBoundingClientRect();
        if (tr.width > 0 && ir.left < tr.right - 1) {
          problems.push(`external[${i}]: icon overlaps the link text`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
