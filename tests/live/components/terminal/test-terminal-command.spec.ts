import { test, expect } from '@playwright/test';

test('terminal command execution', async ({ page }) => {
  await page.goto('http://localhost:5566/components/terminal/demo.html');
  await page.waitForTimeout(1000);

  // Get terminal element
  const terminal = page.locator('#terminal-4');

  // Try executing a command
  const output = await page.evaluate(() => {
    const term = document.getElementById('terminal-4') as any;
    // Simulate typing 'help' command
    const input = term.shadowRoot.querySelector('.terminal-input') as HTMLInputElement;
    input.value = 'help';

    // Trigger enter key
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    input.dispatchEvent(event);

    // Wait a bit and return the terminal content
    return new Promise(resolve => {
      setTimeout(() => {
        const outputDiv = term.shadowRoot.querySelector('.terminal-output');
        resolve(outputDiv?.textContent || '');
      }, 500);
    });
  });

  expect(output).toContain('Available commands');
});
