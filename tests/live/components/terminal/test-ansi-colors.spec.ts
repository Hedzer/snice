import { test, expect } from '@playwright/test';

test('ANSI color parsing', async ({ page }) => {
  await page.goto('http://localhost:5566/components/terminal/demo.html');
  await page.waitForTimeout(1000);

  // Click the ANSI colors button
  await page.click('#ansi-colors');
  await page.waitForTimeout(500);

  // Check that colored spans were rendered
  const hasColoredSpans = await page.evaluate(() => {
    const term = document.getElementById('terminal-4') as any;
    const output = term.shadowRoot.querySelector('.terminal-output');
    const spans = output?.querySelectorAll('span[style*="color"]');
    return spans && spans.length > 0;
  });

  expect(hasColoredSpans).toBe(true);

  // Verify specific colors were applied
  const redTextExists = await page.evaluate(() => {
    const term = document.getElementById('terminal-4') as any;
    const output = term.shadowRoot.querySelector('.terminal-output');
    const redSpans = Array.from(output?.querySelectorAll('span[style*="color"]') || [])
      .filter((span: any) => span.style.color.includes('255, 85, 85') || span.textContent.includes('Red'));
    return redSpans.length > 0;
  });

  expect(redTextExists).toBe(true);
});
