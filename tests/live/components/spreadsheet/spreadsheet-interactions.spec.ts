/**
 * Spreadsheet end-to-end visual regression suite.
 *
 * Hits live Storybook stories on :6006 and drives the same interactions a
 * real user would: click, drag, keypress. Asserts on DOM state inside the
 * shadow root rather than pixel-comparing screenshots — that keeps the test
 * useful across theme tweaks while still catching the structural breakage
 * (selection ring vanished, fill handle wrong, sort not firing, etc.) that
 * unit tests miss because they don't run in a real browser.
 */
import { test, expect, type Page, type Locator } from '@playwright/test';

const STORYBOOK = 'http://localhost:6006';

/** Wait for the spreadsheet element inside the storybook iframe to mount. */
async function gotoStory(page: Page, storyId: string): Promise<Locator> {
  await page.goto(`${STORYBOOK}/iframe.html?id=${storyId}&viewMode=story`);
  const sheet = page.locator('snice-spreadsheet').first();
  await sheet.waitFor({ state: 'attached' });
  // wait for first render
  await page.waitForFunction(() => {
    const el = document.querySelector('snice-spreadsheet') as any;
    return !!(el && el.shadowRoot && el.shadowRoot.querySelector('.spreadsheet-td'));
  });
  return sheet;
}

/** Read a property from inside the shadow root via the host element. */
async function snapshot(sheet: Locator) {
  return sheet.evaluate((el: any) => {
    const sr = el.shadowRoot;
    const selected = sr.querySelector('.spreadsheet-td.selected');
    const inRange = sr.querySelectorAll('.spreadsheet-td.in-range');
    const fillHandle = sr.querySelector('.spreadsheet-fill-handle');
    const findBar = sr.querySelector('.spreadsheet-find-bar');
    const findMatches = sr.querySelectorAll('.spreadsheet-td.find-match');
    const ref = sr.querySelector('.spreadsheet-cell-ref');
    const formulaInput = sr.querySelector('.spreadsheet-formula-input') as HTMLInputElement | null;
    return {
      selectedRC: selected ? [selected.getAttribute('data-row'), selected.getAttribute('data-col')] : null,
      inRangeCount: inRange.length,
      fillHandleVisible: fillHandle ? !fillHandle.hidden : false,
      findBarVisible: findBar ? !findBar.hidden : false,
      findMatchCount: findMatches.length,
      cellRefText: ref?.textContent?.trim() ?? '',
      formulaText: formulaInput?.value ?? '',
      data: el.data,
    };
  });
}

async function clickCell(sheet: Locator, row: number, col: number) {
  await sheet.evaluate((el: any, { r, c }: { r: number; c: number }) => {
    const sr = el.shadowRoot;
    const td = sr.querySelector(`.spreadsheet-td[data-row="${r}"][data-col="${c}"]`);
    td?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true, button: 0 }));
    td?.ownerDocument.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  }, { r: row, c: col });
}

async function pressKey(sheet: Locator, key: string, opts: { ctrl?: boolean; shift?: boolean } = {}) {
  await sheet.evaluate((el: any, { k, o }: { k: string; o: typeof opts }) => {
    const sr = el.shadowRoot;
    const grid = sr.querySelector('.spreadsheet') as HTMLElement;
    grid.dispatchEvent(new KeyboardEvent('keydown', {
      key: k, ctrlKey: !!o.ctrl, shiftKey: !!o.shift, bubbles: true, composed: true,
    }));
  }, { k: key, o: opts });
}

