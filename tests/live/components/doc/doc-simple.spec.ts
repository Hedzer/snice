import { test, expect } from '@playwright/test';

test.describe('snice-doc-simple', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5566/components/doc/demo.html');
    await page.waitForSelector('snice-doc-simple');
  });

  test('should insert image at cursor position', async ({ page }) => {
    // Clear the editor first
    await page.evaluate(() => {
      const editor = document.querySelector('snice-doc-simple') as any;
      editor.clear();
    });

    // Type some text
    const editorContent = page.locator('snice-doc-simple').locator('.doc-editor');
    await editorContent.click();
    await page.keyboard.type('Before');

    // Click the insert image button
    await page.locator('.sidebar-item').filter({ hasText: 'Image' }).click();

    // Wait for modal
    await page.waitForSelector('snice-modal[open]', { timeout: 5000 });

    // Enter URL
    await page.locator('snice-input').fill('https://via.placeholder.com/150');

    // Click insert
    await page.locator('snice-button').filter({ hasText: 'Insert' }).click();

    // Type more text after
    await page.keyboard.type(' After');

    // Check the HTML structure
    const html = await page.evaluate(() => {
      const editor = document.querySelector('snice-doc-simple') as any;
      return editor.getHTML();
    });

    console.log('HTML:', html);

    // Should have "Before", then image, then "After"
    expect(html).toContain('Before');
    expect(html).toContain('https://via.placeholder.com/150');
    expect(html).toContain('After');

    // Check that "Before" comes before the image
    const beforeIndex = html.indexOf('Before');
    const imgIndex = html.indexOf('<img');
    expect(beforeIndex).toBeLessThan(imgIndex);
  });

  test('should insert table at cursor position', async ({ page }) => {
    // Clear the editor
    await page.evaluate(() => {
      const editor = document.querySelector('snice-doc-simple') as any;
      editor.clear();
    });

    // Type some text
    const editorContent = page.locator('snice-doc-simple').locator('.doc-editor');
    await editorContent.click();
    await page.keyboard.type('Start');

    // Click the insert table button
    await page.locator('.sidebar-item').filter({ hasText: 'Table' }).click();

    // Wait for modal
    await page.waitForSelector('snice-modal[open]', { timeout: 5000 });

    // Click insert with default values
    await page.locator('snice-button').filter({ hasText: 'Insert' }).click();

    // Type more text
    await page.keyboard.type(' End');

    // Check the HTML
    const html = await page.evaluate(() => {
      const editor = document.querySelector('snice-doc-simple') as any;
      return editor.getHTML();
    });

    console.log('Table HTML:', html);

    expect(html).toContain('Start');
    expect(html).toContain('<table');
    expect(html).toContain('End');
  });

  test('should insert divider at cursor position', async ({ page }) => {
    // Capture console logs
    page.on('console', msg => console.log('BROWSER:', msg.text()));

    // Clear the editor
    await page.evaluate(() => {
      const editor = document.querySelector('snice-doc-simple') as any;
      editor.clear();
    });

    // Type some text
    const editorContent = page.locator('snice-doc-simple').locator('.doc-editor');
    await editorContent.click();
    await page.keyboard.type('Top');

    // Click the insert divider button
    await page.locator('.sidebar-item').filter({ hasText: 'Divider' }).click();

    //Wait a bit
    await page.waitForTimeout(100);

    // Type more text
    await page.keyboard.type(' Bottom');

    // Check the HTML
    const html = await page.evaluate(() => {
      const editor = document.querySelector('snice-doc-simple') as any;
      return editor.getHTML();
    });

    console.log('Divider HTML:', html);

    expect(html).toContain('Top');
    expect(html).toContain('<hr');
    expect(html).toContain('Bottom');

    // Check proper order: Top, then HR, then Bottom
    // Should NOT have "Top Bottom" in the same element
    expect(html).not.toMatch(/Top.*Bottom.*<hr/);

    // Should have Top before HR, and HR before Bottom
    const topIndex = html.indexOf('Top');
    const hrIndex = html.indexOf('<hr');
    const bottomIndex = html.indexOf('Bottom');
    expect(topIndex).toBeLessThan(hrIndex);
    expect(hrIndex).toBeLessThan(bottomIndex);
  });
});
