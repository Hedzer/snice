import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/tests/live/fixtures/binpack/visual.html';

// The showcase packs absolutely-positioned light-DOM items into each
// <snice-binpack>. The two things that must always hold are: packed items
// never overlap one another, and the container grows to contain them.
// #enter-seq animates items in on scroll, so it is excluded from the
// static geometry sweep.
test.describe('Snice Binpack visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    // The fixture is static (no fetches); WebKit's networkidle can hang on
    // the vite HMR socket, so the deterministic readiness is the fixture
    // flag plus the component definition.
    await page.waitForFunction(() =>
      document.documentElement.dataset.fixtureReady === 'true'
      && !!customElements.get('snice-binpack'));
    await page.waitForTimeout(400);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('packed items never overlap and stay inside their pack', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const packs = [...document.querySelectorAll('snice-binpack')] as HTMLElement[];
      if (packs.length === 0) problems.push('no snice-binpack on page');

      packs.forEach((pack, p) => {
        if (pack.id === 'enter-seq') return; // animates asynchronously
        const host = pack.getBoundingClientRect();
        const items = ([...pack.children] as HTMLElement[])
          .filter(el => !el.hasAttribute('hidden'))
          .map(el => el.getBoundingClientRect())
          .filter(r => r.width > 0 && r.height > 0);

        items.forEach((r, i) => {
          if (r.left < host.left - 1 || r.top < host.top - 1) {
            problems.push(`pack[${p}] item ${i}: starts outside host`);
          }
          // Horizontal packs scroll on x; every pack must still contain
          // its items vertically.
          if (r.bottom > host.bottom + 1) {
            problems.push(`pack[${p}] item ${i}: overflows host bottom`);
          }
          for (let j = i + 1; j < items.length; j++) {
            const o = items[j];
            const overlapX = Math.min(r.right, o.right) - Math.max(r.left, o.left);
            const overlapY = Math.min(r.bottom, o.bottom) - Math.max(r.top, o.top);
            if (overlapX > 1 && overlapY > 1) {
              problems.push(`pack[${p}]: items ${i} and ${j} overlap `
                + `(${Math.round(overlapX)}x${Math.round(overlapY)})`);
            }
          }
        });
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('grid-snapped pack aligns items to the column/row pitch', async ({ page }) => {
    // Section 4: column-width="100" row-height="100" gap="8px" -> pitch 108.
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const pack = [...document.querySelectorAll('snice-binpack')].find(
        p => p.getAttribute('column-width') === '100' && p.getAttribute('row-height') === '100'
      ) as HTMLElement | undefined;
      if (!pack) return ['grid-snapped pack not found'];

      const host = pack.getBoundingClientRect();
      ([...pack.children] as HTMLElement[]).forEach((item, i) => {
        const r = item.getBoundingClientRect();
        if (r.width === 0) return;
        const dx = r.left - host.left;
        const dy = r.top - host.top;
        if (Math.abs(dx % 108) > 1.5 && Math.abs((dx % 108) - 108) > 1.5) {
          problems.push(`grid item ${i}: x offset ${Math.round(dx)} off the 108px pitch`);
        }
        if (Math.abs(dy % 108) > 1.5 && Math.abs((dy % 108) - 108) > 1.5) {
          problems.push(`grid item ${i}: y offset ${Math.round(dy)} off the 108px pitch`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });
});
