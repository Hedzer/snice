import { expect, test } from '@playwright/test';

test.describe('declarative rendering framework in a real browser', () => {
  test('hydrates declarative shadow DOM without replacing server nodes', async ({ page }) => {
    await page.goto('/tests/live/fixtures/declarative-shadow-dom.html');

    const result = await page.evaluate(async () => {
      const { html, hydrateElement } = await import('/src/index.ts');
      const host = document.querySelector('test-browser-hydrate') as HTMLElement;
      const root = host.shadowRoot!;
      const serverButton = root.querySelector('button')!;
      const serverSpan = root.querySelector('span')!;
      let clicks = 0;
      const click = () => { clicks++; };
      const view = (label: string) => html`<button @click=${click}><span>${label}</span></button>`;

      const instance = hydrateElement(host, view('server'));
      const retainedAfterHydration = root.querySelector('button') === serverButton &&
        root.querySelector('span') === serverSpan;
      serverButton.click();
      instance.update(view('client').values);

      return {
        hasDeclarativeRoot: !!root,
        delegatesFocus: root.delegatesFocus,
        retainedAfterHydration,
        retainedAfterUpdate: root.querySelector('button') === serverButton,
        label: serverSpan.textContent,
        clicks,
        styles: root.querySelectorAll('style[data-snice-style]').length,
        markerRemoved: !host.hasAttribute('data-snice-hydrate')
      };
    });

    expect(result).toEqual({
      hasDeclarativeRoot: true,
      delegatesFocus: true,
      retainedAfterHydration: true,
      retainedAfterUpdate: true,
      label: 'client',
      clicks: 1,
      styles: 1,
      markerRemoved: true
    });
  });

  test('deep reactivity uses native Proxy and Reflect semantics in Chromium', async ({ page }) => {
    await page.goto('/guide.html');
    const result = await page.evaluate(async () => {
      const { createDeepReactive } = await import('/src/reactive.ts');
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

  test('dynamic SVG components preserve case-sensitive names and child identity', async ({ page }) => {
    await page.goto('/guide.html');
    const result = await page.evaluate(async () => {
      const { html, hydrate, renderToString } = await import('/src/index.ts');
      const view = (tag: string) => html`
        <svg><defs><component ${tag} id="paint"><stop offset="1"></stop></component></defs></svg>
      `;
      const container = document.createElement('div');
      container.innerHTML = renderToString(view('linearGradient'));
      document.body.append(container);
      const serverGradient = container.querySelector('#paint')!;
      const stop = serverGradient.firstElementChild;
      const instance = hydrate(view('linearGradient'), container);
      const hydratedGradient = container.querySelector('#paint')!;
      instance.update(view('clipPath').values);
      const clipPath = container.querySelector('#paint')!;

      return {
        serverName: serverGradient.localName,
        hydratedName: hydratedGradient.localName,
        retainedOnHydration: hydratedGradient === serverGradient,
        switchedName: clipPath.localName,
        namespace: clipPath.namespaceURI,
        childRetained: clipPath.firstElementChild === stop
      };
    });

    expect(result).toEqual({
      serverName: 'linearGradient',
      hydratedName: 'linearGradient',
      retainedOnHydration: true,
      switchedName: 'clipPath',
      namespace: 'http://www.w3.org/2000/svg',
      childRetained: true
    });
  });

  test('dynamic void targets and SVG HTML integration points hydrate consistently', async ({ page }) => {
    await page.goto('/guide.html');
    const result = await page.evaluate(async () => {
      const { html, hydrate, renderToString } = await import('/src/index.ts');
      const voidView = (tag: string) => html`
        <component ${tag} class="target"><span>retained</span></component>
      `;
      const voidContainer = document.createElement('div');
      const serverMarkup = renderToString(voidView('input'));
      voidContainer.innerHTML = serverMarkup;
      document.body.append(voidContainer);
      const serverInput = voidContainer.querySelector('input')!;
      const voidInstance = hydrate(voidView('input'), voidContainer);
      const voidRetainedOnHydration = voidContainer.querySelector('input') === serverInput;
      voidInstance.update(voidView('section').values);
      const restoredSpan = voidContainer.querySelector('section > span')!;

      const foreignView = () => html`
        <svg><foreignObject><component ${'section'}><span>html</span></component></foreignObject></svg>
      `;
      const foreignContainer = document.createElement('div');
      foreignContainer.innerHTML = renderToString(foreignView());
      document.body.append(foreignContainer);
      const serverSection = foreignContainer.querySelector('section')!;
      hydrate(foreignView(), foreignContainer);

      return {
        serverOmittedVoidChildren: !serverMarkup.includes('<span>') && !serverMarkup.includes('</input>'),
        voidRetainedOnHydration,
        restoredText: restoredSpan.textContent,
        restoredNamespace: restoredSpan.namespaceURI,
        integrationSectionNamespace: serverSection.namespaceURI,
        integrationChildNamespace: serverSection.firstElementChild?.namespaceURI
      };
    });

    expect(result).toEqual({
      serverOmittedVoidChildren: true,
      voidRetainedOnHydration: true,
      restoredText: 'retained',
      restoredNamespace: 'http://www.w3.org/1999/xhtml',
      integrationSectionNamespace: 'http://www.w3.org/1999/xhtml',
      integrationChildNamespace: 'http://www.w3.org/1999/xhtml'
    });
  });

  test('runs the complete customer workflow through the built ESM distribution', async ({ page }) => {
    await page.goto('/guide.html');
    const result = await page.evaluate(async () => {
      const fixture = await import('/tests/live/fixtures/built-customer-declarative.ts');
      return fixture.exerciseBuiltCustomerScenario();
    });

    expect(result.deepAndDynamic).toEqual({
      bound: true,
      style: true,
      keyedIdentity: true,
      dynamicIdentity: true,
      dynamicTag: 'section',
      fallback: true,
      resource: true,
      transition: 'beta',
      portal: 'from-view',
      ref: true,
      actionValue: 'beta'
    });
    expect(result.parked).toEqual({
      calls: [0, 0, 0],
      bound: 'from-view',
      refCleared: true,
      cleanups: 1
    });
    expect(result.initialOnceCalls).toEqual([1, 1]);
    expect(result.identityAfterParking).toBe(true);
    expect(result.afterParkingCalls).toEqual([1, 1, 1]);
    expect(result.lifecycleBeforeFinalRemoval).toEqual([
      'disconnect:branch',
      'reconnect',
      'disconnect:host',
      'reconnect'
    ]);
    expect(result.lifecycle).toEqual([
      ...result.lifecycleBeforeFinalRemoval,
      'disconnect:host'
    ]);
    expect(result.afterParkingOnceCalls).toEqual([1, 1]);
    expect(result.detached).toEqual({
      calls: [2, 2, 2],
      bound: 'detached-write',
      once: [1, 1],
      refCleared: true
    });
    expect(result.identityAfterHostReconnect).toBe(true);
    expect(result.refAfterReconnect).toBe(true);
    expect(result.actionReconnects).toBe(3);
  });
});
