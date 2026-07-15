import { expect, test, type Page } from '@playwright/test';
import { allowedNavigationUrls, unsafeNavigationUrls } from '../../../navigation-url-cases';

type BuildTarget = 'source' | 'distribution' | 'cdn';

const navigationCases = {
  unsafe: unsafeNavigationUrls.map(([mapUrl, description]) => ({ mapUrl, description })),
  allowed: allowedNavigationUrls.map(([mapUrl, description]) => ({ mapUrl, description }))
};

async function loadLocation(page: Page, build: BuildTarget) {
  await page.goto('/guide.html', { waitUntil: 'domcontentloaded' });

  if (build === 'source') {
    await page.evaluate(async () => {
      await import('/packages/components/src/location/snice-location.ts');
    });
  } else if (build === 'distribution') {
    await page.evaluate(async () => {
      await import('/dist/components/location/snice-location.js');
    });
  } else {
    await page.addScriptTag({ url: '/components/snice-location.min.js' });
  }

  await page.waitForFunction(() => Boolean(customElements.get('snice-location')));
}

async function exerciseNavigationPolicy(page: Page, build: BuildTarget) {
  await loadLocation(page, build);

  return page.evaluate(async ({ unsafe, allowed }) => {
    type LocationElement = HTMLElement & {
      mapUrl: unknown;
      clickable: boolean;
      showMap: boolean;
      ready: Promise<void>;
      rendered: Promise<void>;
      openMap(): void;
    };

    const originalOpen = window.open;
    const opens: Array<[string, string | undefined, string | undefined]> = [];
    let locationEvents = 0;
    let errors = 0;
    (globalThis as any).__sniceNavigationInjected = 0;
    window.open = ((url?: string | URL, target?: string, features?: string) => {
      opens.push([String(url), target, features]);
      return null;
    }) as typeof window.open;

    const connectWithAttribute = async (mapUrl: string, name: string) => {
      const location = document.createElement('snice-location') as LocationElement;
      location.setAttribute('name', name);
      location.setAttribute('map-url', mapUrl);
      location.setAttribute('clickable', '');
      location.addEventListener('location-click', () => locationEvents++);
      document.body.appendChild(location);
      await location.ready;
      await location.rendered;
      return location;
    };

    const connectWithProperty = async (mapUrl: unknown, name: string) => {
      const location = document.createElement('snice-location') as LocationElement;
      location.setAttribute('name', name);
      location.setAttribute('clickable', '');
      location.addEventListener('location-click', () => locationEvents++);
      document.body.appendChild(location);
      await location.ready;
      location.mapUrl = mapUrl;
      await location.rendered;
      return location;
    };

    const inspectBlocked = (location: LocationElement) => {
      const before = opens.length;
      location.openMap();
      location.click();
      const base = location.shadowRoot?.querySelector('.location');
      return {
        authoredMapUrl: location.getAttribute('map-url'),
        openCount: opens.length - before,
        iframeCount: location.shadowRoot?.querySelectorAll('iframe').length ?? -1,
        role: base?.getAttribute('role'),
        tabIndex: base?.getAttribute('tabindex'),
        label: base?.textContent?.trim()
      };
    };

    const blockedAttributes = [];
    const blockedProperties = [];
    const allowedAttributes = [];
    const allowedProperties = [];

    try {
      for (const { mapUrl, description } of unsafe) {
        const attributeLocation = await connectWithAttribute(mapUrl, `Attribute: ${description}`);
        attributeLocation.showMap = true;
        await attributeLocation.rendered;
        blockedAttributes.push(inspectBlocked(attributeLocation));

        const propertyLocation = await connectWithProperty(mapUrl, `Property: ${description}`);
        propertyLocation.showMap = true;
        await propertyLocation.rendered;
        blockedProperties.push(inspectBlocked(propertyLocation));
      }

      for (const { mapUrl, description } of allowed) {
        const attributeLocation = await connectWithAttribute(`  ${mapUrl}  `, `Attribute: ${description}`);
        const attributeStart = opens.length;
        attributeLocation.openMap();
        allowedAttributes.push({
          calls: opens.slice(attributeStart),
          label: attributeLocation.shadowRoot?.querySelector('.location')?.textContent?.trim()
        });

        const propertyLocation = await connectWithProperty(`  ${mapUrl}  `, `Property: ${description}`);
        const propertyStart = opens.length;
        propertyLocation.openMap();
        allowedProperties.push({
          calls: opens.slice(propertyStart),
          label: propertyLocation.shadowRoot?.querySelector('.location')?.textContent?.trim()
        });
      }

      const authored = document.createElement('div');
      authored.innerHTML = `
        <snice-location clickable name="Encoded letter" map-url="jav&#x61;script:globalThis.__sniceNavigationInjected += 2"></snice-location>
        <snice-location clickable name="Encoded colon" map-url="javascript&#58;globalThis.__sniceNavigationInjected += 4"></snice-location>
        <snice-location clickable name="Encoded newline" map-url="java&#x0a;script:globalThis.__sniceNavigationInjected += 8"></snice-location>
      `;
      document.body.appendChild(authored);
      const encoded = [];
      for (const location of Array.from(authored.querySelectorAll('snice-location')) as LocationElement[]) {
        await location.ready;
        await location.rendered;
        encoded.push(inspectBlocked(location));
      }

      const nonStringValues = [
        null,
        undefined,
        false,
        0,
        Number.NaN,
        1,
        [],
        { toString: () => 'https://example.test/coerced' },
        { toString: () => { throw new Error('must not convert'); } }
      ];
      const nonStrings = [];
      for (const value of nonStringValues) {
        try {
          const propertyLocation = await connectWithProperty(value, `Non-string ${nonStrings.length}`);
          nonStrings.push(inspectBlocked(propertyLocation));
        } catch {
          errors++;
        }
      }

      const dynamic = await connectWithProperty('/safe-before', 'Dynamic policy');
      dynamic.showMap = true;
      await dynamic.rendered;
      const safeBefore = dynamic.shadowRoot?.querySelector('iframe')?.getAttribute('src');
      dynamic.mapUrl = 'javascript:globalThis.__sniceNavigationInjected += 16';
      const opensBeforeUnsafeActivation = opens.length;
      dynamic.click();
      await dynamic.rendered;
      const unsafeRemoved = !dynamic.shadowRoot?.querySelector('iframe');
      const unsafeOpenCount = opens.length - opensBeforeUnsafeActivation;
      dynamic.mapUrl = '/safe-after';
      await dynamic.rendered;
      const safeAfter = dynamic.shadowRoot?.querySelector('iframe')?.getAttribute('src');

      const whitespace = await connectWithProperty('   ', 'Whitespace URL');
      whitespace.setAttribute('address', 'Fallback must not be used');
      const whitespaceStart = opens.length;
      whitespace.openMap();
      const whitespaceOpenCount = opens.length - whitespaceStart;

      const empty = await connectWithProperty('', 'Exact empty fallback');
      empty.setAttribute('address', '10 Main St & 2nd');
      empty.setAttribute('city', 'Montréal');
      empty.setAttribute('country', 'CA');
      await empty.rendered;
      const emptyStart = opens.length;
      empty.openMap();

      const direct = await connectWithProperty('/direct-map', 'Direct API');
      let directEvents = 0;
      direct.addEventListener('location-click', () => directEvents++);
      const directStart = opens.length;
      direct.openMap();

      const unsafeClickable = await connectWithProperty(
        'javascript:globalThis.__sniceNavigationInjected += 32',
        'Blocked map'
      );
      const unsafeEventStart = locationEvents;
      const unsafeClickStart = opens.length;
      unsafeClickable.click();

      const semantic = await connectWithProperty('/semantic-map', 'Accessible destination');
      const semanticBase = semantic.shadowRoot?.querySelector('.location');
      const clickableSemantics = {
        role: semanticBase?.getAttribute('role'),
        tabIndex: semanticBase?.getAttribute('tabindex'),
        label: semanticBase?.querySelector('.name')?.textContent
      };
      semantic.clickable = false;
      await semantic.rendered;
      const staticSemantics = {
        role: semanticBase?.getAttribute('role'),
        hasTabIndex: semanticBase?.hasAttribute('tabindex')
      };

      return {
        blockedAttributes,
        blockedProperties,
        allowedAttributes,
        allowedProperties,
        encoded,
        nonStrings,
        dynamic: { safeBefore, unsafeRemoved, unsafeOpenCount, safeAfter },
        whitespaceOpenCount,
        emptyCalls: opens.slice(emptyStart, directStart),
        directCalls: opens.slice(directStart, unsafeClickStart),
        directEvents,
        unsafeClick: {
          eventCount: locationEvents - unsafeEventStart,
          openCount: opens.length - unsafeClickStart
        },
        clickableSemantics,
        staticSemantics,
        executed: (globalThis as any).__sniceNavigationInjected,
        errors
      };
    } finally {
      window.open = originalOpen;
      delete (globalThis as any).__sniceNavigationInjected;
    }
  }, navigationCases);
}

