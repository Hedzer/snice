import { test } from '@playwright/test';

test('inspect terminal spacing', async ({ page }) => {
  await page.goto('http://localhost:5566/components/terminal/demo.html');
  await page.waitForTimeout(1000);

  const term = page.locator('snice-terminal#terminal-3').first();

  const styles = await term.evaluate((el: any) => {
    const container = el.shadowRoot.querySelector('.terminal-container');
    const output = el.shadowRoot.querySelector('.terminal-output');
    const lines = el.shadowRoot.querySelectorAll('.terminal-line');

    const computedHost = getComputedStyle(el);
    const computedContainer = getComputedStyle(container);
    const computedOutput = getComputedStyle(output);
    const computedLine = lines[0] ? getComputedStyle(lines[0]) : null;
    const computedLineContent = lines[0]?.querySelector('.line-content')
      ? getComputedStyle(lines[0].querySelector('.line-content'))
      : null;

    return {
      host: {
        lineHeight: computedHost.lineHeight,
        fontSize: computedHost.fontSize,
      },
      container: {
        padding: computedContainer.padding,
      },
      output: {
        marginBottom: computedOutput.marginBottom,
      },
      line: computedLine ? {
        margin: computedLine.margin,
        padding: computedLine.padding,
        display: computedLine.display,
        gap: computedLine.gap,
        height: computedLine.height,
      } : null,
      lineContent: computedLineContent ? {
        lineHeight: computedLineContent.lineHeight,
        display: computedLineContent.display,
      } : null,
      lineCount: lines.length
    };
  });

});
