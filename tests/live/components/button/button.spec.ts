import { test, expect } from '@playwright/test';

const demoPath = 'http://localhost:5566/components/button/demo.html';

test.describe('Snice Button', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => {
      const button = document.querySelector('snice-button');
      return Boolean(customElements.get('snice-button') && button?.shadowRoot?.querySelector('button'));
    });
  });

  test('should render button components', async ({ page }) => {
    const count = await page.locator('snice-button').count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have all variant types', async ({ page }) => {
    expect(await page.locator('snice-button[variant="default"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-button[variant="primary"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-button[variant="success"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-button[variant="warning"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-button[variant="danger"]').count()).toBeGreaterThan(0);
    expect(await page.locator('snice-button[variant="text"]').count()).toBeGreaterThan(0);
  });

  test('should display text content', async ({ page }) => {
    const button = page.locator('snice-button').first();
    const text = await button.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('should render every showcase example as a working internal button', async ({ page }) => {
    const result = await page.locator('snice-button').evaluateAll(buttons => ({
      total: buttons.length,
      rendered: buttons.filter(button => button.shadowRoot?.querySelector('button')).length
    }));

    expect(result.total).toBeGreaterThan(40);
    expect(result.rendered).toBe(result.total);
  });

  test('should demonstrate allowed and blocked href behavior', async ({ page }) => {
    const section = page.locator('#button-safe-destination');
    await expect(section).toContainText('Malformed URLs and unsafe schemes are blocked');

    const blocked = section.locator('snice-button[href^="javascript:"]');
    const before = page.url();
    await page.evaluate(() => {
      (globalThis as any).__sniceUnsafeShowcase = 0;
      (globalThis as any).__sniceUnsafeShowcaseEvent = 0;
      const button = document.querySelector('#button-safe-destination snice-button[href^="javascript:"]');
      button?.addEventListener('button-click', () => {
        (globalThis as any).__sniceUnsafeShowcaseEvent++;
      });
    });
    await blocked.click();

    expect(await page.evaluate(() => ({
      executed: (globalThis as any).__sniceUnsafeShowcase,
      events: (globalThis as any).__sniceUnsafeShowcaseEvent
    }))).toEqual({ executed: 0, events: 0 });
    expect(page.url()).toBe(before);

    await section.getByText('Relative / hash', { exact: true }).click();
    expect(new URL(page.url()).hash).toBe('#button-safe-destination');
  });
});
