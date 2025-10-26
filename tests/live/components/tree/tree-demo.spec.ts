import { test, expect } from '@playwright/test';

test.describe('Tree Demo Page', () => {
  test('should render demo page correctly', async ({ page }) => {
    await page.goto('http://localhost:5566/components/tree/demo.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: '/tmp/tree-demo-full.png', fullPage: true });

    // Check both trees exist
    const tree1 = page.locator('#tree1');
    const tree2 = page.locator('#tree2');

    await expect(tree1).toBeVisible();
    await expect(tree2).toBeVisible();

    // Check tree1 content
    const tree1Label = await tree1.evaluate((el) => {
      const item = el.shadowRoot?.querySelector('snice-tree-item');
      const label = item?.shadowRoot?.querySelector('.tree-item__label');
      return label?.textContent || '';
    });
    console.log('Tree1 label:', tree1Label);

    // Check tree1 has children
    const tree1ChildInfo = await tree1.evaluate((el) => {
      const item = el.shadowRoot?.querySelector('snice-tree-item');
      const children = item?.shadowRoot?.querySelectorAll('.tree-item__children > snice-tree-item');
      return Array.from(children || []).map((child: any) => {
        const label = child.shadowRoot?.querySelector('.tree-item__label');
        return {
          label: label?.textContent || '',
          node: child.node,
          hasSetNode: typeof child.setNode === 'function'
        };
      });
    });
    console.log('Tree1 children:', JSON.stringify(tree1ChildInfo, null, 2));

    const tree1Children = tree1ChildInfo.map(c => c.label);

    // Check tree2 content
    const tree2Label = await tree2.evaluate((el) => {
      const item = el.shadowRoot?.querySelector('snice-tree-item');
      const label = item?.shadowRoot?.querySelector('.tree-item__label');
      return label?.textContent || '';
    });
    console.log('Tree2 label:', tree2Label);

    // Verify content
    expect(tree1Label).toBe('project');
    expect(tree1Children).toContain('src');
    expect(tree2Label).toBe('Fruits');
  });
});
