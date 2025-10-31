import { test, expect } from '@playwright/test';

test('doc component renders and is interactive', async ({ page }) => {
  // Capture console errors
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  page.on('pageerror', err => {
    errors.push(err.message);
    console.log('PAGE ERROR:', err.message);
  });

  await page.goto('http://localhost:5566/components/doc/demo.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Check for any console errors
  if (errors.length > 0) {
    console.log('Errors detected:', errors);
  }

  // Find the doc component
  const docComponent = page.locator('snice-doc').first();
  await expect(docComponent).toBeVisible();

  // Get the shadow root and check for blocks
  const hasBlocks = await docComponent.evaluate((el: any) => {
    const shadowRoot = el.shadowRoot;
    if (!shadowRoot) return false;

    const container = shadowRoot.querySelector('.doc-container');
    if (!container) return false;

    const blocks = container.querySelectorAll('.doc-block');
    return blocks.length > 0;
  });

  expect(hasBlocks).toBe(true);

  // Try typing in the first block
  const firstBlockContent = await docComponent.evaluateHandle((el: any) => {
    const shadowRoot = el.shadowRoot;
    const content = shadowRoot?.querySelector('.block-content');
    return content;
  });

  await firstBlockContent.asElement()?.click();
  await page.keyboard.type('Hello World');

  // Wait a bit for DOM to update
  await page.waitForTimeout(200);

  // Check that content was updated
  const blockContent = await docComponent.evaluate((el: any) => {
    const shadowRoot = el.shadowRoot;
    const content = shadowRoot?.querySelector('.block-content');
    return content?.textContent;
  });

  expect(blockContent).toContain('Hello World');

  // Test block menu by typing /
  await page.keyboard.press('Control+A');
  await page.keyboard.type('/');
  await page.waitForTimeout(200);

  // Check if block menu appeared
  const hasBlockMenu = await docComponent.evaluate((el: any) => {
    const shadowRoot = el.shadowRoot;
    const menu = shadowRoot?.querySelector('.block-menu');
    return menu !== null;
  });

  expect(hasBlockMenu).toBe(true);

  // Verify no errors
  expect(errors).toHaveLength(0);
});
