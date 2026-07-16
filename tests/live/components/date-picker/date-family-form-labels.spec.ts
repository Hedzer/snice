import { expect, test, type Page } from '@playwright/test';

type BuildTarget = 'source' | 'distribution' | 'cdn';

const components = ['date-picker', 'date-range-picker', 'date-time-picker'] as const;

async function loadDateFamily(page: Page, build: BuildTarget) {
  await page.goto('/guide.html', { waitUntil: 'domcontentloaded' });
  if (build === 'source') {
    await page.evaluate(async () => {
      await Promise.all([
        import('/packages/components/src/date-picker/snice-date-picker.ts'),
        import('/packages/components/src/date-range-picker/snice-date-range-picker.ts'),
        import('/packages/components/src/date-time-picker/snice-date-time-picker.ts')
      ]);
    });
  } else if (build === 'distribution') {
    await page.evaluate(async () => {
      await Promise.all([
        import('/dist/components/date-picker/snice-date-picker.js'),
        import('/dist/components/date-range-picker/snice-date-range-picker.js'),
        import('/dist/components/date-time-picker/snice-date-time-picker.js')
      ]);
    });
  } else {
    for (const component of components) {
      await page.addScriptTag({ url: `/components/snice-${component}.min.js` });
    }
  }
  await page.waitForFunction(() => [
    'snice-date-picker',
    'snice-date-range-picker',
    'snice-date-time-picker'
  ].every(tag => Boolean(customElements.get(tag))));
}

async function installFixture(page: Page) {
  await page.evaluate(async () => {
    document.body.innerHTML = `
      <label id="date-primary" for="contract-date">Arrival <strong>date</strong></label>
      <label id="date-secondary" for="contract-date">required</label>
      <snice-date-picker
        id="contract-date"
        label="Internal date fallback"
        helper-text="Use the local arrival date."
        required
      ></snice-date-picker>

      <label id="range-wrapper">
        <span id="range-name">Booking dates</span>
        <span aria-hidden="true">ignored decoration</span>
        <snice-date-range-picker
          id="contract-range"
          label="Internal range fallback"
          helper-text="Choose check-in and check-out."
          required
        ></snice-date-range-picker>
      </label>

      <label id="datetime-primary" for="contract-datetime">Appointment</label>
      <snice-date-time-picker
        id="contract-datetime"
        label="Internal date-time fallback"
        helper-text="Times are displayed locally."
        required
        show-seconds
        time-format="12h"
      ></snice-date-time-picker>

      <label id="inline-primary" for="contract-inline">Inline schedule</label>
      <snice-date-time-picker
        id="contract-inline"
        variant="inline"
        helper-text="Choose a date and time."
      ></snice-date-time-picker>

      <label id="disabled-date-label" for="disabled-date">Disabled date</label>
      <snice-date-picker id="disabled-date" disabled></snice-date-picker>
      <label id="disabled-range-label" for="disabled-range">Disabled range</label>
      <snice-date-range-picker id="disabled-range" disabled></snice-date-range-picker>
      <label id="disabled-datetime-label" for="disabled-datetime">Disabled appointment</label>
      <snice-date-time-picker id="disabled-datetime" disabled></snice-date-time-picker>
      <label id="disabled-inline-label" for="disabled-inline">Disabled inline appointment</label>
      <snice-date-time-picker id="disabled-inline" variant="inline" disabled></snice-date-time-picker>
    `;

    const pickers = Array.from(document.querySelectorAll(
      'snice-date-picker, snice-date-range-picker, snice-date-time-picker'
    )) as Array<HTMLElement & { ready: Promise<void>; rendered: Promise<void> }>;
    await Promise.all(pickers.map(picker => picker.ready));
    await Promise.all(pickers.map(picker => picker.rendered));
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

    (globalThis as any).__dateFamilyOpens = { date: 0, range: 0, datetime: 0 };
    document.querySelector('#contract-date')!.addEventListener('datepicker-open', () => {
      (globalThis as any).__dateFamilyOpens.date++;
    });
    document.querySelector('#contract-range')!.addEventListener('daterange-open', () => {
      (globalThis as any).__dateFamilyOpens.range++;
    });
    document.querySelector('#contract-datetime')!.addEventListener('datetimepicker-open', () => {
      (globalThis as any).__dateFamilyOpens.datetime++;
    });
  });
}

