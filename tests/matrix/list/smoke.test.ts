/**
 * Smoke slice of the snice-list matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/list, 97 combos across states,
 * items, slots and requests) is excluded from the default Vitest include and
 * runs via `npm run test:matrix`. This file lives at `smoke.test.ts` so it
 * stays collected, and it is the standing cost the everyday loop pays for this
 * component.
 *
 * Marquee combos only — one per family the matrix is built around:
 *   · the default list, its four documented parts and its role="list";
 *   · the loading state with a non-default skeleton count, the branch that
 *     replaces the body;
 *   · the no-results fallback, the other branch that replaces the body;
 *   · a fully-formed item, and the ONE pinned finding (MATRIX-list-1);
 *   · the `list/search` request, including the documented 300ms debounce —
 *     the component's whole application-facing contract.
 *
 * Every structural assertion routes through the matrix's own oracle, so this
 * file cannot drift into something weaker than the suite it stands in for.
 * BUDGET: under ~1s. New combinations belong in the matrix, not here.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { expectClean, removeComponent, shadow, textOf, wait } from '../matrix-common';
import {
  checkItem, checkList, itemComboId, listComboId, mountItem, mountList,
  respondTo, typeSearch, type ListCombo,
} from './list-utils';

let el: HTMLElement | null = null;
let stop: (() => void) | null = null;
afterEach(() => {
  stop?.(); stop = null;
  if (el) { removeComponent(el); el = null; }
});

const BASE: ListCombo = {
  dividers: false, searchable: false, loading: false, noResults: false, infinite: false,
};

describe('list matrix smoke', () => {
  it('a plain list is a role="list" container with its sentinel and slots', async () => {
    el = await mountList(BASE);
    expectClean(checkList(el, BASE), listComboId(BASE));
  });

  it('dividers and searchable reach the host and render the search input', async () => {
    const combo: ListCombo = { ...BASE, dividers: true, searchable: true, search: 'inbox' };
    el = await mountList(combo);
    expectClean(checkList(el, combo), listComboId(combo));
  });

  it('loading swaps in exactly skeleton-count skeletons', async () => {
    const combo: ListCombo = { ...BASE, loading: true, skeletonCount: 3 };
    el = await mountList(combo);
    expectClean(checkList(el, combo), listComboId(combo));
  });

  it('no-results falls back to the built-in empty state', async () => {
    const combo: ListCombo = { ...BASE, noResults: true };
    el = await mountList(combo);
    expectClean(checkList(el, combo), listComboId(combo));
    expect(shadow(el).querySelector('snice-empty-state')?.getAttribute('title'))
      .toBe('No results found');
  });

  it('an item renders its heading, description and state', async () => {
    const combo = { heading: 'Inbox', description: '3 unread', selected: true, disabled: true };
    el = await mountItem(combo);
    expectClean(checkItem(el, combo), itemComboId(combo));
  });

  // MATRIX-list-1: `description` is documented as its own property, but the
  // template nests it inside the heading's `<if>`, so an item with a
  // description and no heading renders nothing at all.
  it.fails('MATRIX-list-1: a description with no heading still renders', async () => {
    const combo = { heading: '', description: '3 unread', selected: false, disabled: false };
    el = await mountItem(combo);
    expectClean(checkItem(el, combo), itemComboId(combo));
  });

  it('MATRIX-list-1 reproduces: the headless description leaves the item blank', async () => {
    el = await mountItem({ heading: '', description: '3 unread', selected: false, disabled: false });
    expect(textOf(shadow(el).querySelector('.list-item__content'))).toBe('');
  });

  it('typing sends { query, list } on list/search after the documented 300ms', async () => {
    el = await mountList({ ...BASE, searchable: true });
    const probe = respondTo(document, ['list/search'], () => ({ results: [] }));
    stop = probe.stop;

    typeSearch(el, 'inbox');
    expect(probe.requests.length, 'the search fired before its debounce window').toBe(0);

    await wait(420);
    expect(probe.payloads('list/search').map(p => p.query)).toEqual(['inbox']);
    expect(probe.payloads('list/search')[0].list).toBe(el);
  });
});
