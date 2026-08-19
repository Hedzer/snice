import { test, expect, type Page } from '@playwright/test';

const visibleTooltip = (page: Page, content: string) =>
  page.locator('.snice-tooltip.snice-tooltip--visible').filter({ hasText: content });

test.describe('Tooltip Demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/live/fixtures/tooltip/visual.html');
  });

  for (const [label, content] of [
    ['Top', 'This tooltip appears on top'],
    ['Bottom', 'This tooltip appears on bottom'],
    ['Left', 'This tooltip appears on left'],
    ['Right', 'This tooltip appears on right'],
    ['Top Start', 'Top start aligned'],
    ['Top End', 'Top end aligned'],
  ] as const) {
    test(`position: ${label}`, async ({ page }) => {
      await page.getByRole('button', { name: label, exact: true }).hover();
      await expect(visibleTooltip(page, content)).toBeVisible();
    });
  }

  test('hover trigger shows and hides', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Hover Trigger' });
    await button.hover();
    await expect(visibleTooltip(page, 'Hover to see this tooltip')).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(visibleTooltip(page, 'Hover to see this tooltip')).not.toBeVisible();
  });

  test('click trigger toggles', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Click Trigger' });
    await button.click();
    await expect(visibleTooltip(page, 'Click to toggle this tooltip')).toBeVisible();
    await button.click();
    await expect(visibleTooltip(page, 'Click to toggle this tooltip')).not.toBeVisible();
  });

  test('focus trigger shows and hides', async ({ page }) => {
    const input = page.locator('input[placeholder="Focus me"]');
    await input.focus();
    await expect(visibleTooltip(page, 'Focus to see this tooltip')).toBeVisible();
    await input.blur();
    await expect(visibleTooltip(page, 'Focus to see this tooltip')).not.toBeVisible();
  });

  test('manual trigger toggles', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Manual Control' });
    await button.click();
    await expect(visibleTooltip(page, 'Manually controlled tooltip')).toBeVisible();
    await button.click();
    await expect(visibleTooltip(page, 'Manually controlled tooltip')).not.toBeVisible();
  });

  test('show delay is honored', async ({ page }) => {
    await page.getByRole('button', { name: 'Show Delay (500ms)' }).hover();
    await expect(visibleTooltip(page, 'Shows after 500ms delay')).not.toBeVisible();
    await expect(visibleTooltip(page, 'Shows after 500ms delay')).toBeVisible({ timeout: 1_000 });
  });

  test('hide delay is honored', async ({ page }) => {
    await page.getByRole('button', { name: 'Hide Delay (500ms)' }).hover();
    const tooltip = visibleTooltip(page, 'Hides after 500ms delay');
    await expect(tooltip).toBeVisible();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(200);
    await expect(tooltip).toBeVisible();
    await expect(tooltip).not.toBeVisible({ timeout: 1_000 });
  });

  test('no-arrow customization omits the arrow', async ({ page }) => {
    await page.getByRole('button', { name: 'No Arrow' }).hover();
    const tooltip = visibleTooltip(page, 'Tooltip without arrow');
    await expect(tooltip).toBeVisible();
    await expect(tooltip.locator('.snice-tooltip__arrow')).toHaveCount(0);
  });

  for (const [trigger, content] of [
    ['Wide Tooltip', 'This tooltip has a much wider maximum width'],
    ['Custom Style', 'Custom styled tooltip'],
    ['Large Offset', 'Large offset from trigger'],
  ] as const) {
    test(`customization: ${trigger}`, async ({ page }) => {
      await page.getByRole('button', { name: trigger }).hover();
      await expect(visibleTooltip(page, content)).toBeVisible();
    });
  }

  for (const [selector, content] of [
    ['.link:has-text("Text Content")', 'Simple text tooltip'],
    ['.link:has-text("Long Content")', 'This is a very long tooltip content'],
    ['.icon[aria-label="Info"]', 'Tooltip on an icon'],
    ['code:has-text("npm install")', 'Press Ctrl+C to copy'],
  ] as const) {
    test(`content: ${content}`, async ({ page }) => {
      await page.locator(selector).hover();
      await expect(visibleTooltip(page, content)).toBeVisible();
    });
  }

  test('programmatic show and hide', async ({ page }) => {
    const show = page.getByRole('button', { name: 'Show', exact: true });
    const hide = page.getByRole('button', { name: 'Hide', exact: true });
    await show.click();
    await expect(visibleTooltip(page, 'Programmatically shown')).toBeVisible();
    await hide.click();
    await expect(visibleTooltip(page, 'Programmatically shown')).not.toBeVisible();
  });

  test('dynamic content updates on every hover', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Dynamic Content' });
    await button.hover();
    const initialTooltip = visibleTooltip(page, 'Dynamic content');
    await expect(initialTooltip).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(initialTooltip).not.toBeVisible();
    await button.hover();
    await expect(visibleTooltip(page, 'Hover count: 1')).toBeVisible();
  });

  for (const selector of ['.edge-button.top-left button', '.edge-button.center button']) {
    test(`smart positioning: ${selector}`, async ({ page }) => {
      await page.locator(selector).hover();
      await expect(visibleTooltip(page, selector.includes('center') ? 'Center positioned tooltip' : 'This tooltip will flip to avoid viewport edges')).toBeVisible();
    });
  }
});
