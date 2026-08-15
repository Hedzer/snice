// Oracle for the <snice-list> / <snice-list-item> matrix.
//
// Every expectation below is read off docs/ai/components/list.md, not off the
// rendered output:
//
//   * `container` (role="list"), `search`, `loading` and `sentinel` are the
//     four documented CSS parts; `search` is the searchable wrapper, `loading`
//     the "Loading skeletons wrapper".
//   * `loading` renders `skeletonCount` skeletons (documented default 5).
//   * `noResults` swaps the items for the `no-results` slot, whose documented
//     fallback is an empty state.
//   * `dividers` is a pure styling switch: the stylesheet keys off
//     `:host([dividers])`, and `reflect` defaults to true (docs/ai/properties.md),
//     so the property assignment must land on the host as an attribute or the
//     dividers never paint.
//   * A list item shows `heading` and `description`, and carries `selected` /
//     `disabled` state (the latter also as `aria-disabled`).
import { Problems, mount, part, shadow, textOf } from '../matrix-common';
import '../../../packages/components/src/list/snice-list';
import '../../../packages/components/src/list/snice-list-item';

export interface ListCombo {
  dividers: boolean;
  searchable: boolean;
  loading: boolean;
  noResults: boolean;
  infinite: boolean;
  skeletonCount?: number;
  search?: string;
}

export const ITEM_MARKUP = `
  <snice-list-item heading="Inbox" description="3 unread"></snice-list-item>
  <snice-list-item heading="Sent" description="Last 2h ago"></snice-list-item>
  <snice-list-item heading="Drafts"></snice-list-item>
`;

export function listComboId(combo: ListCombo): string {
  const flags = (['dividers', 'searchable', 'loading', 'noResults', 'infinite'] as const)
    .filter(f => combo[f]);
  return `[${flags.join(',') || 'plain'}]`
    + (combo.skeletonCount !== undefined ? `/skeletons=${combo.skeletonCount}` : '')
    + (combo.search !== undefined ? `/search="${combo.search}"` : '');
}

export async function mountList(combo: ListCombo, html = ITEM_MARKUP) {
  const props: Record<string, any> = {
    dividers: combo.dividers,
    searchable: combo.searchable,
    loading: combo.loading,
    noResults: combo.noResults,
    infinite: combo.infinite,
  };
  if (combo.skeletonCount !== undefined) props.skeletonCount = combo.skeletonCount;
  if (combo.search !== undefined) props.search = combo.search;
  return mount<HTMLElement>('snice-list', props, { html });
}

/** The documented structure of a list for one property vector. */
export function checkList(list: HTMLElement, combo: ListCombo): Problems {
  const problems = new Problems();
  const root = shadow(list);

  const container = part(list, 'container');
  problems.check(!!container, 'no part="container"');
  if (container) {
    problems.equal(container.getAttribute('role'), 'list', 'container role');
  }

  // `dividers` paints through :host([dividers]); a property that does not
  // reflect would leave the switch inert.
  problems.equal(list.hasAttribute('dividers'), combo.dividers, 'host [dividers]');

  // Search wrapper + its input mirror `searchable` / `search`.
  const search = part(list, 'search');
  problems.equal(!!search, combo.searchable, `part="search" present`);
  if (combo.searchable) {
    const input = root.querySelector('.list__search-input') as HTMLInputElement | null;
    problems.check(!!input, 'searchable list has no search input');
    if (input) {
      problems.equal(input.value, combo.search ?? '', 'search input value');
      problems.equal(input.getAttribute('type'), 'text', 'search input type');
    }
  }

  // Items vs the no-results slot are mutually exclusive.
  const defaultSlot = root.querySelector('slot:not([name])');
  const noResultsSlot = root.querySelector('slot[name="no-results"]');
  problems.equal(!!defaultSlot, !combo.noResults, 'default (items) slot present');
  problems.equal(!!noResultsSlot, combo.noResults, 'no-results slot present');
  if (combo.noResults) {
    problems.check(
      !!root.querySelector('snice-empty-state'),
      'no-results fallback is not an empty state',
    );
  }

  // Loading wrapper + its skeletons.
  const loading = part(list, 'loading');
  problems.equal(!!loading, combo.loading, 'part="loading" present');
  if (combo.loading) {
    const expected = combo.skeletonCount ?? 5;
    const skeletons = root.querySelectorAll('snice-skeleton');
    problems.equal(skeletons.length, expected, 'skeleton count');
  } else {
    problems.equal(root.querySelectorAll('snice-skeleton').length, 0,
      'skeletons rendered while not loading');
  }

  // The infinite-scroll sentinel is a documented part of the list container.
  problems.check(!!part(list, 'sentinel'), 'no part="sentinel"');

  // before/after are always available insertion points.
  problems.check(!!root.querySelector('slot[name="before"]'), 'no before slot');
  problems.check(!!root.querySelector('slot[name="after"]'), 'no after slot');

  return problems;
}

/** Assigned items are announced as list items (docs: container is role="list"). */
export function checkItemRoles(list: HTMLElement, problems: Problems): void {
  const items = [...list.children] as HTMLElement[];
  for (const item of items) {
    problems.equal(item.getAttribute('role'), 'listitem',
      `slotted <${item.tagName.toLowerCase()}> role`);
  }
}

