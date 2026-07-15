import { expect, test } from '@playwright/test';

const storyUrl = 'http://localhost:6006/iframe.html?id=checkbox--form-integration&viewMode=story';

test('Storybook checkbox form story is native, interactive, responsive, and theme-complete', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(storyUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const checkboxes = Array.from(document.querySelectorAll('snice-checkbox'));
    return checkboxes.length === 4
      && checkboxes.every(checkbox => checkbox.shadowRoot?.querySelector('input[type="checkbox"]'));
  });

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));

  const form = page.locator('#checkbox-story-form');
  const terms = page.locator('#checkbox-story-terms');
  const digest = page.locator('#checkbox-story-digest');
  const legend = page.locator('#checkbox-story-legend');
  const fieldset = page.locator('#checkbox-story-fieldset');
  const output = form.locator('output');

  expect(await form.evaluate((element: HTMLFormElement) => ({
    valid: element.checkValidity(),
    entries: Array.from(new FormData(element).entries()).map(([name, value]) => [name, String(value)])
  }))).toEqual({
    valid: false,
    entries: [['digest', 'weekly'], ['legend-choice', 'kept']]
  });
  expect(await fieldset.evaluate((checkbox: any) => ({
    authoredDisabled: checkbox.disabled,
    effectiveDisabled: checkbox.matches(':disabled'),
    inputDisabled: checkbox.shadowRoot.querySelector('input').disabled,
    willValidate: checkbox.willValidate
  }))).toEqual({
    authoredDisabled: false,
    effectiveDisabled: true,
    inputDisabled: true,
    willValidate: false
  });
  expect(await legend.evaluate((checkbox: any) => checkbox.matches(':disabled'))).toBe(false);

  await form.getByRole('button', { name: 'Submit' }).click();
  await expect(output).toHaveText('Ready');
  await terms.getByRole('checkbox').click();
  await form.getByRole('button', { name: 'Submit' }).click();
  await expect(output).toHaveText(
    'Submitted: terms=accepted, digest=weekly, legend-choice=kept'
  );

  await digest.getByRole('checkbox').click();
  await form.getByRole('button', { name: 'Submit' }).click();
  await expect(output).toHaveText('Submitted: terms=accepted, legend-choice=kept');

  await digest.evaluate((checkbox: any) => { checkbox.indeterminate = true; });
  await form.getByRole('button', { name: 'Reset defaults' }).click();
  await expect(output).toHaveText('Reset: digest=weekly, legend-choice=kept');
  expect(await page.evaluate(() => {
    const terms = document.querySelector('#checkbox-story-terms') as any;
    const digest = document.querySelector('#checkbox-story-digest') as any;
    return {
      terms: terms.checked,
      digest: digest.checked,
      digestDefault: digest.defaultChecked,
      digestIndeterminate: digest.indeterminate
    };
  })).toEqual({
    terms: false,
    digest: true,
    digestDefault: true,
    digestIndeterminate: true
  });

  await page.goto(`${storyUrl}&globals=theme:light`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'light');
  await expect(page.locator('#checkbox-story-terms').getByRole('checkbox')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
  expect(pageErrors).toEqual([]);
});
