/**
 * Real-page rendering scenarios.
 *
 * Simulates how an actual page works: receives @context(), uses ctx.fetch
 * (with realistic latency), stores results in @property() arrays, and renders
 * declaratively via html`${items.map(...)}` and `<if>`. Verifies that the
 * shadow DOM matches the property state after every async hop.
 *
 * If the render pipeline drops an update — because context arrives mid-fetch,
 * a property is set before ctx, a fetch resolves after disconnect, etc. —
 * one of these tests will fail with a length mismatch.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  Router,
  ContextAwareFetcher,
  Context,
  html,
  render,
  property,
  context,
  ready,
  watch,
} from '../packages/core/src';

const originalFetch = global.fetch;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Wait long enough for microtask render flush + N requested ms. */
async function settle(ms = 0): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  if (ms > 0) await delay(ms);
}

/** Poll until a condition holds or the timeout elapses — deterministic under
 *  load, unlike a fixed delay racing async fetch + render timing. */
async function waitUntil(condition: () => boolean, timeoutMs = 3000): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeoutMs) throw new Error('waitUntil: condition not met before timeout');
    await delay(5);
  }
}

function jsonResponse(body: unknown, latencyMs: number): Promise<Response> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(new Response(JSON.stringify(body), {
        headers: { 'content-type': 'application/json' },
      }));
    }, latencyMs);
  });
}

interface Item {
  id: number;
  name: string;
}

function makeItems(n: number, prefix = 'Item'): Item[] {
  return Array.from({ length: n }, (_, i) => ({ id: i, name: `${prefix} ${i}` }));
}

function getRenderedItemsCount(el: HTMLElement, selector: string): number {
  return el.shadowRoot?.querySelectorAll(selector).length ?? 0;
}

function getRenderedItemTexts(el: HTMLElement, selector: string): string[] {
  return Array.from(el.shadowRoot?.querySelectorAll(selector) ?? [])
    .map((n) => (n.textContent ?? '').trim());
}

