import { test, expect } from '@playwright/test';

test('controller works with correct import order (controller first)', async ({ page }) => {
  // demo.html imports controller before component - this works
  await page.goto('http://localhost:5566/components/terminal/demo.html');
  await page.waitForTimeout(1000);

  // Try executing a command to verify controller is attached and functional
  const commandWorks = await page.evaluate(() => {
    const term = document.getElementById('terminal-1') as any;
    const input = term?.shadowRoot?.querySelector('.terminal-input');
    if (!input) return false;

    input.value = 'help';
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    input.dispatchEvent(event);

    return true;
  });

  await page.waitForTimeout(500);

  const hasHelpOutput = await page.evaluate(() => {
    const term = document.getElementById('terminal-1') as any;
    const output = term?.shadowRoot?.querySelector('.terminal-output')?.textContent || '';
    return output.includes('Available commands');
  });

  expect(commandWorks).toBe(true);
  expect(hasHelpOutput).toBe(true);
});

test('controller works when the component imports before the controller', async ({ page }) => {
  // Capture all console output
  const logs: string[] = [];
  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
  });

  // Navigate to test page with component imported before controller
  await page.goto('http://localhost:5566/tests/live/components/terminal/wrong-import-order.html');
  await page.waitForTimeout(1000);

  console.log('Browser console logs:', logs);

  // Try executing a command
  const commandExecuted = await page.evaluate(() => {
    const term = document.getElementById('test-term') as any;
    const input = term?.shadowRoot?.querySelector('.terminal-input');
    if (!input) return false;

    input.value = 'help';
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    input.dispatchEvent(event);

    return true;
  });

  await page.waitForTimeout(500);

  const hasHelpOutput = await page.evaluate(() => {
    const term = document.getElementById('test-term') as any;
    const output = term?.shadowRoot?.querySelector('.terminal-output')?.textContent || '';
    return output.includes('Available commands');
  });

  expect(commandExecuted).toBe(true);
  expect(hasHelpOutput).toBe(true);
});
