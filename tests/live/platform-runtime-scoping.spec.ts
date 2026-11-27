import { test, expect } from '@playwright/test';
import { compileScopedPlatformCss } from '../../tooling/build/compile-scoped-platforms.mjs';

const IOS_FIXTURE_CSS = compileScopedPlatformCss(
  'ios',
  `
    :root {
      --snice-color-primary: rgb(0 122 255);
      --snice-border-radius-md: 14px;
    }
    [data-theme="dark"] {
      --snice-color-primary: rgb(10 132 255);
    }
  `,
  [
    {
      tagName: 'snice-switch',
      css: `[part~="track"] { border-radius: 9999px; outline: 2px solid rgb(0 122 255); }`,
    },
    {
      tagName: 'snice-button',
      css: `[part~="base"] { border-radius: 14px; }`,
    },
  ],
  { minify: true }
);

const MATERIAL_FIXTURE_CSS = compileScopedPlatformCss(
  'material',
  `
    :root {
      --snice-color-primary: rgb(103 80 164);
      --snice-border-radius-md: 20px;
    }
    [data-theme="dark"] {
      --snice-color-primary: rgb(208 188 255);
    }
  `,
  [
    {
      tagName: 'snice-switch',
      css: `[part~="track"] { border-radius: 16px; }`,
    },
    {
      tagName: 'snice-button',
      css: `[part~="base"] { border-radius: 20px; }`,
    },
  ],
  { minify: true }
);

