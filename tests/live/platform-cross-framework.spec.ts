import { test, expect } from '@playwright/test';

const SKIN_PLATFORMS = ['ios', 'material', 'windows', 'macos'] as const;

test.describe('Cross-framework Vanilla HTML vs React 19 adapter platform parity (PS-08)', () => {
  for (const platform of SKIN_PLATFORMS) {
    test(`renders identical computed tokens, geometry, and events in Vanilla vs React for "${platform}"`, async ({ page }) => {
      await page.goto(`/tests/live/fixtures/platform-skins/cross-framework.html?platform=${platform}`, {
        waitUntil: 'load',
      });
      await page.evaluate(() => (window as any).__xfReady);

      // Wait for React's post-mount property sync transitions to settle, then assert exact parity
      await expect
        .poll(async () =>
          page.evaluate(() => {
            const readMetrics = (prefix: string) => {
              const btnBase = document.getElementById(`${prefix}-btn`)!.shadowRoot!.querySelector('[part~="base"]')!;
              const swTrack = document.getElementById(`${prefix}-sw`)!.shadowRoot!.querySelector('[part~="track"]')!;
              const inpEl = document.getElementById(`${prefix}-inp`)!.shadowRoot!.querySelector('[part~="input"]')!;
              const chipBase = document.getElementById(`${prefix}-chip`)!.shadowRoot!.querySelector('[part~="base"]')!;
              const cardBase = document.getElementById(`${prefix}-card`)!.shadowRoot!.querySelector('[part~="base"]')!;

              return {
                btnBg: getComputedStyle(btnBase).backgroundColor,
                btnRadius: getComputedStyle(btnBase).borderRadius,
                btnHeight: Math.round(btnBase.getBoundingClientRect().height),
                swWidth: Math.round(swTrack.getBoundingClientRect().width),
                swHeight: Math.round(swTrack.getBoundingClientRect().height),
                inpRadius: getComputedStyle(inpEl).borderRadius,
                chipRadius: getComputedStyle(chipBase).borderRadius,
                cardRadius: getComputedStyle(cardBase).borderRadius,
                cardBg: getComputedStyle(cardBase).backgroundColor,
              };
            };

            const vanilla = readMetrics('v');
            const react = readMetrics('r');
            return JSON.stringify(react) === JSON.stringify(vanilla) ? 'match' : { vanilla, react };
          })
        )
        .toBe('match');

      // Verify identical click event dispatch
      const events = await page.evaluate(() => {
        (document.getElementById('v-btn')!.shadowRoot!.querySelector('[part~="base"]') as HTMLElement).click();
        (document.getElementById('r-btn')!.shadowRoot!.querySelector('[part~="base"]') as HTMLElement).click();
        return (window as any).__events;
      });
      expect(events.vanillaClicks).toBe(1);
      expect(events.reactClicks).toBe(1);
    });
  }
});
