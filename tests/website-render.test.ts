import { test, expect } from '@playwright/test';

test.describe('Website Component Rendering', () => {
  test('components render in browser', async ({ page }) => {
    await page.goto('http://localhost:52891/components.html');

    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => !!customElements.get('snice-input'));

    for (const tag of ['snice-button', 'snice-badge', 'snice-alert', 'snice-spinner', 'snice-input']) {
      const component = page.locator(tag).first();
      await expect(component).toBeAttached();
      const shadowContent = await component.evaluate((el) => el.shadowRoot?.innerHTML || '');
      expect(shadowContent, `${tag} should render its shadow tree`).not.toBe('');
    }

    const buttonShadow = await page.locator('snice-button').first()
      .evaluate((el) => el.shadowRoot?.innerHTML || '');
    expect(buttonShadow).toContain('button');
  });

  test('theme toggle works', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('snice-theme', 'light'));
    await page.goto('http://localhost:52891');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.click('.theme-btn');

    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('dark');

    await page.click('.theme-btn');
    const themeLight = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(themeLight).toBe('light');
  });

  test('modal opens', async ({ page }) => {
    await page.goto('http://localhost:52891/components.html');
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => !!customElements.get('snice-modal'));

    const openModalBtn = page.locator('snice-button', { hasText: 'Open Modal' }).first();
    await openModalBtn.click();

    const modal = page.locator('snice-modal#demo-modal');
    const isOpen = await modal.evaluate((el: any) => el.open);
    expect(isOpen).toBe(true);
  });

  test('generated rendering guide and reference contain every major feature', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.goto('http://localhost:52891/guide.html');
    await page.waitForLoadState('networkidle');
    for (const id of ['state', 'roots', 'bindings', 'conditionals', 'lists', 'async', 'ssr']) {
      await expect(page.locator(`#${id}`)).toBeVisible();
    }
    await expect(page.locator('a[href="docs.html#rendering"]')).toBeVisible();

    await page.goto('http://localhost:52891/docs.html#rendering');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#rendering')).toBeVisible();
    for (const id of [
      'rendering-bindings',
      'rendering-control-flow',
      'rendering-async-content',
      'rendering-reactive-authoring',
      'rendering-render-roots',
      'rendering-custom-directives',
      'rendering-server-rendering-and-hydration'
    ]) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }

    // Inline examples such as <component> must remain escaped prose/code, not
    // become accidental live DOM elements in the generated documentation.
    await expect(page.locator('#rendering component')).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  });
});