test.describe('Runtime [data-platform] pure-CSS scoping & lazy behavior binding (PS-03)', () => {
  test('isolates default, side-by-side, and arbitrarily nested [data-platform] subtrees regardless of stylesheet load order', async ({ page }) => {
    await page.goto('/tests/live/fixtures/platform-scoping.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => (window as any).__fixtureReady);

    // Load material BEFORE ios AND also verify reverse order:
    // outer ios has `outline: 2px solid rgb(0, 122, 255)` on switch track which material does NOT set!
    // Donut scoping guarantees zero inward leakage onto #sw-nested-mat even though ios loads AFTER material.
    await page.evaluate(({ matCss, iosCss }) => {
      document.getElementById('scoped-material')!.textContent = matCss;
      document.getElementById('scoped-ios')!.textContent = iosCss;
    }, { matCss: MATERIAL_FIXTURE_CSS, iosCss: IOS_FIXTURE_CSS });

    const styles = await page.evaluate(() => {
      const readTrack = (id: string) => {
        const el = document.getElementById(id)!;
        const track = el.shadowRoot!.querySelector('[part~="track"]')!;
        const cs = getComputedStyle(track);
        return {
          radius: cs.borderRadius,
          outlineStyle: cs.outlineStyle,
          primary: getComputedStyle(el).getPropertyValue('--snice-color-primary').trim(),
        };
      };
      const readBtn = (id: string) => {
        const el = document.getElementById(id)!;
        const base = el.shadowRoot!.querySelector('[part~="base"]')!;
        return getComputedStyle(base).borderRadius;
      };
      return {
        def: readTrack('sw-default'),
        ios: readTrack('sw-ios'),
        mat: readTrack('sw-mat'),
        nestedMat: readTrack('sw-nested-mat'),
        nestedIos: readTrack('sw-nested-ios'),
        deepIos: readTrack('sw-deep-ios'),
        btnDef: readBtn('btn-default'),
        btnIos: readBtn('btn-ios'),
        btnMat: readBtn('btn-mat'),
        btnNestedMat: readBtn('btn-nested-mat'),
      };
    });

    // Default unwrapped element unaffected
    expect(styles.def.outlineStyle).toBe('none');
    expect(styles.btnDef).not.toBe('14px');
    expect(styles.btnDef).not.toBe('20px');

    // Side-by-side iOS vs Material
    expect(styles.ios.outlineStyle).toBe('solid');
    expect(styles.btnIos).toBe('14px');
    expect(styles.mat.outlineStyle).toBe('none');
    expect(styles.mat.radius).toBe('16px');
    expect(styles.btnMat).toBe('20px');

    // Nested Material inside iOS: zero inward leakage from outer iOS outline & exact Material radius
    expect(styles.nestedMat.outlineStyle).toBe('none');
    expect(styles.nestedMat.radius).toBe('16px');
    expect(styles.btnNestedMat).toBe('20px');

    // Nested iOS inside Material: exact iOS outline & radius
    expect(styles.nestedIos.outlineStyle).toBe('solid');

    // Depth-3 iOS inside Material inside iOS: exact iOS outline
    expect(styles.deepIos.outlineStyle).toBe('solid');

    // Compose with [data-theme="dark"] and user --snice-color-primary brand override
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    const darkColors = await page.evaluate(() => ({
      ios: getComputedStyle(document.getElementById('ios-zone')!).getPropertyValue('--snice-color-primary').trim(),
      mat: getComputedStyle(document.getElementById('material-zone')!).getPropertyValue('--snice-color-primary').trim(),
    }));
    expect(darkColors.ios).toBe('rgb(10 132 255)');
    expect(darkColors.mat).toBe('rgb(208 188 255)');
  });

  test('live data-platform toggling with enableRuntimePlatformBehaviors preserves focus, input value, checked state, form association, and listeners with leak-free dispose()', async ({ page }) => {
    await page.goto('/tests/live/fixtures/platform-scoping.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => (window as any).__fixtureReady);

    await page.evaluate(({ matCss, iosCss }) => {
      document.getElementById('scoped-ios')!.textContent = iosCss;
      document.getElementById('scoped-material')!.textContent = matCss;
    }, { matCss: MATERIAL_FIXTURE_CSS, iosCss: IOS_FIXTURE_CSS });

    const result = await page.evaluate(async () => {
      const log: string[] = [];
      const toggleZone = document.getElementById('toggle-zone')!;
      const inputEl = document.getElementById('toggle-input') as any;
      const switchEl = document.getElementById('toggle-switch') as any;
      const formEl = document.getElementById('toggle-form') as HTMLFormElement;

      let changeEvents = 0;
      switchEl.addEventListener('switch-change', () => { changeEvents++; });

      // Attach runtime lazy behavior binder with tracked loaders
      const handle = (window as any).__enableRuntimePlatformBehaviors(toggleZone, {
        loaders: {
          ios: async () => ({
            platform: 'ios',
            attach: (el: Element) => {
              log.push('attach:ios:' + el.id);
              return () => log.push('detach:ios:' + el.id);
            },
          }),
          material: async () => ({
            platform: 'material',
            attach: (el: Element) => {
              log.push('attach:material:' + el.id);
              return () => log.push('detach:material:' + el.id);
            },
          }),
          windows: async () => {
            log.push('loaded-unexpected:windows');
            return { platform: 'windows', attach: () => () => {} };
          },
          macos: async () => {
            log.push('loaded-unexpected:macos');
            return { platform: 'macos', attach: () => () => {} };
          },
        },
      });

      await new Promise((r) => setTimeout(r, 30));

      // Establish user state: focus input, type text, toggle switch checked
      const innerInput = inputEl.shadowRoot.querySelector('input') as HTMLInputElement;
      innerInput.focus();
      inputEl.value = 'Typed by user';
      switchEl.click();

      const sameInputRefBefore = inputEl;
      const sameSwitchRefBefore = switchEl;

      // Live switch: ios -> material -> default -> ios
      toggleZone.setAttribute('data-platform', 'material');
      await new Promise((r) => setTimeout(r, 30));
      const matTrackRadius = getComputedStyle(switchEl.shadowRoot.querySelector('[part~="track"]')).borderRadius;

      toggleZone.setAttribute('data-platform', 'default');
      await new Promise((r) => setTimeout(r, 30));
      const activeDuringDefault = handle.getActivePlatforms();

      toggleZone.setAttribute('data-platform', 'ios');
      await new Promise((r) => setTimeout(r, 30));

      const focusPreserved = document.activeElement === inputEl;
      const valuePreserved = inputEl.value === 'Typed by user';
      const checkedPreserved = switchEl.checked === true;
      const sameRefs =
        document.getElementById('toggle-input') === sameInputRefBefore &&
        document.getElementById('toggle-switch') === sameSwitchRefBefore;
      const formConnected = switchEl.form === formEl && inputEl.form === formEl;

      // Listener still attached after live switches
      switchEl.click();

      // Dispose cleanly
      handle.dispose();
      const activeAfterDispose = handle.getActivePlatforms();

      // Further mutations after dispose must not attach anything
      toggleZone.setAttribute('data-platform', 'material');
      await new Promise((r) => setTimeout(r, 30));

      return {
        log,
        matTrackRadius,
        activeDuringDefault,
        activeAfterDispose,
        focusPreserved,
        valuePreserved,
        checkedPreserved,
        sameRefs,
        formConnected,
        changeEvents,
      };
    });

    expect(result.matTrackRadius).toBe('16px');
    expect(result.focusPreserved).toBe(true);
    expect(result.valuePreserved).toBe(true);
    expect(result.checkedPreserved).toBe(true);
    expect(result.sameRefs).toBe(true);
    expect(result.formConnected).toBe(true);
    expect(result.changeEvents).toBe(2);
    expect(result.activeDuringDefault).toEqual([]);
    expect(result.activeAfterDispose).toEqual([]);
    expect(result.log).toEqual([
      'attach:ios:toggle-zone',
      'detach:ios:toggle-zone',
      'attach:material:toggle-zone',
      'detach:material:toggle-zone',
      'attach:ios:toggle-zone',
      'detach:ios:toggle-zone',
    ]);
  });
});