export interface ItemCombo {
  heading: string;
  description: string;
  selected: boolean;
  disabled: boolean;
}

export function itemComboId(combo: ItemCombo): string {
  return `heading=${combo.heading ? 'yes' : 'no'}/description=${combo.description ? 'yes' : 'no'}`
    + `/${combo.selected ? 'selected' : '-'}/${combo.disabled ? 'disabled' : '-'}`;
}

export async function mountItem(combo: ItemCombo) {
  return mount<HTMLElement>('snice-list-item', { ...combo });
}

/**
 * The documented item contract: `heading` and `description` are two
 * independent string properties, so each renders exactly when it is non-empty.
 */
export function checkItem(item: HTMLElement, combo: ItemCombo): Problems {
  const problems = new Problems();
  const root = shadow(item);

  const heading = root.querySelector('.list-item__heading');
  problems.equal(!!heading, !!combo.heading, 'heading rendered');
  if (combo.heading) problems.equal(textOf(heading), combo.heading, 'heading text');

  const description = root.querySelector('.list-item__description');
  problems.equal(!!description, !!combo.description, 'description rendered');
  if (combo.description) {
    problems.equal(textOf(description), combo.description, 'description text');
  }

  const box = root.querySelector('.list-item') as HTMLElement | null;
  problems.check(!!box, 'no .list-item wrapper');
  if (box) {
    problems.equal(box.classList.contains('list-item--selected'), combo.selected,
      'selected class');
    problems.equal(box.classList.contains('list-item--disabled'), combo.disabled,
      'disabled class');
    problems.equal(box.getAttribute('aria-disabled'), String(combo.disabled),
      'aria-disabled');
    problems.equal(box.getAttribute('role'), 'listitem', 'item role');
  }

  return problems;
}

/** Every item combo except the ones the description defect owns. */
export const ITEM_COMBOS: ItemCombo[] = (() => {
  const out: ItemCombo[] = [];
  for (const heading of ['', 'Inbox']) {
    for (const description of ['', '3 unread']) {
      for (const selected of [false, true]) {
        for (const disabled of [false, true]) {
          out.push({ heading, description, selected, disabled });
        }
      }
    }
  }
  return out;
})();

/** The item combos whose description is nested under a heading in the source. */
export const DESCRIPTION_WITHOUT_HEADING = ITEM_COMBOS
  .filter(c => !c.heading && c.description);

export const HEADED_ITEM_COMBOS = ITEM_COMBOS
  .filter(c => !(!c.heading && c.description));

// ── Requests ────────────────────────────────────────────────────────────────
//
// docs/ai/components/list.md documents two request channels:
//
//     list/search    -> { query, list }   Handle search (debounced 300ms)
//     list/load-more -> { page, list }    Infinite scroll pagination
//
// `@request` is implemented as a bubbling, composed `@request/<channel>` event
// whose detail carries the payload plus discovery/data resolvers
// (docs/ai/request-response.md). Standing in for a controller is therefore just
// listening for that event, resolving discovery, and resolving data — which is
// exactly what a `@respond` handler does, minus the decorator.

export interface RecordedRequest { channel: string; payload: any }

/**
 * Answer the list's documented request channels the way a controller would,
 * recording every payload in dispatch order.
 *
 * `reply` decides the response. Returning `undefined` still resolves the
 * request — a controller that has nothing to add is not a failure — while
 * throwing rejects it, which is how the "error handling" path is reached.
 */
export function respondTo(
  target: EventTarget,
  channels: string[],
  reply: (channel: string, payload: any) => any = () => undefined,
): { requests: RecordedRequest[]; payloads: (channel: string) => any[]; stop: () => void } {
  const requests: RecordedRequest[] = [];
  const handlers = channels.map(channel => {
    const type = `@request/${channel}`;
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      requests.push({ channel, payload: detail.payload });
      detail.discovery.resolve();
      try {
        detail.data.resolve(reply(channel, detail.payload));
      } catch (error) {
        detail.data.reject(error);
      }
    };
    target.addEventListener(type, handler);
    return { type, handler };
  });
  return {
    requests,
    payloads: (channel: string) => requests.filter(r => r.channel === channel).map(r => r.payload),
    stop: () => handlers.forEach(({ type, handler }) => target.removeEventListener(type, handler)),
  };
}

/** Type text into the list's search input the way a user would. */
export function typeSearch(list: HTMLElement, value: string): void {
  const input = shadow(list).querySelector('.list__search-input') as HTMLInputElement | null;
  if (!input) throw new Error('the list rendered no search input to type into');
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}

/** All 32 vectors of the five documented list switches. */
export const LIST_COMBOS: ListCombo[] = (() => {
  const out: ListCombo[] = [];
  for (let bits = 0; bits < 32; bits++) {
    out.push({
      dividers: !!(bits & 1),
      searchable: !!(bits & 2),
      loading: !!(bits & 4),
      noResults: !!(bits & 8),
      infinite: !!(bits & 16),
    });
  }
  return out;
})();
