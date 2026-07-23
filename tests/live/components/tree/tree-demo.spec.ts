import { test, expect } from '@playwright/test';

test.describe('Tree Demo Page', () => {
  test('should render demo page correctly', async ({ page }) => {
    await page.goto('http://localhost:5566/components/tree/demo.html');
    await page.waitForFunction(() => {
      const tree = document.querySelector('#tree-single');
      const imageTree = document.querySelector('#tree-image-icons');
      const first = tree?.shadowRoot?.querySelector('snice-tree-item') as any;
      const image = imageTree?.shadowRoot?.querySelector('snice-tree-item') as any;
      return first?.shadowRoot?.querySelector('.tree-item__label')?.textContent === 'src'
        && image?.shadowRoot?.querySelector('.tree-item__icon-image')?.getAttribute('src') === '/images/snice-logo.png';
    });

    // Check representative text, image, and nested tree showcases exist.
    const tree1 = page.locator('#tree-single');
    const tree2 = page.locator('#tree-custom-icons');
    const imageTree = page.locator('#tree-image-icons');

    await expect(tree1).toBeVisible();
    await expect(tree2).toBeVisible();
    await expect(imageTree).toBeVisible();

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
    const imageInfo = await imageTree.evaluate((el) => {
      const item = el.shadowRoot?.querySelector('snice-tree-item');
      const label = item?.shadowRoot?.querySelector('.tree-item__label');
      const image = item?.shadowRoot?.querySelector('.tree-item__icon-image') as HTMLImageElement | null;
      return { label: label?.textContent || '', src: image?.getAttribute('src') || '' };
    });

    expect(tree1Label).toBe('src');
    expect(tree1Children).toContain('index.ts');
    expect(tree2Label).toBe('Documents');
    expect(imageInfo).toEqual({ label: 'Snice', src: '/images/snice-logo.png' });
  });
});
