import { test, expect } from '@playwright/test';

test('check if controller attaches', async ({ page }) => {
  await page.goto('http://localhost:5566/tests/live/fixtures/terminal/visual.html');
  await page.waitForTimeout(1000);

  // Check if terminal has controller attribute
  const hasController = await page.evaluate(() => {
    const term = document.getElementById('terminal-1');
    return term?.hasAttribute('controller');
  });

  expect(hasController).toBe(true);
});
