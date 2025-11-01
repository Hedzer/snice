import { test } from '@playwright/test';

test('check syntax highlighting', async ({ page }) => {
  await page.goto('http://localhost:5566/components/code-block/demo.html');
  await page.waitForTimeout(2000);

  // Get all code blocks
  const blocks = ['js-code', 'html-code', 'python-code', 'css-code'];

  for (const id of blocks) {
    const result = await page.locator(`snice-code-block#${id}`).evaluate((el: any) => {
      const code = el.shadowRoot?.querySelector('.code-block__code');
      return {
        id: el.id,
        language: el.language,
        hasHighlighting: code?.innerHTML.includes('<span class="token'),
        sample: code ? code.innerHTML.substring(0, 300) : 'NOT FOUND'
      };
    });

    console.log(`\n=== ${result.id} (${result.language}) ===`);
    console.log(`Has highlighting: ${result.hasHighlighting}`);
    console.log(`Sample:\n${result.sample}\n`);
  }
});
