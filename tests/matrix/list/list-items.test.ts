// <snice-list-item> matrix: heading x description x selected x disabled.
//
// docs/ai/components/list.md declares `heading` and `description` as two
// independent string properties, so each renders exactly when it is non-empty.
// The combos where that holds are asserted outright; the combos where it does
// not are pinned as a finding below — never weakened.
import { describe, it, afterEach } from 'vitest';
import { expect } from 'vitest';
import { expectClean, removeComponent, shadow, textOf } from '../matrix-common';
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

describe('list matrix: item defects', () => {
  // MATRIX-list-1 — `description` is documented as its own property, but the
  // template nests the description block INSIDE the heading's `<if>`
  // (snice-list-item.ts render()), so an item with a description and no
  // heading renders nothing at all.
  //
  //   <snice-list-item description="3 unread"></snice-list-item>   -> empty
  //
  // Expected: the description text is rendered. Actual: no
  // `.list-item__description` element and no text in the item.
  for (const combo of DESCRIPTION_WITHOUT_HEADING) {
    it.fails(`MATRIX-list-1: ${itemComboId(combo)} still renders its description`, async () => {
      item = await mountItem(combo);
      expectClean(checkItem(item, combo), itemComboId(combo));
    });
  }

  it('MATRIX-list-1 reproduces: the headless description leaves the item blank', async () => {
    // The counterpart assertion that documents what actually happens, so the
    // finding cannot be "fixed" by accident without this file noticing.
    item = await mountItem({
      heading: '', description: '3 unread', selected: false, disabled: false,
    });
    const content = shadow(item).querySelector('.list-item__content');
    expect(textOf(content)).toBe('');
  });
});
