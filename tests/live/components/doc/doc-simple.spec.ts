import { test, expect, type Locator } from '@playwright/test';

async function placeCursor(doc: Locator, text: string, offset: number) {
  await doc.evaluate((element: any, { text, offset }) => {
    element.setHTML(`<p>${text}</p>`);
    const textNode = element.shadowRoot.querySelector('.doc-editor p').firstChild;
    const range = document.createRange();
    range.setStart(textNode, offset);
    range.collapse(true);
    element.savedSelection = range.cloneRange();
  }, { text, offset });
}

test.describe('snice-doc insertion at the cursor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/live/fixtures/doc/visual.html');
    await page.waitForSelector('snice-doc');
  });

  test('inserts an image at the saved cursor', async ({ page }) => {
    const doc = page.locator('snice-doc').first();
    await placeCursor(doc, 'BeforeAfter', 6);
    await doc.locator('button[title="Insert Image"]').evaluate((button: HTMLButtonElement) => button.click());
    await page.locator('snice-modal[open]').waitFor({ state: 'attached' });
    await page.locator('snice-modal[open] snice-input input').fill('https://example.com/image.png');
    await page.locator('snice-modal[open] snice-button').filter({ hasText: 'Insert' }).click();
    // Insertion applies asynchronously after the modal closes — poll instead
    // of reading immediately (Firefox under load reads pre-insertion HTML).
    await expect.poll(async () => doc.evaluate((element: any) => element.getHTML())).toContain('<img');
    const html = await doc.evaluate((element: any) => element.getHTML());
    expect(html.indexOf('Before')).toBeLessThan(html.indexOf('<img'));
    expect(html.indexOf('<img')).toBeLessThan(html.indexOf('After'));
  });

  test('inserts a table at the saved cursor', async ({ page }) => {
    const doc = page.locator('snice-doc').first();
    await placeCursor(doc, 'StartEnd', 5);
    await doc.locator('button[title="Insert Table"]').evaluate((button: HTMLButtonElement) => button.click());
    await page.locator('snice-modal[open]').waitFor({ state: 'attached' });
    await page.locator('snice-modal[open] snice-button').filter({ hasText: 'Insert' }).click();
    await expect.poll(async () => doc.evaluate((element: any) => element.getHTML())).toContain('<table');
    const html = await doc.evaluate((element: any) => element.getHTML());
    expect(html.indexOf('Start')).toBeLessThan(html.indexOf('<table'));
    expect(html.indexOf('<table')).toBeLessThan(html.indexOf('End'));
  });

  test('inserts a divider at the saved cursor', async ({ page }) => {
    const doc = page.locator('snice-doc').first();
    await placeCursor(doc, 'TopBottom', 3);
    await doc.locator('button[title="Insert Divider"]').evaluate((button: HTMLButtonElement) => button.click());
    await expect.poll(async () => doc.evaluate((element: any) => element.getHTML())).toContain('<hr');
    const html = await doc.evaluate((element: any) => element.getHTML());
    expect(html.indexOf('Top')).toBeLessThan(html.indexOf('<hr'));
    expect(html.indexOf('<hr')).toBeLessThan(html.indexOf('Bottom'));
  });
});