function assertPolicyResult(result: Awaited<ReturnType<typeof exerciseNavigationPolicy>>) {
  expect(result.blockedAttributes).toHaveLength(navigationCases.unsafe.length);
  expect(result.blockedProperties).toHaveLength(navigationCases.unsafe.length);
  for (const entry of [...result.blockedAttributes, ...result.blockedProperties]) {
    expect(entry.openCount).toBe(0);
    expect(entry.iframeCount).toBe(0);
    expect(entry.role).toBe('link');
    expect(entry.tabIndex).toBe('0');
    expect(entry.label).toBeTruthy();
  }

  expect(result.allowedAttributes).toHaveLength(navigationCases.allowed.length);
  expect(result.allowedProperties).toHaveLength(navigationCases.allowed.length);
  for (const [index, expected] of navigationCases.allowed.entries()) {
    for (const entries of [result.allowedAttributes, result.allowedProperties]) {
      expect(entries[index].calls).toEqual([[expected.mapUrl, '_blank', 'noopener']]);
      expect(entries[index].label).toBeTruthy();
    }
  }

  expect(result.encoded).toHaveLength(3);
  expect(result.encoded.every(entry => entry.openCount === 0 && entry.iframeCount === 0)).toBe(true);
  expect(result.nonStrings).toHaveLength(9);
  expect(result.nonStrings.every(entry => entry.openCount === 0 && entry.iframeCount === 0)).toBe(true);
  expect(result.dynamic).toEqual({
    safeBefore: '/safe-before',
    unsafeRemoved: true,
    unsafeOpenCount: 0,
    safeAfter: '/safe-after'
  });
  expect(result.whitespaceOpenCount).toBe(0);
  expect(result.emptyCalls).toEqual([[
    'https://www.google.com/maps/search/?api=1&query=10%20Main%20St%20%26%202nd%2C%20Montr%C3%A9al%2C%20CA',
    '_blank',
    'noopener'
  ]]);
  expect(result.directCalls).toEqual([['/direct-map', '_blank', 'noopener']]);
  expect(result.directEvents).toBe(0);
  expect(result.unsafeClick).toEqual({ eventCount: 1, openCount: 0 });
  expect(result.clickableSemantics).toEqual({
    role: 'link',
    tabIndex: '0',
    label: 'Accessible destination'
  });
  expect(result.staticSemantics).toEqual({ role: null, hasTabIndex: false });
  expect(result.executed).toBe(0);
  expect(result.errors).toBe(0);
}

