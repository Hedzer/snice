import { test, expect } from '@playwright/test';

test.describe('List Input Overflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5566/.debug/test-list-input-overflow.html');
    await page.waitForLoadState('networkidle');
    // Wait for components to be defined
    await page.waitForFunction(() => {
      return customElements.get('snice-list') &&
             customElements.get('snice-list-item') &&
             customElements.get('snice-input');
    });
  });

  test('standard list - inputs should not overflow', async ({ page }) => {
    const lists = page.locator('snice-list');
    const firstList = lists.first();
    const firstListInputs = firstList.locator('snice-input');

    const listBox = await firstList.boundingBox();
    const input1Box = await firstListInputs.nth(0).boundingBox();
    const input2Box = await firstListInputs.nth(1).boundingBox();

    expect(listBox).not.toBeNull();
    expect(input1Box).not.toBeNull();
    expect(input2Box).not.toBeNull();

    const listRightEdge = listBox!.x + listBox!.width;
    const input1RightEdge = input1Box!.x + input1Box!.width;
    const input2RightEdge = input2Box!.x + input2Box!.width;

    console.log('Standard list:', { listRightEdge, input1RightEdge, input2RightEdge });

    expect(input1RightEdge).toBeLessThanOrEqual(listRightEdge);
    expect(input2RightEdge).toBeLessThanOrEqual(listRightEdge);
  });

  test('wide list - inputs should not overflow', async ({ page }) => {
    const lists = page.locator('snice-list');
    const wideList = lists.nth(1);
    const wideListInputs = wideList.locator('snice-input');

    const listBox = await wideList.boundingBox();
    const input1Box = await wideListInputs.nth(0).boundingBox();
    const input2Box = await wideListInputs.nth(1).boundingBox();

    expect(listBox).not.toBeNull();
    expect(input1Box).not.toBeNull();
    expect(input2Box).not.toBeNull();

    const listRightEdge = listBox!.x + listBox!.width;
    const input1RightEdge = input1Box!.x + input1Box!.width;
    const input2RightEdge = input2Box!.x + input2Box!.width;

    console.log('Wide list:', { listRightEdge, input1RightEdge, input2RightEdge });

    expect(input1RightEdge).toBeLessThanOrEqual(listRightEdge);
    expect(input2RightEdge).toBeLessThanOrEqual(listRightEdge);
  });

  test('full width list - inputs should not overflow', async ({ page }) => {
    const lists = page.locator('snice-list');
    const fullWidthList = lists.nth(2);
    const fullWidthListInputs = fullWidthList.locator('snice-input');

    const listBox = await fullWidthList.boundingBox();
    const input1Box = await fullWidthListInputs.nth(0).boundingBox();
    const input2Box = await fullWidthListInputs.nth(1).boundingBox();

    expect(listBox).not.toBeNull();
    expect(input1Box).not.toBeNull();
    expect(input2Box).not.toBeNull();

    const listRightEdge = listBox!.x + listBox!.width;
    const input1RightEdge = input1Box!.x + input1Box!.width;
    const input2RightEdge = input2Box!.x + input2Box!.width;

    console.log('Full width list:', { listRightEdge, input1RightEdge, input2RightEdge });

    expect(input1RightEdge).toBeLessThanOrEqual(listRightEdge);
    expect(input2RightEdge).toBeLessThanOrEqual(listRightEdge);
  });

  test('visual inspection of all list variations', async ({ page }) => {
    await page.screenshot({
      path: '/home/hedzer/Dropbox/Projects/snice/.debug/list-input-overflow.png',
      fullPage: true
    });
  });
});
