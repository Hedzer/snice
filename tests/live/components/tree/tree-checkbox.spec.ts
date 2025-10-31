import { test, expect } from '@playwright/test';

test.describe('Tree Component Checkbox', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5566/components/tree/demo.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for components to initialize
  });

  test('should check and uncheck checkboxes', async ({ page }) => {
    // Get the checkbox tree
    const tree = page.locator('#tree-checkbox');
    await expect(tree).toBeVisible();

    // Wait for tree items to render
    await page.waitForTimeout(1000);

    // Expand the first tree item so children are visible
    const expandResult = await tree.evaluate((el: any) => {
      const treeItem = el.shadowRoot?.querySelector('snice-tree-item');
      if (!treeItem) return { expanded: false, hasChildren: false, childrenInDOM: 0 };

      const hasChildren = treeItem.hasChildren;

      if (treeItem.expand) {
        treeItem.expand();
      }

      // Wait a tick for expansion
      return new Promise(resolve => {
        setTimeout(() => {
          const childrenContainer = treeItem.shadowRoot?.querySelector('.tree-item__children');
          const childItems = treeItem.shadowRoot?.querySelectorAll('.tree-item__children > snice-tree-item');
          resolve({
            expanded: treeItem.expanded,
            hasChildren,
            childrenInDOM: childItems?.length || 0,
            containerVisible: childrenContainer?.classList.contains('tree-item__children--expanded')
          });
        }, 100);
      });
    });

    await page.waitForTimeout(500);

    // Set up event listener to track if handler is called
    await page.evaluate(() => {
      (window as any).treeCheckEventFired = false;
      document.getElementById('tree-checkbox')?.addEventListener('tree-item-check', () => {
        (window as any).treeCheckEventFired = true;
      });
    });

    // Click the first tree item's checkbox
    const clicked = await tree.evaluate((el: any) => {
      const treeItem = el.shadowRoot?.querySelector('snice-tree-item');
      if (!treeItem || !treeItem.shadowRoot) return false;

      const checkbox = treeItem.shadowRoot.querySelector('snice-checkbox');
      if (!checkbox) return false;

      checkbox.click();
      return true;
    });

    await page.waitForTimeout(1000);

    // Check if handleItemCheck was called
    const handlerCalled = await tree.evaluate((el: any) => {
      return (window as any).treeCheckEventFired || false;
    });

    // Verify checkbox is checked
    const afterClick = await tree.evaluate((el: any) => {
      const treeItem = el.shadowRoot?.querySelector('snice-tree-item');
      if (!treeItem || !treeItem.shadowRoot) return null;

      const checkbox = treeItem.shadowRoot.querySelector('snice-checkbox');
      if (!checkbox) return null;

      // Get tree element to check node states
      const tree = el;
      const firstNode = tree.nodes?.[0];
      const firstChildNode = firstNode?.children?.[0];

      // Also get first child element to verify cascade
      const firstChild = treeItem.shadowRoot.querySelector('.tree-item__children > snice-tree-item');
      let childState = null;
      if (firstChild && firstChild.shadowRoot) {
        const childCheckbox = firstChild.shadowRoot.querySelector('snice-checkbox');
        childState = {
          itemChecked: firstChild.checked,
          checkboxChecked: childCheckbox?.checked || false,
          nodeChecked: firstChildNode?.checked
        };
      }

      return {
        checkboxChecked: checkbox.checked,
        itemChecked: treeItem.checked,
        nodeChecked: firstNode?.checked,
        childState
      };
    });

    // Also check node data
    const nodeData = await tree.evaluate((el: any) => {
      const firstNode = el.nodes?.[0];
      return {
        nodeId: firstNode?.id,
        nodeChecked: firstNode?.checked,
        hasChildren: !!firstNode?.children,
        childCount: firstNode?.children?.length,
        firstChildChecked: firstNode?.children?.[0]?.checked
      };
    });

    expect(clicked).toBe(true);
    expect(afterClick?.checkboxChecked).toBe(true);
    expect(afterClick?.itemChecked).toBe(true);

    // If there's a child, it should also be checked (cascade)
    if (afterClick?.childState) {
      expect(afterClick.childState.checkboxChecked).toBe(true);
    }
  });

  test('should show checked status from tree', async ({ page }) => {
    const statusText = await page.locator('#checkbox-status').textContent();

    // Click "Check All" button
    await page.click('button:has-text("Check All")');
    await page.waitForTimeout(1000);

    const afterCheckAll = await page.locator('#checkbox-status').textContent();

    await page.screenshot({ path: '/tmp/tree-checkbox-all-checked.png' });

    expect(afterCheckAll).toContain('Checked');
  });
});
