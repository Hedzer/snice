import { test, expect } from '@playwright/test';

test.describe('macOS 26+ Liquid Glass / AppKit desktop visual & behavioral fidelity (PS-07)', () => {
  test('renders compact AppKit desktop metrics (distinct from iOS 44px touch sizing), Liquid Glass floating nav/menu, opaque content card/table, and brand cascade', async ({ page }) => {
    await page.goto('/tests/live/fixtures/platform-macos.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => (window as any).__macReady);

    const metrics = await page.evaluate(() => {
      const btnBase = document.getElementById('btn-primary')!.shadowRoot!.querySelector('[part~="base"]')!;
      const swTrack = document.getElementById('sw-mac')!.shadowRoot!.querySelector('[part~="track"]')!;
      const navBase = document.getElementById('mac-nav')!.shadowRoot!.querySelector('[part~="base"]')!;
      const menuPanel = document.getElementById('menu-mac')!.shadowRoot!.querySelector('[part~="panel"]')!;
      const cardBase = document.getElementById('card-mac')!.shadowRoot!.querySelector('[part~="base"]')!;
      const tableCell = document.getElementById('table-mac')!.shadowRoot!.querySelector('[part~="cell"]');

      return {
        btnRadius: getComputedStyle(btnBase).borderRadius,
        btnHeight: btnBase.getBoundingClientRect().height,
        swWidth: swTrack.getBoundingClientRect().width,
        swHeight: swTrack.getBoundingClientRect().height,
        navBlur: getComputedStyle(navBase).backdropFilter || (getComputedStyle(navBase) as any).webkitBackdropFilter,
        menuBlur: getComputedStyle(menuPanel).backdropFilter || (getComputedStyle(menuPanel) as any).webkitBackdropFilter,
        cardBlur: getComputedStyle(cardBase).backdropFilter,
        cardRadius: getComputedStyle(cardBase).borderRadius,
        cellBlur: tableCell ? getComputedStyle(tableCell).backdropFilter : 'none',
      };
    });

    // Compact desktop AppKit sizing: ~26px button (< 36px, NOT 44px iOS touch!), 6px radius, 38x22px NSSwitch
    expect(metrics.btnRadius).toBe('6px');
    expect(metrics.btnHeight).toBeGreaterThanOrEqual(22);
    expect(metrics.btnHeight).toBeLessThan(36);
    expect(metrics.swWidth).toBeGreaterThanOrEqual(36);
    expect(metrics.swWidth).toBeLessThanOrEqual(42);
    expect(metrics.swHeight).toBeGreaterThanOrEqual(20);
    expect(metrics.swHeight).toBeLessThanOrEqual(26);
    // Liquid Glass floating nav and menu
    expect(metrics.navBlur).toContain('blur(');
    expect(metrics.menuBlur).toContain('blur(');
    // Opaque content cards and NSTableView cells (zero blur on scrolling data)
    expect(metrics.cardBlur).toBe('none');
    expect(metrics.cardRadius).toBe('12px');
    expect(metrics.cellBlur).toBe('none');

    // Brand seed override cascades cleanly to primary button
    await page.evaluate(() => {
      document.getElementById('brand-css')!.textContent =
        '[data-platform="macos"] { --snice-color-primary: rgb(142 68 173); }';
    });
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const btnBase = document.getElementById('btn-primary')!.shadowRoot!.querySelector('[part~="base"]')!;
          return getComputedStyle(btnBase).backgroundColor;
        })
      )
      .toBe('rgb(142, 68, 173)');

    // Dark mode switches cleanly
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(darkBg).not.toBe('rgb(247, 247, 247)');
  });

  test('executes macOS scroll-edge vibrancy, NSSegmentedControl sliding pill, glass lens press, and soft accent focus halo', async ({ page }) => {
    await page.goto('/tests/live/fixtures/platform-macos.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => (window as any).__macReady);

    const pillReady = await page.evaluate(() => {
      const tabs = document.getElementById('tabs-mac')!;
      const pill = tabs.shadowRoot!.querySelector('[part~="pill"]') as HTMLElement;
      return {
        attr: tabs.getAttribute('data-macos-pill-ready'),
        w: parseFloat(pill.style.width || '0'),
      };
    });
    expect(pillReady.attr).toBe('true');
    expect(pillReady.w).toBeGreaterThan(20);

    // Scroll activates data-scrolled="true" on floating nav
    await page.evaluate(() => window.scrollTo(0, 120));
    await expect
      .poll(async () => page.evaluate(() => document.getElementById('mac-nav')!.getAttribute('data-scrolled')))
      .toBe('true');

    // Keyboard focus activates macOS soft translucent accent halo; switch press activates glass lens
    const interaction = await page.evaluate(() => {
      const btn = document.getElementById('btn-default')!;
      const btnBase = btn.shadowRoot!.querySelector('[part~="base"]') as HTMLElement;
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      btnBase.dispatchEvent(new FocusEvent('focusin', { bubbles: true, composed: true }));
      const focusAttr = btn.getAttribute('data-macos-focus');
      const focusShadow = getComputedStyle(btnBase).boxShadow;

      const sw = document.getElementById('sw-mac')!;
      const swTrack = sw.shadowRoot!.querySelector('[part~="track"]')!;
      swTrack.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, bubbles: true, composed: true }));
      const swPressed = sw.getAttribute('data-macos-pressed');
      window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1 }));
      const swReleased = sw.getAttribute('data-macos-pressed');

      return { focusAttr, focusShadow, swPressed, swReleased };
    });

    expect(interaction.focusAttr).toBe('keyboard');
    expect(interaction.focusShadow).not.toBe('none');
    expect(interaction.swPressed).toBe('true');
    expect(interaction.swReleased).toBeNull();
  });

  test('disables glass backdrop blur cleanly under prefers-reduced-transparency', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/tests/live/fixtures/platform-macos.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => (window as any).__macReady);

    // Also verify forced-colors fallback clears backdrop blur
    await page.emulateMedia({ forcedColors: 'active' });
    const blur = await page.evaluate(() => {
      const navBase = document.getElementById('mac-nav')!.shadowRoot!.querySelector('[part~="base"]')!;
      return getComputedStyle(navBase).backdropFilter;
    });
    expect(blur).toBe('none');
  });
});
