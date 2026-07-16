import { expect, test } from '@playwright/test';

const stories = [
  {
    component: 'date picker',
    url: 'http://localhost:6006/iframe.html?id=datepicker--external-label-lifecycle&viewMode=story',
    root: '#date-picker-label-story',
    host: '#date-story-picker',
    tag: 'snice-date-picker',
    primary: '#date-story-primary',
    target: '.input',
    initialName: 'Arrival date required',
    changedName: 'Departure date required',
    fallbackName: 'Internal fallback',
    error: 'Choose an available date.',
    popupState: 'open'
  },
  {
    component: 'date range picker',
    url: 'http://localhost:6006/iframe.html?id=daterangepicker--external-label-lifecycle&viewMode=story',
    root: '#date-range-picker-label-story',
    host: '#range-story-picker',
    tag: 'snice-date-range-picker',
    primary: '#range-story-primary',
    target: '.input',
    initialName: 'Booking dates required',
    changedName: 'Travel window required',
    fallbackName: 'Internal range fallback',
    error: 'Choose a complete available range.',
    popupState: 'showCalendar'
  },
  {
    component: 'date-time picker',
    url: 'http://localhost:6006/iframe.html?id=datetimepicker--external-label-lifecycle&viewMode=story',
    root: '#date-time-picker-label-story',
    host: '#datetime-story-picker',
    tag: 'snice-date-time-picker',
    primary: '#datetime-story-primary',
    target: '.input',
    initialName: 'Appointment required',
    changedName: 'Event starts required',
    fallbackName: 'Internal date-time fallback',
    error: 'Choose an available date and time.',
    popupState: 'showPanel'
  }
] as const;

for (const story of stories) {
  test(`Storybook ${story.component} external-label story is live, responsive, and theme-complete`, async ({ page }) => {
    test.setTimeout(120_000);
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(story.url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(({ root, host, tag, target }) => {
      const fixture = document.querySelector(root);
      const pickers = Array.from(fixture?.querySelectorAll(tag) || []);
      return pickers.length === 3
        && pickers.every(picker => picker.shadowRoot)
        && Boolean(document.querySelector(host)?.shadowRoot?.querySelector(target));
    }, story);

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const host = page.locator(story.host);
    const target = host.locator(story.target);
    await expect(target).toHaveAccessibleName(story.initialName);
    expect(await host.evaluate((picker: any) => picker.labels.length)).toBe(2);
    const descriptionId = await target.getAttribute('aria-describedby');
    expect(descriptionId).toBeTruthy();
    await expect(host.locator(`#${descriptionId}`)).toHaveCount(1);

    await page.locator(story.primary).click();
    await expect(target).toBeFocused();
    expect(await host.evaluate((picker: any, state) => Boolean(picker[state]), story.popupState)).toBe(false);

    await page.getByRole('button', { name: 'Change label' }).click();
    await expect(target).toHaveAccessibleName(story.changedName);
    await expect(page.locator(`${story.root} output`)).toHaveText(`Accessible name: ${story.changedName}`);

    await page.getByRole('button', { name: 'Show error' }).click();
    await expect(target).toHaveAttribute('aria-invalid', 'true');
    await expect(host.locator('.error-text')).toHaveText(story.error);
    await expect(host.locator('.helper-text')).toHaveCount(0);
    await expect(host.locator(`#${descriptionId}[role="alert"]`)).toHaveCount(1);

    await page.getByRole('button', { name: 'Remove external labels' }).click();
    await expect(target).toHaveAccessibleName(story.fallbackName);
    expect(await host.evaluate((picker: any) => picker.labels.length)).toBe(0);
    await page.getByRole('button', { name: 'Restore external labels' }).click();
    await expect(target).toHaveAccessibleName(story.changedName);

    const disabled = page.locator(`${story.root} ${story.tag}[disabled]`);
    const disabledLabel = disabled.locator('xpath=preceding::label[1]');
    await disabledLabel.click();
    expect(await disabled.evaluate((picker: HTMLElement) => Boolean(picker.shadowRoot?.activeElement))).toBe(false);

    if (story.tag === 'snice-date-time-picker') {
      const inline = page.locator('#datetime-story-inline');
      await expect(inline.locator('.panel')).toHaveAccessibleName('Inline schedule controls');
      await expect(inline.locator('[data-time-unit="hours"]')).toHaveAccessibleName('Inline schedule hours');
    }

    expect(await page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
    await page.goto(`${story.url}&globals=theme:light`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'light');
    await expect(page.locator(story.root)).toBeVisible();
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });
}
