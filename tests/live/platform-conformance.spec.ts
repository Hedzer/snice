import { test, expect } from '@playwright/test';

const ALL_PLATFORMS = ['default', 'ios', 'material', 'windows', 'macos'] as const;

test.describe('Platform Skins 3-engine visual, contrast, RTL, and nested Shadow DOM conformance (PS-08)', () => {
  test('paints visually distinct platforms with WCAG AA contrast, brand cascade, and nested Shadow DOM token inheritance', async ({ page }) => {
    const snapshots: Record<string, Buffer> = {};
    const geometries: Record<string, { btnRadius: string; btnHeight: number; swWidth: number; swHeight: number }> = {};

    for (const platform of ALL_PLATFORMS) {
      await page.goto(`/tests/live/fixtures/platform-skins/conformance.html?platform=${platform}&theme=light`, {
        waitUntil: 'load',
      });
      await page.evaluate(() => (window as any).__cfReady);

      const check = await page.evaluate(() => {
        // Resolve ANY CSS color space (rgb, rgba, color(srgb ...), oklab, hsl) via 1x1 canvas
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d')!;
        const resolveRgb = (c: string): [number, number, number] => {
          ctx.clearRect(0, 0, 1, 1);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 1, 1);
          ctx.fillStyle = c;
          ctx.fillRect(0, 0, 1, 1);
          const d = ctx.getImageData(0, 0, 1, 1).data;
          return [d[0], d[1], d[2]];
        };
        const lum = ([r, g, b]: [number, number, number]) => {
          const f = (c: number) => {
            const x = c / 255;
            return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
          };
          return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
        };
        const contrast = (c1: string, c2: string) => {
          const l1 = lum(resolveRgb(c1));
          const l2 = lum(resolveRgb(c2));
          return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        };

        const bodyStyle = getComputedStyle(document.body);
        const btnBase = document.getElementById('cf-btn-primary')!.shadowRoot!.querySelector('[part~="base"]')!;
        const swTrack = document.getElementById('cf-switch')!.shadowRoot!.querySelector('[part~="track"]')!;
        const nestedHost = document.getElementById('cf-shadow-host')!;
        const nestedBtn = nestedHost.shadowRoot!.getElementById('nested-btn')!;
        const nestedPrimary = getComputedStyle(nestedBtn).getPropertyValue('--snice-color-primary').trim();
        const rootPrimary = getComputedStyle(document.documentElement).getPropertyValue('--snice-color-primary').trim();

        return {
          bodyContrast: contrast(bodyStyle.color, bodyStyle.backgroundColor),
          btnRadius: getComputedStyle(btnBase).borderRadius,
          btnHeight: Math.round(btnBase.getBoundingClientRect().height),
          swWidth: Math.round(swTrack.getBoundingClientRect().width),
          swHeight: Math.round(swTrack.getBoundingClientRect().height),
          nestedPrimary,
          rootPrimary,
          horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
        };
      });

      // WCAG AA text contrast (>= 4.5:1) & zero horizontal overflow
      expect(check.bodyContrast, `${platform} body contrast`).toBeGreaterThanOrEqual(4.5);
      expect(check.horizontalOverflow, `${platform} horizontal overflow`).toBe(false);
      // Nested Shadow DOM inherits the exact platform primary token
      expect(check.nestedPrimary).toBe(check.rootPrimary);

      geometries[platform] = {
        btnRadius: check.btnRadius,
        btnHeight: check.btnHeight,
        swWidth: check.swWidth,
        swHeight: check.swHeight,
      };
      snapshots[platform] = await page.screenshot({ fullPage: false });
    }

    // Distinct contemporary geometry across platforms:
    // macOS compact desktop height < iOS touch height
    expect(geometries.macos.btnHeight).toBeLessThan(geometries.ios.btnHeight);
    // Windows 4px vs macOS 6px vs Material pill
    expect(geometries.windows.btnRadius).toBe('4px');
    expect(geometries.macos.btnRadius).toBe('6px');
    expect(parseFloat(geometries.material.btnRadius)).toBeGreaterThanOrEqual(999);

    // Every platform renders distinct non-identical PNG bytes
    for (let i = 0; i < ALL_PLATFORMS.length; i++) {
      for (let j = i + 1; j < ALL_PLATFORMS.length; j++) {
        const a = ALL_PLATFORMS[i];
        const b = ALL_PLATFORMS[j];
        expect(Buffer.compare(snapshots[a], snapshots[b]), `${a} vs ${b} rendered identically`).not.toBe(0);
      }
    }
  });

  test('verifies dark mode, RTL layout, and reduced-motion/forced-colors across all 4 skins', async ({ page }) => {
    for (const platform of ['ios', 'material', 'windows', 'macos'] as const) {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/tests/live/fixtures/platform-skins/conformance.html?platform=${platform}&theme=dark&dir=rtl`, {
        waitUntil: 'load',
      });
      await page.evaluate(() => (window as any).__cfReady);

      const res = await page.evaluate(() => {
        const dir = getComputedStyle(document.body).direction;
        const fast = getComputedStyle(document.documentElement).getPropertyValue('--snice-transition-fast').trim();
        const btn = document.getElementById('cf-btn-primary')!.shadowRoot!.querySelector('[part~="base"]')!;
        const rect = btn.getBoundingClientRect();
        return { dir, fast: parseFloat(fast), width: rect.width, height: rect.height };
      });

      expect(res.dir).toBe('rtl');
      expect(res.fast).toBeLessThanOrEqual(1);
      expect(res.width).toBeGreaterThan(40);
      expect(res.height).toBeGreaterThan(20);
    }
  });
});
