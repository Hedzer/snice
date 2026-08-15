/**
 * <snice-list> / <snice-list-item> slot matrix.
 *
 * `list-states.test.ts` crosses the five state switches and `list-items.test.ts`
 * the item's four properties. Neither touches the documented SLOT surface, and
 * the list is described as "slot-fed only; no `items` property" — the slots ARE
 * the data channel, so a dead one is a component with no way to show anything.
 *
 * Documented slots (docs/ai/components/list.md):
 *
 *   snice-list        (default) list items · before · after · no-results · loading
 *   snice-list-item   (default) custom content · before (icon/avatar) · after (badge/metadata)
 *
 * The cross is slot-occupancy x the state that decides whether the slot is even
 * rendered, because four of the five list slots are inside an `<if>` and a
 * component that renders the wrong branch silently swallows its author's
 * content.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { Problems, expectClean, mount, removeComponent, shadow, textOf } from '../matrix-common';
import { ITEM_MARKUP, checkList, listComboId, mountList, type ListCombo } from './list-utils';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

/**
 * What a named slot actually projects — shadow `textContent` cannot see it.
 *
 * The explicit `[...]` is load-bearing: happy-dom's `assignedNodes()` returns a
 * NodeList that EXTENDS Array, so `.map()` hands back another NodeList rather
 * than a plain array. Vitest then formats it as an HTMLCollection and the
 * assertion dies inside the reporter instead of reporting anything.
 */
