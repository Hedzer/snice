import { test, expect } from '@playwright/test';

test.describe('Terminal with @request/@respond', () => {
  test('should execute commands using @request/@respond pattern', async ({ page }) => {
    await page.goto('http://localhost:5566/components/terminal/demo.html');
    await page.waitForTimeout(1000);

    const term = page.locator('snice-terminal#terminal-1').first();

    // Test help command
    await term.evaluate((el: any) => {
      const input = el.shadowRoot.querySelector('.terminal-input');
      if (input) {
        input.value = 'help';
        const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
        input.dispatchEvent(event);
      }
    });

    await page.waitForTimeout(200);

    // Check that help output appears
    const helpOutput = await term.evaluate((el: any) => {
      const lines = el.shadowRoot.querySelectorAll('.terminal-line');
      return Array.from(lines).map((line: any) => line.textContent).join('\n');
    });

    expect(helpOutput).toContain('Available commands');
    expect(helpOutput).toContain('help');
    expect(helpOutput).toContain('echo');
    expect(helpOutput).toContain('ls');

    console.log('✓ Help command works');

    // Test echo command
    await term.evaluate((el: any) => {
      const input = el.shadowRoot.querySelector('.terminal-input');
      if (input) {
        input.value = 'echo hello world';
        const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
        input.dispatchEvent(event);
      }
    });

    await page.waitForTimeout(200);

    const echoOutput = await term.evaluate((el: any) => {
      const lines = el.shadowRoot.querySelectorAll('.terminal-line');
      return Array.from(lines).map((line: any) => line.textContent).join('\n');
    });

    expect(echoOutput).toContain('hello world');
    console.log('✓ Echo command works');

    // Test ls command
    await term.evaluate((el: any) => {
      const input = el.shadowRoot.querySelector('.terminal-input');
      if (input) {
        input.value = 'ls -l';
        const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
        input.dispatchEvent(event);
      }
    });

    await page.waitForTimeout(200);

    const lsOutput = await term.evaluate((el: any) => {
      const lines = el.shadowRoot.querySelectorAll('.terminal-line');
      return Array.from(lines).map((line: any) => line.textContent).join('\n');
    });

    expect(lsOutput).toContain('demo.txt');
    expect(lsOutput).toContain('projects');
    console.log('✓ ls command works');

    // Test invalid command
    await term.evaluate((el: any) => {
      const input = el.shadowRoot.querySelector('.terminal-input');
      if (input) {
        input.value = 'invalid-command';
        const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
        input.dispatchEvent(event);
      }
    });

    await page.waitForTimeout(200);

    const errorOutput = await term.evaluate((el: any) => {
      const lines = el.shadowRoot.querySelectorAll('.terminal-line.error');
      return Array.from(lines).map((line: any) => line.textContent).join('\n');
    });

    expect(errorOutput).toContain('Command not found');
    console.log('✓ Error handling works');
  });

  test('should support writeLines for streaming', async ({ page }) => {
    await page.goto('http://localhost:5566/components/terminal/demo.html');
    await page.waitForTimeout(1000);

    const term = page.locator('snice-terminal#terminal-4').first();

    // Test writeLines API
    await term.evaluate((el: any) => {
      el.writeLines([
        { content: 'Line 1', type: 'output' },
        { content: 'Line 2', type: 'info' },
        { content: 'Line 3', type: 'success' },
        { content: 'Error line', type: 'error' }
      ]);
    });

    await page.waitForTimeout(200);

    const output = await term.evaluate((el: any) => {
      const lines = el.shadowRoot.querySelectorAll('.terminal-line');
      return {
        count: lines.length,
        hasLine1: Array.from(lines).some((l: any) => l.textContent.includes('Line 1')),
        hasLine2: Array.from(lines).some((l: any) => l.textContent.includes('Line 2')),
        hasLine3: Array.from(lines).some((l: any) => l.textContent.includes('Line 3')),
        hasError: Array.from(lines).some((l: any) => l.textContent.includes('Error line')),
      };
    });

    expect(output.hasLine1).toBe(true);
    expect(output.hasLine2).toBe(true);
    expect(output.hasLine3).toBe(true);
    expect(output.hasError).toBe(true);
    console.log('✓ writeLines streaming API works');
  });

  test('should clear terminal', async ({ page }) => {
    await page.goto('http://localhost:5566/components/terminal/demo.html');
    await page.waitForTimeout(1000);

    const term = page.locator('snice-terminal#terminal-1').first();

    // Execute clear command
    await term.evaluate((el: any) => {
      const input = el.shadowRoot.querySelector('.terminal-input');
      if (input) {
        input.value = 'clear';
        const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
        input.dispatchEvent(event);
      }
    });

    await page.waitForTimeout(200);

    const lineCount = await term.evaluate((el: any) => {
      const lines = el.shadowRoot.querySelectorAll('.terminal-line');
      return lines.length;
    });

    // Should have very few lines after clear (just the clear command itself)
    expect(lineCount).toBeLessThan(3);
    console.log('✓ Clear command works');
  });
});
