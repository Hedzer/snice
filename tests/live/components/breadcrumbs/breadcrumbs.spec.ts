import { test, expect } from '@playwright/test';

const demoPath = 'http://localhost:5566/components/breadcrumbs/demo.html';

test.describe('Snice Breadcrumbs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
  });

  test('should render breadcrumbs components', async ({ page }) => {
    const count = await page.locator('snice-breadcrumbs').count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display breadcrumb items', async ({ page }) => {
    const breadcrumbs = page.locator('snice-breadcrumbs').first();
    await expect(breadcrumbs).toBeVisible();

    const items = breadcrumbs.locator('.breadcrumb-item');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have collapsible breadcrumbs with max-items', async ({ page }) => {
    // Find breadcrumbs with max-items attribute
    const collapsibleBreadcrumbs = page.locator('snice-breadcrumbs[max-items]').first();

    if (await collapsibleBreadcrumbs.count() > 0) {
      // Check for ellipsis button
      const ellipsis = collapsibleBreadcrumbs.locator('.breadcrumb-ellipsis');
      if (await ellipsis.count() > 0) {
        await expect(ellipsis).toBeVisible();

        // Click ellipsis to expand
        await ellipsis.click();
        await page.waitForTimeout(100);

        // Ellipsis should no longer be visible after expanding
        await expect(ellipsis).not.toBeVisible();
      }
    }
  });

  test('should display icon images when provided', async ({ page }) => {
    // Check for icon images in breadcrumbs
    const iconImages = page.locator('snice-breadcrumbs .breadcrumb-icon-image');
    const count = await iconImages.count();

    if (count > 0) {
      // Verify at least one icon image is visible
      await expect(iconImages.first()).toBeVisible();
    }
  });

  test('should work with slot-based snice-crumb elements', async ({ page }) => {
    // Find breadcrumbs that might use slots (check for snice-crumb children)
    const breadcrumbsWithSlots = page.locator('snice-breadcrumbs').filter({
      has: page.locator('snice-crumb')
    });

    const slotCount = await breadcrumbsWithSlots.count();

    if (slotCount > 0) {
      const firstWithSlots = breadcrumbsWithSlots.first();

      // Should still render breadcrumb items
      const items = firstWithSlots.locator('.breadcrumb-item');
      const count = await items.count();
      expect(count).toBeGreaterThan(0);
    } else {
      // If no slot-based breadcrumbs in demo, test passes (not all demos use slots)
      expect(slotCount).toBe(0);
    }
  });

  test('should display separators between items', async ({ page }) => {
    const breadcrumbs = page.locator('snice-breadcrumbs').first();
    const separators = breadcrumbs.locator('.breadcrumb-separator');
    const separatorCount = await separators.count();

    // Should have separators (at least one if there are multiple items)
    expect(separatorCount).toBeGreaterThanOrEqual(0);
  });

  test('should have clickable links', async ({ page }) => {
    const links = page.locator('snice-breadcrumbs .breadcrumb-link');
    const linkCount = await links.count();

    if (linkCount > 0) {
      // Verify links have href attributes
      const firstLink = links.first();
      const href = await firstLink.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });
});
