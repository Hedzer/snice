import { expect, test, type Page } from '@playwright/test';

const demoPath = '/tests/live/fixtures/radio/visual.html';

async function openShowcase(page: Page, pageErrors: string[]) {
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(demoPath, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const radios = Array.from(document.querySelectorAll('snice-radio'));
    return radios.length === 51
      && radios.every(radio => radio.shadowRoot?.querySelector('input[type="radio"]'));
  });
}

test.describe('Snice Radio full showcase', () => {
  test('renders the complete variant, state, form, and event catalog', async ({ page }) => {
    const pageErrors: string[] = [];
    await openShowcase(page, pageErrors);

    const result = await page.evaluate(() => {
      const radios = Array.from(document.querySelectorAll('snice-radio')) as Array<HTMLElement & {
        checked: boolean;
        defaultChecked: boolean;
      }>;
      const input = (radio: HTMLElement) => radio.shadowRoot!.querySelector('input') as HTMLInputElement;
      const visual = (radio: HTMLElement) => radio.shadowRoot!.querySelector('.radio') as HTMLElement;
      const byLabel = (label: string) => radios.find(radio => radio.getAttribute('label') === label)!;

      return {
        total: radios.length,
        rendered: radios.filter(radio => input(radio)).length,
        headings: Array.from(document.querySelectorAll('h2')).map(heading => heading.textContent?.trim()),
        sizes: ['small', 'medium', 'large'].map(size => ({
          size,
          authored: radios.filter(radio => (radio.getAttribute('size') || 'medium') === size).length,
          rendered: radios.filter(radio => visual(radio).classList.contains(`radio--${size}`)).length
        })),
        checkedDefaults: radios.filter(radio => radio.hasAttribute('checked')).map(radio => ({
          checked: radio.checked,
          defaultChecked: radio.defaultChecked,
          inputChecked: input(radio).checked
        })),
        disabled: radios.filter(radio => radio.hasAttribute('disabled')).map(radio => ({
          input: input(radio).disabled,
          wrapper: Boolean(radio.shadowRoot!.querySelector('.radio-wrapper--disabled'))
        })),
        loading: radios.filter(radio => radio.hasAttribute('loading')).map(radio => ({
          input: input(radio).disabled,
          spinner: Boolean(radio.shadowRoot!.querySelector('[part="spinner"]')),
          wrapper: Boolean(radio.shadowRoot!.querySelector('.radio-wrapper--loading'))
        })),
        required: {
          ownInput: input(byLabel('Required field')).required,
          groupInputs: ['Basic', 'Pro'].map(label => input(byLabel(label)).required),
          marker: getComputedStyle(
            byLabel('Required field').shadowRoot!.querySelector('.radio-label')!,
            '::after'
          ).content
        },
        invalid: radios.filter(radio => radio.hasAttribute('invalid')).map(radio => ({
          className: visual(radio).classList.contains('radio--invalid'),
          aria: input(radio).getAttribute('aria-invalid')
        })),
        blocks: radios.filter(radio => radio.getAttribute('variant') === 'block').map(radio => ({
          wrapper: Boolean(radio.shadowRoot!.querySelector('.radio-wrapper--block')),
          content: Boolean(radio.shadowRoot!.querySelector('[part="content"]'))
        })),
        parts: radios.every(radio =>
          radio.shadowRoot!.querySelector('[part="input"]')
          && radio.shadowRoot!.querySelector('[part="radio"]')
          && (!radio.getAttribute('label') || radio.shadowRoot!.querySelector('[part="label"]'))
        ),
        formDemo: Boolean(document.querySelector('#radio-showcase-form')),
        eventDemo: Boolean(document.querySelector('#radio-showcase-event-a')),
        positiveBoxes: radios.every(radio => {
          const rect = radio.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        }),
        viewport: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth
      };
    });

    expect(result.total).toBe(51);
    expect(result.rendered).toBe(result.total);
    expect(result.headings).toEqual([
      'Variant: default',
      'Variant: block',
      'Size: small',
      'Size: medium (default)',
      'Size: large',
      'All sizes',
      'Checked: true',
      'Checked: false',
      'Disabled',
      'Loading',
      'Required',
      'Invalid',
      'No label',
      'Block variant with description',
      'Block variant: disabled',
      'Block variant: loading',
      'Block variant: sizes',
      'Suffix slot (block variant)',
      'State matrix: size x disabled/loading/invalid',
      'Native form integration, group validation, reset, and fieldset rules',
      'Activation event order and arrow navigation'
    ]);
    expect(result.sizes.every(entry => entry.authored > 0 && entry.authored === entry.rendered)).toBe(true);
    expect(result.checkedDefaults.length).toBeGreaterThan(0);
    expect(result.checkedDefaults.every(state => state.checked && state.defaultChecked && state.inputChecked)).toBe(true);
    expect(result.disabled.length).toBeGreaterThan(0);
    expect(result.disabled.every(state => state.input && state.wrapper)).toBe(true);
    expect(result.loading.length).toBeGreaterThan(0);
    expect(result.loading.every(state => state.input && state.spinner && state.wrapper)).toBe(true);
    expect(result.required.ownInput).toBe(true);
    expect(result.required.groupInputs).toEqual([true, true]);
    expect(result.required.marker).toContain('*');
    expect(result.invalid.every(state => state.className && state.aria === 'true')).toBe(true);
    expect(result.blocks.length).toBeGreaterThan(0);
    expect(result.blocks.every(state => state.wrapper && state.content)).toBe(true);
    expect(result.parts).toBe(true);
    expect(result.formDemo).toBe(true);
    expect(result.eventDemo).toBe(true);
    expect(result.positiveBoxes).toBe(true);
    expect(result.scroll).toBeLessThanOrEqual(result.viewport);
    expect(pageErrors).toEqual([]);
  });

  test('drives the public form example through group validation, submission, and reset', async ({ page }) => {
    const pageErrors: string[] = [];
    await openShowcase(page, pageErrors);

    const form = page.locator('#radio-showcase-form');
    const basic = page.locator('#radio-showcase-basic');
    const pro = page.locator('#radio-showcase-pro');
    const legend = page.locator('#radio-showcase-legend');
    const fieldset = page.locator('#radio-showcase-fieldset');
    const status = page.locator('#radio-form-status');

    expect(await form.evaluate((element: HTMLFormElement) => ({
      valid: element.checkValidity(),
      entries: Array.from(new FormData(element).entries()).map(([name, value]) => [name, String(value)])
    }))).toEqual({
      valid: false,
      entries: [['legend-plan', 'kept']]
    });
    expect(await basic.evaluate((radio: any) => ({
      missing: radio.validity.valueMissing,
      checked: radio.checked
    }))).toEqual({ missing: true, checked: false });
    expect(await pro.evaluate((radio: any) => radio.validity.valueMissing)).toBe(true);
    expect(await fieldset.evaluate((radio: any) => ({
      authoredDisabled: radio.disabled,
      disabledAttribute: radio.hasAttribute('disabled'),
      effectiveDisabled: radio.matches(':disabled'),
      inputDisabled: radio.shadowRoot.querySelector('input').disabled,
      willValidate: radio.willValidate
    }))).toEqual({
      authoredDisabled: false,
      disabledAttribute: false,
      effectiveDisabled: true,
      inputDisabled: true,
      willValidate: false
    });
    expect(await legend.evaluate((radio: any) => ({
      effectiveDisabled: radio.matches(':disabled'),
      inputDisabled: radio.shadowRoot.querySelector('input').disabled
    }))).toEqual({ effectiveDisabled: false, inputDisabled: false });

    await form.getByRole('button', { name: 'Submit form' }).click();
    await expect(status).toHaveText('Ready — choose a plan and submit.');
    expect(await basic.evaluate((radio: any) => radio.shadowRoot.activeElement === radio.shadowRoot.querySelector('input'))).toBe(true);
    await page.keyboard.press('Escape');

    // Firefox keeps its native validation popup open after the rejected
    // submit, which prevents Playwright's pointer action from completing.
    // Exercise the component's public native-activation method for this step;
    // pointer and external-label activation are covered below and in the
    // source/built/CDN interaction matrix.
    await pro.evaluate((radio: any) => radio.click());
    await form.getByRole('button', { name: 'Submit form' }).click();
    await expect(status).toHaveText('Submitted: plan=pro, legend-plan=kept');
    expect(await page.evaluate(() => [
      (document.querySelector('#radio-showcase-basic') as any).checked,
      (document.querySelector('#radio-showcase-pro') as any).checked
    ])).toEqual([false, true]);

    await basic.locator('.radio-label').click();
    await form.getByRole('button', { name: 'Submit form' }).click();
    await expect(status).toHaveText('Submitted: plan=basic, legend-plan=kept');

    await form.getByRole('button', { name: 'Reset defaults' }).click();
    await expect(status).toHaveText('Reset: legend-plan=kept');
    expect(await page.evaluate(() => {
      const basic = document.querySelector('#radio-showcase-basic') as any;
      const pro = document.querySelector('#radio-showcase-pro') as any;
      return {
        checked: [basic.checked, pro.checked],
        defaults: [basic.defaultChecked, pro.defaultChecked],
        missing: [basic.validity.valueMissing, pro.validity.valueMissing]
      };
    })).toEqual({
      checked: [false, false],
      defaults: [false, false],
      missing: [true, true]
    });
    expect(pageErrors).toEqual([]);
  });

  test('keeps events, arrows, labels, blocked states, themes, and mobile layout working', async ({ page }) => {
    const pageErrors: string[] = [];
    await openShowcase(page, pageErrors);

    const eventA = page.locator('#radio-showcase-event-a');
    const eventB = page.locator('#radio-showcase-event-b');
    const status = page.locator('#radio-event-status');

    await eventB.locator('.radio-label').click();
    await expect(status).toHaveText('input → change → radio-change; value=b');

    await eventB.evaluate((radio: any) => radio.focus());
    await page.keyboard.press('ArrowLeft');
    await expect(status).toHaveText('input → change → radio-change; value=a');
    expect(await page.evaluate(() => (document.activeElement as HTMLElement)?.id)).toBe('radio-showcase-event-a');
    await expect.poll(() => eventA.locator('.radio').evaluate(element => {
      const style = getComputedStyle(element);
      return parseFloat(style.outlineWidth) > 0 && style.boxShadow !== 'none';
    })).toBe(true);

    await page.getByText('Select Event B through an external label', { exact: true }).click();
    await expect(status).toHaveText('input → change → radio-change; value=b');
    expect(await eventB.evaluate((radio: any) => radio.shadowRoot.activeElement === radio.shadowRoot.querySelector('input'))).toBe(true);

    const blocked = await page.evaluate(() => {
      const radios = Array.from(document.querySelectorAll('snice-radio')) as any[];
      const disabled = radios.find(radio => radio.getAttribute('label') === 'Disabled unchecked');
      const loading = radios.find(radio => radio.getAttribute('label') === 'Loading unchecked');
      const events = { disabled: 0, loading: 0 };
      disabled.addEventListener('radio-change', () => events.disabled++);
      loading.addEventListener('radio-change', () => events.loading++);
      disabled.click();
      disabled.select();
      loading.click();
      loading.select();
      return { events, disabledChecked: disabled.checked, loadingChecked: loading.checked };
    });
    expect(blocked).toEqual({
      events: { disabled: 0, loading: 0 },
      disabledChecked: false,
      loadingChecked: false
    });

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.evaluate(() => window.postMessage({ type: 'snice-theme', theme: 'light' }, '*'));
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(eventA).toBeVisible();

    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-theme');
      for (const stylesheet of document.querySelectorAll('link[rel="stylesheet"]')) {
        (stylesheet as HTMLLinkElement).disabled = true;
      }
    });
    await expect(eventA).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
      widths: Array.from(document.querySelectorAll('snice-radio')).map(radio => radio.getBoundingClientRect().width)
    }))).toEqual(expect.objectContaining({ viewport: 390, scroll: 390 }));
    expect(await page.evaluate(() => Array.from(document.querySelectorAll('snice-radio'))
      .every(radio => radio.getBoundingClientRect().width > 0))).toBe(true);
    expect(pageErrors).toEqual([]);
  });
});
