import { expect, test } from '@playwright/test';

test('structured property bindings survive native IDL collisions and late upgrade', async ({ page }) => {
  await page.goto('/guide.html');

  const result = await page.evaluate(async () => {
    const fixture = await import('/tests/live/fixtures/property-native-idl-late-upgrade.ts');
    const owner = document.createElement('live-native-idl-binding-owner') as any;
    document.body.append(owner);
    await owner.ready;

    const pending = owner.shadowRoot.querySelector('live-native-idl-binding-child') as any;
    const before = {
      same: pending.role === fixture.nativeIdlBoundRole,
      attribute: pending.getAttribute('role'),
    };

    fixture.defineNativeIdlBindingChild();
    await customElements.whenDefined('live-native-idl-binding-child');
    const child = owner.shadowRoot.querySelector('live-native-idl-binding-child') as any;
    await child.ready;
    return {
      before,
      after: {
        same: child.role === fixture.nativeIdlBoundRole,
        attribute: child.getAttribute('role'),
        own: Object.hasOwn(child, 'role'),
      },
    };
  });

  expect(result).toEqual({
    before: { same: true, attribute: null },
    after: { same: true, attribute: null, own: false },
  });
});

test('registered Snice elements preserve native-IDL-colliding bindings from template clones', async ({ page }) => {
  await page.goto('/guide.html');

  const result = await page.evaluate(async () => {
    const fixture = await import('/tests/live/fixtures/property-native-idl-late-upgrade.ts');
    fixture.defineRegisteredNativeIdlScenario();
    const owner = document.createElement('live-registered-native-idl-owner') as any;
    document.body.append(owner);
    await owner.ready;

    const direct = owner.shadowRoot.querySelector('#direct') as any;
    const spread = owner.shadowRoot.querySelector('#spread') as any;
    await Promise.all([direct.ready, spread.ready]);
    return {
      direct: {
        same: direct.role === fixture.registeredNativeIdlDirectRole,
        attribute: direct.getAttribute('role'),
        own: Object.hasOwn(direct, 'role'),
      },
      spread: {
        same: spread.role === fixture.registeredNativeIdlSpreadRole,
        attribute: spread.getAttribute('role'),
        own: Object.hasOwn(spread, 'role'),
      },
    };
  });

  expect(result).toEqual({
    direct: { same: true, attribute: null, own: false },
    spread: { same: true, attribute: null, own: false },
  });
});

