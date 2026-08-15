/**
 * <snice-list> request matrix — the component's two documented channels.
 *
 * docs/ai/components/list.md:
 *
 *     list/search    -> { query, list }   Handle search (debounced 300ms)
 *     list/load-more -> { page, list }    Infinite scroll pagination
 *
 * These are the list's entire application-facing contract: everything else it
 * does is presentation. A controller author reads those two lines and nothing
 * else, so the payload SHAPE, the debounce WINDOW, and the page NUMBERING are
 * the whole promise — and none of them are covered by the state or slot files.
 *
 * The cross is channel x the state switches that gate it (searchable, loading,
 * infinite), plus the timing dimension the doc names explicitly.
 */
import { describe, it, afterEach, beforeEach, expect, vi } from 'vitest';
import { removeComponent, settle, wait } from '../matrix-common';
import { mountList, respondTo, typeSearch, type ListCombo } from './list-utils';

let el: HTMLElement | null = null;
let stop: (() => void) | null = null;

beforeEach(() => { vi.useRealTimers(); });
afterEach(() => {
  stop?.(); stop = null;
  if (el) { removeComponent(el); el = null; }
});

const SEARCHABLE: ListCombo = {
  dividers: false, searchable: true, loading: false, noResults: false, infinite: false,
};

/** The documented debounce, plus enough slack for a real timer to fire. */
const DEBOUNCE = 300;
const AFTER_DEBOUNCE = DEBOUNCE + 120;

describe('list matrix: list/search', () => {
  it('typing sends { query, list } on the list/search channel', async () => {
    el = await mountList(SEARCHABLE);
    const probe = respondTo(document, ['list/search'], () => ({ results: [] }));
    stop = probe.stop;

    typeSearch(el, 'inbox');
    await wait(AFTER_DEBOUNCE);

    expect(probe.payloads('list/search').map(p => p.query)).toEqual(['inbox']);
    // "{ query, list }" — the list itself is part of the payload so a
    // controller can drive the element that asked.
    expect(probe.payloads('list/search')[0].list).toBe(el);
    expect(Object.keys(probe.payloads('list/search')[0]).sort()).toEqual(['list', 'query']);
  });

  it('the input updates `search` immediately, before the debounce elapses', async () => {
    // `search` is a documented property with its own value; the debounce is on
    // the REQUEST, not on the field, or the input would stutter as you type.
    el = await mountList(SEARCHABLE);
    const probe = respondTo(document, ['list/search']);
    stop = probe.stop;

    typeSearch(el, 'in');
    expect((el as any).search).toBe('in');
    expect(probe.requests.length, 'the request fired before its debounce window').toBe(0);

    // Let the window elapse WITH the responder still attached: a debounced
    // request that outlives its test would otherwise fire into an empty
    // document and log a discovery failure against whatever runs next.
    await wait(AFTER_DEBOUNCE);
    expect(probe.payloads('list/search').map(p => p.query)).toEqual(['in']);
  });

  it('300ms of typing collapses to ONE request carrying the final query', async () => {
    // "debounced 300ms": four keystrokes inside the window are one search.
    el = await mountList(SEARCHABLE);
    const probe = respondTo(document, ['list/search'], () => ({ results: [] }));
    stop = probe.stop;

    for (const value of ['i', 'in', 'inb', 'inbo']) {
      typeSearch(el, value);
      await wait(40);
    }
    await wait(AFTER_DEBOUNCE);

    expect(probe.payloads('list/search').map(p => p.query)).toEqual(['inbo']);
  });

  it('two queries separated by more than the window are two requests', async () => {
    el = await mountList(SEARCHABLE);
    const probe = respondTo(document, ['list/search'], () => ({ results: [] }));
    stop = probe.stop;

    typeSearch(el, 'first');
    await wait(AFTER_DEBOUNCE);
    typeSearch(el, 'second');
    await wait(AFTER_DEBOUNCE);

    expect(probe.payloads('list/search').map(p => p.query)).toEqual(['first', 'second']);
  });

  it('an empty query is still a search — it is how a filter is cleared', async () => {
    el = await mountList({ ...SEARCHABLE, search: 'inbox' });
    const probe = respondTo(document, ['list/search'], () => ({ results: [] }));
    stop = probe.stop;

    typeSearch(el, '');
    await wait(AFTER_DEBOUNCE);

    expect(probe.payloads('list/search').map(p => p.query)).toEqual(['']);
  });

  it('a search shows the loading state and clears it when the response lands', async () => {
    // The list owns its own loading affordance for the duration of a request;
    // `loading` is a documented property and the skeletons are its part.
    el = await mountList(SEARCHABLE);
    let release!: (value: any) => void;
    const pending = new Promise(resolve => { release = resolve; });
    const probe = respondTo(document, ['list/search'], () => pending);
    stop = probe.stop;

    typeSearch(el, 'inbox');
    await wait(AFTER_DEBOUNCE);
    expect((el as any).loading, 'the list is not loading during its own search').toBe(true);

    release({ results: [] });
    await wait(60);
    expect((el as any).loading, 'the list stayed loading after its search resolved').toBe(false);
  });

  it('a rejected search still clears the loading state', async () => {
    // Documented error handling: a failed request must not strand the list in
    // a permanent skeleton.
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      el = await mountList(SEARCHABLE);
      const probe = respondTo(document, ['list/search'], () => {
        throw new Error('search backend is down');
      });
      stop = probe.stop;

      typeSearch(el, 'inbox');
      await wait(AFTER_DEBOUNCE);
      expect((el as any).loading).toBe(false);
    } finally {
      errors.mockRestore();
    }
  });

  it('a list that is not searchable has no input to search from', async () => {
    el = await mountList({ ...SEARCHABLE, searchable: false });
    const probe = respondTo(document, ['list/search']);
    stop = probe.stop;
    expect(() => typeSearch(el!, 'inbox')).toThrow();
    await wait(AFTER_DEBOUNCE);
    expect(probe.requests).toEqual([]);
  });
});