function slotted(host: HTMLElement, selector: string): string[] {
  const slot = shadow(host).querySelector(selector) as HTMLSlotElement | null;
  if (!slot) return ['∅ no slot'];
  return [...slot.assignedNodes({ flatten: true })]
    .map(node => (node.textContent ?? '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

/**
 * The element tags a slot projects — for items whose text lives in shadow DOM.
 *
 * ENVIRONMENT LIMIT, deliberately compensated for: happy-dom assigns EVERY
 * light-DOM child to the default slot, including children that carry a `slot="…"`
 * attribute and are already assigned to a named slot. A real engine never does
 * that. So the default-slot reading drops children that name another slot; the
 * exclusivity claim ("`slot="before"` content does NOT also appear in the list
 * body") belongs to the visual tier, where a real engine runs the assignment
 * algorithm. Named slots are read as-is — happy-dom gets those right.
 */
function slottedTags(host: HTMLElement, selector: string): string[] {
  const slot = shadow(host).querySelector(selector) as HTMLSlotElement | null;
  if (!slot) return ['∅ no slot'];
  const isDefault = !slot.hasAttribute('name');
  return [...slot.assignedElements({ flatten: true })]
    .filter(el => !(isDefault && el.hasAttribute('slot')))
    .map(el => el.tagName.toLowerCase());
}

const BASE: ListCombo = {
  dividers: false, searchable: false, loading: false, noResults: false, infinite: false,
};

describe('list matrix: container slots', () => {
  // `before` and `after` are documented as unconditional insertion points, so
  // they must project in every state — including the two states that replace
  // the items entirely.
  for (const state of ['plain', 'loading', 'noResults', 'searchable'] as const) {
    const combo: ListCombo = { ...BASE, [state]: true } as ListCombo;
    it(`before/after project while ${state}`, async () => {
      el = await mountList(combo, `
        <div slot="before">Pinned</div>
        ${ITEM_MARKUP}
        <div slot="after">Footer</div>
      `);
      expect(slotted(el, 'slot[name="before"]')).toEqual(['Pinned']);
      expect(slotted(el, 'slot[name="after"]')).toEqual(['Footer']);
      expectClean(checkList(el, combo), `${listComboId(combo)}/before+after`);
    });
  }

  it('the default slot projects the items when nothing is replacing them', async () => {
    // A <snice-list-item>'s own text lives in ITS shadow root, so the list's
    // slot can only be judged by the elements it assigns, not by their text.
    el = await mountList(BASE);
    expect(slottedTags(el, 'slot:not([name])'))
      .toEqual(['snice-list-item', 'snice-list-item', 'snice-list-item']);
  });

  it('no-results replaces the items with the author\'s own empty state', async () => {
    const combo: ListCombo = { ...BASE, noResults: true };
    el = await mountList(combo, `
      ${ITEM_MARKUP}
      <div slot="no-results">Nothing here</div>
    `);
    expect(slotted(el, 'slot[name="no-results"]')).toEqual(['Nothing here']);
    // "no-results — Custom empty state": the author's content REPLACES the
    // fallback, so the built-in empty state must not also render.
    const slot = shadow(el).querySelector('slot[name="no-results"]') as HTMLSlotElement;
    expect(slot.assignedNodes({ flatten: true }).length).toBeGreaterThan(0);
    expectClean(checkList(el, combo), 'no-results/custom');
  });

  it('no-results with no custom content falls back to the built-in empty state', async () => {
    const combo: ListCombo = { ...BASE, noResults: true };
    el = await mountList(combo);
    const fallback = shadow(el).querySelector('snice-empty-state');
    expect(fallback, 'the documented no-results fallback did not render').toBeTruthy();
    expect(fallback!.getAttribute('title')).toBe('No results found');
  });

  it('the loading slot replaces the skeletons with the author\'s own content', async () => {
    const combo: ListCombo = { ...BASE, loading: true };
    el = await mountList(combo, `
      ${ITEM_MARKUP}
      <div slot="loading">Fetching…</div>
    `);
    expect(slotted(el, 'slot[name="loading"]')).toEqual(['Fetching…']);
    // The skeletons are the slot's FALLBACK, so authored loading content must
    // suppress them rather than stack on top of them.
    const slot = shadow(el).querySelector('slot[name="loading"]') as HTMLSlotElement;
    expect(slot.assignedNodes().length).toBeGreaterThan(0);
  });

  it('the loading slot is absent entirely while not loading', async () => {
    el = await mountList(BASE, `${ITEM_MARKUP}<div slot="loading">Fetching…</div>`);
    expect(shadow(el).querySelector('slot[name="loading"]')).toBeNull();
  });

  // Every pair of simultaneously-occupied slots: the list is documented to
  // support all five at once, and a template whose `<if>` branches interfere
  // loses one of them.
  it('all five slots can be occupied at once', async () => {
    const combo: ListCombo = { ...BASE, searchable: true, loading: true, dividers: true };
    el = await mountList(combo, `
      <div slot="before">Pinned</div>
      ${ITEM_MARKUP}
      <div slot="after">Footer</div>
      <div slot="loading">Fetching…</div>
      <div slot="no-results">Nothing here</div>
    `);
    expect(slotted(el, 'slot[name="before"]')).toEqual(['Pinned']);
    expect(slotted(el, 'slot[name="after"]')).toEqual(['Footer']);
    expect(slotted(el, 'slot[name="loading"]')).toEqual(['Fetching…']);
    expect(slottedTags(el, 'slot:not([name])'))
      .toEqual(['snice-list-item', 'snice-list-item', 'snice-list-item']);
    expectClean(checkList(el, combo), 'all-slots');
  });
});

describe('list matrix: item slots', () => {
  // The doc's own "With icons" example: a before slot for the icon, an after
  // slot for the count, crossed with the item's own two state flags because
  // `disabled` and `selected` change the item's class list and a template that
  // rebuilds on state change can drop its slots.
  for (const selected of [false, true]) {
    for (const disabled of [false, true]) {
      const label = `${selected ? 'selected' : '-'}/${disabled ? 'disabled' : '-'}`;
      it(`before and after project on a ${label} item`, async () => {
        el = await mount<HTMLElement>('snice-list-item', { selected, disabled }, {
          html: '<span slot="before">📥</span><span slot="after">12</span>',
        });
        (el as any).heading = 'Downloads';
        await new Promise(resolve => setTimeout(resolve, 20));
        expect(slotted(el, 'slot[name="before"]')).toEqual(['📥']);
        expect(slotted(el, 'slot[name="after"]')).toEqual(['12']);
      });
    }
  }

  it('the default slot carries custom content alongside the heading', async () => {
    // "(default) — Custom content", and the heading is a separate property, so
    // an item may show both.
    el = await mount<HTMLElement>('snice-list-item', { heading: 'Inbox' }, {
      html: '<em>custom body</em>',
    });
    expect(textOf(shadow(el).querySelector('.list-item__heading'))).toBe('Inbox');
    expect(slotted(el, 'slot:not([name])')).toEqual(['custom body']);
  });

  it('an item with only default-slot content still renders it', async () => {
    // The item has no `heading`, which is the exact shape a consumer building
    // a fully custom row uses.
    el = await mount<HTMLElement>('snice-list-item', {}, { html: '<em>only this</em>' });
    expect(slotted(el, 'slot:not([name])')).toEqual(['only this']);
  });

  it('the before/after slots sit outside the item content box', async () => {
    // "before — Icon/avatar area", "after — Badge/metadata area": they are
    // siblings of the content, not part of it, which is what lets CSS lay the
    // row out as icon | text | badge.
    el = await mount<HTMLElement>('snice-list-item', { heading: 'Downloads' }, {
      html: '<span slot="before">📥</span><span slot="after">12</span>',
    });
    const problems = new Problems();
    const content = shadow(el).querySelector('.list-item__content');
    for (const name of ['before', 'after']) {
      const slot = shadow(el).querySelector(`slot[name="${name}"]`);
      problems.check(!!slot, `no ${name} slot`);
      if (slot && content) {
        problems.check(!content.contains(slot),
          `the ${name} slot is nested inside the content box`);
      }
    }
    expectClean(problems, 'item/slot-placement');
  });
});
