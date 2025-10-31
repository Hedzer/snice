import { test, expect } from '@playwright/test';

test.describe('Tree Single Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5566/components/tree/demo.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should only allow one item selected at a time', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const tree = document.querySelector('#tree1') as any;
      if (!tree || !tree.shadowRoot) return { error: 'Tree not found' };

      // Get the first root item
      const rootItem = tree.shadowRoot.querySelector('snice-tree-item') as any;
      if (!rootItem || !rootItem.shadowRoot) return { error: 'Root item not found' };

      // Expand the first item to access its children
      const expander = rootItem.shadowRoot.querySelector('.tree-item__expander');
      if (expander) expander.click();
      await new Promise(r => setTimeout(r, 300));

      // Get first child item
      const childItems = rootItem.shadowRoot.querySelectorAll('.tree-item__children > snice-tree-item');
      if (childItems.length < 1) return { error: 'Not enough items' };

      const item1 = rootItem;
      const item2 = childItems[0] as any;

      if (!item2.shadowRoot) return { error: 'Item 2 not ready' };

      const content1 = item1.shadowRoot.querySelector('.tree-item__content');
      const content2 = item2.shadowRoot.querySelector('.tree-item__content');

      if (!content1 || !content2) return { error: 'Contents not found' };

      const results = [];

      // Click first item
      content1.click();
      await new Promise(r => setTimeout(r, 200));
      results.push({
        step: 'After selecting item 1',
        item1Selected: content1.classList.contains('tree-item__content--selected'),
        item2Selected: content2.classList.contains('tree-item__content--selected')
      });

      // Click second item
      content2.click();
      await new Promise(r => setTimeout(r, 200));
      results.push({
        step: 'After selecting item 2',
        item1Selected: content1.classList.contains('tree-item__content--selected'),
        item2Selected: content2.classList.contains('tree-item__content--selected')
      });

      return { results, success: true };
    });

    console.log(JSON.stringify(result, null, 2));

    expect(result.error).toBeUndefined();
    expect(result.results).toBeDefined();

    // After selecting item 1, only item 1 should be selected
    expect(result.results![0].item1Selected).toBe(true);
    expect(result.results![0].item2Selected).toBe(false);

    // After selecting item 2, only item 2 should be selected (item 1 deselected)
    expect(result.results![1].item1Selected).toBe(false);
    expect(result.results![1].item2Selected).toBe(true);
  });
});
