import { expect, test } from '@playwright/test';

const storyUrl = 'http://localhost:6006/iframe.html?id=location--safe-external-navigation&viewMode=story';

test('Storybook safe-navigation story is interactive, responsive, and theme-complete', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(storyUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const locations = Array.from(document.querySelectorAll('snice-location'));
    return locations.length === 2
      && locations.every(location => location.shadowRoot?.querySelector('.location'));
  });

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const safe = page.locator('#location-story-safe');
  const blocked = page.locator('#location-story-blocked');
  await expect(safe.getByRole('link')).toBeVisible();
  await expect(blocked.getByRole('link')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));

  await page.evaluate(() => {
    const calls: Array<[string, string | undefined, string | undefined]> = [];
    (globalThis as any).__sniceLocationStoryOriginalOpen = window.open;
    (globalThis as any).__sniceLocationStoryCalls = calls;
    (globalThis as any).__sniceUnsafeLocationStory = 0;
    window.open = ((url?: string | URL, target?: string, features?: string) => {
      calls.push([String(url), target, features]);
      return null;
    }) as typeof window.open;
  });

  await safe.getByRole('link').click();
  await expect(page.locator('output')).toHaveText('location-click: Safe relative destination');
  await blocked.getByRole('link').click();
  await expect(page.locator('output')).toHaveText('location-click: Blocked unsafe destination');
  expect(await page.evaluate(() => ({
    calls: (globalThis as any).__sniceLocationStoryCalls,
    executed: (globalThis as any).__sniceUnsafeLocationStory
  }))).toEqual({
    calls: [['#location-safe-navigation', '_blank', 'noopener']],
    executed: 0
  });

  const safeLink = safe.getByRole('link');
  await page.evaluate(() => {
    document.body.tabIndex = -1;
    document.body.focus();
  });
  await page.keyboard.press('Tab');
  await expect(safeLink).toBeFocused();
  expect(await safeLink.evaluate(element => getComputedStyle(element).outlineStyle)).toBe('solid');

  await page.evaluate(() => {
    window.open = (globalThis as any).__sniceLocationStoryOriginalOpen;
    delete (globalThis as any).__sniceLocationStoryOriginalOpen;
    delete (globalThis as any).__sniceLocationStoryCalls;
    delete (globalThis as any).__sniceUnsafeLocationStory;
  });

  await page.goto(`${storyUrl}&globals=theme:light`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'light');
  await expect(page.locator('#location-story-safe').getByRole('link')).toBeVisible();
  expect(pageErrors).toEqual([]);
});