async function installActivationProbe(page: Page) {
  await page.evaluate(async () => {
    type LocationElement = HTMLElement & {
      ready: Promise<void>;
      rendered: Promise<void>;
    };
    const location = document.createElement('snice-location') as LocationElement;
    location.id = 'snice-location-activation-test';
    location.setAttribute('name', 'Activation destination');
    location.setAttribute('map-url', '/guide.html#snice-location-activation');
    location.setAttribute('clickable', '');
    location.style.cssText = 'position:fixed;top:5.5rem;right:1rem;z-index:10000;background:Canvas;padding:.5rem;';
    document.body.appendChild(location);
    await location.ready;
    await location.rendered;

    const state = {
      order: [] as string[],
      calls: [] as Array<[string, string | undefined, string | undefined]>,
      events: 0,
      originalOpen: window.open
    };
    location.addEventListener('location-click', () => {
      state.events++;
      state.order.push('event');
    });
    window.open = ((url?: string | URL, target?: string, features?: string) => {
      state.order.push('open');
      state.calls.push([String(url), target, features]);
      return null;
    }) as typeof window.open;
    (globalThis as any).__sniceLocationActivation = state;
  });
}

async function resetActivationProbe(page: Page) {
  await page.evaluate(() => {
    const state = (globalThis as any).__sniceLocationActivation;
    state.order.length = 0;
    state.calls.length = 0;
    state.events = 0;
  });
}

