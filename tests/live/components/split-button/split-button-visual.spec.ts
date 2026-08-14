import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/split-button/demo.html';

test.describe('Snice Split Button visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('primary and toggle halves form one seamless control of equal height', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const hosts = [...document.querySelectorAll('snice-split-button')] as HTMLElement[];
      if (hosts.length === 0) problems.push('no split buttons rendered');

      const heightBySize: Record<string, number[]> = { small: [], medium: [], large: [] };

      hosts.forEach((host, i) => {
        const root = host.shadowRoot!;
        const primary = root.querySelector('.split-button__primary') as HTMLElement | null;
        const toggle = root.querySelector('.split-button__toggle') as HTMLElement | null;
        if (!primary || !toggle) { problems.push(`sb[${i}]: missing primary or toggle`); return; }
        const pr = primary.getBoundingClientRect();
        const tr = toggle.getBoundingClientRect();
        const hr = host.getBoundingClientRect();
        const tag = `sb[${i}] "${primary.textContent?.trim().slice(0, 24)}"`;

        // The two halves abut exactly — no seam gap, no overlap.
        if (Math.abs(tr.left - pr.right) > 1) {
          problems.push(`${tag}: seam ${Math.round(pr.right)} -> ${Math.round(tr.left)}`);
        }
        // Shared top and bottom edges, so the control reads as one pill.
        if (Math.abs(pr.top - tr.top) > 1 || Math.abs(pr.bottom - tr.bottom) > 1) {
          problems.push(`${tag}: halves misaligned vertically (${Math.round(pr.height)} vs ${Math.round(tr.height)} tall)`);
        }
        // Both halves stay within the host. (The showcase's `repeat(3, auto)`
        // matrix grid stretches some hosts wider than the control itself, so
        // this is containment rather than an exact span.)
        if (pr.left < hr.left - 1 || tr.right > hr.right + 1) {
          problems.push(`${tag}: halves overflow the host box`);
        }
        // The toggle is a narrow arrow affordance, never wider than the label half.
        if (tr.width > pr.width) {
          problems.push(`${tag}: toggle (${Math.round(tr.width)}px) wider than primary (${Math.round(pr.width)}px)`);
        }
        // The arrow glyph is centered in the toggle.
        const arrow = toggle.querySelector('.split-button__arrow') as HTMLElement | null;
        if (arrow) {
          const ar = arrow.getBoundingClientRect();
          if (ar.width > 0) {
            const dx = (ar.left + ar.width / 2) - (tr.left + tr.width / 2);
            const dy = (ar.top + ar.height / 2) - (tr.top + tr.height / 2);
            // Pill toggles carry deliberately asymmetric padding (10px/14px) to
            // optically compensate for the fully rounded right cap, which nudges
            // the glyph ~2px left of the geometric centre.
            const tolX = (host as any).pill ? 3 : 1.5;
            if (Math.abs(dx) > tolX || Math.abs(dy) > 1.5) {
              problems.push(`${tag}: arrow off-center by (${Math.round(dx)},${Math.round(dy)})`);
            }
          }
        }

        const size = (host as any).size ?? 'medium';
        if (heightBySize[size]) heightBySize[size].push(Math.round(hr.height));
      });

      const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
      const { small, medium, large } = heightBySize;
      if (small.length && medium.length && avg(small) >= avg(medium)) {
        problems.push(`size scale broken: small ${avg(small)} >= medium ${avg(medium)}`);
      }
      if (medium.length && large.length && avg(medium) >= avg(large)) {
        problems.push(`size scale broken: medium ${avg(medium)} >= large ${avg(large)}`);
      }
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('opening the menu drops a sanely sized panel under the button, right-aligned to it', async ({ page }) => {
    const host = page.locator('#many-actions snice-split-button').first();
    await host.locator('.split-button__toggle').click();
    await page.waitForTimeout(300);

    const geo = await host.evaluate((el: any) => {
      const root = el.shadowRoot as ShadowRoot;
      const menu = root.querySelector('.split-button__menu') as HTMLElement;
      const toggle = root.querySelector('.split-button__toggle') as HTMLElement;
      const mr = menu.getBoundingClientRect();
      const hr = el.getBoundingClientRect();
      const items = [...menu.querySelectorAll('.split-button__action')] as HTMLElement[];
      return {
        open: menu.matches(':popover-open'),
        menu: { top: mr.top, left: mr.left, right: mr.right, bottom: mr.bottom,
                width: mr.width, height: mr.height },
        host: { top: hr.top, left: hr.left, right: hr.right, bottom: hr.bottom, width: hr.width },
        toggleBottom: toggle.getBoundingClientRect().bottom,
        viewport: { w: window.innerWidth, h: window.innerHeight },
        items: items.map(it => {
          const r = it.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, height: r.height };
        }),
      };
    });

    expect(geo.open).toBe(true);
    // Panel is a real menu: at least as wide as the button it hangs off.
    expect(geo.menu.width).toBeGreaterThanOrEqual(geo.host.width - 1);
    expect(geo.menu.height).toBeGreaterThan(40);
    // It sits below the control, not on top of it.
    expect(geo.menu.top).toBeGreaterThanOrEqual(geo.toggleBottom - 1);
    // Right-aligned with the button.
    expect(Math.abs(geo.menu.right - geo.host.right)).toBeLessThanOrEqual(2);
    expect(geo.menu.right).toBeLessThanOrEqual(geo.viewport.w + 1);

    // Menu items tile the panel top to bottom, each inside its bounds.
    expect(geo.items.length).toBeGreaterThan(1);
    geo.items.forEach((item, i) => {
      expect(item.height).toBeGreaterThan(16);
      expect(item.left).toBeGreaterThanOrEqual(geo.menu.left - 1);
      expect(item.right).toBeLessThanOrEqual(geo.menu.right + 1);
      expect(item.top).toBeGreaterThanOrEqual(geo.menu.top - 1);
      expect(item.bottom).toBeLessThanOrEqual(geo.menu.bottom + 1);
      if (i > 0) {
        expect(Math.abs(item.top - geo.items[i - 1].bottom)).toBeLessThanOrEqual(1);
      }
    });
  });

  // BUG: the dropdown never clamps to the viewport. The menu is right-aligned to
  // its button and carries `min-width: 10rem`, so a button narrower than that
  // near the left edge pushes the panel off-screen instead of flipping or
  // clamping. Measured on #many-actions ("Export as CSV", host 113px wide with
  // its right edge at x=145): the 157px panel lands at left = -11.5 and its
  // first item at left = -2.5, clipping the panel's left edge off the viewport.
  test.fixme('an opened menu stays fully inside the viewport', async ({ page }) => {
    const host = page.locator('#many-actions snice-split-button').first();
    await host.locator('.split-button__toggle').click();
    await page.waitForTimeout(300);

    const left = await host.evaluate((el: any) =>
      el.shadowRoot.querySelector('.split-button__menu').getBoundingClientRect().left);
    expect(left).toBeGreaterThanOrEqual(-1);
  });
});
