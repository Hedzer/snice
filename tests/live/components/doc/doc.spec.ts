import { test, expect } from '@playwright/test';

test('doc component renders', async ({ page }) => {
  await page.goto('http://localhost:5566/components/doc/demo.html');

  // Wait for component to be defined
  await page.waitForFunction(() => customElements.get('snice-doc'));

  // Check if doc component exists
  const doc = await page.locator('snice-doc').first();
  await expect(doc).toBeVisible();

  // Check if doc has shadow root content
  const hasContent = await doc.evaluate((el: any) => {
    return el.shadowRoot?.innerHTML?.length > 0;
  });

  console.log('Doc has shadow root content:', hasContent);

  // Get shadow root HTML
  const shadowHTML = await doc.evaluate((el: any) => {
    return el.shadowRoot?.innerHTML || 'NO SHADOW ROOT';
  });

  // Check blocks
  const blocks = await doc.evaluate((el: any) => {
    return el.blocks;
  });

  console.log('Blocks:', JSON.stringify(blocks, null, 2));
  console.log('Shadow root HTML length:', shadowHTML.length);
  console.log('Shadow root HTML preview:', shadowHTML.substring(0, 500));

  // Check for any console errors
  const errors: string[] = [];
  page.on('pageerror', error => {
    errors.push(error.message);
  });

  await page.waitForTimeout(500);

  if (errors.length > 0) {
    console.log('Page errors:', errors);
    throw new Error(`Page had errors: ${errors.join(', ')}`);
  }

  expect(hasContent).toBe(true);
});