describe('real-page declarative rendering with context + fetch + lists', () => {
  let container: HTMLDivElement;
  let mockFetch: ReturnType<typeof vi.fn>;
  let pageCounter = 0;
  const uniqueTag = (base: string) => `${base}-${++pageCounter}`;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'app';
    document.body.appendChild(container);
    mockFetch = vi.fn();
    global.fetch = mockFetch as any;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Baseline: page mounts, context arrives, fetch resolves slow, list renders.
  // ──────────────────────────────────────────────────────────────────────────
  it('renders a fetched list of N items after async ctx + slow fetch', async () => {
    mockFetch.mockReturnValue(jsonResponse(makeItems(7), 30));

    const fetcher = new ContextAwareFetcher();
    const router = Router({ target: '#app', type: 'hash', fetcher });

    const tag = uniqueTag('rp-baseline');
    @router.page({ tag, routes: ['/baseline'] })
    class BaselinePage extends HTMLElement {
      @property({ type: Array }) items: Item[] = [];
      @property({ type: Boolean }) loading = true;

      private ctx?: Context;

      @context()
      onCtx(ctx: Context) {
        this.ctx = ctx;
      }

      @ready()
      async load() {
        // Wait until context handler has fired before reading ctx.fetch.
        // In a real app the page may not check this — we test that path next.
        while (!this.ctx) await delay(5);
        const res = await this.ctx.fetch('/api/items');
        this.items = await res.json();
        this.loading = false;
      }

      @render()
      tpl() {
        return html`
          <if ${this.loading}><p class="loading">Loading…</p></if>
          <ul>
            ${this.items.map((it) => html`<li class="item">${it.name}</li>`)}
          </ul>
          <span class="count">${this.items.length}</span>
        `;
      }
    }

    router.initialize();
    await router.navigate('/baseline');
    await settle(80);

    const page = container.querySelector(tag) as HTMLElement;
    expect(page).toBeTruthy();
    expect((page as any).items.length).toBe(7);
    expect(getRenderedItemsCount(page, 'li.item')).toBe(7);
    expect(page.shadowRoot?.querySelector('.count')?.textContent).toBe('7');
    expect(page.shadowRoot?.querySelector('.loading')).toBeNull();
    expect(getRenderedItemTexts(page, 'li.item')).toEqual(makeItems(7).map((i) => i.name));
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Property is set BEFORE @context handler fires.
  //    Real situation: a @ready() hook starts before navigation completes the
  //    context push. The first render happens with empty ctx; verify the list
  //    renders correctly once data arrives.
  // ──────────────────────────────────────────────────────────────────────────
  it('renders list when items are set before ctx handler fires', async () => {
    mockFetch.mockReturnValue(jsonResponse(makeItems(5), 10));

    const fetcher = new ContextAwareFetcher();
    const router = Router({ target: '#app', type: 'hash', fetcher });

    const tag = uniqueTag('rp-presetctx');
    @router.page({ tag, routes: ['/preset'] })
    class PresetPage extends HTMLElement {
      @property({ type: Array }) items: Item[] = [];
      ctxId = -1;

      @context()
      onCtx(ctx: Context) {
        this.ctxId = ctx.id;
      }

      @ready()
      async load() {
        // Don't wait for ctx — set data immediately to force a render before
        // ctx handler runs in some interleavings.
        this.items = makeItems(3, 'Pre');
        await delay(20);
        const res = await fetch('/api/items');
        this.items = await res.json();
      }

      @render()
      tpl() {
        return html`
          <ul>${this.items.map((it) => html`<li class="item">${it.name}</li>`)}</ul>
        `;
      }
    }

    router.initialize();
    await router.navigate('/preset');
    await settle(50);

    const page = container.querySelector(tag) as HTMLElement;
    expect((page as any).items.length).toBe(5);
    expect(getRenderedItemsCount(page, 'li.item')).toBe(5);
    expect((page as any).ctxId).toBeGreaterThanOrEqual(0);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Sequential property updates from chained fetches.
  //    Page issues 3 fetches in series, each setting items. Final state must
  //    win and render correctly.
  // ──────────────────────────────────────────────────────────────────────────
  it('renders the final list after a chain of sequential fetches', async () => {
    mockFetch
      .mockReturnValueOnce(jsonResponse(makeItems(2, 'A'), 15))
      .mockReturnValueOnce(jsonResponse(makeItems(4, 'B'), 15))
      .mockReturnValueOnce(jsonResponse(makeItems(6, 'C'), 15));

    const fetcher = new ContextAwareFetcher();
    const router = Router({ target: '#app', type: 'hash', fetcher });

    const tag = uniqueTag('rp-chained');
    @router.page({ tag, routes: ['/chained'] })
    class ChainedPage extends HTMLElement {
      @property({ type: Array }) items: Item[] = [];

      private ctx?: Context;
      @context() onCtx(ctx: Context) { this.ctx = ctx; }

      @ready()
      async load() {
        while (!this.ctx) await delay(5);
        for (let i = 0; i < 3; i++) {
          const res = await this.ctx.fetch(`/api/page/${i}`);
          this.items = await res.json();
        }
      }

      @render()
      tpl() {
        return html`<ul>${this.items.map((it) => html`<li class="item">${it.name}</li>`)}</ul>`;
      }
    }

    router.initialize();
    await router.navigate('/chained');
    await settle(120);

    const page = container.querySelector(tag) as HTMLElement;
    expect((page as any).items.length).toBe(6);
    expect(getRenderedItemsCount(page, 'li.item')).toBe(6);
    expect(getRenderedItemTexts(page, 'li.item')[0]).toBe('C 0');
    expect(getRenderedItemTexts(page, 'li.item')[5]).toBe('C 5');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Parallel fetches resolving in different orders.
  //    Three separate property arrays each populated by a fetch with a
  //    different latency. All three must render with their final lengths.
  // ──────────────────────────────────────────────────────────────────────────
  it('renders three independent lists from parallel fetches with mixed latencies', async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : (input as Request).url ?? String(input);
      if (url.endsWith('/users')) return jsonResponse(makeItems(3, 'User'), 50);
      if (url.endsWith('/posts')) return jsonResponse(makeItems(8, 'Post'), 10);
      if (url.endsWith('/tags')) return jsonResponse(makeItems(5, 'Tag'), 30);
      return jsonResponse([], 0);
    });

    const fetcher = new ContextAwareFetcher();
    const router = Router({ target: '#app', type: 'hash', fetcher });

    const tag = uniqueTag('rp-parallel');
    @router.page({ tag, routes: ['/parallel'] })
    class ParallelPage extends HTMLElement {
      @property({ type: Array }) users: Item[] = [];
      @property({ type: Array }) posts: Item[] = [];
      @property({ type: Array }) tags: Item[] = [];

      private ctx?: Context;
      @context() onCtx(ctx: Context) { this.ctx = ctx; }

      @ready()
      async load() {
        while (!this.ctx) await delay(5);
        const [u, p, t] = await Promise.all([
          this.ctx.fetch('/users').then((r) => r.json()),
          this.ctx.fetch('/posts').then((r) => r.json()),
          this.ctx.fetch('/tags').then((r) => r.json()),
        ]);
        // Set in a different order than the fetches resolved in.
        this.posts = p;
        this.tags = t;
        this.users = u;
      }

      @render()
      tpl() {
        return html`
          <section class="users">
            ${this.users.map((u) => html`<div class="u">${u.name}</div>`)}
          </section>
          <section class="posts">
            ${this.posts.map((p) => html`<div class="p">${p.name}</div>`)}
          </section>
          <section class="tags">
            ${this.tags.map((t) => html`<div class="t">${t.name}</div>`)}
          </section>
        `;
      }
    }

    router.initialize();
    await router.navigate('/parallel');
    await settle(120);

    const page = container.querySelector(tag) as HTMLElement;
    expect(getRenderedItemsCount(page, 'div.u')).toBe(3);
    expect(getRenderedItemsCount(page, 'div.p')).toBe(8);
    expect(getRenderedItemsCount(page, 'div.t')).toBe(5);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Conditional <if> flips loading→loaded after fetch.
  //    Verifies the loading branch is gone and the list branch is present.
  // ──────────────────────────────────────────────────────────────────────────
  it('flips conditional <if> branches after fetch resolves', async () => {
    mockFetch.mockReturnValue(jsonResponse(makeItems(4), 25));

    const fetcher = new ContextAwareFetcher();
    const router = Router({ target: '#app', type: 'hash', fetcher });

    const tag = uniqueTag('rp-cond');
    @router.page({ tag, routes: ['/cond'] })
    class CondPage extends HTMLElement {
      @property({ type: Array }) items: Item[] = [];
      @property({ type: Boolean }) loading = true;
      @property({ type: Boolean }) hasItems = false;

      private ctx?: Context;
      @context() onCtx(ctx: Context) { this.ctx = ctx; }

      @ready()
      async load() {
        while (!this.ctx) await delay(5);
        const res = await this.ctx.fetch('/api/items');
        const data = await res.json() as Item[];
        this.items = data;
        this.hasItems = data.length > 0;
        this.loading = false;
      }

      @render()
      tpl() {
        return html`
          <if ${this.loading}><p class="loading">Loading…</p></if>
          <if ${!this.loading && this.hasItems}>
            <ul>${this.items.map((it) => html`<li class="item">${it.name}</li>`)}</ul>
          </if>
          <if ${!this.loading && !this.hasItems}>
            <p class="empty">No items</p>
          </if>
        `;
      }
    }

    router.initialize();
    await router.navigate('/cond');

    // Mid-flight: the loading state renders first (loading = true is the
    // default, rendered on connect before the fetch resolves). Wait for it
    // rather than sampling at a fixed delay that the render can miss under load.
    const page = container.querySelector(tag) as HTMLElement;
    await waitUntil(() => page?.shadowRoot?.querySelector('.loading') != null);
    expect(page.shadowRoot?.querySelector('.loading')).toBeTruthy();
    expect(getRenderedItemsCount(page, 'li.item')).toBe(0);

    // After fetch resolves: loading gone, list shown. Wait for the actual
    // transition (context arrival + 25ms fetch + render) instead of a fixed
    // delay that races the scheduler under load.
    await waitUntil(() =>
      page.shadowRoot?.querySelector('.loading') === null &&
      getRenderedItemsCount(page, 'li.item') === 4
    );
    expect(page.shadowRoot?.querySelector('.loading')).toBeNull();
    expect(page.shadowRoot?.querySelector('.empty')).toBeNull();
    expect(getRenderedItemsCount(page, 'li.item')).toBe(4);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Empty result path: fetch returns [], empty branch shows.
  // ──────────────────────────────────────────────────────────────────────────
  it('renders empty branch when fetch returns []', async () => {
    mockFetch.mockReturnValue(jsonResponse([], 15));

    const fetcher = new ContextAwareFetcher();
    const router = Router({ target: '#app', type: 'hash', fetcher });

    const tag = uniqueTag('rp-empty');
    @router.page({ tag, routes: ['/empty'] })
    class EmptyPage extends HTMLElement {
      @property({ type: Array }) items: Item[] = [];
      @property({ type: Boolean }) loading = true;

      private ctx?: Context;
      @context() onCtx(ctx: Context) { this.ctx = ctx; }

      @ready()
      async load() {
        while (!this.ctx) await delay(5);
        const res = await this.ctx.fetch('/api/items');
        this.items = await res.json();
        this.loading = false;
      }

      @render()
      tpl() {
        const noItems = !this.loading && this.items.length === 0;
        return html`
          <if ${this.loading}><p class="loading">…</p></if>
          <if ${noItems}><p class="empty">No items</p></if>
          <ul>${this.items.map((it) => html`<li class="item">${it.name}</li>`)}</ul>
        `;
      }
    }

    router.initialize();
    await router.navigate('/empty');
    await settle(60);

    const page = container.querySelector(tag) as HTMLElement;
    expect((page as any).items.length).toBe(0);
    expect(getRenderedItemsCount(page, 'li.item')).toBe(0);
    expect(page.shadowRoot?.querySelector('.empty')).toBeTruthy();
    expect(page.shadowRoot?.querySelector('.loading')).toBeNull();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 7. Two replacements of the same array — list shrinks then grows.
  //    Real situation: filter applied, then cleared.
  // ──────────────────────────────────────────────────────────────────────────
  it('handles list shrink → grow → final size correctly', async () => {
    mockFetch
      .mockReturnValueOnce(jsonResponse(makeItems(10, 'X'), 10))
      .mockReturnValueOnce(jsonResponse(makeItems(2, 'Y'), 10))
      .mockReturnValueOnce(jsonResponse(makeItems(15, 'Z'), 10));

    const fetcher = new ContextAwareFetcher();
    const router = Router({ target: '#app', type: 'hash', fetcher });

    const tag = uniqueTag('rp-resize');
    @router.page({ tag, routes: ['/resize'] })
    class ResizePage extends HTMLElement {
      @property({ type: Array }) items: Item[] = [];

      private ctx?: Context;
      @context() onCtx(ctx: Context) { this.ctx = ctx; }

      @ready()
      async load() {
        while (!this.ctx) await delay(5);
        for (let i = 0; i < 3; i++) {
          const res = await this.ctx.fetch(`/api/q/${i}`);
          this.items = await res.json();
          // Pause so each render lands before the next fetch starts.
          await delay(15);
        }
      }

      @render()
      tpl() {
        return html`<div class="grid">${this.items.map((it) => html`<span class="cell">${it.name}</span>`)}</div>`;
      }
    }

    router.initialize();
    await router.navigate('/resize');
    await settle(150);

    const page = container.querySelector(tag) as HTMLElement;
    expect((page as any).items.length).toBe(15);
    expect(getRenderedItemsCount(page, 'span.cell')).toBe(15);
    const texts = getRenderedItemTexts(page, 'span.cell');
    expect(texts[0]).toBe('Z 0');
    expect(texts[14]).toBe('Z 14');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 8. @watch fires for each list change and observes final value.
  // ──────────────────────────────────────────────────────────────────────────
  it('@watch sees final items value after async fetch sets prop', async () => {
    mockFetch.mockReturnValue(jsonResponse(makeItems(6), 20));

    const fetcher = new ContextAwareFetcher();
    const router = Router({ target: '#app', type: 'hash', fetcher });

    const seen: number[] = [];
    const tag = uniqueTag('rp-watch');

    @router.page({ tag, routes: ['/watched'] })
    class WatchedPage extends HTMLElement {
      @property({ type: Array }) items: Item[] = [];

      private ctx?: Context;
      @context() onCtx(ctx: Context) { this.ctx = ctx; }

      @watch('items')
      onItems(_old: Item[], next: Item[]) {
        seen.push(next.length);
      }

      @ready()
      async load() {
        while (!this.ctx) await delay(5);
        const res = await this.ctx.fetch('/api/items');
        this.items = await res.json();
      }

      @render()
      tpl() {
        return html`<ul>${this.items.map((it) => html`<li class="item">${it.name}</li>`)}</ul>`;
      }
    }

    router.initialize();
    await router.navigate('/watched');
    await settle(80);

    const page = container.querySelector(tag) as HTMLElement;
    expect((page as any).items.length).toBe(6);
    expect(getRenderedItemsCount(page, 'li.item')).toBe(6);
    expect(seen).toContain(6);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 9. Disconnect mid-fetch: page is removed from the DOM while fetch is in
  //    flight. Setting items after disconnect must not throw and must not try
  //    to render into a detached shadow root.
  // ──────────────────────────────────────────────────────────────────────────
  it('does not crash if fetch resolves after page disconnect', async () => {
    mockFetch.mockReturnValue(jsonResponse(makeItems(5), 60));

    const fetcher = new ContextAwareFetcher();
    const router = Router({ target: '#app', type: 'hash', fetcher });

    let setAfterDisconnect = false;
    let threw: unknown = null;

    const tag = uniqueTag('rp-disconnect');
    @router.page({ tag, routes: ['/disconnect'] })
    class DisconnectPage extends HTMLElement {
      @property({ type: Array }) items: Item[] = [];

      private ctx?: Context;
      @context() onCtx(ctx: Context) { this.ctx = ctx; }

      @ready()
      async load() {
        while (!this.ctx) await delay(5);
        try {
          const res = await this.ctx.fetch('/api/items');
          const data = await res.json();
          if (!this.isConnected) setAfterDisconnect = true;
          this.items = data;
        } catch (e) {
          threw = e;
        }
      }

      @render()
      tpl() {
        return html`<ul>${this.items.map((it) => html`<li class="item">${it.name}</li>`)}</ul>`;
      }
    }

    router.initialize();
    await router.navigate('/disconnect');
    await settle(10);

    const page = container.querySelector(tag) as HTMLElement;
    expect(page).toBeTruthy();

    // Yank the page mid-flight.
    page.remove();

    // Wait for fetch to resolve.
    await settle(120);

    expect(threw).toBeNull();
    expect(setAfterDisconnect).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 10. Two pages back-to-back (real navigation): each must render its own
  //     fetched list, no leakage between them.
  // ──────────────────────────────────────────────────────────────────────────
  it('navigating between two pages renders each list independently', async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : (input as Request).url ?? String(input);
      if (url.endsWith('/a')) return jsonResponse(makeItems(3, 'A'), 20);
      if (url.endsWith('/b')) return jsonResponse(makeItems(7, 'B'), 20);
      return jsonResponse([], 0);
    });

    const fetcher = new ContextAwareFetcher();
    const router = Router({ target: '#app', type: 'hash', fetcher });

    const tagA = uniqueTag('rp-nav-a');
    const tagB = uniqueTag('rp-nav-b');

    @router.page({ tag: tagA, routes: ['/a'] })
    class APage extends HTMLElement {
      @property({ type: Array }) items: Item[] = [];
      private ctx?: Context;
      @context() onCtx(ctx: Context) { this.ctx = ctx; }
      @ready()
      async load() {
        while (!this.ctx) await delay(5);
        this.items = await (await this.ctx.fetch('/a')).json();
      }
      @render()
      tpl() { return html`<ul>${this.items.map((i) => html`<li class="a-item">${i.name}</li>`)}</ul>`; }
    }

    @router.page({ tag: tagB, routes: ['/b'] })
    class BPage extends HTMLElement {
      @property({ type: Array }) items: Item[] = [];
      private ctx?: Context;
      @context() onCtx(ctx: Context) { this.ctx = ctx; }
      @ready()
      async load() {
        while (!this.ctx) await delay(5);
        this.items = await (await this.ctx.fetch('/b')).json();
      }
      @render()
      tpl() { return html`<ul>${this.items.map((i) => html`<li class="b-item">${i.name}</li>`)}</ul>`; }
    }

    router.initialize();

    await router.navigate('/a');
    await settle(80);
    const pageA = container.querySelector(tagA) as HTMLElement;
    expect(getRenderedItemsCount(pageA, 'li.a-item')).toBe(3);

    await router.navigate('/b');
    await settle(80);
    const pageB = container.querySelector(tagB) as HTMLElement;
    expect(pageB).toBeTruthy();
    expect(getRenderedItemsCount(pageB, 'li.b-item')).toBe(7);
    // A page should be gone or detached — must not still own the screen.
    expect(container.querySelector(tagA)).toBeNull();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 11. Fast double-navigate: user clicks link twice. The second navigation
  //     overrides the first. Only the second page's data must render.
  // ──────────────────────────────────────────────────────────────────────────
  it('fast double navigation only renders the final destination', async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : (input as Request).url ?? String(input);
      if (url.endsWith('/slow')) return jsonResponse(makeItems(2, 'Slow'), 80);
      if (url.endsWith('/fast')) return jsonResponse(makeItems(9, 'Fast'), 10);
      return jsonResponse([], 0);
    });

    const fetcher = new ContextAwareFetcher();
    const router = Router({ target: '#app', type: 'hash', fetcher });

    const tagSlow = uniqueTag('rp-slow');
    const tagFast = uniqueTag('rp-fast');

    @router.page({ tag: tagSlow, routes: ['/slow'] })
    class SlowPage extends HTMLElement {
      @property({ type: Array }) items: Item[] = [];
      private ctx?: Context;
      @context() onCtx(ctx: Context) { this.ctx = ctx; }
      @ready()
      async load() {
        while (!this.ctx) await delay(5);
        this.items = await (await this.ctx.fetch('/slow')).json();
      }
      @render() tpl() { return html`<ul>${this.items.map((i) => html`<li class="slow">${i.name}</li>`)}</ul>`; }
    }

    @router.page({ tag: tagFast, routes: ['/fast'] })
    class FastPage extends HTMLElement {
      @property({ type: Array }) items: Item[] = [];
      private ctx?: Context;
      @context() onCtx(ctx: Context) { this.ctx = ctx; }
      @ready()
      async load() {
        while (!this.ctx) await delay(5);
        this.items = await (await this.ctx.fetch('/fast')).json();
      }
      @render() tpl() { return html`<ul>${this.items.map((i) => html`<li class="fast">${i.name}</li>`)}</ul>`; }
    }

    router.initialize();
    // Kick off a slow nav, then immediately switch.
    router.navigate('/slow');
    await delay(5);
    await router.navigate('/fast');
    await settle(150);

    const fast = container.querySelector(tagFast) as HTMLElement;
    expect(fast).toBeTruthy();
    expect(getRenderedItemsCount(fast, 'li.fast')).toBe(9);
    // Slow page should not be on screen.
    expect(container.querySelector(tagSlow)).toBeNull();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 11b. Realistic pattern: fetch is kicked off inside @context() itself.
  //     The handler is async and awaits ctx.fetch then sets a property.
  //     Verifies the framework doesn't drop the @property() setter's render
  //     because it happened "outside" the registered handler call.
  // ──────────────────────────────────────────────────────────────────────────
  it('renders list when fetch is performed inside @context() handler', async () => {
    mockFetch.mockReturnValue(jsonResponse(makeItems(8, 'Ctx'), 25));

    const fetcher = new ContextAwareFetcher();
    const router = Router({ target: '#app', type: 'hash', fetcher });

    const tag = uniqueTag('rp-fetchin-ctx');
    @router.page({ tag, routes: ['/fetchctx'] })
    class FetchInCtxPage extends HTMLElement {
      @property({ type: Array }) items: Item[] = [];

      @context()
      async onCtx(ctx: Context) {
        const res = await ctx.fetch('/api/items');
        this.items = await res.json();
      }

      @render()
      tpl() {
        return html`<ul>${this.items.map((it) => html`<li class="item">${it.name}</li>`)}</ul>`;
      }
    }

    router.initialize();
    await router.navigate('/fetchctx');
    await settle(80);

    const page = container.querySelector(tag) as HTMLElement;
    expect((page as any).items.length).toBe(8);
    expect(getRenderedItemsCount(page, 'li.item')).toBe(8);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 11c. Realistic pattern: @ready() assumes ctx is already populated by
  //     @context() and reads it directly (no busy-wait loop). This is the
  //     most common real-world page shape, and the most likely to break
  //     after the v5.2 sync-emit revert.
  // ──────────────────────────────────────────────────────────────────────────
  it('renders when @ready reads ctx without explicitly waiting', async () => {
    mockFetch.mockReturnValue(jsonResponse(makeItems(6, 'Direct'), 20));

    const fetcher = new ContextAwareFetcher();
    const router = Router({ target: '#app', type: 'hash', fetcher });

    let readyHadCtx = false;
    let readyError: unknown = null;

    const tag = uniqueTag('rp-direct-ready');
    @router.page({ tag, routes: ['/direct'] })
    class DirectPage extends HTMLElement {
      @property({ type: Array }) items: Item[] = [];
      ctx?: Context;

      @context()
      onCtx(ctx: Context) { this.ctx = ctx; }

      @ready()
      async load() {
        try {
          readyHadCtx = !!this.ctx;
          if (!this.ctx) return;
          const res = await this.ctx.fetch('/api/items');
          this.items = await res.json();
        } catch (e) {
          readyError = e;
        }
      }

      @render()
      tpl() {
        return html`<ul>${this.items.map((it) => html`<li class="item">${it.name}</li>`)}</ul>`;
      }
    }

    router.initialize();
    await router.navigate('/direct');
    await settle(80);

    const page = container.querySelector(tag) as HTMLElement;
    expect(readyError).toBeNull();
    // This is the diagnostic check. If false, @ready ran before @context fired.
    // Real-world pages crash here when they assume ctx is ready.
    expect(readyHadCtx).toBe(true);
    expect((page as any).items.length).toBe(6);
    expect(getRenderedItemsCount(page, 'li.item')).toBe(6);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 11d. Realistic pattern: page sets two related properties in one fetch
  //     (items + total), checks length, and renders both. Verifies the
  //     batched render sees both writes.
  // ──────────────────────────────────────────────────────────────────────────
  it('renders both items and derived total from a single fetch', async () => {
    mockFetch.mockReturnValue(jsonResponse(makeItems(11, 'Pair'), 20));

    const fetcher = new ContextAwareFetcher();
    const router = Router({ target: '#app', type: 'hash', fetcher });

    const tag = uniqueTag('rp-pair');
    @router.page({ tag, routes: ['/pair'] })
    class PairPage extends HTMLElement {
      @property({ type: Array }) items: Item[] = [];
      @property({ type: Number }) total = 0;

      @context()
      async onCtx(ctx: Context) {
        const data: Item[] = await (await ctx.fetch('/api/items')).json();
        this.items = data;
        this.total = data.length;
      }

      @render()
      tpl() {
        return html`
          <header><span class="total">${this.total}</span></header>
          <ul>${this.items.map((it) => html`<li class="item">${it.name}</li>`)}</ul>
        `;
      }
    }

    router.initialize();
    await router.navigate('/pair');
    await settle(80);

    const page = container.querySelector(tag) as HTMLElement;
    expect((page as any).items.length).toBe(11);
    expect(getRenderedItemsCount(page, 'li.item')).toBe(11);
    expect(page.shadowRoot?.querySelector('.total')?.textContent).toBe('11');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 11e. Realistic pattern: page uses ctx.application as data dependency.
  //     items derived from app context user, fetched with that user id.
  // ──────────────────────────────────────────────────────────────────────────
  it('uses ctx.application for fetch params and renders list', async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : (input as Request).url ?? String(input);
      const m = /\/users\/(\d+)\/items/.exec(url);
      if (m) {
        const userId = parseInt(m[1], 10);
        return jsonResponse(makeItems(userId, `U${userId}`), 15);
      }
      return jsonResponse([], 0);
    });

    const fetcher = new ContextAwareFetcher();
    const router = Router({
      target: '#app',
      type: 'hash',
      fetcher,
      context: { userId: 4 } as any,
    });

    const tag = uniqueTag('rp-appctx');
    @router.page({ tag, routes: ['/appctx'] })
    class AppCtxPage extends HTMLElement {
      @property({ type: Array }) items: Item[] = [];

      @context()
      async onCtx(ctx: Context) {
        const userId = (ctx.application as any).userId;
        const res = await ctx.fetch(`/users/${userId}/items`);
        this.items = await res.json();
      }

      @render()
      tpl() {
        return html`<ul>${this.items.map((it) => html`<li class="item">${it.name}</li>`)}</ul>`;
      }
    }

    router.initialize();
    await router.navigate('/appctx');
    await settle(80);

    const page = container.querySelector(tag) as HTMLElement;
    expect((page as any).items.length).toBe(4);
    expect(getRenderedItemsCount(page, 'li.item')).toBe(4);
    expect(getRenderedItemTexts(page, 'li.item')[0]).toBe('U4 0');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 12. Length sanity across renders: every property change must leave the
  //     DOM count equal to items.length, not stale or doubled.
  // ──────────────────────────────────────────────────────────────────────────
  it('rendered DOM count tracks items.length through many updates', async () => {
    const fetcher = new ContextAwareFetcher();
    const router = Router({ target: '#app', type: 'hash', fetcher });

    const tag = uniqueTag('rp-count');
    @router.page({ tag, routes: ['/count'] })
    class CountPage extends HTMLElement {
      @property({ type: Array }) items: Item[] = [];
      private ctx?: Context;
      @context() onCtx(ctx: Context) { this.ctx = ctx; }
      @render()
      tpl() {
        return html`<ul>${this.items.map((i) => html`<li class="x">${i.name}</li>`)}</ul>`;
      }
    }

    router.initialize();
    await router.navigate('/count');
    await settle(20);

    const page = container.querySelector(tag) as any;
    expect(page).toBeTruthy();

    const sizes = [0, 1, 5, 4, 100, 99, 0, 3];
    for (const n of sizes) {
      page.items = makeItems(n, `S${n}`);
      await settle(5);
      expect((page as HTMLElement).shadowRoot?.querySelectorAll('li.x').length)
        .toBe(n);
      expect(page.items.length).toBe(n);
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 13. Page hands fetched array to a nested @element via .prop binding.
  //     Nested element renders its own <li>s. Verifies the array reaches
  //     the child element and the child re-renders when parent's data updates.
  // ──────────────────────────────────────────────────────────────────────────
  it('passes fetched list down to a nested element via .prop binding', async () => {
    mockFetch.mockReturnValue(jsonResponse(makeItems(5, 'Nested'), 25));

    const { element } = await import('../packages/core/src/index');

    @element('rp-child-list')
    class ChildList extends HTMLElement {
      @property({ type: Array }) data: Item[] = [];

      @render()
      tpl() {
        return html`<ul class="child">${this.data.map((d) => html`<li class="row">${d.name}</li>`)}</ul>`;
      }
    }

    const fetcher = new ContextAwareFetcher();
    const router = Router({ target: '#app', type: 'hash', fetcher });

    const pageTag = uniqueTag('rp-parent');
    @router.page({ tag: pageTag, routes: ['/parent'] })
    class ParentPage extends HTMLElement {
      @property({ type: Array }) items: Item[] = [];

      @context()
      async onCtx(ctx: Context) {
        this.items = await (await ctx.fetch('/api/items')).json();
      }

      @render()
      tpl() {
        return html`<rp-child-list .data=${this.items}></rp-child-list>`;
      }
    }

    router.initialize();
    await router.navigate('/parent');
    await settle(80);

    const parent = container.querySelector(pageTag) as HTMLElement;
    const child = parent.shadowRoot?.querySelector('rp-child-list') as HTMLElement;
    expect(child).toBeTruthy();
    if (child && (child as any).ready) await (child as any).ready;
    await settle(10);

    expect((child as any).data.length).toBe(5);
    expect(child.shadowRoot?.querySelectorAll('li.row').length).toBe(5);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 14. Filter UI: page fetches list, then user-applied filter narrows it.
  //     Verifies derived render count matches filtered length, not raw length.
  // ──────────────────────────────────────────────────────────────────────────
  it('renders filtered subset when filter property changes', async () => {
    mockFetch.mockReturnValue(jsonResponse(makeItems(20, 'Filt'), 20));

    const fetcher = new ContextAwareFetcher();
    const router = Router({ target: '#app', type: 'hash', fetcher });

    const tag = uniqueTag('rp-filter');
    @router.page({ tag, routes: ['/filter'] })
    class FilterPage extends HTMLElement {
      @property({ type: Array }) items: Item[] = [];
      @property() query = '';

      @context()
      async onCtx(ctx: Context) {
        this.items = await (await ctx.fetch('/api/items')).json();
      }

      get visible() {
        if (!this.query) return this.items;
        return this.items.filter((it) => it.name.includes(this.query));
      }

      @render()
      tpl() {
        const v = this.visible;
        return html`
          <span class="vis-count">${v.length}</span>
          <ul>${v.map((it) => html`<li class="item">${it.name}</li>`)}</ul>
        `;
      }
    }

    router.initialize();
    await router.navigate('/filter');
    await settle(80);

    const page = container.querySelector(tag) as any;
    expect(page.items.length).toBe(20);
    expect(getRenderedItemsCount(page, 'li.item')).toBe(20);

    // Apply a filter that matches one item.
    page.query = 'Filt 7';
    await settle(10);
    expect(getRenderedItemsCount(page, 'li.item')).toBe(1);
    expect(page.shadowRoot?.querySelector('.vis-count')?.textContent).toBe('1');

    // Filter that matches a substring (10, 11, ..., 19 — 10 items).
    page.query = 'Filt 1';
    await settle(10);
    expect(getRenderedItemsCount(page, 'li.item')).toBe(11); // "Filt 1", "Filt 10".."Filt 19"

    // Clear filter.
    page.query = '';
    await settle(10);
    expect(getRenderedItemsCount(page, 'li.item')).toBe(20);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 15. Pagination: page fetches sequential pages, list swaps each time.
  //     Verifies stale items don't bleed into the next page.
  // ──────────────────────────────────────────────────────────────────────────
  it('paginates by re-fetching and replacing items per page', async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : (input as Request).url ?? String(input);
      const m = /\/page\/(\d+)/.exec(url);
      const page = m ? parseInt(m[1], 10) : 0;
      const items = Array.from({ length: 10 }, (_, i) => ({
        id: page * 10 + i,
        name: `P${page}-${i}`,
      }));
      return jsonResponse(items, 15);
    });

    const fetcher = new ContextAwareFetcher();
    const router = Router({ target: '#app', type: 'hash', fetcher });

    const tag = uniqueTag('rp-pagi');
    @router.page({ tag, routes: ['/pagi'] })
    class PagePage extends HTMLElement {
      @property({ type: Array }) items: Item[] = [];
      @property({ type: Number }) pageNum = 0;
      private ctx?: Context;

      @context() onCtx(ctx: Context) { this.ctx = ctx; }

      async loadPage(n: number) {
        this.pageNum = n;
        const res = await this.ctx!.fetch(`/page/${n}`);
        this.items = await res.json();
      }

      @ready()
      async load() {
        while (!this.ctx) await delay(5);
        await this.loadPage(0);
      }

      @render()
      tpl() {
        return html`
          <span class="pn">${this.pageNum}</span>
          <ul>${this.items.map((it) => html`<li class="item">${it.name}</li>`)}</ul>
        `;
      }
    }

    router.initialize();
    await router.navigate('/pagi');
    await settle(60);

    const page = container.querySelector(tag) as any;
    expect(page.items.length).toBe(10);
    expect(getRenderedItemTexts(page, 'li.item')[0]).toBe('P0-0');

    await page.loadPage(1);
    await settle(40);
    expect(page.items.length).toBe(10);
    expect(getRenderedItemsCount(page, 'li.item')).toBe(10);
    expect(getRenderedItemTexts(page, 'li.item')[0]).toBe('P1-0');
    expect(getRenderedItemTexts(page, 'li.item')[9]).toBe('P1-9');
    expect(page.shadowRoot.querySelector('.pn').textContent).toBe('1');

    await page.loadPage(2);
    await settle(40);
    expect(getRenderedItemTexts(page, 'li.item')[0]).toBe('P2-0');
    // Stale "P0-0" / "P1-0" must be gone.
    const allText = page.shadowRoot.textContent ?? '';
    expect(allText.includes('P0-')).toBe(false);
    expect(allText.includes('P1-')).toBe(false);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 16. Same route navigated twice in a row: each visit must produce fresh
  //     fetched data, not stale.
  // ──────────────────────────────────────────────────────────────────────────
  it('refetches on revisit to the same route', async () => {
    let callIdx = 0;
    mockFetch.mockImplementation(() =>
      jsonResponse(makeItems(3 + callIdx, `Visit${callIdx++}`), 15));

    const fetcher = new ContextAwareFetcher();
    const router = Router({ target: '#app', type: 'hash', fetcher });

    const tag = uniqueTag('rp-revisit');
    @router.page({ tag, routes: ['/revisit'] })
    class RevisitPage extends HTMLElement {
      @property({ type: Array }) items: Item[] = [];
      @context()
      async onCtx(ctx: Context) {
        this.items = await (await ctx.fetch('/api/items')).json();
      }
      @render()
      tpl() { return html`<ul>${this.items.map((it) => html`<li class="item">${it.name}</li>`)}</ul>`; }
    }

    router.initialize();
    await router.navigate('/revisit');
    await settle(60);
    const firstPage = container.querySelector(tag) as any;
    expect(firstPage.items.length).toBe(3);
    expect(getRenderedItemTexts(firstPage, 'li.item')[0]).toBe('Visit0 0');

    // Navigate away then back.
    @router.page({ tag: uniqueTag('rp-other'), routes: ['/other'] })
    class OtherPage extends HTMLElement {
      @render() tpl() { return html`<p>other</p>`; }
    }
    await router.navigate('/other');
    await settle(20);

    await router.navigate('/revisit');
    await settle(60);

    const secondPage = container.querySelector(tag) as any;
    expect(secondPage).toBeTruthy();
    expect(secondPage.items.length).toBe(4);
    expect(getRenderedItemTexts(secondPage, 'li.item')[0]).toBe('Visit1 0');
  });
});