async function expectActivationProbe(page: Page) {
  expect(await page.evaluate(() => {
    const { order, calls, events } = (globalThis as any).__sniceLocationActivation;
    return { order, calls, events };
  })).toEqual({
    order: ['event', 'open'],
    calls: [['/guide.html#snice-location-activation', '_blank', 'noopener']],
    events: 1
  });
}

async function restoreActivationProbe(page: Page) {
  await page.evaluate(() => {
    const state = (globalThis as any).__sniceLocationActivation;
    window.open = state.originalOpen;
    delete (globalThis as any).__sniceLocationActivation;
  });
}

async function expectActivationAndPopupBehavior(page: Page) {
  await installActivationProbe(page);
  const location = page.locator('#snice-location-activation-test');
  const link = location.getByRole('link', { name: 'Activation destination' });

  await expect(link).toBeVisible();
  await link.click();
  await expectActivationProbe(page);

  await resetActivationProbe(page);
  await link.focus();
  await expect(link).toBeFocused();
  await page.keyboard.press('Enter');
  await expectActivationProbe(page);

  await resetActivationProbe(page);
  await location.evaluate((element: HTMLElement) => element.click());
  await expectActivationProbe(page);
  await restoreActivationProbe(page);

  const popupLocation = await page.evaluate(async () => {
    type LocationElement = HTMLElement & { ready: Promise<void>; rendered: Promise<void> };
    const location = document.createElement('snice-location') as LocationElement;
    location.id = 'snice-location-popup-test';
    location.setAttribute('name', 'Popup destination');
    location.setAttribute('map-url', '/guide.html#snice-location-popup');
    location.setAttribute('clickable', '');
    location.style.cssText = 'position:fixed;top:11rem;right:1rem;z-index:10000;background:Canvas;padding:.5rem;';
    document.body.appendChild(location);
    await location.ready;
    await location.rendered;
    return location.id;
  });
  const popupLink = page.locator(`#${popupLocation}`).getByRole('link', { name: 'Popup destination' });
  const popupPromise = page.context().waitForEvent('page');
  await popupLink.click();
  const popup = await popupPromise;
  await popup.waitForLoadState('domcontentloaded');
  expect(await popup.evaluate(() => window.opener === null)).toBe(true);
  expect(new URL(popup.url()).hash).toBe('#snice-location-popup');
  await popup.close();
}

for (const build of ['source', 'distribution', 'cdn'] as const) {
  test(`enforces safe location navigation through ${build}`, async ({ page }) => {
    assertPolicyResult(await exerciseNavigationPolicy(page, build));
    await expectActivationAndPopupBehavior(page);
  });
}
