import { test, expect } from '@playwright/test';

// The height-fill row is table content, and `@observe('resize', '.table-frame')`
// re-derives it from the frame's box. On a host whose height is content-driven
// (`:host { height: 100% }` against an auto/max-content container — a stretched
// grid item, a plain block parent) the filler is therefore an input to its own
// trigger: the table inflated by one slack per animation frame, without bound,
// and pushed every later section of the page off screen.
//
// The invariant these specs pin: a table's height must come to rest. Nothing
// here asserts a particular height — only that the page stops moving.
const fixture = 'http://localhost:5566/tests/live/fixtures/table/fill-content-driven.html';
const showcase = 'http://localhost:5566/tests/live/fixtures/table/visual.html';

async function settleThenSample(page: any, ids: string[], ms: number) {
  const read = () => page.evaluate((list: string[]) =>
    Object.fromEntries(list.map(id => {
      const el = document.getElementById(id);
      return [id, el ? Math.round(el.getBoundingClientRect().height) : -1];
    }).concat([['__body', Math.round(document.body.scrollHeight)]])), ids);

  const before = await read();
  await page.waitForTimeout(ms);
  const after = await read();
  return { before, after };
}

test.describe('Snice Table height fill is stable', () => {
  test('content-driven hosts stop growing', async ({ page }) => {
    await page.goto(fixture, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!customElements.get('snice-table'));
    await page.waitForTimeout(500);

    const ids = ['compact', 'comfy', 'lone'];
    const { before, after } = await settleThenSample(page, ids, 2000);

    for (const id of [...ids, '__body']) {
      expect(Math.abs(after[id] - before[id]), `${id} moved ${before[id]} -> ${after[id]}`)
        .toBeLessThan(2);
    }
  });

  test('the showcase density tables stop growing', async ({ page }) => {
    await page.goto(showcase, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!customElements.get('snice-table'));
    await page.waitForTimeout(800);

    const ids = ['density-compact', 'density-comfy'];
    const { before, after } = await settleThenSample(page, ids, 2000);

    for (const id of [...ids, '__body']) {
      expect(Math.abs(after[id] - before[id]), `${id} moved ${before[id]} -> ${after[id]}`)
        .toBeLessThan(2);
    }
    // A density card holds 12 rows; anything near a viewport-and-a-half is the
    // runaway, not a layout.
    expect(after['density-compact']).toBeLessThan(2000);
    expect(after['density-comfy']).toBeLessThan(2000);
  });
});
