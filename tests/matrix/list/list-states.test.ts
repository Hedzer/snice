// <snice-list> container matrix: all 32 vectors of the five documented
// switches (dividers, searchable, loading, no-results, infinite), plus the
// skeleton-count and search-value dimensions crossed against the states that
// actually consume them.
import { describe, it, afterEach } from 'vitest';
import { expectClean, removeComponent, settle } from '../matrix-common';
import {
  LIST_COMBOS, checkItemRoles, checkList, listComboId, mountList,
  type ListCombo,
} from './list-utils';

let list: HTMLElement | null = null;
afterEach(() => { if (list) { removeComponent(list); list = null; } });

describe('list matrix: state vectors', () => {
  for (const combo of LIST_COMBOS) {
    it(`renders ${listComboId(combo)}`, async () => {
      list = await mountList(combo);
      const problems = checkList(list, combo);
      // Slotted children are announced as list items in every state that still
      // shows them (docs: the container is role="list").
      if (!combo.noResults) checkItemRoles(list, problems);
      expectClean(problems, listComboId(combo));
    });
  }
});

describe('list matrix: skeleton count', () => {
  // `skeletonCount` (default 5) is only observable while `loading`.
  for (const skeletonCount of [0, 1, 3, 7]) {
    for (const noResults of [false, true]) {
      const combo: ListCombo = {
        dividers: false, searchable: false, loading: true,
        noResults, infinite: false, skeletonCount,
      };
      it(`renders ${listComboId(combo)}`, async () => {
        list = await mountList(combo);
        expectClean(checkList(list, combo), listComboId(combo));
      });
    }
  }
});

describe('list matrix: search value', () => {
  for (const search of ['', 'inbox', 'a b c']) {
    for (const loading of [false, true]) {
      const combo: ListCombo = {
        dividers: true, searchable: true, loading,
        noResults: false, infinite: false, search,
      };
      it(`renders ${listComboId(combo)}`, async () => {
        list = await mountList(combo);
        expectClean(checkList(list, combo), listComboId(combo));
      });
    }
  }

  it('a later search assignment reaches the input', async () => {
    const combo: ListCombo = {
      dividers: false, searchable: true, loading: false,
      noResults: false, infinite: false, search: '',
    };
    list = await mountList(combo);
    (list as any).search = 'later';
    await settle();
    expectClean(checkList(list, { ...combo, search: 'later' }), 'search/reassigned');
  });
});
