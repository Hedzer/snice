/**
 * LAYER 1, local delivery: 6 pipelines x 3 delivery patterns x all 32 vectors
 * of {virtualize, height, squish, striped, selectable} = 576 combos, each
 * mounted in a real browser and measured by geometry, computed style, and
 * elementFromPoint. See matrix-harness.ts for the two-layer design and for why
 * the full product is affordable here.
 */
import { test, type Page } from '@playwright/test';
import { checkCombo, combosFor, openStage } from './matrix-harness';

let page: Page;

test.beforeAll(async ({ browser }) => { page = await openStage(browser); });
test.afterAll(async () => { await page?.close(); });

for (const combo of combosFor('local')) {
  test(combo.id, async () => { await checkCombo(page, combo); });
}