for (const build of [
  {
    name: 'source',
    fixtureUrl: '/tests/live/fixtures/property-native-idl-late-upgrade.ts',
    ownerTag: 'live-scoped-native-idl-owner',
    nativeChildName: 'LiveScopedNativeIdlChild',
    reactiveChildName: 'LiveScopedReactiveIdlChild',
  },
  {
    name: 'distribution',
    fixtureUrl: '/tests/live/fixtures/property-native-idl-scoped-distribution.ts',
    ownerTag: 'dist-scoped-native-idl-owner',
    nativeChildName: 'DistScopedNativeIdlChild',
    reactiveChildName: 'DistScopedReactiveIdlChild',
  },
] as const) {
test(`${build.name}: scoped registries preserve native semantics and declared reactive bindings`, async ({ page }) => {
  await page.goto('/guide.html');

  const result = await page.evaluate(async ({ fixtureUrl, ownerTag, nativeChildName, reactiveChildName }) => {
    const fixture = await import(fixtureUrl);
    const definitions = fixture.defineScopedNativeIdlScenario();
    const owner = document.createElement(ownerTag) as any;
    document.body.append(owner);
    await owner.ready;

    const nativeDirect = owner.shadowRoot.querySelector('[data-native-direct]') as any;
    const nativeSpread = owner.shadowRoot.querySelector('[data-native-spread]') as any;
    const lateNativeDirect = owner.shadowRoot.querySelector('[data-late-native-direct]') as any;
    const lateNativeSpread = owner.shadowRoot.querySelector('[data-late-native-spread]') as any;
    const reactiveDirect = owner.shadowRoot.querySelector('[data-reactive-direct]') as any;
    const reactiveSpread = owner.shadowRoot.querySelector('[data-reactive-spread]') as any;
    await Promise.all([reactiveDirect.ready, reactiveSpread.ready]);

    const initial = {
      upgraded: {
        nativeDirect: nativeDirect instanceof definitions[nativeChildName],
        nativeSpread: nativeSpread instanceof definitions[nativeChildName],
        reactiveDirect: reactiveDirect instanceof definitions[reactiveChildName],
        reactiveSpread: reactiveSpread instanceof definitions[reactiveChildName],
      },
      nativeDirect: {
        value: nativeDirect.role,
        attribute: nativeDirect.getAttribute('role'),
        own: Object.hasOwn(nativeDirect, 'role'),
      },
      nativeSpread: {
        value: nativeSpread.hidden,
        attribute: nativeSpread.hasAttribute('hidden'),
        own: Object.hasOwn(nativeSpread, 'hidden'),
      },
      lateNative: {
        directValue: lateNativeDirect.role,
        directAttribute: lateNativeDirect.getAttribute('role'),
        directOwn: Object.hasOwn(lateNativeDirect, 'role'),
        spreadValue: lateNativeSpread.hidden,
        spreadAttribute: lateNativeSpread.hasAttribute('hidden'),
        spreadOwn: Object.hasOwn(lateNativeSpread, 'hidden'),
      },
      reactiveDirect: {
        same: reactiveDirect.role === fixture.scopedReactiveDirectRole,
        attribute: reactiveDirect.getAttribute('role'),
        own: Object.hasOwn(reactiveDirect, 'role'),
      },
      reactiveSpread: {
        same: reactiveSpread.hidden === fixture.scopedReactiveSpreadHidden,
        attribute: reactiveSpread.getAttribute('hidden'),
        own: Object.hasOwn(reactiveSpread, 'hidden'),
      },
    };

    const LateNativeIdlChild = await definitions.defineLateNativeIdlChild();
    const lateDefined = {
      directUpgraded: lateNativeDirect instanceof LateNativeIdlChild,
      directValue: lateNativeDirect.role,
      directAttribute: lateNativeDirect.getAttribute('role'),
      directOwn: Object.hasOwn(lateNativeDirect, 'role'),
      spreadUpgraded: lateNativeSpread instanceof LateNativeIdlChild,
      spreadValue: lateNativeSpread.hidden,
      spreadAttribute: lateNativeSpread.hasAttribute('hidden'),
      spreadOwn: Object.hasOwn(lateNativeSpread, 'hidden'),
    };

    owner.nativeRole = 'menu';
    owner.nativeProps = {};
    await owner.rendered;
    return {
      initial,
      lateDefined,
      updated: {
        role: nativeDirect.role,
        roleAttribute: nativeDirect.getAttribute('role'),
        hidden: nativeSpread.hidden,
        hiddenAttribute: nativeSpread.hasAttribute('hidden'),
        ownRole: Object.hasOwn(nativeDirect, 'role'),
        ownHidden: Object.hasOwn(nativeSpread, 'hidden'),
      },
    };
  }, build);

  expect(result).toEqual({
    initial: {
      upgraded: {
        nativeDirect: true,
        nativeSpread: true,
        reactiveDirect: true,
        reactiveSpread: true,
      },
      nativeDirect: { value: 'button', attribute: 'button', own: false },
      nativeSpread: { value: true, attribute: true, own: false },
      lateNative: {
        directValue: 'switch',
        directAttribute: null,
        directOwn: true,
        spreadValue: true,
        spreadAttribute: false,
        spreadOwn: true,
      },
      reactiveDirect: { same: true, attribute: null, own: false },
      reactiveSpread: { same: true, attribute: null, own: false },
    },
    lateDefined: {
      directUpgraded: true,
      directValue: 'switch',
      directAttribute: 'switch',
      directOwn: false,
      spreadUpgraded: true,
      spreadValue: true,
      spreadAttribute: true,
      spreadOwn: false,
    },
    updated: {
      role: 'menu',
      roleAttribute: 'menu',
      hidden: false,
      hiddenAttribute: false,
      ownRole: false,
      ownHidden: false,
    },
  });
});
}
