import { expect, test } from '@playwright/test';

const demoPath = 'http://localhost:5566/tests/live/fixtures/link/visual.html';

test.describe('Snice Link full showcase', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => {
      const link = document.querySelector('snice-link');
      return Boolean(customElements.get('snice-link') && link?.shadowRoot?.querySelector('a'));
    });
  });

  test('renders every showcase example as an internal anchor', async ({ page }) => {
    const result = await page.locator('snice-link').evaluateAll(links => ({
      total: links.length,
      rendered: links.filter(link => link.shadowRoot?.querySelector('a')).length,
      labeled: links.filter(link => Boolean(link.textContent?.trim())).length
    }));

    expect(result.total).toBeGreaterThan(30);
    expect(result.rendered).toBe(result.total);
    expect(result.labeled).toBe(result.total);
  });

  test('contains every documented visual variant and state', async ({ page }) => {
    for (const variant of ['default', 'primary', 'secondary', 'muted']) {
      await expect(page.locator(`snice-link[variant="${variant}"]`).first()).toBeVisible();
    }
    await expect(page.locator('snice-link[external]').first()).toBeVisible();
    await expect(page.locator('snice-link[disabled]').first()).toBeVisible();
    await expect(page.locator('snice-link[underline]').first()).toBeVisible();
    await expect(page.locator('snice-link[hash]').first()).toBeVisible();
  });

  test('demonstrates allowed and blocked href behavior without execution', async ({ page }) => {
    const section = page.locator('#link-safe-destination');
    await expect(section).toContainText('Malformed URLs and unsafe or obfuscated schemes');

    const blocked = section.locator('snice-link[href^="javascript:"]');
    const blockedAnchor = blocked.locator('a');
    const before = page.url();
    await page.evaluate(() => {
      (globalThis as any).__sniceUnsafeLinkShowcase = 0;
    });

    expect(await blockedAnchor.getAttribute('href')).toBeNull();
    await expect(section.getByRole('link', { name: 'Unsafe scheme blocked' })).toHaveCount(0);
    await blockedAnchor.click();
    expect(await page.evaluate(() => (globalThis as any).__sniceUnsafeLinkShowcase)).toBe(0);
    expect(page.url()).toBe(before);

    await section.getByRole('link', { name: 'Relative / hash' }).click();
    expect(new URL(page.url()).hash).toBe('#link-safe-destination');
  });

  test('uses the disabled theme token in light, dark, and no-theme modes', async ({ page }) => {
    const blockedAnchor = page
      .locator('#link-safe-destination snice-link[href^="javascript:"]')
      .locator('a');
    const color = () => blockedAnchor.evaluate(anchor => getComputedStyle(anchor).color);

    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    await expect.poll(color).toBe('rgb(163, 163, 163)');

    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await expect.poll(color).toBe('rgb(82, 82, 82)');

    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-theme');
      for (const stylesheet of document.querySelectorAll('link[rel="stylesheet"]')) {
        if ((stylesheet as HTMLLinkElement).href.includes('/theme/theme.css')) stylesheet.remove();
      }
    });
    await expect.poll(color).toBe('rgb(163, 163, 163)');
  });

  test('keeps all links within the showcase viewport', async ({ page }) => {
    const layout = await page.locator('snice-link').evaluateAll(links => links.map(link => {
      const rect = link.getBoundingClientRect();
      return {
        label: link.textContent?.trim(),
        width: rect.width,
        height: rect.height,
        left: rect.left,
        right: rect.right,
        viewportWidth: document.documentElement.clientWidth
      };
    }));

    expect(layout.every(item =>
      item.width > 0
      && item.height > 0
      && item.left >= 0
      && item.right <= item.viewportWidth + 1
    )).toBe(true);
  });
});