test.describe('snice-spreadsheet — interactions', () => {
  test('click a cell shows selection ring + updates formula bar', async ({ page }) => {
    const sheet = await gotoStory(page, 'spreadsheet--with-formulas');
    await clickCell(sheet, 0, 0);
    await page.waitForTimeout(80);
    const s = await snapshot(sheet);
    expect(s.selectedRC).toEqual(['0', '0']);
    expect(s.cellRefText).toBe('A1');
    expect(s.formulaText).toBe('Product A');
    expect(s.fillHandleVisible).toBe(true);
  });

  test('clicking a formula cell shows the source in the formula bar, not the value', async ({ page }) => {
    const sheet = await gotoStory(page, 'spreadsheet--with-formulas');
    // Average row Q1 — has formula =AVG(B1:B3)
    await clickCell(sheet, 3, 1);
    await page.waitForTimeout(80);
    const s = await snapshot(sheet);
    expect(s.cellRefText).toBe('B4');
    expect(s.formulaText).toBe('=AVG(B1:B3)');
  });

  test('arrow keys move selection', async ({ page }) => {
    const sheet = await gotoStory(page, 'spreadsheet--with-formulas');
    await clickCell(sheet, 0, 0);
    await pressKey(sheet, 'ArrowDown');
    await pressKey(sheet, 'ArrowRight');
    await page.waitForTimeout(50);
    const s = await snapshot(sheet);
    expect(s.selectedRC).toEqual(['1', '1']);
  });

  test('shift+arrow extends the range', async ({ page }) => {
    const sheet = await gotoStory(page, 'spreadsheet--with-formulas');
    await clickCell(sheet, 0, 0);
    await pressKey(sheet, 'ArrowRight', { shift: true });
    await pressKey(sheet, 'ArrowDown', { shift: true });
    await page.waitForTimeout(50);
    const s = await snapshot(sheet);
    // 2x2 range = 4 cells; active anchor cell + 3 in-range
    expect(s.inRangeCount).toBeGreaterThanOrEqual(3);
  });

  test('Ctrl+F opens find bar; typing highlights matches', async ({ page }) => {
    const sheet = await gotoStory(page, 'spreadsheet--with-formulas');
    await pressKey(sheet, 'f', { ctrl: true });
    await page.waitForTimeout(60);
    let s = await snapshot(sheet);
    expect(s.findBarVisible).toBe(true);

    // Type into the find input
    await sheet.evaluate((el: any) => {
      const input = el.shadowRoot.querySelector('.spreadsheet-find-input') as HTMLInputElement;
      input.value = 'Product';
      input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    });
    await page.waitForTimeout(60);
    s = await snapshot(sheet);
    expect(s.findMatchCount).toBe(3);
  });

  test('Replace All updates every match in place', async ({ page }) => {
    const sheet = await gotoStory(page, 'spreadsheet--with-formulas');
    await pressKey(sheet, 'h', { ctrl: true });
    await page.waitForTimeout(60);

    await sheet.evaluate((el: any) => {
      const sr = el.shadowRoot;
      const findInput = sr.querySelector('.spreadsheet-find-input') as HTMLInputElement;
      findInput.value = 'Product';
      findInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    });
    await page.waitForTimeout(60);

    await sheet.evaluate((el: any) => {
      const sr = el.shadowRoot;
      const replaceInput = sr.querySelector('.spreadsheet-replace-input') as HTMLInputElement;
      replaceInput.value = 'Item';
      const btn = sr.querySelector('[data-find-action="replace-all"]') as HTMLElement;
      btn.click();
    });
    await page.waitForTimeout(80);

    const s = await snapshot(sheet);
    expect(s.data[0][0]).toBe('Item A');
    expect(s.data[1][0]).toBe('Item B');
    expect(s.data[2][0]).toBe('Item C');
  });

  test('clicking a column header sorts the data', async ({ page }) => {
    const sheet = await gotoStory(page, 'spreadsheet--with-formulas');
    await sheet.evaluate((el: any) => {
      const sr = el.shadowRoot;
      const th = sr.querySelector('.spreadsheet-th[data-col="1"]') as HTMLElement;
      th.click();
    });
    await page.waitForTimeout(60);
    const after: any[][] = await sheet.evaluate((el: any) => el.data);
    // The "Average" row holds a formula (`=AVG(B1:B3)`) which sort places at
    // one extreme; assert the numeric values among data rows are ascending.
    const numbersOnly = after.map(r => r[1]).filter(v => typeof v === 'number');
    const sorted = [...numbersOnly].sort((a, b) => a - b);
    expect(numbersOnly).toEqual(sorted);
  });

  test('frozen pane: scrolling left keeps Region column visible', async ({ page }) => {
    const sheet = await gotoStory(page, 'spreadsheet--frozen-panes');
    const result = await sheet.evaluate((el: any) => {
      const sr = el.shadowRoot;
      const wrapper = sr.querySelector('.spreadsheet') as HTMLElement;
      wrapper.scrollLeft = 400;
      return new Promise(r => setTimeout(() => {
        const cell = sr.querySelector('.spreadsheet-td--fixed-col[data-row="0"]') as HTMLElement;
        const rect = cell.getBoundingClientRect();
        const wrap = wrapper.getBoundingClientRect();
        r({ scrollLeft: wrapper.scrollLeft, fixedCellLeft: rect.left, wrapperLeft: wrap.left });
      }, 200));
    });
    expect((result as any).scrollLeft).toBe(400);
    // Frozen cell should be near the wrapper's left edge despite the scroll
    const offset = (result as any).fixedCellLeft - (result as any).wrapperLeft;
    expect(offset).toBeLessThan(100);
  });

  test('frozen pane: scrolling down keeps row 1 visible at the top', async ({ page }) => {
    const sheet = await gotoStory(page, 'spreadsheet--frozen-panes');
    const result = await sheet.evaluate((el: any) => {
      const sr = el.shadowRoot;
      const wrapper = sr.querySelector('.spreadsheet') as HTMLElement;
      wrapper.scrollTop = 500;
      return new Promise(r => setTimeout(() => {
        const cell = sr.querySelector('.spreadsheet-td--fixed-row[data-row="0"]') as HTMLElement;
        const rect = cell.getBoundingClientRect();
        const wrap = wrapper.getBoundingClientRect();
        const rn0 = sr.querySelector('.spreadsheet-row-num[data-row="0"]') as HTMLElement;
        r({ scrollTop: wrapper.scrollTop, fixedCellTop: rect.top, wrapperTop: wrap.top, rn0Text: rn0.textContent?.trim() });
      }, 200));
    });
    expect((result as any).scrollTop).toBe(500);
    expect((result as any).rn0Text).toBe('1');
    const offset = (result as any).fixedCellTop - (result as any).wrapperTop;
    // header row is 28px; frozen row 0 sits at top + 28 (or close)
    expect(offset).toBeLessThan(80);
  });

  test('formula precision is trimmed (no floating-point tail)', async ({ page }) => {
    const sheet = await gotoStory(page, 'spreadsheet--with-formulas');
    const text = await sheet.evaluate((el: any) => {
      const cell = el.shadowRoot.querySelector('.spreadsheet-td[data-row="3"][data-col="1"] .spreadsheet-cell');
      return cell?.textContent?.trim();
    });
    expect(text).toMatch(/^126[.,]666667$/);
    expect(text).not.toContain('666666666666');
  });

  test('currency cells render with locale grouping + symbol', async ({ page }) => {
    const sheet = await gotoStory(page, 'spreadsheet--frozen-panes');
    const text = await sheet.evaluate((el: any) => {
      const cell = el.shadowRoot.querySelector('.spreadsheet-td[data-row="0"][data-col="1"] .spreadsheet-cell');
      return cell?.textContent?.trim();
    });
    expect(text).toContain('$');
    expect(text).toMatch(/\$[0-9,]+/);
  });

  test('Escape closes the find bar and clears highlights', async ({ page }) => {
    const sheet = await gotoStory(page, 'spreadsheet--with-formulas');
    await pressKey(sheet, 'f', { ctrl: true });
    await sheet.evaluate((el: any) => {
      const input = el.shadowRoot.querySelector('.spreadsheet-find-input') as HTMLInputElement;
      input.value = 'Product';
      input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    });
    await page.waitForTimeout(60);
    let s = await snapshot(sheet);
    expect(s.findMatchCount).toBeGreaterThan(0);

    await sheet.evaluate((el: any) => {
      const input = el.shadowRoot.querySelector('.spreadsheet-find-input') as HTMLInputElement;
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
    });
    await page.waitForTimeout(60);
    s = await snapshot(sheet);
    expect(s.findBarVisible).toBe(false);
    expect(s.findMatchCount).toBe(0);
  });
});
