import { test, expect } from '@playwright/test';

const demoPath = 'http://localhost:5566/tests/live/fixtures/accordion/visual.html';

// Height of an item's content region, measured inside its shadow root.
async function contentHeight(page: import('@playwright/test').Page, itemId: string): Promise<number> {
  return page.evaluate((id) => {
    const item = document.querySelector(`snice-accordion-item[item-id="${id}"]`) as HTMLElement;
    const content = item.shadowRoot!.querySelector('.accordion-item__content') as HTMLElement;
    return content.getBoundingClientRect().height;
  }, itemId);
}

async function clickHeader(page: import('@playwright/test').Page, itemId: string) {
  await page.evaluate((id) => {
    const item = document.querySelector(`snice-accordion-item[item-id="${id}"]`) as HTMLElement;
    (item.shadowRoot!.querySelector('.accordion-item__header') as HTMLElement).click();
  }, itemId);
}

async function setOpen(page: import('@playwright/test').Page, itemId: string, open: boolean) {
  await page.evaluate(({ id, value }) => {
    const item = document.querySelector(`snice-accordion-item[item-id="${id}"]`) as any;
    item.open = value;
  }, { id: itemId, value: open });
}

async function focusHeader(page: import('@playwright/test').Page, itemId: string) {
  await page.evaluate((id) => {
    const item = document.querySelector(`snice-accordion-item[item-id="${id}"]`) as HTMLElement;
    (item.shadowRoot!.querySelector('.accordion-item__header') as HTMLElement).focus();
  }, itemId);
}

async function focusedItemId(page: import('@playwright/test').Page): Promise<string | null> {
  return page.evaluate(() => {
    const active = document.activeElement;
    return active?.tagName === 'SNICE-ACCORDION-ITEM' ? active.getAttribute('item-id') : null;
  });
}

const ANIMATION_SETTLE_MS = 600;

test.describe('Snice Accordion', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!customElements.get('snice-accordion-item'));
    await page.waitForFunction(() => {
      const item = document.querySelector('snice-accordion-item[item-id="s1"]');
      return !!item?.shadowRoot?.querySelector('.accordion-item__header');
    });
  });

  test('initially open item renders its content visible', async ({ page }) => {
    expect(await contentHeight(page, 'b1')).toBeGreaterThan(0);
  });

  test('clicking a closed item expands it', async ({ page }) => {
    expect(await contentHeight(page, 's1')).toBe(0);

    await clickHeader(page, 's1');
    await page.waitForTimeout(ANIMATION_SETTLE_MS);

    expect(await contentHeight(page, 's1')).toBeGreaterThan(0);
  });

  test('setting open=true programmatically after a manual open/close cycle shows the content', async ({ page }) => {
    await clickHeader(page, 's1');
    await page.waitForTimeout(ANIMATION_SETTLE_MS);
    await clickHeader(page, 's1');
    await page.waitForTimeout(ANIMATION_SETTLE_MS);

    await setOpen(page, 's1', true);
    await page.waitForTimeout(ANIMATION_SETTLE_MS);

    expect(await contentHeight(page, 's1')).toBeGreaterThan(0);
  });

  test('setting open=false programmatically after a manual open hides the content', async ({ page }) => {
    await clickHeader(page, 's2');
    await page.waitForTimeout(ANIMATION_SETTLE_MS);

    await setOpen(page, 's2', false);
    await page.waitForTimeout(ANIMATION_SETTLE_MS);

    expect(await contentHeight(page, 's2')).toBe(0);
  });

  test('ArrowDown skips a disabled item and focuses the next enabled header', async ({ page }) => {
    await focusHeader(page, 'd1');
    await page.keyboard.press('ArrowDown');

    expect(await focusedItemId(page)).toBe('d3');
  });

  test('End focuses the last enabled item when the list contains a disabled item', async ({ page }) => {
    await focusHeader(page, 'd1');
    await page.keyboard.press('End');

    expect(await focusedItemId(page)).toBe('d3');
  });

  test('Home focuses the first enabled item', async ({ page }) => {
    await focusHeader(page, 'd3');
    await page.keyboard.press('Home');

    expect(await focusedItemId(page)).toBe('d1');
  });

  test('rapid double toggle does not leave the item unresponsive', async ({ page }) => {
    await clickHeader(page, 's3');
    await page.waitForTimeout(50); // mid-animation
    await clickHeader(page, 's3');
    await page.waitForTimeout(ANIMATION_SETTLE_MS);

    // A click after an interrupted animation must still work.
    await clickHeader(page, 's3');
    await page.waitForTimeout(ANIMATION_SETTLE_MS);

    expect(await contentHeight(page, 's3')).toBeGreaterThan(0);
  });
});
