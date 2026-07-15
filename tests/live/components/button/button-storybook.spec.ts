import { expect, test } from '@playwright/test';

const storyUrl = 'http://localhost:6006/iframe.html?id=button--link-buttons&viewMode=story';

test('Storybook link-button story is isolated, interactive, responsive, and theme-complete', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(storyUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const buttons = Array.from(document.querySelectorAll('snice-button'));
    return buttons.length === 5
      && buttons.every(button => button.shadowRoot?.querySelector('button'));
  });

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByText('Same-context navigation stays in place')).toBeVisible();
  for (const id of [
    'button-story-same-context',
    'button-story-blank',
    'button-story-named',
    'button-story-download',
    'button-story-blocked'
  ]) {
    await expect(page.locator(`#${id}`).getByRole('button')).toBeVisible();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));

  await page.evaluate(() => {
    const calls: Array<[string, string | undefined, string | undefined]> = [];
    (globalThis as any).__sniceButtonStoryOriginalOpen = window.open;
    (globalThis as any).__sniceButtonStoryCalls = calls;
    (globalThis as any).__sniceUnsafeButtonStory = false;
    window.open = ((url?: string | URL, target?: string, features?: string) => {
      calls.push([String(url), target, features]);
      return null;
    }) as typeof window.open;
  });

  await page.locator('#button-story-blank').getByRole('button').click();
  await expect(page.locator('output')).toHaveText('button-click: Isolated blank target');
  await page.locator('#button-story-named').getByRole('button').click();
  await expect(page.locator('output')).toHaveText('button-click: Isolated named target');
  await page.locator('#button-story-blocked').getByRole('button').click();
  await expect(page.locator('output')).toHaveText('button-click: Isolated named target');
  expect(await page.evaluate(() => ({
    calls: (globalThis as any).__sniceButtonStoryCalls,
    executed: (globalThis as any).__sniceUnsafeButtonStory
  }))).toEqual({
    calls: [
      ['#button-story-blank-target', '_blank', 'noopener'],
      ['#button-story-named-target', 'snice-button-story-window', 'noopener']
    ],
    executed: false
  });

  await page.evaluate(() => {
    window.open = (globalThis as any).__sniceButtonStoryOriginalOpen;
    delete (globalThis as any).__sniceButtonStoryOriginalOpen;
    delete (globalThis as any).__sniceButtonStoryCalls;
  });

  const namedPromise = page.context().waitForEvent('page');
  await page.locator('#button-story-named').getByRole('button').click();
  const named = await namedPromise;
  await named.waitForLoadState('domcontentloaded');
  expect(await named.evaluate(() => window.opener === null)).toBe(true);
  expect(new URL(named.url()).hash).toBe('#button-story-named-target');
  await named.close();

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#button-story-download').getByRole('button').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('snice-logo.png');
  await expect(page.locator('output')).toHaveText('button-click: Download without popup');

  const sameContext = page.locator('#button-story-same-context').getByRole('button');
  await page.evaluate(() => {
    document.body.tabIndex = -1;
    document.body.focus();
  });
  await page.keyboard.press('Tab');
  await expect(sameContext).toBeFocused();
  expect(await sameContext.evaluate(element => ({
    focusVisible: element.matches(':focus-visible'),
    boxShadow: getComputedStyle(element).boxShadow
  }))).toEqual(expect.objectContaining({ focusVisible: true }));
  expect(await sameContext.evaluate(element => getComputedStyle(element).boxShadow)).not.toBe('none');
  await page.keyboard.press('Enter');
  await expect.poll(() => new URL(page.url()).hash).toBe('#button-story-same-context');
  await expect(page.locator('output')).toHaveText('button-click: Same context');

  await page.goto(`${storyUrl}&globals=theme:light`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'light');
  await expect(page.locator('#button-story-blank').getByRole('button')).toBeVisible();
  expect(pageErrors).toEqual([]);
});
