import { expect, test } from '@playwright/test';

const stories = [
  {
    component: 'time picker',
    url: 'http://localhost:6006/iframe.html?id=timepicker--external-label-lifecycle&viewMode=story',
    root: '#time-picker-label-story',
    host: '#time-story-picker',
    tag: 'snice-time-picker',
    primary: '#time-story-primary',
    target: '.input',
    initialName: 'Appointment time required',
    changedName: 'Event starts required',
    fallbackName: 'Internal time fallback',
    error: 'Choose an available time.'
  },
  {
    component: 'color picker',
    url: 'http://localhost:6006/iframe.html?id=colorpicker--external-label-lifecycle&viewMode=story',
    root: '#color-picker-label-story',
    host: '#color-story-picker',
    tag: 'snice-color-picker',
    primary: '#color-story-primary',
    target: '.color-input',
    initialName: 'Brand color required',
    changedName: 'Surface color required',
    fallbackName: 'Internal color fallback',
    error: 'Choose a color with sufficient contrast.'
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
    if (story.component === 'time picker') {
      expect(await host.evaluate((picker: any) => picker.showDropdown)).toBe(false);
    }
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

    if (story.component === 'time picker') {
      const inline = page.locator('#time-story-inline');
      await expect(inline.locator('.dropdown')).toHaveAccessibleName('Inline schedule controls');
      await expect(inline.locator('[data-time-unit="minutes"]')).toHaveAccessibleName('Inline schedule minutes');
    } else {
      await expect(host.locator('.color-swatch')).toHaveAccessibleName(`${story.changedName} color chooser`);
      const swatchOnly = page.locator('#color-story-swatch');
      await expect(swatchOnly.locator('.color-swatch')).toHaveAccessibleName('Swatch color');
      await expect(swatchOnly.locator('.color-input')).toHaveCount(0);
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
