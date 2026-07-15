import { test, expect } from '@playwright/test';

test.describe('Tree Lazy Loading', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5566/components/tree/demo.html');
    await page.waitForFunction(() => {
      const tree = document.querySelector('#tree-lazy') as any;
      return tree?.shadowRoot?.querySelectorAll('.tree__content > snice-tree-item').length === 2;
    });
  });

  test('should show expander for lazy nodes', async ({ page }) => {
    const tree = page.locator('#tree-lazy');
    const rootItem = tree.locator('.tree__content > snice-tree-item').nth(1);

    // Check that expander is visible for lazy node
    const expander = rootItem.locator('.tree-item__content > .tree-item__expander');
    await expect(expander).toBeVisible();
    await expect(expander).not.toHaveClass(/tree-item__expander--hidden/);
  });

  test('should show loading spinner when expanding lazy node', async ({ page }) => {
    const tree = page.locator('#tree-lazy');
    const rootItem = tree.locator('.tree__content > snice-tree-item').nth(1);

    // Click expander
    const expander = rootItem.locator('.tree-item__content > .tree-item__expander');
    await expander.click();

    // Loading spinner should appear
    const loadingSpinner = rootItem.locator('.tree-item__content > .tree-item__loading');
    await expect(loadingSpinner).toBeVisible();

    // Expander should be hidden
    await expect(expander).not.toBeVisible();
  });

  test('should update node data and expand after lazy load', async ({ page }) => {
    const initial = await page.evaluate(() => {
      const tree = document.querySelector('#tree-lazy') as any;
      const initialNode = tree.nodes[1];
      const rootItem = tree.shadowRoot.querySelectorAll('.tree__content > snice-tree-item')[1] as any;
      const expander = rootItem.shadowRoot.querySelector('.tree-item__expander');
      expander?.click();
      return {
        childCount: initialNode.children?.length ?? 0,
        lazy: initialNode.lazy,
        loading: rootItem.loading
      };
    });

    expect(initial).toEqual({ childCount: 0, lazy: true, loading: true });
    await expect.poll(() => page.evaluate(() => {
      const tree = document.querySelector('#tree-lazy') as any;
      const updatedNode = tree.nodes[1];
      // updateNode() replaces the rendered root items, so inspect the current
      // item rather than retaining the pre-update element reference.
      const updatedItem = tree.shadowRoot.querySelectorAll('.tree__content > snice-tree-item')[1] as any;
      return {
        childCount: updatedNode.children?.length ?? 0,
        lazy: updatedNode.lazy,
        expanded: updatedItem.expanded,
        loading: updatedItem.loading,
        renderedChildren: updatedItem.shadowRoot.querySelectorAll('.tree-item__children > snice-tree-item').length
      };
    }), { timeout: 5000 }).toEqual({
      childCount: 2,
      lazy: false,
      expanded: true,
      loading: false,
      renderedChildren: 2
    });
  });
});
