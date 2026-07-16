import { expect, test } from '@playwright/test';

const storyUrl = 'http://localhost:6006/iframe.html?id=button--disabled-fieldset-lifecycle&viewMode=story';

test('Storybook button fieldset story preserves native disabled behavior, themes, and mobile layout', async ({ page }) => {
  test.setTimeout(120_000);
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(storyUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const buttons = Array.from(document.querySelectorAll('snice-button'));
    return buttons.length === 6 && buttons.every(button => button.shadowRoot?.querySelector('button'));
  });

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const legend = page.locator('#button-story-legend').getByRole('button');
  const ordinaryHost = page.locator('#button-story-ordinary');
  await expect(legend).toBeEnabled();
  await expect(ordinaryHost).not.toHaveAttribute('disabled');
  await expect(ordinaryHost.getByRole('button')).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));

  await legend.click();
  await expect(page.locator('output')).toHaveText('First legend action accepted.');
  await page.locator('#button-story-toggle').getByRole('button').click();
  await expect(ordinaryHost.getByRole('button')).toBeEnabled();
  await ordinaryHost.getByRole('button').click();
  await expect(page.locator('output')).toHaveText('Fieldset body actions are enabled.');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.locator('output')).toHaveText('Submitted.');
  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(page.locator('output')).toHaveText('Reset.');
  await page.locator('#button-story-toggle').getByRole('button').click();
  await expect(ordinaryHost.getByRole('button')).toBeDisabled();

  await page.goto(`${storyUrl}&globals=theme:light`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'light');
  await expect(page.locator('#button-story-legend')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
