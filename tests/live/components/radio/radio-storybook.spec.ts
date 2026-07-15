import { expect, test } from '@playwright/test';

const storyUrl = 'http://localhost:6006/iframe.html?id=radio--form-integration&viewMode=story';

test('Storybook radio form story is native, interactive, responsive, and theme-complete', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(storyUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const radios = Array.from(document.querySelectorAll('snice-radio'));
    return radios.length === 4
      && radios.every(radio => radio.shadowRoot?.querySelector('input[type="radio"]'));
  });

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));

  const form = page.locator('#radio-story-form');
  const basic = page.locator('#radio-story-basic');
  const pro = page.locator('#radio-story-pro');
  const legend = page.locator('#radio-story-legend');
  const fieldset = page.locator('#radio-story-fieldset');
  const output = form.locator('output');

  expect(await form.evaluate((element: HTMLFormElement) => ({
    valid: element.checkValidity(),
    entries: Array.from(new FormData(element).entries()).map(([name, value]) => [name, String(value)])
  }))).toEqual({
    valid: true,
    entries: [['plan', 'pro'], ['legend-plan', 'kept']]
  });
  expect(await fieldset.evaluate((radio: any) => ({
    authoredDisabled: radio.disabled,
    effectiveDisabled: radio.matches(':disabled'),
    inputDisabled: radio.shadowRoot.querySelector('input').disabled,
    willValidate: radio.willValidate
  }))).toEqual({
    authoredDisabled: false,
    effectiveDisabled: true,
    inputDisabled: true,
    willValidate: false
  });
  expect(await legend.evaluate((radio: any) => radio.matches(':disabled'))).toBe(false);

  await form.getByRole('button', { name: 'Submit' }).click();
  await expect(output).toHaveText('Submitted: plan=pro, legend-plan=kept');

  await basic.locator('.radio-label').click();
  await form.getByRole('button', { name: 'Submit' }).click();
  await expect(output).toHaveText('Submitted: plan=basic, legend-plan=kept');
  expect(await page.evaluate(() => [
    (document.querySelector('#radio-story-basic') as any).checked,
    (document.querySelector('#radio-story-pro') as any).checked
  ])).toEqual([true, false]);

  await form.getByRole('button', { name: 'Reset defaults' }).click();
  await expect(output).toHaveText('Reset: plan=pro, legend-plan=kept');
  expect(await page.evaluate(() => {
    const basic = document.querySelector('#radio-story-basic') as any;
    const pro = document.querySelector('#radio-story-pro') as any;
    return {
      checked: [basic.checked, pro.checked],
      defaults: [basic.defaultChecked, pro.defaultChecked]
    };
  })).toEqual({ checked: [false, true], defaults: [false, true] });

  await page.goto(`${storyUrl}&globals=theme:light`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'light');
  await expect(page.locator('#radio-story-basic')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
  expect(pageErrors).toEqual([]);
});
