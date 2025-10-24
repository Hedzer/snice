import { test, expect } from '@playwright/test';

test('pagination component visual test', async ({ page }) => {
  await page.goto('http://localhost:5566/components/pagination/demo.html');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('snice-pagination', { timeout: 10000 });

  const pagination = page.locator('snice-pagination').first();

  // Check shadow root exists
  const hasShadowRoot = await pagination.evaluate(el => !!el.shadowRoot);
  expect(hasShadowRoot).toBe(true);

  // Check initial state
  const initialPage = await pagination.evaluate(el => el.current);
  expect(initialPage).toBe(1);

  // Click next button
  await pagination.evaluate(el => {
    const nextBtn = el.shadowRoot.querySelector('.pagination-next');
    nextBtn?.click();
  });

  await page.waitForTimeout(100);
  const afterNext = await pagination.evaluate(el => el.current);
  expect(afterNext).toBe(2);

  // Click page 3
  await pagination.evaluate(el => {
    const pageButtons = el.shadowRoot.querySelectorAll('[data-page]');
    const page3 = Array.from(pageButtons).find(btn => btn.getAttribute('data-page') === '3');
    if (page3) page3.click();
  });

  await page.waitForTimeout(100);
  const afterPage3 = await pagination.evaluate(el => el.current);
  expect(afterPage3).toBe(3);
});
