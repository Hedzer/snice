import { test, expect } from '@playwright/test';

const demoPath = 'http://localhost:5566/tests/live/layout/z-index-stacking.html';

test.describe('Layout Z-Index Stacking', () => {
  test('page content should render below layout drawer', async ({ page }) => {
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

      const drawerElement = sidebar.shadowRoot.querySelector('snice-drawer');
      const main = sidebar.shadowRoot.querySelector('.main');
      const toggleButton = sidebar.shadowRoot.querySelector('.sidebar-toggle') as HTMLButtonElement;

      if (!drawerElement || !main || !toggleButton) {
        const availableElements = {
          drawerElement: !!drawerElement,
          main: !!main,
          toggleButton: !!toggleButton,
          shadowHTML: sidebar.shadowRoot.innerHTML.substring(0, 500)
        };
        throw new Error(`Required elements not found: ${JSON.stringify(availableElements)}`);
      }

      // Make sure drawer element has shadow root
      if (!drawerElement.shadowRoot) {
        throw new Error('Drawer shadow root not found');
      }

      // Get the actual drawer panel inside the drawer's shadow DOM
      const drawerPanel = drawerElement.shadowRoot.querySelector('.drawer');
      if (!drawerPanel) {
        throw new Error('Drawer panel not found in drawer shadow DOM');
      }

      toggleButton.click();

      return new Promise<any>((resolve) => {
        setTimeout(() => {
          const drawerZ = window.getComputedStyle(drawerPanel).zIndex;
          const mainZ = window.getComputedStyle(main).zIndex;

          resolve({
            drawerZ: parseInt(drawerZ, 10),
            mainZ: parseInt(mainZ, 10)
          });
        }, 200);
      });
    });

    expect(result.drawerZ).toBeGreaterThan(result.mainZ);
    expect(result.drawerZ).toBeGreaterThanOrEqual(1050);
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
    expect(result.headerZ).toBe(1020);
  });

  test('drawer backdrop should be clickable and not blocked by page content', async ({ page }) => {
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

      const drawerElement = sidebar.shadowRoot.querySelector('snice-drawer');
      const toggleButton = sidebar.shadowRoot.querySelector('.sidebar-toggle') as HTMLButtonElement;

      if (!drawerElement || !toggleButton) {
        throw new Error('Drawer or toggle not found');
      }

      toggleButton.click();

      return new Promise<any>((resolve) => {
        setTimeout(() => {
          if (!drawerElement.shadowRoot) {
            resolve({ error: 'Drawer shadow root not found' });
            return;
          }

          const backdrop = drawerElement.shadowRoot.querySelector('.drawer-backdrop') as HTMLElement;
          if (!backdrop) {
            resolve({ error: 'Backdrop not found' });
            return;
          }

          backdrop.click();

          setTimeout(() => {
            resolve({ drawerClosed: !drawerElement.hasAttribute('open') });
          }, 200);
        }, 200);
      });
    });

    expect(result.drawerClosed).toBe(true);
  });
});
