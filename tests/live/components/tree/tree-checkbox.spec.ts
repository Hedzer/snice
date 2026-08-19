import { test, expect } from '@playwright/test';

test.describe('Tree Component Checkbox', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5566/tests/live/fixtures/tree/visual.html');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => {
      const tree = document.querySelector('#tree-check');
      return tree?.shadowRoot?.querySelectorAll('.tree__content > snice-tree-item').length === 4;
    });
  });

  test('should check and uncheck checkboxes', async ({ page }) => {
    // Get the checkbox tree
    const tree = page.locator('#tree-check');
    await expect(tree).toBeVisible();

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

    // Set up event listener to track if handler is called
    await page.evaluate(() => {
      (window as any).treeCheckEventFired = false;
      document.getElementById('tree-check')?.addEventListener('tree-node-check', () => {
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

    await expect.poll(() => tree.evaluate((el: any) => el.checkedNodes.includes('src'))).toBe(true);
    await expect.poll(() => tree.evaluate((el: any) => [...el.selectedNodes])).toEqual([]);

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
    expect(handlerCalled).toBe(true);
    expect(afterClick?.checkboxChecked).toBe(true);
    expect(afterClick?.itemChecked).toBe(true);

    // If there's a child, it should also be checked (cascade)
    if (afterClick?.childState) {
      expect(afterClick.childState.checkboxChecked).toBe(true);
    }
  });

  test('should reflect programmatic checkedNodes changes', async ({ page }) => {
    const tree = page.locator('#tree-check');
    await tree.evaluate((el: any) => {
      el.checkedNodes = ['src', 'index.ts'];
    });

    await expect.poll(() => tree.evaluate((el: any) => {
      const root = el.shadowRoot?.querySelector('.tree__content > snice-tree-item');
      const child = root?.shadowRoot?.querySelector('.tree-item__children > snice-tree-item');
      return {
        rootChecked: root?.checked,
        childChecked: child?.checked,
        checkedNodes: [...el.checkedNodes]
      };
    })).toEqual({
      rootChecked: true,
      childChecked: true,
      checkedNodes: ['src', 'index.ts']
    });

    await tree.evaluate((el: any) => {
      el.checkedNodes = [];
    });
    await expect.poll(() => tree.evaluate((el: any) => {
      const root = el.shadowRoot?.querySelector('.tree__content > snice-tree-item');
      return root?.checked;
    })).toBe(false);
  });
});
