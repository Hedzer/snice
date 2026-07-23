import { test, expect } from '@playwright/test';

test('doc component renders and is interactive', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/components/doc/demo.html');
  const doc = page.locator('snice-doc').first();
  const editor = doc.locator('.doc-editor');
  await expect(doc).toBeVisible();
  await expect(editor).toHaveAttribute('contenteditable', 'true');
  await editor.click();
  await page.keyboard.type('Hello World');
  await expect.poll(() => doc.evaluate((element: any) => element.getText())).toContain('Hello World');
  await doc.evaluate((element: any) => element.clear());
  expect(await doc.evaluate((element: any) => element.getHTML())).toBe('<p><br></p>');
  expect(errors).toEqual([]);
});
