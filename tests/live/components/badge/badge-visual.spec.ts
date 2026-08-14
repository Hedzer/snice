import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/badge/demo.html';

test.describe('Snice Badge visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-badge'));
    await page.waitForFunction(() =>
      !!document.querySelector('snice-badge')?.shadowRoot?.querySelector('.badge'));
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('pinned badges centre on the requested corner of their target', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-badge').forEach((host, i) => {
        if (host.hasAttribute('inline')) return;
        const badge = (host as any).shadowRoot?.querySelector('.badge') as HTMLElement | null;
        if (!badge) return; // hidden-badge edge case is intentional
        const wrapper = (host as any).shadowRoot.querySelector('.badge-wrapper') as HTMLElement;
        const w = wrapper.getBoundingClientRect();
        const b = badge.getBoundingClientRect();
        const offset = Number(host.getAttribute('offset') ?? 0);
        const pos = host.getAttribute('position') ?? 'top-right';

        if (b.width < 6 || b.height < 6) {
          problems.push(`badge[${i}] (${pos}): degenerate ${Math.round(b.width)}x${Math.round(b.height)}`);
          return;
        }

        const cx = b.left + b.width / 2;
        const cy = b.top + b.height / 2;
        const wantX = pos.endsWith('right') ? w.right - offset : w.left + offset;
        const wantY = pos.startsWith('top') ? w.top + offset : w.bottom - offset;
        if (Math.abs(cx - wantX) > 2 || Math.abs(cy - wantY) > 2) {
          problems.push(
            `badge[${i}] (${pos}, offset ${offset}): centre (${Math.round(cx)},${Math.round(cy)})`
            + ` != corner (${Math.round(wantX)},${Math.round(wantY)})`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('size variants scale monotonically and inline badges flow in the row', async ({ page }) => {
    const result = await page.evaluate(() => {
      const heightFor = (size: string) => {
        const host = document.querySelector(`snice-badge[size="${size}"][content]`)!;
        const badge = (host as any).shadowRoot.querySelector('.badge') as HTMLElement;
        return badge.getBoundingClientRect().height;
      };
      const inlineProblems: string[] = [];
      document.querySelectorAll('snice-badge[inline]').forEach((host, i) => {
        const badge = (host as any).shadowRoot?.querySelector('.badge') as HTMLElement | null;
        if (!badge) { inlineProblems.push(`inline[${i}]: no badge`); return; }
        const hr = host.getBoundingClientRect();
        const br = badge.getBoundingClientRect();
        if (br.left < hr.left - 1 || br.right > hr.right + 1
            || br.top < hr.top - 1 || br.bottom > hr.bottom + 1) {
          inlineProblems.push(`inline[${i}]: badge escapes host box`);
        }
      });
      return {
        small: heightFor('small'),
        medium: heightFor('medium'),
        large: heightFor('large'),
        inlineProblems
      };
    });

    expect(result.inlineProblems).toEqual([]);
    expect(result.small).toBeGreaterThan(8);
    expect(result.medium).toBeGreaterThan(result.small);
    expect(result.large).toBeGreaterThan(result.medium);
  });
});
