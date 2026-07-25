import { test, expect } from '@playwright/test';

const demoPath = 'http://localhost:5566/tests/live/layout/z-index-stacking.html';

test.describe('Layout Z-Index Stacking', () => {
  test('the mobile sidebar overlay stacks above page content', async ({ page }) => {
    await page.setViewportSize({ width: 480, height: 800 });
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');

    await page.waitForFunction(() => {
      const sidebar = document.querySelector('snice-layout-sidebar');
      return sidebar?.shadowRoot != null;
    }, { timeout: 5000 });

    const result = await page.evaluate(() => {
      const sidebar = document.querySelector('snice-layout-sidebar');
      if (!sidebar?.shadowRoot) throw new Error('Shadow root not found');

      const aside = sidebar.shadowRoot.querySelector('aside.sidebar') as HTMLElement | null;
      const main = sidebar.shadowRoot.querySelector('.main') as HTMLElement | null;
      const toggleButton = sidebar.shadowRoot.querySelector('.sidebar-toggle') as HTMLButtonElement | null;

      if (!aside || !main || !toggleButton) {
        throw new Error(`Required elements not found: ${JSON.stringify({ aside: !!aside, main: !!main, toggleButton: !!toggleButton })}`);
      }

      toggleButton.click();

      return new Promise<any>(resolve => {
        setTimeout(() => {
          const scrim = sidebar.shadowRoot!.querySelector('.scrim') as HTMLElement;
          resolve({
            sidebarZ: parseInt(window.getComputedStyle(aside).zIndex, 10),
            scrimZ: parseInt(window.getComputedStyle(scrim).zIndex, 10),
            mainZ: parseInt(window.getComputedStyle(main).zIndex, 10),
          });
        }, 300);
      });
    });

    expect(result.sidebarZ).toBeGreaterThan(result.scrimZ);
    expect(result.scrimZ).toBeGreaterThan(result.mainZ);
    expect(result.mainZ).toBe(0);
  });

  test('page content should render below layout header', async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');

    // Wait for shadow root to be attached
    await page.waitForFunction(() => {
      const sidebar = document.querySelector('snice-layout-sidebar');
      return sidebar?.shadowRoot != null;
    }, { timeout: 5000 });

    const result = await page.evaluate(() => {
      const sidebar = document.querySelector('snice-layout-sidebar');
      if (!sidebar?.shadowRoot) throw new Error('Shadow root not found');

      const header = sidebar.shadowRoot.querySelector('.header');
      const main = sidebar.shadowRoot.querySelector('.main');

      if (!header || !main) {
        throw new Error('Header or main not found');
      }

      const headerZ = window.getComputedStyle(header).zIndex;
      const mainZ = window.getComputedStyle(main).zIndex;

      return {
        headerZ: parseInt(headerZ, 10),
        mainZ: parseInt(mainZ, 10)
      };
    });

    expect(result.headerZ).toBeGreaterThan(result.mainZ);
    expect(result.headerZ).toBe(10);
  });

  test('the scrim is reachable and closes the overlay', async ({ page }) => {
    await page.setViewportSize({ width: 480, height: 800 });
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');

    await page.waitForFunction(() => {
      const sidebar = document.querySelector('snice-layout-sidebar');
      return sidebar?.shadowRoot != null;
    }, { timeout: 5000 });

    const result = await page.evaluate(() => {
      const sidebar = document.querySelector('snice-layout-sidebar') as any;
      if (!sidebar?.shadowRoot) throw new Error('Shadow root not found');

      const toggleButton = sidebar.shadowRoot.querySelector('.sidebar-toggle') as HTMLButtonElement;
      toggleButton.click();

      return new Promise<any>(resolve => {
        setTimeout(() => {
          const scrim = sidebar.shadowRoot.querySelector('.scrim') as HTMLElement;
          const visible = window.getComputedStyle(scrim).display !== 'none';
          const rect = scrim.getBoundingClientRect();
          const topElement = sidebar.shadowRoot.elementFromPoint(rect.right - 5, rect.bottom - 5);

          scrim.click();

          setTimeout(() => {
            resolve({
              scrimVisible: visible,
              scrimOnTop: topElement === scrim,
              closedAfterClick: sidebar.mobileOpen === false,
            });
          }, 300);
        }, 300);
      });
    });

    expect(result.scrimVisible).toBe(true);
    expect(result.scrimOnTop).toBe(true);
    expect(result.closedAfterClick).toBe(true);
  });
});
