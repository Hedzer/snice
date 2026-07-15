import { expect, test, type Page } from '@playwright/test';

async function exerciseUntrustedSelectData(page: Page, build: 'distribution' | 'cdn') {
  await page.goto('/guide.html');
  if (build === 'distribution') {
    await page.evaluate(async () => {
      await import('/dist/components/select/snice-select.js');
    });
  } else {
    await page.addScriptTag({ url: '/components/snice-select.min.js' });
  }
  await page.waitForFunction(() => !!customElements.get('snice-select'));

  return page.evaluate(async () => {
    const maliciousLabel = '<img data-select-injected="label" src="missing-label.png" onerror="globalThis.__sniceSelectInjected++"><svg><script>globalThis.__sniceSelectInjected++</script></svg>';
    const maliciousValue = 'value" tabindex="0" data-select-injected="value';
    const maliciousIcon = 'missing-icon.png" onerror="globalThis.__sniceSelectInjected++" data-select-injected="icon';
    const maliciousPlaceholder = '<img data-select-injected="placeholder" src="missing-placeholder.png" onerror="globalThis.__sniceSelectInjected++">';
    const secondValue = 'second" aria-label="forged';
    const secondLabel = '<b data-select-injected="second">Second</b>';
    (globalThis as any).__sniceSelectInjected = 0;

    const selected = document.createElement('snice-select') as any;
    selected.options = [{ value: maliciousValue, label: maliciousLabel, icon: maliciousIcon }];
    selected.value = maliciousValue;
    document.body.appendChild(selected);
    await selected.ready;

    const multiple = document.createElement('snice-select') as any;
    multiple.multiple = true;
    multiple.options = [
      { value: maliciousValue, label: maliciousLabel, icon: maliciousIcon },
      { value: secondValue, label: secondLabel }
    ];
    multiple.value = `${maliciousValue},${secondValue}`;
    document.body.appendChild(multiple);
    await multiple.ready;

    const placeholder = document.createElement('snice-select') as any;
    placeholder.placeholder = maliciousPlaceholder;
    document.body.appendChild(placeholder);
    await placeholder.ready;

    const declarative = document.createElement('snice-select') as any;
    const declarativeOption = document.createElement('snice-option');
    declarativeOption.setAttribute('value', maliciousValue);
    declarativeOption.setAttribute('icon', maliciousIcon);
    declarativeOption.textContent = maliciousLabel;
    declarative.appendChild(declarativeOption);
    document.body.appendChild(declarative);
    await declarative.ready;

    const remote = document.createElement('snice-select') as any;
    remote.remote = true;
    remote.searchable = true;
    document.body.appendChild(remote);
    await remote.ready;
    remote.addEventListener('@request/select/search', (event: CustomEvent) => {
      event.detail.discovery.resolve();
      event.detail.data.resolve([{
        value: maliciousValue,
        label: maliciousLabel,
        icon: maliciousIcon
      }]);
    });
    await remote.performRemoteSearch('adversarial query');

    selected.options = [{
      value: 'dynamic" data-select-injected="dynamic',
      label: '<img data-select-injected="dynamic-label" src="missing-dynamic.png">',
      icon: maliciousIcon
    }];
    selected.value = 'dynamic" data-select-injected="dynamic';
    await new Promise(resolve => setTimeout(resolve, 100));

    const selectedShadow = selected.shadowRoot!;
    const multipleShadow = multiple.shadowRoot!;
    const placeholderShadow = placeholder.shadowRoot!;
    const declarativeShadow = declarative.shadowRoot!;
    const remoteShadow = remote.shadowRoot!;
    const shadows = [selectedShadow, multipleShadow, placeholderShadow, declarativeShadow, remoteShadow];
    const option = selectedShadow.querySelector('.select-option') as HTMLElement;
    const icon = option.querySelector('.select-option-icon') as HTMLImageElement;

    return {
      executed: (globalThis as any).__sniceSelectInjected,
      injectedNodes: document.querySelectorAll('[data-select-injected]').length
        + shadows.reduce((count, shadow) => count + shadow.querySelectorAll('[data-select-injected]').length, 0),
      scripts: shadows.reduce((count, shadow) => count + shadow.querySelectorAll('script').length, 0),
      dynamicLabel: selectedShadow.querySelector('.select-option-label')?.textContent,
      dynamicValue: option.getAttribute('data-value'),
      forgedTabIndex: option.getAttribute('tabindex'),
      iconSource: icon.getAttribute('src'),
      iconHandler: icon.getAttribute('onerror'),
      multipleLabels: Array.from(multipleShadow.querySelectorAll('.select-tag')).map(tag => tag.textContent),
      multipleValues: Array.from(multipleShadow.querySelectorAll('.select-tag-remove')).map(tag => tag.getAttribute('data-value')),
      placeholder: placeholderShadow.querySelector('.select-placeholder')?.textContent,
      declarativeLabel: declarativeShadow.querySelector('.select-option-label')?.textContent,
      remoteLabel: remoteShadow.querySelector('.select-option-label')?.textContent,
      remoteValue: remoteShadow.querySelector('.select-option')?.getAttribute('data-value'),
      remoteIconHandler: remoteShadow.querySelector('.select-option-icon')?.getAttribute('onerror')
    };
  });
}

