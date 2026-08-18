// <snice-list-item> matrix: heading x description x selected x disabled.
//
// docs/ai/components/list.md declares `heading` and `description` as two
// independent string properties, so each renders exactly when it is non-empty.
// MATRIX-list-1 pinned the template nesting the description inside the
// heading's `<if>`; the blocks are siblings now and every combo asserts the
// documented contract outright.
import { describe, it, afterEach } from 'vitest';
import { expect } from 'vitest';
import { expectClean, removeComponent } from '../matrix-common';
import {
  DESCRIPTION_WITHOUT_HEADING, HEADED_ITEM_COMBOS, checkItem, itemComboId, mountItem,
} from './list-utils';

let item: HTMLElement | null = null;
afterEach(() => { if (item) { removeComponent(item); item = null; } });

describe('list matrix: item vectors', () => {
  for (const combo of HEADED_ITEM_COMBOS) {
    it(`renders ${itemComboId(combo)}`, async () => {
      item = await mountItem(combo);
      expectClean(checkItem(item, combo), itemComboId(combo));
    });
  }
});

describe('list matrix: item defects (fixed)', () => {
  // MATRIX-list-1 (fixed) — `description` is documented as its own property,
  // but the template used to nest the description block INSIDE the heading's
  // `<if>` (snice-list-item.ts render()), so an item with a description and
  // no heading rendered nothing at all. The blocks are siblings now.
  //
  //   <snice-list-item description="3 unread"></snice-list-item>   -> renders
  for (const combo of DESCRIPTION_WITHOUT_HEADING) {
    it(`MATRIX-list-1 (fixed): ${itemComboId(combo)} still renders its description`, async () => {
      item = await mountItem(combo);
      expectClean(checkItem(item, combo), itemComboId(combo));
    });
  }
});
