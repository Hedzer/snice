import { test, expect } from '@playwright/test';

test.describe('Select Component Dropdown Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5566/components/select/demo.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should render dropdown options on first open', async ({ page }) => {
    const select = page.locator('#basic-select');
    await expect(select).toBeVisible();

    // Click to open the dropdown
    const trigger = select.locator('.select-trigger');
    await trigger.click();

    // Wait for dropdown to open
    await page.waitForTimeout(500);

    // Check if dropdown is open
    const isOpen = await select.evaluate((el: any) => {
      return el.open;
    });
    expect(isOpen).toBe(true);

    // Check if options are rendered in the dropdown
    const optionsCount = await select.evaluate((el: any) => {
      const dropdown = el.shadowRoot?.querySelector('.select-options');
      if (!dropdown) return 0;
      const options = dropdown.querySelectorAll('.select-option');
      return options.length;
    });

    // Should have 5 options (including one disabled)
    expect(optionsCount).toBe(5);

    // Take screenshot for visual verification
    await page.screenshot({ path: '/tmp/select-dropdown-first-open.png' });
  });

  test('should show options immediately when opened', async ({ page }) => {
    const select = page.locator('#basic-select');

    // Open dropdown programmatically
    await select.evaluate((el: any) => {
      el.openDropdown();
    });

    await page.waitForTimeout(300);

    // Check dropdown state and options
    const state = await select.evaluate((el: any) => {
      const dropdown = el.shadowRoot?.querySelector('.select-options');
      const options = dropdown?.querySelectorAll('.select-option');

      return {
        open: el.open,
        dropdownExists: !!dropdown,
        optionsCount: options?.length || 0,
        dropdownHTML: dropdown?.innerHTML || ''
      };
    });

    expect(state.open).toBe(true);
    expect(state.dropdownExists).toBe(true);
    expect(state.optionsCount).toBe(5);
  });
});
