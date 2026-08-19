import { expect, test, type Page } from '@playwright/test';

const demoPath = '/tests/live/fixtures/checkbox/visual.html';

async function openShowcase(page: Page, pageErrors: string[]) {
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(demoPath, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const checkboxes = Array.from(document.querySelectorAll('snice-checkbox'));
    return checkboxes.length === 35
      && checkboxes.every(checkbox => checkbox.shadowRoot?.querySelector('input[type="checkbox"]'));
  });
}

test.describe('Snice Checkbox full showcase', () => {
  test('renders the complete state, size, form, and event catalog', async ({ page }) => {
    const pageErrors: string[] = [];
    await openShowcase(page, pageErrors);

    const result = await page.evaluate(() => {
      const checkboxes = Array.from(document.querySelectorAll('snice-checkbox')) as Array<HTMLElement & {
        checked: boolean;
        defaultChecked: boolean;
        indeterminate: boolean;
      }>;
      const input = (checkbox: HTMLElement) => checkbox.shadowRoot!.querySelector('input') as HTMLInputElement;
      const visual = (checkbox: HTMLElement) => checkbox.shadowRoot!.querySelector('.checkbox') as HTMLElement;
      const byLabel = (label: string) => checkboxes.find(checkbox => checkbox.getAttribute('label') === label)!;

      return {
        total: checkboxes.length,
        rendered: checkboxes.filter(checkbox => input(checkbox)).length,
        headings: Array.from(document.querySelectorAll('h2')).map(heading => heading.textContent?.trim()),
        sizes: ['small', 'medium', 'large'].map(size => ({
          size,
          authored: checkboxes.filter(checkbox => (checkbox.getAttribute('size') || 'medium') === size).length,
          rendered: checkboxes.filter(checkbox => visual(checkbox).classList.contains(`checkbox--${size}`)).length
        })),
        checkedDefaults: checkboxes.filter(checkbox => checkbox.hasAttribute('checked')).map(checkbox => ({
          checked: checkbox.checked,
          defaultChecked: checkbox.defaultChecked,
          inputChecked: input(checkbox).checked
        })),
        indeterminate: checkboxes.filter(checkbox => checkbox.hasAttribute('indeterminate')).map(checkbox => ({
          property: checkbox.indeterminate,
          input: input(checkbox).indeterminate,
          aria: input(checkbox).getAttribute('aria-checked'),
          visual: visual(checkbox).classList.contains('checkbox--indeterminate')
        })),
        disabled: checkboxes.filter(checkbox => checkbox.hasAttribute('disabled')).map(checkbox => ({
          input: input(checkbox).disabled,
          wrapper: Boolean(checkbox.shadowRoot!.querySelector('.checkbox-wrapper--disabled'))
        })),
        loading: checkboxes.filter(checkbox => checkbox.hasAttribute('loading')).map(checkbox => ({
          input: input(checkbox).disabled,
          spinner: Boolean(checkbox.shadowRoot!.querySelector('[part="spinner"]')),
          wrapper: Boolean(checkbox.shadowRoot!.querySelector('.checkbox-wrapper--loading'))
        })),
        required: {
          input: input(byLabel('Required field')).required,
          marker: getComputedStyle(
            byLabel('Required field').shadowRoot!.querySelector('.checkbox-label')!,
            '::after'
          ).content
        },
        invalid: checkboxes.filter(checkbox => checkbox.hasAttribute('invalid')).map(checkbox => ({
          className: visual(checkbox).classList.contains('checkbox--invalid'),
          aria: input(checkbox).getAttribute('aria-invalid')
        })),
        parts: checkboxes.every(checkbox =>
          checkbox.shadowRoot!.querySelector('[part="input"]')
          && checkbox.shadowRoot!.querySelector('[part="checkbox"]')
          && (!checkbox.getAttribute('label') || checkbox.shadowRoot!.querySelector('[part="label"]'))
        ),
        formDemo: Boolean(document.querySelector('#checkbox-showcase-form')),
        eventDemo: Boolean(document.querySelector('#checkbox-showcase-events')),
        positiveBoxes: checkboxes.every(checkbox => {
          const rect = checkbox.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        }),
        viewport: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth
      };
    });

    expect(result.total).toBe(35);
    expect(result.rendered).toBe(result.total);
    expect(result.headings).toEqual([
      'Default (unchecked)',
      'Checked',
      'Indeterminate',
      'Sizes',
      'Sizes x Checked',
      'Sizes x Indeterminate',
      'Disabled',
      'Loading',
      'Loading x Sizes',
      'Required',
      'Invalid',
      'Required + Invalid',
      'No label',
      'Long label',
      'Single character label',
      'Native form integration, validation, reset, and fieldset rules',
      'Activation event order'
    ]);
    expect(result.sizes.every(entry => entry.authored > 0 && entry.authored === entry.rendered)).toBe(true);
    expect(result.checkedDefaults.length).toBeGreaterThan(0);
    expect(result.checkedDefaults.every(state => state.checked && state.defaultChecked && state.inputChecked)).toBe(true);
    expect(result.indeterminate.length).toBeGreaterThan(0);
    expect(result.indeterminate.every(state =>
      state.property && state.input && state.aria === 'mixed' && state.visual
    )).toBe(true);
    expect(result.disabled.length).toBeGreaterThan(0);
    expect(result.disabled.every(state => state.input && state.wrapper)).toBe(true);
    expect(result.loading.length).toBeGreaterThan(0);
    expect(result.loading.every(state => state.input && state.spinner && state.wrapper)).toBe(true);
    expect(result.required.input).toBe(true);
    expect(result.required.marker).toContain('*');
    expect(result.invalid.every(state => state.className && state.aria === 'true')).toBe(true);
    expect(result.parts).toBe(true);
    expect(result.formDemo).toBe(true);
    expect(result.eventDemo).toBe(true);
    expect(result.positiveBoxes).toBe(true);
    expect(result.scroll).toBeLessThanOrEqual(result.viewport);
    expect(pageErrors).toEqual([]);
  });

  test('drives the public form example through validation, submission, and reset', async ({ page }) => {
    const pageErrors: string[] = [];
    await openShowcase(page, pageErrors);

    const form = page.locator('#checkbox-showcase-form');
    const terms = page.locator('#checkbox-showcase-terms');
    const digest = page.locator('#checkbox-showcase-digest');
    const legend = page.locator('#checkbox-showcase-legend');
    const fieldset = page.locator('#checkbox-showcase-fieldset');
    const status = page.locator('#checkbox-form-status');

    expect(await form.evaluate((element: HTMLFormElement) => ({
      valid: element.checkValidity(),
      entries: Array.from(new FormData(element).entries()).map(([name, value]) => [name, String(value)])
    }))).toEqual({
      valid: false,
      entries: [['digest', 'weekly'], ['legend-choice', 'kept']]
    });
    expect(await fieldset.evaluate((checkbox: any) => ({
      authoredDisabled: checkbox.disabled,
      disabledAttribute: checkbox.hasAttribute('disabled'),
      effectiveDisabled: checkbox.matches(':disabled'),
      inputDisabled: checkbox.shadowRoot.querySelector('input').disabled,
      willValidate: checkbox.willValidate
    }))).toEqual({
      authoredDisabled: false,
      disabledAttribute: false,
      effectiveDisabled: true,
      inputDisabled: true,
      willValidate: false
    });
    expect(await legend.evaluate((checkbox: any) => ({
      effectiveDisabled: checkbox.matches(':disabled'),
      inputDisabled: checkbox.shadowRoot.querySelector('input').disabled
    }))).toEqual({ effectiveDisabled: false, inputDisabled: false });

    await form.getByRole('button', { name: 'Submit form' }).click();
    await expect(status).toHaveText('Ready — submit to inspect FormData.');
    await expect(terms.getByRole('checkbox')).toBeFocused();

    await terms.getByRole('checkbox').click();
    await form.getByRole('button', { name: 'Submit form' }).click();
    await expect(status).toHaveText(
      'Submitted: terms=accepted, digest=weekly, legend-choice=kept'
    );

    await digest.getByRole('checkbox').click();
    await form.getByRole('button', { name: 'Submit form' }).click();
    await expect(status).toHaveText('Submitted: terms=accepted, legend-choice=kept');

    await digest.evaluate((checkbox: any) => { checkbox.indeterminate = true; });
    await form.getByRole('button', { name: 'Reset defaults' }).click();
    await expect(status).toHaveText('Reset: digest=weekly, legend-choice=kept');
    expect(await page.evaluate(() => {
      const terms = document.querySelector('#checkbox-showcase-terms') as any;
      const digest = document.querySelector('#checkbox-showcase-digest') as any;
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
    expect(pageErrors).toEqual([]);
  });

  test('keeps event order, blocked interaction, focus, themes, and mobile layout working', async ({ page }) => {
    const pageErrors: string[] = [];
    await openShowcase(page, pageErrors);

    const eventCheckbox = page.locator('#checkbox-showcase-events');
    const eventInput = eventCheckbox.getByRole('checkbox');
    const eventStatus = page.locator('#checkbox-event-status');
    await eventInput.click();
    await expect(eventStatus).toHaveText('input → change → checkbox-change; checked=true');

    await eventCheckbox.evaluate((checkbox: any) => { checkbox.indeterminate = true; });
    await eventInput.focus();
    await page.keyboard.press('Space');
    await expect(eventStatus).toHaveText('input → change → checkbox-change; checked=false');
    expect(await eventCheckbox.evaluate((checkbox: any) => checkbox.indeterminate)).toBe(false);

    await page.getByText('External label activation', { exact: true }).click();
    await expect(eventStatus).toHaveText('input → change → checkbox-change; checked=true');

    const blocked = await page.evaluate(() => {
      const disabled = Array.from(document.querySelectorAll('snice-checkbox'))
        .find(checkbox => checkbox.getAttribute('label') === 'Disabled unchecked') as any;
      const loading = Array.from(document.querySelectorAll('snice-checkbox'))
        .find(checkbox => checkbox.getAttribute('label') === 'Loading') as any;
      const events = { disabled: 0, loading: 0 };
      disabled.addEventListener('checkbox-change', () => events.disabled++);
      loading.addEventListener('checkbox-change', () => events.loading++);
      disabled.click();
      disabled.toggle();
      loading.click();
      loading.toggle();
      return { events, disabledChecked: disabled.checked, loadingChecked: loading.checked };
    });
    expect(blocked).toEqual({
      events: { disabled: 0, loading: 0 },
      disabledChecked: false,
      loadingChecked: false
    });

    await page.locator('#checkbox-showcase-form button[type="reset"]').focus();
    await page.keyboard.press('Tab');
    await expect(eventInput).toBeFocused();
    await expect.poll(() => eventCheckbox.locator('.checkbox').evaluate(element => {
      const style = getComputedStyle(element);
      return parseFloat(style.outlineWidth) > 0 && style.boxShadow !== 'none';
    })).toBe(true);
    const focus = await eventCheckbox.locator('.checkbox').evaluate(element => {
      const style = getComputedStyle(element);
      return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth, boxShadow: style.boxShadow };
    });
    expect(focus.outlineStyle).toBe('solid');
    expect(parseFloat(focus.outlineWidth)).toBeGreaterThan(0);
    expect(focus.boxShadow).not.toBe('none');

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.evaluate(() => window.postMessage({ type: 'snice-theme', theme: 'light' }, '*'));
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(eventCheckbox).toBeVisible();
    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-theme');
      for (const stylesheet of document.querySelectorAll('link[rel="stylesheet"]')) {
        if ((stylesheet as HTMLLinkElement).href.includes('/theme/theme.css')) stylesheet.remove();
      }
    });
    await expect(page.locator('html')).not.toHaveAttribute('data-theme');
    await expect(eventCheckbox).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    const mobile = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
      maxRight: Math.max(...Array.from(document.querySelectorAll('snice-checkbox'))
        .map(checkbox => checkbox.getBoundingClientRect().right)),
      minLeft: Math.min(...Array.from(document.querySelectorAll('snice-checkbox'))
        .map(checkbox => checkbox.getBoundingClientRect().left))
    }));
    expect(mobile.scroll).toBeLessThanOrEqual(mobile.viewport);
    expect(mobile.maxRight).toBeLessThanOrEqual(mobile.viewport + 1);
    expect(mobile.minLeft).toBeGreaterThanOrEqual(0);
    expect(pageErrors).toEqual([]);
  });
});
