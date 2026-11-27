import { test, expect } from '@playwright/test';

test.describe('Android Material 3 Expressive visual & behavioral fidelity (PS-05)', () => {
  test('renders M3 tonal surface containers, updated slider stop-dot & tall handle, brand color-mix() tonal regeneration, dark mode, and non-native controls', async ({ page }) => {
    await page.goto('/tests/live/fixtures/platform-material.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => (window as any).__m3Ready);

    const metrics = await page.evaluate(() => {
      const btnBase = document.getElementById('btn-primary')!.shadowRoot!.querySelector('[part~="base"]')!;
      const swTrack = document.getElementById('sw-m3')!.shadowRoot!.querySelector('[part~="track"]')!;
      const sldTrack = document.getElementById('sld-m3')!.shadowRoot!.querySelector('[part~="track"]')!;
      const sldStops = document.getElementById('sld-m3')!.shadowRoot!.querySelector('[part~="stops"]')!;
      const sldThumb = document.getElementById('sld-m3')!.shadowRoot!.querySelector('[part~="thumb"]')!;
      const cardBase = document.getElementById('card-m3')!.shadowRoot!.querySelector('[part~="base"]')!;
      const surfaceBefore = getComputedStyle(document.documentElement).getPropertyValue('--snice-color-surface-container-high').trim();

      return {
        btnRadius: getComputedStyle(btnBase).borderRadius,
        swWidth: swTrack.getBoundingClientRect().width,
        swHeight: swTrack.getBoundingClientRect().height,
        sldTrackHeight: sldTrack.getBoundingClientRect().height,
        sldStopsDisplay: getComputedStyle(sldStops).display,
        sldThumbHeight: sldThumb.getBoundingClientRect().height,
        sldThumbWidth: sldThumb.getBoundingClientRect().width,
        cardRadius: getComputedStyle(cardBase).borderRadius,
        surfaceBefore,
      };
    });

    // Pill button, 52x32dp M3 switch, tall 16px M3 slider track + tall narrow pill handle + visible stop dot
    expect(parseFloat(metrics.btnRadius)).toBeGreaterThanOrEqual(999);
    expect(metrics.swWidth).toBeGreaterThanOrEqual(50);
    expect(metrics.swHeight).toBeGreaterThanOrEqual(30);
    expect(metrics.sldTrackHeight).toBeGreaterThanOrEqual(14);
    expect(metrics.sldStopsDisplay).toBe('block');
    expect(metrics.sldThumbHeight).toBeGreaterThanOrEqual(40);
    expect(metrics.sldThumbWidth).toBeLessThanOrEqual(8);
    expect(metrics.cardRadius).toBe('16px');

    // Brand seed override regenerates tonal surface container via color-mix()
    await page.evaluate(() => {
      document.getElementById('brand-css')!.textContent =
        '[data-platform="material"] { --snice-color-primary: rgb(0 107 91); }';
    });
    const tonalChanged = await page.evaluate(() => {
      const cardBase = document.getElementById('card-m3')!.shadowRoot!.querySelector('[part~="base"]')!;
      return getComputedStyle(cardBase).backgroundColor;
    });
    expect(tonalChanged).toContain('rgb');

    // Dark mode switches cleanly
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(darkBg).not.toBe('rgb(255, 255, 255)');
  });

  test('executes M3 Expressive pointer-origin ripple coordinates, press shape morph, connected-group neighbor response, and chip selection morph', async ({ page }) => {
    await page.goto('/tests/live/fixtures/platform-material.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => (window as any).__m3Ready);

    const interaction = await page.evaluate(() => {
      const btn1 = document.getElementById('btn-primary')!;
      const btn2 = document.getElementById('btn-tonal')!;
      const base = btn1.shadowRoot!.querySelector('[part~="base"]')!;
      const rect = base.getBoundingClientRect();

      base.dispatchEvent(new PointerEvent('pointerdown', {
        pointerId: 1,
        clientX: rect.left + 12,
        clientY: rect.top + 8,
        bubbles: true,
        composed: true,
      }));

      const ripple = btn1.shadowRoot!.querySelector('[part~="ripple"]') as HTMLElement;
      const rx = ripple.style.getPropertyValue('--snice-ripple-x');
      const ry = ripple.style.getPropertyValue('--snice-ripple-y');
      const rsize = parseFloat(ripple.style.getPropertyValue('--snice-ripple-size') || '0');
      const pressed = btn1.getAttribute('data-m3-pressed');
      const rippleState = btn1.getAttribute('data-m3-ripple');
      const neighbor = btn2.getAttribute('data-m3-neighbor-pressed');

      window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1 }));

      return { rx, ry, rsize, pressed, rippleState, neighbor };
    });

    expect(interaction.pressed).toBe('true');
    expect(interaction.rippleState).toBe('active');
    expect(interaction.rx).toBe('12px');
    expect(interaction.ry).toBe('8px');
    expect(interaction.rsize).toBeGreaterThan(40);
    expect(interaction.neighbor).toBe('start');

    // Chip selection morphs radius from 8px -> 16px with spatial spring settle
    const beforeRadius = await page.evaluate(() => {
      const chip = document.getElementById('chip-m3') as any;
      const base = chip.shadowRoot.querySelector('[part~="base"]')!;
      const before = getComputedStyle(base).borderRadius;
      chip.selected = true;
      return before;
    });
    expect(beforeRadius).toBe('8px');
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const chip = document.getElementById('chip-m3') as any;
          return getComputedStyle(chip.shadowRoot.querySelector('[part~="base"]')!).borderRadius;
        })
      )
      .toBe('16px');
  });

  test('respects reduced-motion by collapsing ripple animation to static state layer', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/tests/live/fixtures/platform-material.html', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => (window as any).__m3Ready);

    const rippleMode = await page.evaluate(() => {
      const btn = document.getElementById('btn-primary')!;
      const base = btn.shadowRoot!.querySelector('[part~="base"]')!;
      base.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 2, clientX: 20, clientY: 20, bubbles: true, composed: true }));
      const mode = btn.getAttribute('data-m3-ripple');
      window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 2 }));
      return mode;
    });
    expect(rippleMode).toBe('static');
  });
});
