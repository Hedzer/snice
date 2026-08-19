import { test, expect } from '@playwright/test';

const demoPath = 'http://localhost:5566/tests/live/fixtures/action-bar/visual.html';

// The first pill bar on the demo page holds six snice-button children.
const BAR = 'snice-action-bar[variant="pill"][position="bottom"]:not([size])';

async function focusedButtonIndex(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate((sel) => {
    const bar = document.querySelector(sel)!;
    const buttons = Array.from(bar.querySelectorAll('snice-button'));
    return buttons.indexOf(document.activeElement as HTMLElement);
  }, BAR);
}

test.describe('Snice Action Bar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!customElements.get('snice-action-bar'));
    await page.waitForFunction((sel) => {
      const bar = document.querySelector(sel) as HTMLElement | null;
      return !!bar?.shadowRoot?.querySelector('.action-bar') && bar.hasAttribute('ready');
    }, BAR);
    await page.evaluate((sel) => {
      (document.querySelector(sel) as any).show();
      (document.querySelector(sel) as HTMLElement).scrollIntoView({ block: 'center' });
    }, BAR);
  });

  test('applies roving tabindex to snice-button children', async ({ page }) => {
    const tabindexes = await page.evaluate((sel) => {
      const bar = document.querySelector(sel)!;
      return Array.from(bar.querySelectorAll('snice-button')).map(b => b.getAttribute('tabindex'));
    }, BAR);

    expect(tabindexes[0]).toBe('0');
    expect(tabindexes.slice(1)).toEqual(Array(tabindexes.length - 1).fill('-1'));
  });

  test('ArrowRight moves focus to the next snice-button', async ({ page }) => {
    await page.evaluate((sel) => {
      (document.querySelector(sel)!.querySelector('snice-button') as HTMLElement).focus();
    }, BAR);
    expect(await focusedButtonIndex(page)).toBe(0);

    await page.keyboard.press('ArrowRight');
    expect(await focusedButtonIndex(page)).toBe(1);

    await page.keyboard.press('ArrowRight');
    expect(await focusedButtonIndex(page)).toBe(2);
  });

  test('End and Home jump to last and first buttons', async ({ page }) => {
    await page.evaluate((sel) => {
      (document.querySelector(sel)!.querySelector('snice-button') as HTMLElement).focus();
    }, BAR);

    await page.keyboard.press('End');
    expect(await focusedButtonIndex(page)).toBe(5);

    await page.keyboard.press('Home');
    expect(await focusedButtonIndex(page)).toBe(0);
  });

  test('ArrowLeft from the first button wraps to the last', async ({ page }) => {
    await page.evaluate((sel) => {
      (document.querySelector(sel)!.querySelector('snice-button') as HTMLElement).focus();
    }, BAR);

    await page.keyboard.press('ArrowLeft');
    expect(await focusedButtonIndex(page)).toBe(5);
  });

  test('Escape closes the bar when focus is inside', async ({ page }) => {
    await page.evaluate((sel) => {
      (document.querySelector(sel)!.querySelector('snice-button') as HTMLElement).focus();
    }, BAR);

    await page.keyboard.press('Escape');

    const open = await page.evaluate((sel) => (document.querySelector(sel) as any).open, BAR);
    expect(open).toBe(false);
  });
});
