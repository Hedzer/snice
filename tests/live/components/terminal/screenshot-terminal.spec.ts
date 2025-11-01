import { test } from '@playwright/test';

test('screenshot terminal', async ({ page }) => {
  await page.goto('http://localhost:5566/components/terminal/demo.html');
  await page.waitForTimeout(2000);

  await page.screenshot({ path: '/tmp/terminal-demo.png', fullPage: true });
  console.log('Screenshot saved to /tmp/terminal-demo.png');
});
