import { test, expect } from '@playwright/test';

test.describe('Tree Selection Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5566/components/tree/demo.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should toggle selection on click', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const tree = document.querySelector('#tree1') as any;
      if (!tree || !tree.shadowRoot) return { error: 'Tree not found' };

      const item = tree.shadowRoot.querySelector('snice-tree-item') as any;
      if (!item || !item.shadowRoot) return { error: 'Tree item not found' };

      const content = item.shadowRoot.querySelector('.tree-item__content');
      if (!content) return { error: 'Content not found' };

      const results = [];

      // Test 1: First click should select
      content.click();
      await new Promise(r => setTimeout(r, 100));
      const selected1 = content.classList.contains('tree-item__content--selected');
      results.push({ test: 'First click selects', pass: selected1, selected: selected1 });

      // Test 2: Second click should deselect
      content.click();
      await new Promise(r => setTimeout(r, 100));
      const selected2 = content.classList.contains('tree-item__content--selected');
      results.push({ test: 'Second click deselects', pass: !selected2, selected: selected2 });

      // Test 3: Select again to verify it can be re-selected
      content.click();
      await new Promise(r => setTimeout(r, 100));
      const selected3 = content.classList.contains('tree-item__content--selected');
      results.push({ test: 'Third click re-selects', pass: selected3, selected: selected3 });

      return { results, success: true };
    });

    console.log(JSON.stringify(result, null, 2));

    expect(result.error).toBeUndefined();
    expect(result.results).toBeDefined();
    expect(result.results![0].pass).toBe(true); // First click selects
    expect(result.results![1].pass).toBe(true); // Second click deselects
    expect(result.results![2].pass).toBe(true); // Third click re-selects
  });
});
