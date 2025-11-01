import { test } from '@playwright/test';

test('screenshot code blocks', async ({ page }) => {
  await page.goto('http://localhost:5566/components/code-block/demo.html');
  await page.waitForTimeout(2000);

  await page.screenshot({ path: '/tmp/code-block-demo.png', fullPage: true });
  console.log('Screenshot saved to /tmp/code-block-demo.png');
});
