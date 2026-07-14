import { expect, test } from '@playwright/test';

test.describe('declarative rendering framework in a real browser', () => {
  test('deep reactivity uses native Proxy and Reflect semantics in a real browser', async ({ page }) => {
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
});
