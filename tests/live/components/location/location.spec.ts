import { expect, test } from '@playwright/test';

test('full location showcase renders and every example remains functional', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/tests/live/fixtures/location/visual.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const locations = Array.from(document.querySelectorAll('snice-location'));
    return locations.length === 32
      && locations.every(location => location.shadowRoot?.querySelector('.location'));
  });

  const showcase = await page.evaluate(() => {
    const locations = Array.from(document.querySelectorAll('snice-location'));
    const inspect = (selector: string) => {
      const location = document.querySelector(selector)!;
      return {
        name: location.shadowRoot?.querySelector('.name')?.textContent?.trim() ?? null,
        address: location.shadowRoot?.querySelector('.address')?.textContent?.trim() ?? null,
        coordinates: location.shadowRoot?.querySelector('.coordinates')?.textContent?.trim() ?? null
      };
    };
    const clickable = locations.filter(location => location.hasAttribute('clickable'));
    const iframes = locations.flatMap(location =>
      Array.from(location.shadowRoot?.querySelectorAll('iframe') ?? [])
    );
    const noIcon = locations.find(location => location.getAttribute('name') === 'No Icon')!;
    const imageIcon = locations.find(location => location.getAttribute('name') === 'Custom Icon Image')!;
    const slotted = locations.find(location => location.getAttribute('name') === 'Slotted Icon')!;
    const customMap = locations.find(location => location.getAttribute('name') === 'Custom Map')!;

    return {
      total: locations.length,
      rendered: locations.filter(location => location.shadowRoot?.querySelector('.location')).length,
      headings: Array.from(document.querySelectorAll('h2')).map(heading => heading.textContent?.trim()),
      modes: {
        full: inspect('snice-location[mode="full"]'),
        compact: inspect('snice-location[mode="compact"]'),
        coordinates: inspect('snice-location[mode="coordinates"]'),
        address: inspect('snice-location[mode="address"]')
      },
      clickable: {
        total: clickable.length,
        links: clickable.filter(location => location.shadowRoot?.querySelector('[role="link"][tabindex="0"]')).length
      },
      iframeCount: iframes.length,
      iframeSources: iframes.map(iframe => iframe.getAttribute('src')),
      noIconCount: noIcon.shadowRoot?.querySelectorAll('.icon').length,
      imageIcon: imageIcon.shadowRoot?.querySelector('.icon img')?.getAttribute('src'),
      slottedIconCount: (slotted.shadowRoot?.querySelector('slot[name="icon"]') as HTMLSlotElement)
        ?.assignedElements().length,
      customMapSource: customMap.shadowRoot?.querySelector('iframe')?.getAttribute('src'),
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
      widths: locations.map(location => location.getBoundingClientRect().width),
      emptyRendered: Boolean(document.querySelector('snice-location:not([name]):not([address]):not([latitude])')
        ?.shadowRoot?.querySelector('.location'))
    };
  });

  expect(showcase.total).toBe(32);
  expect(showcase.rendered).toBe(showcase.total);
  expect(showcase.headings).toContain('Safe external navigation');
  expect(showcase.headings).toContain('Mode x clickable matrix');
  expect(showcase.modes.full).toEqual({
    name: 'Central Park',
    address: '59th to 110th Street, New York, NY, 10022, USA',
    coordinates: '40.782900, -73.965400'
  });
  expect(showcase.modes.compact).toEqual({
    name: 'Times Square',
    address: 'Broadway & 7th Avenue, New York, NY',
    coordinates: '40.758000, -73.985500'
  });
  expect(showcase.modes.coordinates).toEqual({
    name: null,
    address: null,
    coordinates: '40.748400, -73.985700'
  });
  expect(showcase.modes.address).toEqual({
    name: 'Empire State Building',
    address: '350 Fifth Avenue, New York, NY, 10118, USA',
    coordinates: null
  });
  expect(showcase.clickable.links).toBe(showcase.clickable.total);
  expect(showcase.iframeCount).toBe(3);
  expect(showcase.iframeSources.every(source => source && !/^javascript:/i.test(source))).toBe(true);
  expect(showcase.noIconCount).toBe(0);
  // The showcase's remote flaticon PNG was localized to a data-URL SVG
  // stand-in; the assertion tracks the icon-image channel, not the CDN.
  expect(showcase.imageIcon).toMatch(/^data:image\/svg\+xml/);
  expect(showcase.slottedIconCount).toBe(1);
  expect(showcase.customMapSource).toBe('/tests/live/fixtures/location/map-stub.html');
  expect(showcase.scroll).toBeLessThanOrEqual(showcase.viewport);
  expect(showcase.widths.every(width => width >= 0 && width <= 400)).toBe(true);
  expect(showcase.emptyRendered).toBe(true);

  const navigation = await page.evaluate(() => {
    const originalOpen = window.open;
    const calls: Array<[string, string | undefined, string | undefined]> = [];
    window.open = ((url?: string | URL, target?: string, features?: string) => {
      calls.push([String(url), target, features]);
      return null;
    }) as typeof window.open;
    (globalThis as any).__sniceUnsafeLocationShowcase = 0;

    const safe = document.querySelector('#location-safe-map') as HTMLElement;
    const blocked = document.querySelector('#location-blocked-map') as HTMLElement;
    safe.click();
    const safeStatus = document.querySelector('#location-navigation-status')?.textContent;
    blocked.click();
    const blockedStatus = document.querySelector('#location-navigation-status')?.textContent;

    window.open = originalOpen;
    return {
      calls,
      safeStatus,
      blockedStatus,
      executed: (globalThis as any).__sniceUnsafeLocationShowcase
    };
  });
  expect(navigation).toEqual({
    calls: [['#location-safe-navigation', '_blank', 'noopener']],
    safeStatus: 'location-click: Safe relative destination',
    blockedStatus: 'location-click: Blocked unsafe destination',
    executed: 0
  });

  const safeLink = page.locator('#location-safe-map').getByRole('link');
  await safeLink.focus();
  await expect(safeLink).toBeFocused();
  const focus = await safeLink.evaluate(element => {
    const style = getComputedStyle(element);
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineOffset: style.outlineOffset
    };
  });
  expect(focus.outlineStyle).toBe('solid');
  expect(parseFloat(focus.outlineWidth)).toBeGreaterThan(0);
  expect(parseFloat(focus.outlineOffset)).toBeGreaterThanOrEqual(0);

  await page.evaluate(() => window.postMessage({ type: 'snice-theme', theme: 'light' }, '*'));
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(safeLink).toBeVisible();

  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
  await expect(page.locator('html')).not.toHaveAttribute('data-theme');
  await expect(safeLink).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  const mobile = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
    maxLocationWidth: Math.max(...Array.from(document.querySelectorAll('snice-location'))
      .map(location => location.getBoundingClientRect().width))
  }));
  expect(mobile.scroll).toBeLessThanOrEqual(mobile.viewport);
  expect(mobile.maxLocationWidth).toBeLessThanOrEqual(mobile.viewport - 48);
  expect(pageErrors).toEqual([]);
});
