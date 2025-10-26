import { test, expect } from '@playwright/test';

const demoPath = 'http://localhost:5566/components/chart/demo.html';

test.describe('Snice Chart', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
  });

  test('should render chart components', async ({ page }) => {
    const count = await page.locator('snice-chart').count();
    expect(count).toBeGreaterThan(0);
  });

  test('should render line chart', async ({ page }) => {
    const lineChart = page.locator('snice-chart#line-chart');
    expect(await lineChart.count()).toBe(1);
    expect(await lineChart.getAttribute('type')).toBe('line');
  });

  test('should render bar chart', async ({ page }) => {
    const barChart = page.locator('snice-chart#bar-chart');
    expect(await barChart.count()).toBe(1);
    expect(await barChart.getAttribute('type')).toBe('bar');
  });

  test('should render pie chart', async ({ page }) => {
    const pieChart = page.locator('snice-chart#pie-chart');
    expect(await pieChart.count()).toBe(1);
    expect(await pieChart.getAttribute('type')).toBe('pie');
  });

  test('should contain SVG element', async ({ page }) => {
    const svg = page.locator('snice-chart svg').first();
    expect(await svg.count()).toBe(1);
  });

  test('should have legend', async ({ page }) => {
    const legend = page.locator('snice-chart .chart-legend').first();
    expect(await legend.count()).toBe(1);
  });

  test('should have legend items', async ({ page }) => {
    const legendItems = page.locator('snice-chart .legend-item');
    expect(await legendItems.count()).toBeGreaterThan(0);
  });
});
