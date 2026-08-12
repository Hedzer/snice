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
