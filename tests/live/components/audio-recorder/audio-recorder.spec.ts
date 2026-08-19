import { test, expect } from '@playwright/test';

const demoPath = 'http://localhost:5566/tests/live/fixtures/audio-recorder/visual.html';

test.describe('Snice Audio Recorder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.locator('snice-audio-recorder#recorder').waitFor();
  });

  test('should render audio recorder component', async ({ page }) => {
    const recorder = page.locator('snice-audio-recorder#recorder');
    expect(await recorder.count()).toBe(1);
  });

  test('should have recorder container', async ({ page }) => {
    const container = page.locator('#recorder .recorder-container');
    expect(await container.count()).toBe(1);
  });

  test('should have status display', async ({ page }) => {
    const status = page.locator('#recorder .recorder-status');
    expect(await status.count()).toBe(1);
  });

  test('should show ready state initially', async ({ page }) => {
    const state = page.locator('#recorder .recorder-state');
    const text = await state.textContent();
    expect(text).toContain('Ready');
  });

  test('should have timer', async ({ page }) => {
    const timer = page.locator('#recorder .recorder-timer');
    expect(await timer.count()).toBe(1);
    const timerText = await timer.textContent();
    expect(timerText).toMatch(/\d{2}:\d{2}/);
  });

  test('should have visualizer', async ({ page }) => {
    const visualizer = page.locator('#recorder .recorder-visualizer');
    expect(await visualizer.count()).toBe(1);
  });

  test('should have visualizer bars', async ({ page }) => {
    const bars = page.locator('#recorder .visualizer-bar');
    expect(await bars.count()).toBe(32);
  });

  test('should have controls', async ({ page }) => {
    const controls = page.locator('#recorder .recorder-controls');
    expect(await controls.count()).toBe(1);
  });

  test('should have record button', async ({ page }) => {
    const recordBtn = page.locator('#recorder .recorder-btn.record');
    expect(await recordBtn.count()).toBe(1);
  });
});