for (const build of ['source', 'distribution', 'cdn'] as const) {
  test(`associates explicit, wrapping, multiple, and inline labels through ${build}`, async ({ page }) => {
    await loadDateFamily(page, build);
    await installFixture(page);

    const date = page.locator('#contract-date');
    const dateInput = date.locator('.input');
    await expect(dateInput).toHaveAccessibleName('Arrival date required');
    await expect(dateInput).toHaveAttribute('aria-describedby', /snice-date-picker-desc-/);
    expect(await date.evaluate((picker: any) => Array.from(picker.labels, (label: HTMLLabelElement) => label.id)))
      .toEqual(['date-primary', 'date-secondary']);
    await page.locator('#date-primary').click();
    await expect(dateInput).toBeFocused();
    expect(await date.evaluate((picker: any) => picker.open)).toBe(false);

    const range = page.locator('#contract-range');
    const rangeInput = range.locator('.input');
    await expect(rangeInput).toHaveAccessibleName('Booking dates');
    await expect(rangeInput).not.toHaveAccessibleName(/ignored decoration/);
    await expect(rangeInput).toHaveAttribute('aria-describedby', /snice-date-range-picker-desc-/);
    await expect(range.locator('.calendar')).toHaveAttribute('aria-label', 'Booking dates calendar');
    expect(await range.evaluate((picker: any) => Array.from(picker.labels, (label: HTMLLabelElement) => label.id)))
      .toEqual(['range-wrapper']);
    await page.locator('#range-name').click();
    await expect(rangeInput).toBeFocused();
    expect(await range.evaluate((picker: any) => picker.showCalendar)).toBe(false);
    expect(await page.evaluate(() => (globalThis as any).__dateFamilyOpens.range)).toBe(0);
    await range.evaluate((picker: any) => picker.open());
    await expect(range.locator('.calendar')).toBeVisible();
    await expect(range.locator('.calendar')).toHaveAccessibleName('Booking dates calendar');
    await range.evaluate((picker: any) => picker.close());
    await page.evaluate(() => { (globalThis as any).__dateFamilyOpens = { date: 0, range: 0, datetime: 0 }; });

    const dateTime = page.locator('#contract-datetime');
    const dateTimeInput = dateTime.locator('.input');
    await expect(dateTimeInput).toHaveAccessibleName('Appointment');
    await expect(dateTimeInput).toHaveAttribute('aria-describedby', /snice-date-time-picker-desc-/);
    await expect(dateTime.locator('.panel')).toHaveAttribute('aria-label', 'Appointment controls');
    await expect(dateTime.locator('.panel-calendar')).toHaveAttribute('aria-label', 'Appointment date');
    await expect(dateTime.locator('[data-time-unit="hours"]')).toHaveAttribute('aria-label', 'Appointment hours');
    await expect(dateTime.locator('[data-time-unit="minutes"]')).toHaveAttribute('aria-label', 'Appointment minutes');
    await expect(dateTime.locator('[data-time-unit="seconds"]')).toHaveAttribute('aria-label', 'Appointment seconds');
    await expect(dateTime.locator('[data-time-unit="period"]')).toHaveAttribute('aria-label', 'Appointment period');
    await page.locator('#datetime-primary').click();
    await expect(dateTimeInput).toBeFocused();
    expect(await dateTime.evaluate((picker: any) => picker.showPanel)).toBe(false);
    expect(await page.evaluate(() => (globalThis as any).__dateFamilyOpens.datetime)).toBe(0);
    await dateTime.evaluate((picker: any) => picker.open());
    await expect(dateTime.locator('.panel')).toBeVisible();
    await expect(dateTime.locator('.panel')).toHaveAccessibleName('Appointment controls');
    await expect(dateTime.locator('[data-time-unit="hours"]')).toHaveAccessibleName('Appointment hours');
    await dateTime.evaluate((picker: any) => picker.close());
    await page.evaluate(() => { (globalThis as any).__dateFamilyOpens = { date: 0, range: 0, datetime: 0 }; });

    const inline = page.locator('#contract-inline');
    const inlinePanel = inline.locator('.panel');
    await expect(inlinePanel).toHaveAccessibleName('Inline schedule controls');
    await expect(inlinePanel).toHaveAttribute('aria-describedby', /snice-date-time-picker-desc-/);
    await page.locator('#inline-primary').click();
    await expect(inlinePanel).toBeFocused();

    expect(await page.evaluate(() => (globalThis as any).__dateFamilyOpens)).toEqual({ date: 0, range: 0, datetime: 0 });
  });

  test(`keeps date-family names, descriptions, errors, and required state live through ${build}`, async ({ page }) => {
    await loadDateFamily(page, build);
    await installFixture(page);

    await page.evaluate(async () => {
      document.querySelector('#date-primary')!.firstChild!.textContent = 'Departure ';
      (document.querySelector('#date-secondary') as HTMLLabelElement).htmlFor = 'contract-datetime';
      document.querySelector('#range-name')!.textContent = 'Revised travel window';
      document.querySelector('#datetime-primary')!.setAttribute('aria-label', 'Event starts');

      const date = document.querySelector('#contract-date') as any;
      const range = document.querySelector('#contract-range') as any;
      const dateTime = document.querySelector('#contract-datetime') as any;
      date.invalid = true;
      date.errorText = 'Choose an available departure date.';
      range.invalid = true;
      range.errorText = 'Choose a complete travel window.';
      dateTime.invalid = true;
      dateTime.errorText = 'Choose an available appointment.';
      await Promise.all([date.rendered, range.rendered, dateTime.rendered]);
    });

    const cases = [
      {
        host: page.locator('#contract-date'),
        target: page.locator('#contract-date').locator('.input'),
        name: 'Departure date',
        error: 'Choose an available departure date.',
        prefix: 'snice-date-picker-desc-'
      },
      {
        host: page.locator('#contract-range'),
        target: page.locator('#contract-range').locator('.input'),
        name: 'Revised travel window',
        error: 'Choose a complete travel window.',
        prefix: 'snice-date-range-picker-desc-'
      },
      {
        host: page.locator('#contract-datetime'),
        target: page.locator('#contract-datetime').locator('.input'),
        name: 'required Event starts',
        error: 'Choose an available appointment.',
        prefix: 'snice-date-time-picker-desc-'
      }
    ];

    for (const entry of cases) {
      await expect(entry.target).toHaveAccessibleName(entry.name);
      await expect(entry.target).toHaveAttribute('aria-invalid', 'true');
      await expect(entry.target).toHaveAttribute('required', '');
      const descriptionId = await entry.target.getAttribute('aria-describedby');
      expect(descriptionId).toMatch(new RegExp(`^${entry.prefix}`));
      await expect(entry.host.locator(`#${descriptionId}`)).toHaveText(entry.error);
      await expect(entry.host.locator(`#${descriptionId}[role="alert"]`)).toHaveCount(1);
      await expect(entry.host.locator(`#${descriptionId}`)).toHaveCount(1);
      await expect(entry.host.locator('.helper-text')).toHaveCount(0);
    }

    await expect(page.locator('#contract-range').locator('.calendar'))
      .toHaveAttribute('aria-label', 'Revised travel window calendar');
    await expect(page.locator('#contract-datetime').locator('.panel'))
      .toHaveAttribute('aria-label', 'required Event starts controls');

    await page.evaluate(async () => {
      document.querySelector('#date-primary')!.remove();
      const date = document.querySelector('#contract-date') as any;
      date.remove();
      document.body.append(date);
      await date.ready;
      await date.rendered;
    });
    await expect(page.locator('#contract-date').locator('.input')).toHaveAccessibleName('Internal date fallback');
    expect(await page.locator('#contract-date').evaluate((picker: any) => picker.labels.length)).toBe(0);
  });

  test(`keeps disabled label activation inert for every date-family control through ${build}`, async ({ page }) => {
    await loadDateFamily(page, build);
    await installFixture(page);

    for (const [label, picker, popupState] of [
      ['#disabled-date-label', '#disabled-date', 'open'],
      ['#disabled-range-label', '#disabled-range', 'showCalendar'],
      ['#disabled-datetime-label', '#disabled-datetime', 'showPanel'],
      ['#disabled-inline-label', '#disabled-inline', 'showPanel']
    ] as const) {
      await page.locator(label).click();
      expect(await page.locator(picker).evaluate((element: any, state) => ({
        active: Boolean(element.shadowRoot?.activeElement),
        popup: Boolean(element[state])
      }), popupState)).toEqual({ active: false, popup: false });
    }
  });
}