const inertSelectDataResult = {
  executed: 0,
  injectedNodes: 0,
  scripts: 0,
  dynamicLabel: '<img data-select-injected="dynamic-label" src="missing-dynamic.png">',
  dynamicValue: 'dynamic" data-select-injected="dynamic',
  forgedTabIndex: null,
  iconSource: 'missing-icon.png" onerror="globalThis.__sniceSelectInjected++" data-select-injected="icon',
  iconHandler: null,
  multipleLabels: [
    '<img data-select-injected="label" src="missing-label.png" onerror="globalThis.__sniceSelectInjected++"><svg><script>globalThis.__sniceSelectInjected++</script></svg>×',
    '<b data-select-injected="second">Second</b>×'
  ],
  multipleValues: [
    'value" tabindex="0" data-select-injected="value',
    'second" aria-label="forged'
  ],
  placeholder: '<img data-select-injected="placeholder" src="missing-placeholder.png" onerror="globalThis.__sniceSelectInjected++">',
  declarativeLabel: '<img data-select-injected="label" src="missing-label.png" onerror="globalThis.__sniceSelectInjected++"><svg><script>globalThis.__sniceSelectInjected++</script></svg>',
  remoteLabel: '<img data-select-injected="label" src="missing-label.png" onerror="globalThis.__sniceSelectInjected++"><svg><script>globalThis.__sniceSelectInjected++</script></svg>',
  remoteValue: 'value" tabindex="0" data-select-injected="value',
  remoteIconHandler: null
};

test.describe('declarative rendering framework in a real browser', () => {
  test('deep reactivity uses native Proxy and Reflect semantics in a real browser', async ({ page }) => {
    await page.goto('/guide.html');
    const result = await page.evaluate(async () => {
      const { createDeepReactive } = await import('/packages/core/src/reactive.ts');
      let changes = 0;
      const key = { id: 1 };
      const source: any = {
        nested: { count: 0 },
        map: new Map([[key, { label: 'first' }]]),
        set: new Set([key])
      };
      source.self = source;
      const state = createDeepReactive(source, () => { changes++; });
      const proxyKey = [...state.map.keys()][0];

      state.nested.count++;
      state.map.get(proxyKey).label = 'second';
      state.map.set(proxyKey, { label: 'third' });
      state.set.delete(proxyKey);
      Reflect.set(state.nested, 'extra', true);

      return {
        proxyAvailable: typeof Proxy === 'function',
        reflectAvailable: typeof Reflect.set === 'function',
        cyclePreserved: state.self === state,
        mapKeyInterop: state.map.has(proxyKey) && state.map.has(key),
        mapValue: state.map.get(key).label,
        setRemoved: !state.set.has(key),
        reflectedWrite: state.nested.extra,
        changes
      };
    });

    expect(result).toEqual({
      proxyAvailable: true,
      reflectAvailable: true,
      cyclePreserved: true,
      mapKeyInterop: true,
      mapValue: 'third',
      setRemoved: true,
      reflectedWrite: true,
      changes: 5
    });
  });

  test('runs the complete customer workflow through the built ESM distribution', async ({ page }) => {
    await page.goto('/guide.html');
    const result = await page.evaluate(async () => {
      const fixture = await import('/tests/live/fixtures/built-customer-declarative.ts');
      return fixture.exerciseBuiltCustomerScenario();
    });

    expect(result.rendering).toEqual({
      bound: true,
      style: true,
      keyedIdentity: true,
      fallback: true,
      asyncValue: true,
      currentView: 'beta'
    });
    expect(result.parked).toEqual({
      calls: [0, 0],
      bound: 'from-view'
    });
    expect(result.initialOnceCalls).toBe(1);
    expect(result.identityAfterParking).toBe(true);
    expect(result.afterParkingCalls).toEqual([1, 1]);
    expect(result.afterParkingOnceCalls).toBe(1);
    expect(result.detached).toEqual({
      calls: [2, 2],
      bound: 'detached-write',
      once: 1
    });
    expect(result.identityAfterHostReconnect).toBe(true);
  });

  test('reconciles the built repeat implementation in table, select, and SVG contexts', async ({ page }) => {
    await page.goto('/guide.html');
    const result = await page.evaluate(async () => {
      const fixture = await import('/tests/live/fixtures/built-customer-declarative.ts');
      return fixture.exerciseBuiltRepeatContextsScenario();
    });

    expect(result).toEqual({
      parents: ['TBODY', 'SELECT'],
      svgNamespace: 'http://www.w3.org/2000/svg',
      identities: [true, true, true],
      rows: ['two updated', 'one updated', 'three'],
      options: ['two updated', 'one updated', 'three'],
      circlePositions: ['1', '2', '3']
    });
  });

  test('handles stale, completed, cancelled, and restarted async values through the built ESM distribution', async ({ page }) => {
    await page.goto('/guide.html');
    const result = await page.evaluate(async () => {
      const fixture = await import('/tests/live/fixtures/built-customer-declarative.ts');
      return fixture.exerciseBuiltAsyncLifecycleScenario();
    });

    expect(result).toEqual({
      staleIgnored: true,
      currentRendered: true,
      streamedTemplate: true,
      completedOpenCount: 1,
      cancellation: 1,
      restarted: 2
    });
  });

  test('renders untrusted select data inertly through the built ESM component distribution', async ({ page }) => {
    expect(await exerciseUntrustedSelectData(page, 'distribution')).toEqual(inertSelectDataResult);
  });

  test('renders untrusted select data inertly through the built CDN bundle', async ({ page }) => {
    expect(await exerciseUntrustedSelectData(page, 'cdn')).toEqual(inertSelectDataResult);
  });
});
