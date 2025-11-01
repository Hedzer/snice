import { test, expect } from '@playwright/test';

test('check code block rendering', async ({ page }) => {
  const logs: string[] = [];
  const errors: string[] = [];

  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', error => {
    errors.push(error.message);
  });

  await page.goto('http://localhost:5566/components/code-block/demo.html');
  await page.waitForTimeout(3000);

  // Check for errors first
  if (errors.length > 0) {
    console.log('\n=== Page Errors ===');
    errors.forEach(err => console.log(err));
  }

  if (logs.length > 0) {
    console.log('\n=== Console Logs ===');
    logs.forEach(log => console.log(log));
  }

  // Get first code block
  const codeBlock = page.locator('snice-code-block#js-code').first();
  const exists = await codeBlock.count();
  console.log(`\nCode block exists: ${exists > 0}`);

  if (exists > 0) {
    // Get shadow root content
    const innerHTML = await codeBlock.evaluate((el: any) => {
      const code = el.shadowRoot?.querySelector('.code-block__code');
      return code ? code.innerHTML : 'CODE ELEMENT NOT FOUND';
    });

    console.log('\n=== JS Code Block Content ===');
    console.log(innerHTML.substring(0, 500));
    console.log('\n=== End ===\n');
  }
});
