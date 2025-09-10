import { test, expect } from '@playwright/test';

test.describe('Layout Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('#app');
  });

  test('should navigate between pages with layout', async ({ page }) => {
    // Start on home page
    await expect(page.locator('app-layout')).toBeVisible();
    await expect(page.locator('home-page[slot="page"]')).toBeVisible();
    
    // Navigate to todos
    await page.click('a[href="#/todos"]');
    await page.waitForTimeout(300); // Wait for transition
    
    // Should still have layout
    await expect(page.locator('app-layout')).toBeVisible();
    await expect(page.locator('todo-page[slot="page"]')).toBeVisible();
    await expect(page.locator('home-page[slot="page"]')).not.toBeVisible();
    
    // Navigate to about
    await page.click('a[href="#/about"]');
    await page.waitForTimeout(300);
    
    await expect(page.locator('app-layout')).toBeVisible();
    await expect(page.locator('about-page[slot="page"]')).toBeVisible();
    await expect(page.locator('todo-page[slot="page"]')).not.toBeVisible();
    await expect(page.locator('home-page[slot="page"]')).not.toBeVisible();
  });

  test('should not stack pages during navigation', async ({ page }) => {
    // Navigate through multiple pages quickly
    await page.click('a[href="#/todos"]');
    await page.waitForTimeout(100);
    
    await page.click('a[href="#/about"]');
    await page.waitForTimeout(100);
    
    await page.click('a[href="#/"]');
    await page.waitForTimeout(300); // Wait for final transition
    
    // Should only have one page with slot="page"
    const pagesWithSlot = page.locator('[slot="page"]');
    await expect(pagesWithSlot).toHaveCount(1);
    
    // Should be home page
    await expect(page.locator('home-page[slot="page"]')).toBeVisible();
    await expect(page.locator('todo-page[slot="page"]')).not.toBeVisible();
    await expect(page.locator('about-page[slot="page"]')).not.toBeVisible();
  });

  test('should maintain layout across page changes', async ({ page }) => {
    const layout = page.locator('app-layout');
    
    // Get initial layout element reference
    await expect(layout).toBeVisible();
    const initialLayoutHTML = await layout.innerHTML();
    
    // Navigate to different page
    await page.click('a[href="#/todos"]');
    await page.waitForTimeout(300);
    
    // Layout should still exist and be the same element
    await expect(layout).toBeVisible();
    const afterNavigationHTML = await layout.innerHTML();
    
    // Layout structure should be preserved (nav, main, etc.)
    expect(afterNavigationHTML).toContain('nav class="navbar"');
    expect(afterNavigationHTML).toContain('main class="main-content"');
  });

  test('should handle rapid navigation without errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Rapid navigation
    for (let i = 0; i < 5; i++) {
      await page.click('a[href="#/todos"]');
      await page.waitForTimeout(50);
      await page.click('a[href="#/about"]');
      await page.waitForTimeout(50);
      await page.click('a[href="#/"]');
      await page.waitForTimeout(50);
    }
    
    // Wait for final state
    await page.waitForTimeout(500);
    
    // Should not have any console errors
    expect(errors).toEqual([]);
    
    // Should still be functional
    await expect(page.locator('app-layout')).toBeVisible();
    await expect(page.locator('[slot="page"]')).toHaveCount(1);
  });

  test('should apply transitions correctly', async ({ page }) => {
    const homePage = page.locator('home-page[slot="page"]');
    const todoPage = page.locator('todo-page[slot="page"]');
    
    // Start on home page
    await expect(homePage).toBeVisible();
    
    // Navigate and check transition states
    await page.click('a[href="#/todos"]');
    
    // During transition, both elements might be present temporarily
    await page.waitForTimeout(100);
    
    // After transition completes, only new page should be visible
    await page.waitForTimeout(300);
    await expect(todoPage).toBeVisible();
    await expect(homePage).not.toBeVisible();
  });

  test('should clean up transition styles', async ({ page }) => {
    // Navigate to trigger transition
    await page.click('a[href="#/todos"]');
    await page.waitForTimeout(400); // Wait for transition to complete
    
    const todoPage = page.locator('todo-page[slot="page"]');
    await expect(todoPage).toBeVisible();
    
    // Check that transition styles are cleaned up
    const position = await todoPage.evaluate(el => getComputedStyle(el).position);
    const transition = await todoPage.evaluate(el => getComputedStyle(el).transition);
    
    // Should not have transition positioning styles
    expect(position).not.toBe('absolute');
    expect(transition).toBe('all 0s ease 0s'); // Default transition value
  });
});