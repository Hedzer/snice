import { test, expect } from '@playwright/test';

test.describe('Tree Selection Background', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5566/components/tree/demo.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should change background color on selection toggle', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const tree = document.querySelector('#tree1') as any;
      if (!tree || !tree.shadowRoot) return { error: 'Tree not found' };

      const item = tree.shadowRoot.querySelector('snice-tree-item') as any;
      if (!item || !item.shadowRoot) return { error: 'Tree item not found' };

      const content = item.shadowRoot.querySelector('.tree-item__content') as HTMLElement;
      if (!content) return { error: 'Content not found' };

      const results = [];

      // Get initial background
      const initialBg = window.getComputedStyle(content).backgroundColor;
      results.push({ state: 'initial', bg: initialBg, hasClass: content.classList.contains('tree-item__content--selected') });

      // First click - should select and change background
      content.click();
      await new Promise(r => setTimeout(r, 200));
      const selectedBg = window.getComputedStyle(content).backgroundColor;
      results.push({ state: 'selected', bg: selectedBg, hasClass: content.classList.contains('tree-item__content--selected') });

      // Second click - should deselect and background should revert
      content.click();
      await new Promise(r => setTimeout(r, 200));
      const deselectedBg = window.getComputedStyle(content).backgroundColor;
      results.push({ state: 'deselected', bg: deselectedBg, hasClass: content.classList.contains('tree-item__content--selected') });

      return { results, success: true };
    });

    console.log(JSON.stringify(result, null, 2));

    expect(result.error).toBeUndefined();
    expect(result.results).toBeDefined();

    // Check that backgrounds are different
    const initialBg = result.results![0].bg;
    const selectedBg = result.results![1].bg;
    const deselectedBg = result.results![2].bg;

    console.log(`Initial: ${initialBg}, Selected: ${selectedBg}, Deselected: ${deselectedBg}`);

    // Selected should have different background than initial
    expect(selectedBg).not.toBe(initialBg);

    // Deselected should match initial
    expect(deselectedBg).toBe(initialBg);
  });
});
