import { test, expect } from '@playwright/test';

test('doc sidebar is visible and functional', async ({ page }) => {
  // Capture console errors
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  await page.goto('http://localhost:5566/components/doc/demo.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  const docComponent = page.locator('snice-doc').first();
  await expect(docComponent).toBeVisible();

  // Check sidebar exists
  const hasSidebar = await docComponent.evaluate((el: any) => {
    const shadowRoot = el.shadowRoot;
    if (!shadowRoot) return false;
    const sidebar = shadowRoot.querySelector('.doc-sidebar');
    return sidebar !== null;
  });

  expect(hasSidebar).toBe(true);

  // Check sidebar has block items
  const blockItemCount = await docComponent.evaluate((el: any) => {
    const shadowRoot = el.shadowRoot;
    const items = shadowRoot?.querySelectorAll('.sidebar-block-item');
    return items?.length || 0;
  });

  expect(blockItemCount).toBeGreaterThan(0);

  // Click a block type to add it
  await docComponent.evaluate((el: any) => {
    const shadowRoot = el.shadowRoot;
    const firstBlockItem = shadowRoot?.querySelector('.sidebar-block-item');
    if (firstBlockItem) firstBlockItem.click();
  });

  await page.waitForTimeout(200);

  // Check block was added
  const blockCount = await docComponent.evaluate((el: any) => {
    return el.blocks?.length || 0;
  });

  expect(blockCount).toBeGreaterThan(1);

  // Test sidebar toggle
  await docComponent.evaluate((el: any) => {
    const shadowRoot = el.shadowRoot;
    const toggleBtn = shadowRoot?.querySelector('.sidebar-toggle');
    if (toggleBtn) toggleBtn.click();
  });

  await page.waitForTimeout(400);

  // Check sidebar is collapsed
  const isCollapsed = await docComponent.evaluate((el: any) => {
    const shadowRoot = el.shadowRoot;
    const sidebar = shadowRoot?.querySelector('.doc-sidebar');
    return sidebar?.classList.contains('collapsed') || false;
  });

  expect(isCollapsed).toBe(true);

  // Click anywhere in container to focus last block
  await docComponent.evaluate((el: any) => {
    const shadowRoot = el.shadowRoot;
    const container = shadowRoot?.querySelector('.doc-container');
    if (container) container.click();
  });

  await page.waitForTimeout(200);

  // Check that a block is focused
  const hasFocusedBlock = await docComponent.evaluate((el: any) => {
    const shadowRoot = el.shadowRoot;
    const activeElement = shadowRoot?.activeElement;
    return activeElement?.classList.contains('block-content') || false;
  });

  expect(hasFocusedBlock).toBe(true);

  // Verify no errors
  expect(errors).toHaveLength(0);
});
