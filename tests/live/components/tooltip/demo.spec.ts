import { test, expect } from '@playwright/test';

test.describe('Tooltip Demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5566/components/tooltip/demo.html');
    await page.waitForLoadState('networkidle');
  });

  test('Basic Positions - Top', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Top', exact: true });
    await button.hover();
    await page.waitForTimeout(100);

    // Tooltip is rendered as a portal in document body
    const tooltip = page.locator('.snice-tooltip-portal.snice-tooltip--visible');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText('This tooltip appears on top');
  });

  test('Basic Positions - Bottom', async ({ page }) => {
    const button = page.locator('button:has-text("Bottom")');
    await button.hover();
    await page.waitForTimeout(100);

    const tooltip = page.locator('snice-tooltip').filter({ hasText: 'This tooltip appears on bottom' });
    const tooltipContent = tooltip.locator('.tooltip-content');

    await expect(tooltipContent).toBeVisible();
  });

  test('Basic Positions - Left', async ({ page }) => {
    const button = page.locator('button:has-text("Left")');
    await button.hover();
    await page.waitForTimeout(100);

    const tooltip = page.locator('snice-tooltip').filter({ hasText: 'This tooltip appears on left' });
    const tooltipContent = tooltip.locator('.tooltip-content');

    await expect(tooltipContent).toBeVisible();
  });

  test('Basic Positions - Right', async ({ page }) => {
    const button = page.locator('button:has-text("Right")');
    await button.hover();
    await page.waitForTimeout(100);

    const tooltip = page.locator('snice-tooltip').filter({ hasText: 'This tooltip appears on right' });
    const tooltipContent = tooltip.locator('.tooltip-content');

    await expect(tooltipContent).toBeVisible();
  });

  test('Aligned Positions - Top Start', async ({ page }) => {
    const button = page.locator('button:has-text("Top Start")');
    await button.hover();
    await page.waitForTimeout(100);

    const tooltip = page.locator('snice-tooltip').filter({ hasText: 'Top start aligned' });
    const tooltipContent = tooltip.locator('.tooltip-content');

    await expect(tooltipContent).toBeVisible();
  });

  test('Aligned Positions - Top End', async ({ page }) => {
    const button = page.locator('button:has-text("Top End")');
    await button.hover();
    await page.waitForTimeout(100);

    const tooltip = page.locator('snice-tooltip').filter({ hasText: 'Top end aligned' });
    const tooltipContent = tooltip.locator('.tooltip-content');

    await expect(tooltipContent).toBeVisible();
  });

  test('Trigger Types - Hover', async ({ page }) => {
    const button = page.locator('button:has-text("Hover Trigger")');
    const tooltip = page.locator('snice-tooltip').filter({ hasText: 'Hover to see this tooltip' });
    const tooltipContent = tooltip.locator('.tooltip-content');

    // Should not be visible initially
    await expect(tooltipContent).not.toBeVisible();

    // Hover to show
    await button.hover();
    await page.waitForTimeout(100);
    await expect(tooltipContent).toBeVisible();

    // Move away to hide
    await page.mouse.move(0, 0);
    await page.waitForTimeout(100);
    await expect(tooltipContent).not.toBeVisible();
  });

  test('Trigger Types - Click', async ({ page }) => {
    const button = page.locator('button:has-text("Click Trigger")');

    // Should not be visible initially
    const tooltipBefore = page.locator('.snice-tooltip-portal.snice-tooltip--visible').filter({ hasText: 'Click to toggle this tooltip' });
    await expect(tooltipBefore).not.toBeVisible();

    // Click to show
    await button.click();
    await page.waitForTimeout(100);

    const tooltipAfterClick = page.locator('.snice-tooltip-portal.snice-tooltip--visible').filter({ hasText: 'Click to toggle this tooltip' });
    await expect(tooltipAfterClick).toBeVisible();

    // Click again to hide
    await button.click();
    await page.waitForTimeout(100);
    await expect(tooltipAfterClick).not.toBeVisible();
  });

  test('Trigger Types - Focus', async ({ page }) => {
    const input = page.locator('input[placeholder="Focus me"]');
    const tooltip = page.locator('snice-tooltip').filter({ hasText: 'Focus to see this tooltip' });
    const tooltipContent = tooltip.locator('.tooltip-content');

    // Should not be visible initially
    await expect(tooltipContent).not.toBeVisible();

    // Focus to show
    await input.focus();
    await page.waitForTimeout(100);
    await expect(tooltipContent).toBeVisible();

    // Blur to hide
    await input.blur();
    await page.waitForTimeout(100);
    await expect(tooltipContent).not.toBeVisible();
  });

  test('Trigger Types - Manual', async ({ page }) => {
    const button = page.locator('button:has-text("Manual Control")');
    const tooltip = page.locator('snice-tooltip#manual-tooltip');
    const tooltipContent = tooltip.locator('.tooltip-content');

    // Should not be visible initially
    await expect(tooltipContent).not.toBeVisible();

    // Click to toggle
    await button.click();
    await page.waitForTimeout(100);
    await expect(tooltipContent).toBeVisible();

    // Click again to toggle off
    await button.click();
    await page.waitForTimeout(100);
    await expect(tooltipContent).not.toBeVisible();
  });

  test('Delays - Show Delay', async ({ page }) => {
    const button = page.locator('button:has-text("Show Delay (500ms)")');
    const tooltip = page.locator('snice-tooltip').filter({ hasText: 'Shows after 500ms delay' });
    const tooltipContent = tooltip.locator('.tooltip-content');

    // Hover
    await button.hover();

    // Should not be visible immediately
    await expect(tooltipContent).not.toBeVisible();

    // Wait for delay
    await page.waitForTimeout(600);
    await expect(tooltipContent).toBeVisible();
  });

  test('Delays - Hide Delay', async ({ page }) => {
    const button = page.locator('button:has-text("Hide Delay (500ms)")');
    const tooltip = page.locator('snice-tooltip').filter({ hasText: 'Hides after 500ms delay' });
    const tooltipContent = tooltip.locator('.tooltip-content');

    // Hover to show
    await button.hover();
    await page.waitForTimeout(100);
    await expect(tooltipContent).toBeVisible();

    // Move away
    await page.mouse.move(0, 0);

    // Should still be visible (hide delay)
    await page.waitForTimeout(200);
    await expect(tooltipContent).toBeVisible();

    // Wait for hide delay
    await page.waitForTimeout(400);
    await expect(tooltipContent).not.toBeVisible();
  });

  test('Customization - No Arrow', async ({ page }) => {
    const button = page.locator('button:has-text("No Arrow")');
    await button.hover();
    await page.waitForTimeout(100);

    const tooltip = page.locator('snice-tooltip').filter({ hasText: 'Tooltip without arrow' });
    const arrow = tooltip.locator('.tooltip-arrow');

    // Arrow should not be visible
    await expect(arrow).not.toBeVisible();
  });

  test('Customization - Wide Tooltip', async ({ page }) => {
    const button = page.locator('button:has-text("Wide Tooltip")');
    await button.hover();
    await page.waitForTimeout(100);

    const tooltip = page.locator('snice-tooltip').filter({ hasText: 'This tooltip has a much wider maximum width' });
    const tooltipContent = tooltip.locator('.tooltip-content');

    await expect(tooltipContent).toBeVisible();
    await expect(tooltipContent).toContainText('much wider maximum width');
  });

  test('Customization - Custom Style', async ({ page }) => {
    const button = page.locator('button:has-text("Custom Style")');
    await button.hover();
    await page.waitForTimeout(100);

    const tooltip = page.locator('snice-tooltip.custom-tooltip');
    const tooltipContent = tooltip.locator('.tooltip-content');

    await expect(tooltipContent).toBeVisible();
  });

  test('Customization - Large Offset', async ({ page }) => {
    const button = page.locator('button:has-text("Large Offset")');
    await button.hover();
    await page.waitForTimeout(100);

    const tooltip = page.locator('snice-tooltip').filter({ hasText: 'Large offset from trigger' });
    const tooltipContent = tooltip.locator('.tooltip-content');

    await expect(tooltipContent).toBeVisible();
  });

  test('Content Types - Text Content', async ({ page }) => {
    const link = page.locator('.link:has-text("Text Content")');
    await link.hover();
    await page.waitForTimeout(100);

    const tooltip = page.locator('snice-tooltip').filter({ hasText: 'Simple text tooltip' });
    const tooltipContent = tooltip.locator('.tooltip-content');

    await expect(tooltipContent).toBeVisible();
  });

  test('Content Types - Long Content', async ({ page }) => {
    const link = page.locator('.link:has-text("Long Content")');
    await link.hover();
    await page.waitForTimeout(100);

    const tooltip = page.locator('snice-tooltip').filter({ hasText: 'This is a very long tooltip content' });
    const tooltipContent = tooltip.locator('.tooltip-content');

    await expect(tooltipContent).toBeVisible();
    await expect(tooltipContent).toContainText('multiple lines');
  });

  test('Content Types - Icon', async ({ page }) => {
    const icon = page.locator('.icon[aria-label="Info"]');
    await icon.hover();
    await page.waitForTimeout(100);

    const tooltip = page.locator('snice-tooltip').filter({ hasText: 'Tooltip on an icon' });
    const tooltipContent = tooltip.locator('.tooltip-content');

    await expect(tooltipContent).toBeVisible();
  });

  test('Content Types - Code', async ({ page }) => {
    const code = page.locator('code:has-text("npm install")');
    await code.hover();
    await page.waitForTimeout(100);

    const tooltip = page.locator('snice-tooltip').filter({ hasText: 'Press Ctrl+C to copy' });
    const tooltipContent = tooltip.locator('.tooltip-content');

    await expect(tooltipContent).toBeVisible();
  });

  test('Programmatic Control - Show/Hide', async ({ page }) => {
    const tooltip = page.locator('snice-tooltip#prog-tooltip');
    const tooltipContent = tooltip.locator('.tooltip-content');
    const showButton = page.locator('button:has-text("Show")').nth(1);
    const hideButton = page.locator('button:has-text("Hide")').nth(1);

    // Should not be visible initially
    await expect(tooltipContent).not.toBeVisible();

    // Click show button
    await showButton.click();
    await page.waitForTimeout(100);
    await expect(tooltipContent).toBeVisible();

    // Click hide button
    await hideButton.click();
    await page.waitForTimeout(100);
    await expect(tooltipContent).not.toBeVisible();
  });

  test('Programmatic Control - Dynamic Content', async ({ page }) => {
    const button = page.locator('button:has-text("Dynamic Content")');
    const tooltip = page.locator('snice-tooltip#dynamic-tooltip');
    const tooltipContent = tooltip.locator('.tooltip-content');

    // First hover
    await button.hover();
    await page.waitForTimeout(100);
    await expect(tooltipContent).toContainText('Hover count: 1');

    // Move away and hover again
    await page.mouse.move(0, 0);
    await page.waitForTimeout(100);
    await button.hover();
    await page.waitForTimeout(100);
    await expect(tooltipContent).toContainText('Hover count: 2');
  });

  test('Smart Positioning - Edge Detection Top Left', async ({ page }) => {
    const button = page.locator('.edge-button.top-left button');
    await button.hover();
    await page.waitForTimeout(100);

    const tooltip = button.locator('xpath=ancestor::snice-tooltip');
    const tooltipContent = tooltip.locator('.tooltip-content');

    await expect(tooltipContent).toBeVisible();
  });

  test('Smart Positioning - Edge Detection Center', async ({ page }) => {
    const button = page.locator('.edge-button.center button');
    await button.hover();
    await page.waitForTimeout(100);

    const tooltip = button.locator('xpath=ancestor::snice-tooltip');
    const tooltipContent = tooltip.locator('.tooltip-content');

    await expect(tooltipContent).toBeVisible();
  });
});
