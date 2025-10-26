import { test, expect } from '@playwright/test';

const demoPath = 'http://localhost:5566/components/draw/demo.html';

test.describe('Snice Draw', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForLoadState('networkidle');
  });

  test('should render draw component', async ({ page }) => {
    const draw = page.locator('snice-draw#draw');
    expect(await draw.count()).toBe(1);
  });

  test('should have canvas element', async ({ page }) => {
    const canvas = page.locator('snice-draw canvas');
    expect(await canvas.count()).toBe(1);
  });

  test('should have correct canvas dimensions', async ({ page }) => {
    const canvas = page.locator('snice-draw canvas');
    const width = await canvas.getAttribute('width');
    const height = await canvas.getAttribute('height');
    expect(width).toBe('800');
    expect(height).toBe('600');
  });

  test('should have toolbar', async ({ page }) => {
    const toolbar = page.locator('.toolbar');
    expect(await toolbar.count()).toBe(1);
  });

  test('should have tool buttons', async ({ page }) => {
    const toolButtons = page.locator('.tool-btn');
    expect(await toolButtons.count()).toBeGreaterThan(0);
  });

  test('should have pen tool button active by default', async ({ page }) => {
    const penButton = page.locator('.tool-btn[data-tool="pen"]');
    expect(await penButton.count()).toBe(1);
    const isActive = await penButton.evaluate(el => el.classList.contains('active'));
    expect(isActive).toBe(true);
  });

  test('should have color picker', async ({ page }) => {
    const colorInput = page.locator('input#color-input');
    expect(await colorInput.count()).toBe(1);
    expect(await colorInput.getAttribute('type')).toBe('color');
  });

  test('should have width slider', async ({ page }) => {
    const widthInput = page.locator('input#width-input');
    expect(await widthInput.count()).toBe(1);
    expect(await widthInput.getAttribute('type')).toBe('range');
  });

  test('should have lazy brush checkbox', async ({ page }) => {
    const lazyCheck = page.locator('input#lazy-check');
    expect(await lazyCheck.count()).toBe(1);
    expect(await lazyCheck.isChecked()).toBe(true);
  });

  test('should have action buttons', async ({ page }) => {
    const undoBtn = page.locator('button#undo-btn');
    const redoBtn = page.locator('button#redo-btn');
    const downloadBtn = page.locator('button#download-btn');
    const clearBtn = page.locator('button#clear-btn');

    expect(await undoBtn.count()).toBe(1);
    expect(await redoBtn.count()).toBe(1);
    expect(await downloadBtn.count()).toBe(1);
    expect(await clearBtn.count()).toBe(1);
  });

  test('should switch tools when clicked', async ({ page }) => {
    const eraserBtn = page.locator('.tool-btn[data-tool="eraser"]');
    await eraserBtn.click();

    const isActive = await eraserBtn.evaluate(el => el.classList.contains('active'));
    expect(isActive).toBe(true);
  });
});
