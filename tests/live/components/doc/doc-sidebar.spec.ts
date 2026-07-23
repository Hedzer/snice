import { test, expect } from '@playwright/test';

test('doc insertion controls are visible and functional', async ({ page }) => {
  await page.goto('/components/doc/demo.html');
  const doc = page.locator('snice-doc').first();
  const toolbar = doc.locator('.toolbar');
  await expect(toolbar).toBeVisible();
  await expect(doc.locator('button[title="Insert Image"]')).toBeVisible();
  await expect(doc.locator('button[title="Insert Table"]')).toBeVisible();
  await expect(doc.locator('button[title="Insert Divider"]')).toBeVisible();
  await doc.locator('button[title="Insert Divider"]').click();
  await expect.poll(() => doc.evaluate((element: any) => element.getHTML())).toContain('<hr');
});
