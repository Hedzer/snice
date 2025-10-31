import { test, expect } from '@playwright/test';

test.describe('Tree Lazy Loading', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5566/components/tree/demo.html');
    await page.waitForTimeout(1000);
  });

  test('should show expander for lazy nodes', async ({ page }) => {
    const tree = page.locator('#tree-lazy');
    const rootItem = tree.locator('snice-tree-item').first();

    // Check that expander is visible for lazy node
    const expander = rootItem.locator('.tree-item__expander');
    await expect(expander).toBeVisible();
    await expect(expander).not.toHaveClass(/tree-item__expander--hidden/);
  });

  test('should show loading spinner when expanding lazy node', async ({ page }) => {
    const tree = page.locator('#tree-lazy');
    const rootItem = tree.locator('snice-tree-item').first();

    // Click expander
    const expander = rootItem.locator('.tree-item__expander');
    await expander.click();

    // Loading spinner should appear
    const loadingSpinner = rootItem.locator('.tree-item__loading');
    await expect(loadingSpinner).toBeVisible();

    // Expander should be hidden
    await expect(expander).not.toBeVisible();
  });

  test('should update node data and expand after lazy load', async ({ page }) => {
    await page.evaluate(async () => {
      const tree = document.querySelector('#tree-lazy') as any;

      // Get initial node state
      const initialNode = tree.nodes[0];
      console.log('Initial node:', initialNode);

      // Click to trigger lazy load
      const rootItem = tree.shadowRoot.querySelector('snice-tree-item') as any;
      const expander = rootItem.shadowRoot.querySelector('.tree-item__expander');
      expander.click();

      // Wait for lazy load
      await new Promise(r => setTimeout(r, 2000));

      // Check node was updated
      const updatedNode = tree.nodes[0];
      console.log('Updated node:', updatedNode);

      if (!updatedNode.children || updatedNode.children.length !== 3) {
        throw new Error(`Expected 3 children, got ${updatedNode.children?.length}`);
      }
      if (updatedNode.lazy !== false) {
        throw new Error(`Expected lazy to be false, got ${updatedNode.lazy}`);
      }
    });
  });
});
