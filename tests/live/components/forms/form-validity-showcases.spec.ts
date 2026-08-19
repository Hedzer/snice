import { expect, test, type Locator } from '@playwright/test';

const base = 'http://localhost:5566/tests/live/fixtures';

async function expectInvalidSubmissionFocus(
  control: Locator,
  anchorSelector: string
) {
  expect(await control.evaluate((element: any, selector) => ({
    delegatesFocus: element.shadowRoot?.delegatesFocus,
    host: document.activeElement === element,
    anchor: element.shadowRoot?.activeElement === element.shadowRoot?.querySelector(selector)
  }), anchorSelector)).toEqual({ delegatesFocus: true, host: true, anchor: true });
}

test('public full showcases exercise every new form-validity contract', async ({ page }) => {
  test.setTimeout(180_000);
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(`${page.url()}: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(`${page.url()}: ${message.text()}`);
  });
  await page.setViewportSize({ width: 900, height: 900 });

  await test.step('input forwards native email and required validity', async () => {
    await page.goto(`${base}/input/visual.html`, { waitUntil: 'domcontentloaded' });
    const control = page.locator('#input-contract-control');
    await expect(control.locator('.input')).toBeVisible();
    await page.locator('#input-contract-form button[type="submit"]').click();
    await expectInvalidSubmissionFocus(control, '.input');
    await expect(page.locator('#input-contract-output')).not.toHaveText('Enter a valid email, then submit.');
    expect(await control.evaluate((input: any) => ({ missing: input.validity.valueMissing, form: input.form?.id })))
      .toEqual({ missing: true, form: 'input-contract-form' });
    await control.locator('.input').fill('person@example.com');
    await page.locator('#input-contract-form button[type="submit"]').click();
    await expect(page.locator('#input-contract-output')).toHaveText('Submitted email=person@example.com');
  });

  await test.step('textarea forwards trusted minlength validity', async () => {
    await page.goto(`${base}/textarea/visual.html`, { waitUntil: 'domcontentloaded' });
    const control = page.locator('#textarea-contract-control');
    await expect(control.locator('.textarea')).toBeVisible();
    await control.locator('.textarea').fill('short');
    await page.locator('#textarea-contract-form button[type="submit"]').click();
    await expectInvalidSubmissionFocus(control, '.textarea');
    expect(await control.evaluate((textarea: any) => textarea.validity.tooShort)).toBe(true);
    await control.locator('.textarea').fill('Long enough comment');
    await page.locator('#textarea-contract-form button[type="submit"]').click();
    await expect(page.locator('#textarea-contract-output')).toHaveText('Submitted comments=Long enough comment');
  });

  await test.step('select required validity clears after customer selection', async () => {
    await page.goto(`${base}/select/visual.html`, { waitUntil: 'domcontentloaded' });
    const control = page.locator('#select-contract-control');
    await expect(control.locator('.select-trigger')).toBeVisible();
    await page.locator('#select-contract-form button[type="submit"]').click();
    await expectInvalidSubmissionFocus(control, '.select-trigger');
    expect(await control.evaluate((select: any) => select.validity.valueMissing)).toBe(true);
    await control.evaluate((select: any) => select.selectOption('emea'));
    await page.locator('#select-contract-form button[type="submit"]').click();
    await expect(page.locator('#select-contract-output')).toHaveText('Submitted region=emea');
  });

  await test.step('switch emits native change and satisfies required validity', async () => {
    await page.goto(`${base}/switch/visual.html`, { waitUntil: 'domcontentloaded' });
    const control = page.locator('#switch-contract-control');
    await expect(control.locator('.switch-input')).toBeAttached();
    await page.locator('#switch-contract-form button[type="submit"]').click();
    await expectInvalidSubmissionFocus(control, '.switch-input');
    expect(await control.evaluate((toggle: any) => toggle.validity.valueMissing)).toBe(true);
    await control.locator('.switch-track').click();
    await expect(page.locator('#switch-contract-output')).toHaveText('Changed checked=true');
    await page.locator('#switch-contract-form button[type="submit"]').click();
    await expect(page.locator('#switch-contract-output')).toHaveText('Submitted terms=accepted');
  });

  await test.step('file upload validates required, size, count, and successful files', async () => {
    await page.goto(`${base}/file-upload/visual.html`, { waitUntil: 'domcontentloaded' });
    const control = page.locator('#file-contract-control');
    const input = control.locator('.file-input');
    await expect(input).toBeAttached();
    await page.locator('#file-contract-form button[type="submit"]').click();
    await expectInvalidSubmissionFocus(control, '.file-input');
    expect(await control.evaluate((upload: any) => upload.validity.valueMissing)).toBe(true);
    await input.setInputFiles({ name: 'small.txt', mimeType: 'text/plain', buffer: Buffer.from('small') });
    await page.locator('#file-contract-form button[type="submit"]').click();
    await expect(page.locator('#file-contract-output')).toHaveText('Submitted 1 file(s): small.txt');
    await input.setInputFiles({ name: 'large.txt', mimeType: 'text/plain', buffer: Buffer.alloc(3000) });
    expect(await control.evaluate((upload: any) => ({ invalid: !upload.checkValidity(), message: upload.validationMessage })))
      .toEqual({ invalid: true, message: 'File "large.txt" exceeds the maximum size.' });
  });

  await test.step('color picker preserves malformed text and submits canonical color', async () => {
    await page.goto(`${base}/color-picker/visual.html`, { waitUntil: 'domcontentloaded' });
    const control = page.locator('#color-contract-control');
    const input = control.locator('.color-input');
    await expect(input).toBeVisible();
    await page.locator('#color-contract-form button[type="submit"]').click();
    await expectInvalidSubmissionFocus(control, '.color-input');
    expect(await control.evaluate((picker: any) => picker.validity.valueMissing)).toBe(true);
    await page.locator('#color-contract-malformed').click();
    expect(await control.evaluate((picker: any) => ({ value: picker.value, badInput: picker.validity.badInput })))
      .toEqual({ value: 'rgb(300, 0, 0)', badInput: true });
    await input.fill('rgb(18, 52, 86)');
    await page.locator('#color-contract-form button[type="submit"]').click();
    await expect(page.locator('#color-contract-output')).toHaveText('Submitted brand-color=#123456');
  });

  for (const numeric of [
    { component: 'slider', control: '#slider-contract-control', form: '#slider-contract-form', output: '#slider-contract-output', name: 'rating', value: '3', error: '#slider-contract-error' },
    { component: 'range-slider', control: '#range-contract-control', form: '#range-contract-form', output: '#range-contract-output', name: 'budget', value: '3,9', error: '#range-contract-error' },
    { component: 'step-input', control: '#step-contract-control', form: '#step-contract-form', output: '#step-contract-output', name: 'seats', value: '3', error: '#step-contract-error' }
  ]) {
    await test.step(`${numeric.component} normalizes and reports custom form errors`, async () => {
      await page.goto(`${base}/${numeric.component}/visual.html`, { waitUntil: 'domcontentloaded' });
      const control = page.locator(numeric.control);
      await control.waitFor({ state: 'attached' });
      await page.waitForFunction(selector => typeof (document.querySelector(selector) as any)?.checkValidity === 'function', numeric.control);
      expect(await control.evaluate((element: any) => ({ value: new FormData(element.form).get(element.name), valid: element.checkValidity() })))
        .toEqual({ value: numeric.value, valid: true });
      await page.locator(`${numeric.form} button[type="submit"]`).click();
      await expect(page.locator(numeric.output)).toContainText(`Submitted ${numeric.name}=${numeric.value}`);
      await page.locator(numeric.error).click();
      expect(await control.evaluate((element: any) => ({ custom: element.validity.customError, formValid: element.form.checkValidity() })))
        .toEqual({ custom: true, formValid: false });
      await page.locator(numeric.error).click();
      expect(await control.evaluate((element: any) => element.checkValidity())).toBe(true);
    });
  }

  await test.step('tag input exposes aggregate constraint failures and JSON submission', async () => {
    await page.goto(`${base}/tag-input/visual.html`, { waitUntil: 'domcontentloaded' });
    const control = page.locator('#tag-contract-control');
    await expect(control.locator('.tag-input-container')).toBeVisible();
    await page.locator('#tag-contract-overflow').click();
    expect(await control.evaluate((tags: any) => ({ tooLong: tags.validity.tooLong, valid: tags.form.checkValidity() })))
      .toEqual({ tooLong: true, valid: false });
    await control.evaluate((tags: any) => { tags.value = ['HTML', 'CSS']; });
    await page.locator('#tag-contract-form button[type="submit"]').click();
    await expect(page.locator('#tag-contract-output')).toHaveText('Submitted skills=["HTML","CSS"]');
    await page.locator('#tag-contract-duplicates').click();
    expect(await control.evaluate((tags: any) => tags.validity.customError)).toBe(true);
  });

  await test.step('every validity contract remains inside a mobile viewport', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const component of [
      'input', 'textarea', 'select', 'switch', 'file-upload',
      'color-picker', 'slider', 'range-slider', 'step-input', 'tag-input'
    ]) {
      await page.goto(`${base}/${component}/visual.html`, { waitUntil: 'domcontentloaded' });
      await page.locator('.contract-form').waitFor({ state: 'visible' });
      expect(await page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth
      })), component).toEqual({ client: 390, scroll: 390 });
    }
  });

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
