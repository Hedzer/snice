import { expect, test, type Page } from '@playwright/test';

type BuildTarget = 'source' | 'distribution' | 'cdn';

async function loadPickers(page: Page, build: BuildTarget) {
  await page.goto('/guide.html', { waitUntil: 'domcontentloaded' });
  if (build === 'source') {
    await page.evaluate(async () => {
      await Promise.all([
        import('/packages/components/src/time-picker/snice-time-picker.ts'),
        import('/packages/components/src/color-picker/snice-color-picker.ts')
      ]);
    });
  } else if (build === 'distribution') {
    await page.evaluate(async () => {
      await Promise.all([
        import('/dist/components/time-picker/snice-time-picker.js'),
        import('/dist/components/color-picker/snice-color-picker.js')
      ]);
    });
  } else {
    await page.addScriptTag({ url: '/components/snice-time-picker.min.js' });
    await page.addScriptTag({ url: '/components/snice-color-picker.min.js' });
  }
  await page.waitForFunction(() => [
    'snice-time-picker',
    'snice-color-picker'
  ].every(tag => Boolean(customElements.get(tag))));
}

async function installFixture(page: Page) {
  await page.evaluate(async () => {
    document.body.innerHTML = `
      <label id="time-primary" for="contract-time">Appointment <strong>time</strong></label>
      <label id="time-secondary" for="contract-time">required</label>
      <snice-time-picker
        id="contract-time"
        label="Internal time fallback"
        helper-text="Times are displayed locally."
        required
        show-seconds
        format="12h"
      ></snice-time-picker>

      <label id="color-wrapper">
        <span id="color-name">Brand color</span>
        <span aria-hidden="true">ignored decoration</span>
        <snice-color-picker
          id="contract-color"
          label="Internal color fallback"
          helper-text="Use an approved brand color."
          show-presets
          required
        ></snice-color-picker>
      </label>

      <label id="inline-time-label" for="contract-inline-time">Inline schedule</label>
      <snice-time-picker
        id="contract-inline-time"
        variant="inline"
        helper-text="Choose a time."
      ></snice-time-picker>

      <label id="swatch-color-label" for="contract-swatch-color">Swatch color</label>
      <snice-color-picker
        id="contract-swatch-color"
        show-input="false"
        helper-text="Open the native chooser."
      ></snice-color-picker>

      <label id="disabled-time-label" for="disabled-time">Disabled time</label>
      <snice-time-picker id="disabled-time" disabled></snice-time-picker>
      <label id="disabled-inline-time-label" for="disabled-inline-time">Disabled inline time</label>
      <snice-time-picker id="disabled-inline-time" variant="inline" disabled></snice-time-picker>
      <label id="disabled-color-label" for="disabled-color">Disabled color</label>
      <snice-color-picker id="disabled-color" disabled show-input="false" show-presets></snice-color-picker>
      <label id="loading-color-label" for="loading-color">Loading color</label>
      <snice-color-picker id="loading-color" loading show-input="false" show-presets></snice-color-picker>
      <fieldset disabled>
        <label id="fieldset-color-label" for="fieldset-color">Fieldset color</label>
        <snice-color-picker id="fieldset-color" show-input="false" show-presets></snice-color-picker>
      </fieldset>
    `;

    const pickers = Array.from(document.querySelectorAll(
      'snice-time-picker, snice-color-picker'
    )) as Array<HTMLElement & { ready: Promise<void>; rendered: Promise<void> }>;
    await Promise.all(pickers.map(picker => picker.ready));
    await Promise.all(pickers.map(picker => picker.rendered));
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
}

for (const build of ['source', 'distribution', 'cdn'] as const) {
  test(`associates explicit, wrapping, multiple, inline, and swatch-only labels through ${build}`, async ({ page }) => {
    await loadPickers(page, build);
    await installFixture(page);

    const time = page.locator('#contract-time');
    const timeInput = time.locator('.input');
    await expect(timeInput).toHaveAccessibleName('Appointment time required');
    await expect(timeInput).toHaveAttribute('aria-describedby', /snice-time-picker-desc-/);
    expect(await time.evaluate((picker: any) => Array.from(picker.labels, (label: HTMLLabelElement) => label.id)))
      .toEqual(['time-primary', 'time-secondary']);
    await time.evaluate((picker: any) => picker.open());
    await expect(time.locator('.dropdown')).toBeVisible();
    await expect(time.locator('.dropdown')).toHaveAccessibleName('Appointment time required controls');
    await expect(time.locator('[data-time-unit="hours"]')).toHaveAccessibleName('Appointment time required hours');
    await expect(time.locator('[data-time-unit="minutes"]')).toHaveAccessibleName('Appointment time required minutes');
    await expect(time.locator('[data-time-unit="seconds"]')).toHaveAccessibleName('Appointment time required seconds');
    await expect(time.locator('[data-time-unit="period"]')).toHaveAccessibleName('Appointment time required period');
    await expect(time.locator('.clock-toggle')).toHaveAccessibleName('Appointment time required: open time picker');
    await time.evaluate((picker: any) => picker.close());
    // The popover's hide can lag a beat behind close() (the exit goes
    // through the panel's allow-discrete transition); wait for the hidden
    // state instead of asserting an arbitrary frame.
    await expect.poll(() => time.locator('.dropdown').evaluate(el =>
      (el as HTMLElement).hidden
      || getComputedStyle(el).display === 'none'
      || (el as HTMLElement).matches(':popover-open') === false && (el as HTMLElement).hidden)).toBe(true);
    await expect(time.locator('.dropdown')).toBeHidden();
    await page.locator('#time-primary').click();
    await expect(timeInput).toBeFocused();
    expect(await time.evaluate((picker: any) => picker.showDropdown)).toBe(false);

    const color = page.locator('#contract-color');
    const colorInput = color.locator('.color-input');
    await expect(colorInput).toHaveAccessibleName('Brand color');
    await expect(colorInput).not.toHaveAccessibleName(/ignored decoration/);
    await expect(colorInput).toHaveAttribute('aria-describedby', /snice-color-picker-desc-/);
    expect(await color.evaluate((picker: any) => Array.from(picker.labels, (label: HTMLLabelElement) => label.id)))
      .toEqual(['color-wrapper']);
    await expect(color.locator('.color-swatch')).toHaveAccessibleName('Brand color color chooser');
    await expect(color.locator('[data-color]').first()).toHaveAccessibleName(/Set Brand color to #/);
    await expect(color.locator('.native-input')).toHaveAttribute('aria-hidden', 'true');
    await expect(color.locator('.native-input')).not.toHaveAttribute('name', /.+/);
    await page.locator('#color-name').click();
    await expect(colorInput).toBeFocused();

    const inline = page.locator('#contract-inline-time');
    const inlinePanel = inline.locator('.dropdown');
    await expect(inlinePanel).toHaveAccessibleName('Inline schedule controls');
    await expect(inlinePanel).toHaveAttribute('aria-describedby', /snice-time-picker-desc-/);
    await page.locator('#inline-time-label').click();
    await expect(inlinePanel).toBeFocused();

    const swatchOnly = page.locator('#contract-swatch-color');
    const swatch = swatchOnly.locator('.color-swatch');
    await expect(swatch).toHaveAccessibleName('Swatch color');
    await expect(swatch).toHaveAttribute('aria-describedby', /snice-color-picker-desc-/);
    await expect(swatchOnly.locator('.color-input')).toHaveCount(0);
    await page.locator('#swatch-color-label').click();
    await expect(swatch).toBeFocused();
  });

  test(`keeps time and color names, descriptions, errors, and targets live through ${build}`, async ({ page }) => {
    await loadPickers(page, build);
    await installFixture(page);

    await page.evaluate(async () => {
      document.querySelector('#time-primary')!.firstChild!.textContent = 'Departure ';
      (document.querySelector('#time-secondary') as HTMLLabelElement).htmlFor = 'contract-color';
      document.querySelector('#color-name')!.textContent = 'Revised surface color';

      const time = document.querySelector('#contract-time') as any;
      const color = document.querySelector('#contract-color') as any;
      time.invalid = true;
      time.errorText = 'Choose an available departure time.';
      color.invalid = true;
      color.errorText = 'Choose a color with sufficient contrast.';
      await Promise.all([time.rendered, color.rendered]);
    });

    const time = page.locator('#contract-time');
    const timeInput = time.locator('.input');
    await expect(timeInput).toHaveAccessibleName('Departure time');
    await expect(timeInput).toHaveAttribute('aria-invalid', 'true');
    await expect(timeInput).toHaveAttribute('required', '');
    const timeDescription = await timeInput.getAttribute('aria-describedby');
    await expect(time.locator(`#${timeDescription}[role="alert"]`)).toHaveText('Choose an available departure time.');
    await expect(time.locator(`#${timeDescription}`)).toHaveCount(1);
    await expect(time.locator('.helper-text')).toHaveCount(0);
    await time.evaluate((picker: any) => picker.open());
    await expect(time.locator('.dropdown')).toBeVisible();
    await expect(time.locator('.dropdown')).toHaveAccessibleName('Departure time controls');

    const color = page.locator('#contract-color');
    const colorInput = color.locator('.color-input');
    await expect(colorInput).toHaveAccessibleName('required Revised surface color');
    await expect(colorInput).toHaveAttribute('aria-invalid', 'true');
    await expect(colorInput).toHaveAttribute('required', '');
    const colorDescription = await colorInput.getAttribute('aria-describedby');
    await expect(color.locator(`#${colorDescription}[role="alert"]`)).toHaveText('Choose a color with sufficient contrast.');
    await expect(color.locator(`#${colorDescription}`)).toHaveCount(1);
    await expect(color.locator('.helper-text')).toHaveCount(0);
    await expect(color.locator('.color-swatch')).toHaveAccessibleName('required Revised surface color color chooser');
    await expect(color.locator('[data-color]').first()).toHaveAccessibleName(/Set required Revised surface color to #/);

    await page.evaluate(async () => {
      document.querySelector('#time-primary')!.remove();
      const time = document.querySelector('#contract-time') as any;
      time.remove();
      document.body.append(time);
      await time.ready;
      await time.rendered;
    });
    await expect(page.locator('#contract-time').locator('.input')).toHaveAccessibleName('Internal time fallback');
    expect(await page.locator('#contract-time').evaluate((picker: any) => picker.labels.length)).toBe(0);
  });

  test(`keeps disabled and loading label activation inert through ${build}`, async ({ page }) => {
    await loadPickers(page, build);
    await installFixture(page);

    for (const [label, picker, popupState] of [
      ['#disabled-time-label', '#disabled-time', 'showDropdown'],
      ['#disabled-inline-time-label', '#disabled-inline-time', 'showDropdown'],
      ['#disabled-color-label', '#disabled-color', null],
      ['#loading-color-label', '#loading-color', null],
      ['#fieldset-color-label', '#fieldset-color', null]
    ] as const) {
      await page.locator(label).click();
      expect(await page.locator(picker).evaluate((element: any, state) => ({
        active: Boolean(element.shadowRoot?.activeElement),
        popup: state ? Boolean(element[state]) : false,
        authoredDisabled: element.disabled,
        nativeDisabled: Boolean(element.shadowRoot?.querySelector('.native-input')?.disabled)
      }), popupState)).toEqual({
        active: false,
        popup: false,
        authoredDisabled: label === '#fieldset-color-label' ? false : label.startsWith('#disabled'),
        nativeDisabled: label.includes('color')
      });
    }
  });
}
