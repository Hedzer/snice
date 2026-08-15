/**
 * LAYER 1, remote delivery: the same 576 combos as matrix-local.spec.ts, but
 * every row arrives through a resolved `@request/table/data` response instead
 * of the `data` setter. The layout half of the matrix is identical; what this
 * file adds is that the table reaches each of those layouts by way of the
 * request/response path, including the re-delivery and late-delivery patterns.
 * See matrix-harness.ts.
 */
import { test, type Page } from '@playwright/test';
import { checkCombo, combosFor, openStage } from './matrix-harness';

let page: Page;

test.beforeAll(async ({ browser }) => { page = await openStage(browser); });
test.afterAll(async () => { await page?.close(); });

for (const combo of combosFor('remote')) {
  test(combo.id, async () => { await checkCombo(page, combo); });
}
