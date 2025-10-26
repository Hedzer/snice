import { test, expect } from '@playwright/test';

test.describe('Tree Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5566/components/tree/demo.html');
    await page.waitForLoadState('networkidle');
  });

  test('should render tree structure', async ({ page }) => {
    // Check if tree element exists in DOM
    const tree = page.locator('#tree1');
    await expect(tree).toBeVisible();

    // Wait a bit for components to register and DOMContentLoaded
    await page.waitForTimeout(2000);

    // Check the tree has nodes set
    const nodesFromPage = await tree.evaluate((el: any) => el.nodes);
    console.log('Nodes from page:', JSON.stringify(nodesFromPage, null, 2));

    // Check the HTML of the tree-item element
    const itemHTML = await tree.evaluate((el: any) => {
      const item = el.shadowRoot?.querySelector('snice-tree-item');
      return item?.outerHTML;
    });
    console.log('Tree item HTML:', itemHTML);

    // Try calling setNode manually
    await tree.evaluate((el: any) => {
      const item = el.shadowRoot?.querySelector('snice-tree-item');
      if (item && el.nodes && el.nodes[0] && item.setNode) {
        console.log('Calling setNode with:', el.nodes[0].label);
        item.setNode(el.nodes[0], 0);
      } else {
        console.log('setNode not available or no data');
      }
    });

    await page.waitForTimeout(1000);

    const nodeAfterSet = await tree.evaluate((el: any) => {
      const item = el.shadowRoot?.querySelector('snice-tree-item');
      return {
        node: item?.node,
        hasSetNode: typeof item?.setNode === 'function'
      };
    });
    console.log('Node after setNode:', JSON.stringify(nodeAfterSet, null, 2).substring(0, 300));

    // Check if custom element is defined
    const isDefined = await page.evaluate(() => {
      return customElements.get('snice-tree') !== undefined;
    });
    console.log('Is snice-tree defined:', isDefined);

    // Check shadow DOM content
    const shadowContent = await tree.evaluate((el) => {
      return el.shadowRoot?.innerHTML || 'NO SHADOW ROOT';
    });
    console.log('Tree shadow content:', shadowContent.substring(0, 500));

    // Check if tree has nodes property
    const nodesLength = await tree.evaluate((el: any) => {
      console.log('Tree element:', el.tagName);
      console.log('Nodes:', el.nodes);
      return el.nodes?.length || 0;
    });
    console.log('Nodes length:', nodesLength);

    // Check if tree items are rendered
    const treeItemsCount = await tree.evaluate((el) => {
      const items = el.shadowRoot?.querySelectorAll('snice-tree-item');
      return items?.length || 0;
    });
    console.log('Tree items count:', treeItemsCount);

    // Check tree item shadow DOM
    const treeItemInfo = await tree.evaluate((el) => {
      const firstItem = el.shadowRoot?.querySelector('snice-tree-item') as any;
      if (!firstItem) return { found: false };
      return {
        found: true,
        node: firstItem.node,
        hasChildren: firstItem.hasChildren,
        shadowHTML: firstItem.shadowRoot?.innerHTML.substring(0, 800) || 'NO SHADOW ROOT'
      };
    });
    console.log('Tree item info:', JSON.stringify(treeItemInfo, null, 2));

    // Take final screenshot
    await page.screenshot({ path: '/tmp/tree-final.png', fullPage: true });

    // Check if label is visible in the tree item
    const labelInfo = await tree.evaluate((el) => {
      const item = el.shadowRoot?.querySelector('snice-tree-item');
      if (!item || !item.shadowRoot) return { found: false };
      const label = item.shadowRoot.querySelector('.tree-item__label');
      return {
        found: !!label,
        textContent: label?.textContent || '',
        innerHTML: label?.innerHTML || '',
        fullShadow: item.shadowRoot.innerHTML
      };
    });
    console.log('Label info:', JSON.stringify(labelInfo, null, 2).substring(0, 1000));

    expect(treeItemsCount).toBeGreaterThan(0);
    expect(labelInfo.textContent).toContain('Root');
  });
});