describe('list matrix: list/load-more', () => {
  const INFINITE: ListCombo = {
    dividers: false, searchable: false, loading: false, noResults: false, infinite: true,
  };

  it('load-more sends { page, list } with a 1-based page number', async () => {
    // "{ page, list }": the first page a controller is asked for is 1, not 0,
    // or every controller off-by-ones its own pagination.
    el = await mountList(INFINITE);
    const probe = respondTo(document, ['list/load-more'], () => ({ items: [] }));
    stop = probe.stop;

    await (el as any).loadMore();
    expect(probe.payloads('list/load-more').map(p => p.page)).toEqual([1]);
    expect(probe.payloads('list/load-more')[0].list).toBe(el);
    expect(Object.keys(probe.payloads('list/load-more')[0]).sort()).toEqual(['list', 'page']);
  });

  it('successive loads advance the page number', async () => {
    el = await mountList(INFINITE);
    const probe = respondTo(document, ['list/load-more'], () => ({ items: [] }));
    stop = probe.stop;

    await (el as any).loadMore();
    await settle();
    await (el as any).loadMore();
    await settle();
    await (el as any).loadMore();
    await settle();

    expect(probe.payloads('list/load-more').map(p => p.page)).toEqual([1, 2, 3]);
  });

  it('a load in flight suppresses a second one', async () => {
    // Pagination that fires twice for one scroll duplicates a page of results.
    el = await mountList(INFINITE);
    let release!: (value: any) => void;
    const pending = new Promise(resolve => { release = resolve; });
    const probe = respondTo(document, ['list/load-more'], () => pending);
    stop = probe.stop;

    const first = (el as any).loadMore();
    await wait(20);
    await (el as any).loadMore();
    expect(probe.payloads('list/load-more').map(p => p.page)).toEqual([1]);

    release({ items: [] });
    await first;
    await settle();
    expect((el as any).loading).toBe(false);
  });

  it('load-more shows and clears the loading state', async () => {
    el = await mountList(INFINITE);
    let release!: (value: any) => void;
    const pending = new Promise(resolve => { release = resolve; });
    const probe = respondTo(document, ['list/load-more'], () => pending);
    stop = probe.stop;

    const inflight = (el as any).loadMore();
    await wait(20);
    expect((el as any).loading).toBe(true);
    release({ items: [] });
    await inflight;
    expect((el as any).loading).toBe(false);
  });

  it('a rejected load-more clears the loading state', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      el = await mountList(INFINITE);
      const probe = respondTo(document, ['list/load-more'], () => {
        throw new Error('pagination backend is down');
      });
      stop = probe.stop;

      await (el as any).loadMore();
      await settle();
      expect((el as any).loading).toBe(false);
    } finally {
      errors.mockRestore();
    }
  });

  it('the sentinel the infinite scroll observes is always in the tree', async () => {
    // `sentinel` is a documented CSS part, and the IntersectionObserver has
    // nothing to watch without it. It is unconditional so that flipping
    // `infinite` on later still has a target.
    for (const infinite of [false, true]) {
      const list = await mountList({ ...INFINITE, infinite });
      expect(list.shadowRoot!.querySelector('[part~="sentinel"]'),
        `infinite=${infinite} rendered no sentinel`).toBeTruthy();
      removeComponent(list);
    }
  });
});

describe('list matrix: the two channels together', () => {
  it('a search and a load-more each reach their own channel', async () => {
    el = await mountList({ ...SEARCHABLE, infinite: true });
    const probe = respondTo(document, ['list/search', 'list/load-more'], () => ({ results: [] }));
    stop = probe.stop;

    typeSearch(el, 'inbox');
    await wait(AFTER_DEBOUNCE);
    await (el as any).loadMore();
    await settle();

    expect(probe.requests.map(r => r.channel)).toEqual(['list/search', 'list/load-more']);
  });

  it('the request event is composed and bubbling, so a page-level controller sees it', async () => {
    // The list lives inside whatever shadow tree an application puts it in;
    // the documented protocol crosses those boundaries.
    el = await mountList(SEARCHABLE);
    const seen: Event[] = [];
    const handler = (event: Event) => {
      seen.push(event);
      const detail = (event as CustomEvent).detail;
      detail.discovery.resolve();
      detail.data.resolve({ results: [] });
    };
    window.addEventListener('@request/list/search', handler);
    try {
      typeSearch(el, 'inbox');
      await wait(AFTER_DEBOUNCE);
      expect(seen.length, 'the search request never reached the window').toBe(1);
      expect(seen[0].bubbles).toBe(true);
      expect(seen[0].composed).toBe(true);
    } finally {
      window.removeEventListener('@request/list/search', handler);
    }
  });
});
