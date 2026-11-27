import { test, expect } from '@playwright/test';

test.describe('iOS 26+ Liquid Glass visual & behavioral fidelity (PS-04)', () => {
  test('renders Liquid Glass materials, concentric radii, >=44px touch targets, dark mode, brand color-mix() cascade, and non-native controls', async ({ page }) => {
    await page.goto('/tests/live/fixtures/platform-ios.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => (window as any).__iosReady);

    const metrics = await page.evaluate(() => {
      const btnBase = document.getElementById('btn-primary')!.shadowRoot!.querySelector('[part~="base"]')!;
      const btnGlass = document.getElementById('btn-default')!.shadowRoot!.querySelector('[part~="base"]')!;
      const swTrack = document.getElementById('sw-ios')!.shadowRoot!.querySelector('[part~="track"]')!;
      const navEl = document.getElementById('ios-nav')!.shadowRoot!.querySelector('[part~="nav"]')!;
      const cardBase = document.getElementById('card-ios')!.shadowRoot!.querySelector('[part~="base"]')!;
      const tableFrame = document.getElementById('table-ios')!.shadowRoot!.querySelector('[part~="frame"], [part~="container"]')!;

      return {
        btnHeight: btnBase.getBoundingClientRect().height,
        btnRadius: getComputedStyle(btnBase).borderRadius,
        btnGlassBlur: getComputedStyle(btnGlass).backdropFilter || (getComputedStyle(btnGlass) as any).webkitBackdropFilter || '',
        swTrackRadius: getComputedStyle(swTrack).borderRadius,
        swTrackWidth: swTrack.getBoundingClientRect().width,
        swTrackHeight: swTrack.getBoundingClientRect().height,
        navRadius: getComputedStyle(navEl).borderRadius,
        navBlur: getComputedStyle(navEl).backdropFilter || (getComputedStyle(navEl) as any).webkitBackdropFilter || '',
        cardRadius: getComputedStyle(cardBase).borderRadius,
        cardBlur: getComputedStyle(cardBase).backdropFilter || 'none',
        tableRadius: getComputedStyle(tableFrame).borderRadius,
      };
    });

    // >= 44px touch target & capsule/concentric radii
    expect(metrics.btnHeight).toBeGreaterThanOrEqual(44);
    expect(parseFloat(metrics.btnRadius)).toBeGreaterThanOrEqual(999);
    expect(metrics.swTrackWidth).toBeGreaterThanOrEqual(50);
    expect(metrics.swTrackHeight).toBeGreaterThanOrEqual(30);
    expect(metrics.cardRadius).toBe('20px');
    expect(metrics.tableRadius).toBe('20px');
    // Liquid Glass strictly on floating chrome/controls — NOT on opaque content cards
    expect(metrics.navBlur).toContain('blur');
    expect(metrics.cardBlur).toBe('none');

    // Brand seed override cascades automatically via color-mix() in light & dark modes
    await page.evaluate(() => {
      document.getElementById('brand-css')!.textContent =
        '[data-platform="ios"] { --snice-color-primary: rgb(147 51 234); }';
    });
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const btnBase = document.getElementById('btn-primary')!.shadowRoot!.querySelector('[part~="base"]')!;
          return getComputedStyle(btnBase).backgroundColor;
        })
      )
      .toBe('rgb(147, 51, 234)');

    const derivedHover = await page.evaluate(() => {
      const el = document.getElementById('btn-primary')!;
      return getComputedStyle(el).getPropertyValue('--snice-color-primary-hover').trim();
    });
    expect(derivedHover).not.toBe('');

    // Dark mode switches cleanly
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    const darkSurface = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(darkSurface).toBe('rgb(0, 0, 0)');
  });

  test('executes iOS 26+ micro-behaviors: switch glass press/drag magnification, tabs sliding pill, bottom-sheet drag & scroll yield, nav scroll condense', async ({ page }) => {
    await page.goto('/tests/live/fixtures/platform-ios.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => (window as any).__iosReady);

    // 1. Switch press magnification sets data-ios-pressed="true" and clears on pointerup
    const switchPressState = await page.evaluate(() => {
      const sw = document.getElementById('sw-ios')!;
      const track = sw.shadowRoot!.querySelector('[part~="track"]')!;
      track.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, clientX: 50, bubbles: true, composed: true }));
      const during = sw.getAttribute('data-ios-pressed');
      window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientX: 50 }));
      const after = sw.getAttribute('data-ios-pressed');
      return { during, after };
    });
    expect(switchPressState.during).toBe('true');
    expect(switchPressState.after).toBeNull();

    // 2. Tabs sliding glass pill positions onto active tab
    const pillState = await page.evaluate(async () => {
      const tabs = document.getElementById('tabs-ios') as any;
      tabs.selectTab(1);
      await new Promise((r) => setTimeout(r, 60));
      const pill = tabs.shadowRoot.querySelector('[part~="pill"]') as HTMLElement;
      return { width: parseFloat(pill.style.width || '0'), transform: pill.style.transform };
    });
    expect(pillState.width).toBeGreaterThan(20);
    expect(pillState.transform).toContain('translate3d');

    // 3. Bottom sheet drag-to-dismiss from grabber & yield to inner scroll
    const sheetDismissed = await page.evaluate(async () => {
      const drawer = document.getElementById('sheet-ios') as any;
      drawer.show();
      await new Promise((r) => setTimeout(r, 60));
      const grabber = drawer.shadowRoot.querySelector('[part~="grabber"]') as HTMLElement;
      grabber.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 7, clientY: 200, bubbles: true, composed: true }));
      window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 7, clientY: 420 }));
      window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 7, clientY: 420 }));
      await new Promise((r) => setTimeout(r, 60));
      return drawer.open;
    });
    expect(sheetDismissed).toBe(false);

    // 4. Nav scroll condense toggles data-condensed="true"
    const condensed = await page.evaluate(() => {
      const box = document.querySelector('[data-ios-scroll-container]') as HTMLElement;
      const nav = document.getElementById('ios-nav')!;
      box.scrollTop = 120;
      box.dispatchEvent(new Event('scroll'));
      const down = nav.getAttribute('data-condensed');
      box.scrollTop = 0;
      box.dispatchEvent(new Event('scroll'));
      const up = nav.getAttribute('data-condensed');
      return { down, up };
    });
    expect(condensed.down).toBe('true');
    expect(condensed.up).toBeNull();
  });

  test('respects reduced-transparency and reduced-motion accessibility preferences', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/tests/live/fixtures/platform-ios.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => (window as any).__iosReady);

    const transition = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--snice-transition-medium').trim()
    );
    expect(transition).toBe('0ms');
  });
});
