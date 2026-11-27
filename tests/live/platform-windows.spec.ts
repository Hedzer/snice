import { test, expect } from '@playwright/test';

test.describe('Windows 11 Fluent 2 / WinUI 3 visual & behavioral fidelity (PS-06)', () => {
  test('renders 4px control radius, 32px desktop height, Mica layered cards (0 blur), transient Acrylic menu, 40x20px ToggleSwitch, and brand cascade', async ({ page }) => {
    await page.goto('/tests/live/fixtures/platform-windows.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => (window as any).__winReady);

    const metrics = await page.evaluate(() => {
      const btnBase = document.getElementById('btn-primary')!.shadowRoot!.querySelector('[part~="base"]')!;
      const swTrack = document.getElementById('sw-win')!.shadowRoot!.querySelector('[part~="track"]')!;
      const cardBase = document.getElementById('card-win')!.shadowRoot!.querySelector('[part~="base"]')!;
      const menuPanel = document.getElementById('menu-win')!.shadowRoot!.querySelector('[part~="panel"]')!;
      const tableCell = document.getElementById('table-win')!.shadowRoot!.querySelector('[part~="cell"]');
      const btnBgBefore = getComputedStyle(btnBase).backgroundColor;

      return {
        btnRadius: getComputedStyle(btnBase).borderRadius,
        btnHeight: btnBase.getBoundingClientRect().height,
        swWidth: swTrack.getBoundingClientRect().width,
        swHeight: swTrack.getBoundingClientRect().height,
        cardRadius: getComputedStyle(cardBase).borderRadius,
        cardBlur: getComputedStyle(cardBase).backdropFilter,
        menuBlur: getComputedStyle(menuPanel).backdropFilter || (getComputedStyle(menuPanel) as any).webkitBackdropFilter,
        cellBlur: tableCell ? getComputedStyle(tableCell).backdropFilter : 'none',
        btnBgBefore,
      };
    });

    // Authentic WinUI 3 metrics: 4px control radius, ~32px desktop height, 40x20 ToggleSwitch
    expect(metrics.btnRadius).toBe('4px');
    expect(metrics.btnHeight).toBeGreaterThanOrEqual(30);
    expect(metrics.btnHeight).toBeLessThanOrEqual(38);
    expect(metrics.swWidth).toBeGreaterThanOrEqual(38);
    expect(metrics.swWidth).toBeLessThanOrEqual(44);
    expect(metrics.swHeight).toBeGreaterThanOrEqual(18);
    expect(metrics.swHeight).toBeLessThanOrEqual(24);
    expect(metrics.cardRadius).toBe('8px');
    // Mica cards and DataGrid cells must never apply live backdrop-filter blur
    expect(metrics.cardBlur).toBe('none');
    expect(metrics.cellBlur).toBe('none');
    // Transient Acrylic menu flyout applies backdrop blur
    expect(metrics.menuBlur).toContain('blur(');

    // Brand seed override cascades cleanly to primary button
    await page.evaluate(() => {
      document.getElementById('brand-css')!.textContent =
        '[data-platform="windows"] { --snice-color-primary: rgb(16 124 16); }';
    });
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const btnBase = document.getElementById('btn-primary')!.shadowRoot!.querySelector('[part~="base"]')!;
          return getComputedStyle(btnBase).backgroundColor;
        })
      )
      .toBe('rgb(16, 124, 16)');

    // Dark mode switches cleanly
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(darkBg).not.toBe('rgb(243, 243, 243)');
  });

  test('enforces WinUI 3 keyboard-only dual-stroke focus and ToggleSwitch press elongation', async ({ page }) => {
    await page.goto('/tests/live/fixtures/platform-windows.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => (window as any).__winReady);

    const interaction = await page.evaluate(() => {
      const btn = document.getElementById('btn-standard')!;
      const sw = document.getElementById('sw-win')!;
      const btnBase = btn.shadowRoot!.querySelector('[part~="base"]') as HTMLElement;

      // Pointer focus must NOT show keyboard dual-stroke ring
      document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      btnBase.dispatchEvent(new FocusEvent('focusin', { bubbles: true, composed: true }));
      const pointerFocusAttr = btn.getAttribute('data-win-focus');
      btnBase.dispatchEvent(new FocusEvent('focusout', { bubbles: true, composed: true }));

      // Keyboard Tab focus MUST enable dual-stroke focus ring
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      btnBase.dispatchEvent(new FocusEvent('focusin', { bubbles: true, composed: true }));
      const keyboardFocusAttr = btn.getAttribute('data-win-focus');
      const focusShadow = getComputedStyle(btnBase).boxShadow;

      // ToggleSwitch press elongation
      const swTrack = sw.shadowRoot!.querySelector('[part~="track"]')!;
      swTrack.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, bubbles: true, composed: true }));
      const swPressed = sw.getAttribute('data-win-pressed');
      window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1 }));
      const swReleased = sw.getAttribute('data-win-pressed');

      return { pointerFocusAttr, keyboardFocusAttr, focusShadow, swPressed, swReleased };
    });

    expect(interaction.pointerFocusAttr).toBeNull();
    expect(interaction.keyboardFocusAttr).toBe('keyboard');
    expect(interaction.focusShadow).not.toBe('none');
    expect(interaction.swPressed).toBe('true');
    expect(interaction.swReleased).toBeNull();
  });

  test('honors forced-colors and reduced-motion cleanly without clipping', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
    await page.goto('/tests/live/fixtures/platform-windows.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => (window as any).__winReady);

    const check = await page.evaluate(() => {
      const menuPanel = document.getElementById('menu-win')!.shadowRoot!.querySelector('[part~="panel"]')!;
      const btnBase = document.getElementById('btn-primary')!.shadowRoot!.querySelector('[part~="base"]')!;
      return {
        menuBlur: getComputedStyle(menuPanel).backdropFilter,
        btnHeight: btnBase.getBoundingClientRect().height,
        btnWidth: btnBase.getBoundingClientRect().width,
      };
    });

    // Forced-colors disables acrylic blur so Windows High Contrast themes remain crisp
    expect(check.menuBlur).toBe('none');
    expect(check.btnHeight).toBeGreaterThan(24);
    expect(check.btnWidth).toBeGreaterThan(36);
  });
});
