import { test, expect } from '@playwright/test';

test('debug code block structure', async ({ page }) => {
  await page.goto('http://localhost:5566/components/code-block/demo.html');
  await page.waitForTimeout(2000);

  const result = await page.locator('snice-code-block#js-code').first().evaluate((el: any) => {
    const info: any = {};

    info.tagName = el.tagName;
    info.hasShadowRoot = !!el.shadowRoot;
    info.code = el.code || 'NO CODE PROPERTY';
    info.codeLength = el.code ? el.code.length : 0;

    if (el.shadowRoot) {
      info.shadowRootHTML = el.shadowRoot.innerHTML.substring(0, 500);

      // Try different selectors
      info.hasCodeBlock = !!el.shadowRoot.querySelector('.code-block');
      info.hasCodeBlockContent = !!el.shadowRoot.querySelector('.code-block__content');
      info.hasCodeBlockPre = !!el.shadowRoot.querySelector('.code-block__pre');
      info.hasCodeBlockCode = !!el.shadowRoot.querySelector('.code-block__code');

      const codeEl = el.shadowRoot.querySelector('.code-block__code');
      if (codeEl) {
        info.codeInnerHTML = codeEl.innerHTML.substring(0, 200);
      } else {
        info.codeInnerHTML = 'ELEMENT NOT FOUND';
      }
    }

    return info;
  });

  console.log(JSON.stringify(result, null, 2));
});
