import { test, expect } from '@playwright/test';

const demoPath = 'http://localhost:5566/components/checkbox/demo.html';

test.describe('Checkbox Demo Assessment', () => {
  test('explore checkbox demo for issues', async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');

    // Check if checkboxes render
    const checkboxCount = await page.locator('snice-checkbox').count();
    console.log('Total checkboxes found:', checkboxCount);
    expect(checkboxCount).toBeGreaterThan(0);

    // Test basic checkbox interaction
    const firstCheckbox = page.locator('snice-checkbox').first();
    console.log('First checkbox visible:', await firstCheckbox.isVisible());

    // Check initial state
    const initialChecked = await firstCheckbox.evaluate((el: any) => el.checked);
    console.log('Initial checked state:', initialChecked);

    // Click the checkbox
    await firstCheckbox.click();
    await page.waitForTimeout(100);

    const afterClickChecked = await firstCheckbox.evaluate((el: any) => el.checked);
    console.log('After click checked state:', afterClickChecked);

    // Check if state changed
    expect(afterClickChecked).not.toBe(initialChecked);

    // Check disabled state functionality
    const disabledCheckboxes = page.locator('snice-checkbox[disabled]');
    const disabledCount = await disabledCheckboxes.count();
    console.log('Disabled checkboxes found:', disabledCount);

    if (disabledCount > 0) {
      const disabledCheckbox = disabledCheckboxes.first();
      const beforeClick = await disabledCheckbox.evaluate((el: any) => el.checked);

      await disabledCheckbox.click({ force: true });
      await page.waitForTimeout(100);

      const afterClick = await disabledCheckbox.evaluate((el: any) => el.checked);
      console.log('Disabled checkbox state changed after click:', beforeClick !== afterClick);

      // Disabled checkbox should NOT change state
      expect(afterClick).toBe(beforeClick);
    }

    // Check indeterminate state if it exists
    const indeterminateCheckboxes = page.locator('snice-checkbox[indeterminate]');
    const indeterminateCount = await indeterminateCheckboxes.count();
    console.log('Indeterminate checkboxes found:', indeterminateCount);

    // Test label clicking (if labels exist)
    const labels = page.locator('label');
    const labelCount = await labels.count();
    console.log('Labels found:', labelCount);

    // Check for any console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Interact with a few checkboxes to see if any errors occur
    const interactCount = Math.min(5, checkboxCount);
    for (let i = 0; i < interactCount; i++) {
      const checkbox = page.locator('snice-checkbox').nth(i);
      const isDisabled = await checkbox.evaluate((el: any) => el.disabled);

      if (!isDisabled) {
        await checkbox.click();
        await page.waitForTimeout(50);
      }
    }

    console.log('Console errors:', errors.length > 0 ? errors : 'None');
  });
});
