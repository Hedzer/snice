/**
 * MATRIX slice — snice-pdf-viewer document lifecycle.
 *
 * Dimensions: loaded pages (2) x fit (3) = 6, error path x channel (2),
 * src change x direction (2), loading state (1), navigation with a document
 * (goToPage in-range/out-of-range x2, next at last, prev at first,
 * keyboard mid-document) — 17 combos.
 *
 * happy-dom has no PDF stack worth trusting, and this suite runs offline: the
 * vendored `pdf.min.mjs` loader is swapped for a recording stand-in (the same
 * substitution `tests/matrix/media-mock.ts` makes for the capture stack). The
 * stand-in is faithful to the part the DOCUMENTED contract observes — a
 * loading task whose promise resolves a document with `numPages` and `getPage`,
 * or rejects with an error — so the events (`pdf-loaded -> { totalPages }`,
 * `pdf-error -> { error }`, `page-change -> { page, totalPages }`), the
 * toolbar's document-aware state, and the viewport state machine are all
 * assertable exactly as the docs state them.
 *
 * Rendered page GEOMETRY needs layout and belongs to the visual tier; here the
 * render pipeline is only observed through the stand-in's recorded calls.
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { product, expectShape, captureEvents, removeComponent, settle, unmountAll } from '../matrix-utils';
import {
  mountViewer, readToolbar, expectedToolbar, stateVisible, pressKey,
  type ViewerCombo,
} from './pdf-viewer-support';

// ── The offline document stand-in ────────────────────────────────────────────
//
// One virtual document per `src` prefix: `doc:one`/`doc:many` resolve with
// 1/3 pages, `err:` rejects, and `slow:` never settles until the test says so.
vi.mock('../../../packages/components/src/pdf-viewer/pdf.min.mjs', () => {
  const state = {
    srcs: [] as string[],
    renders: 0,
    slowResolve: null as null | ((pages: number) => void),
  };
  const makeDoc = (numPages: number) => ({
    numPages,
    getPage: async () => ({
      getViewport: ({ scale }: { scale: number }) => ({ width: 612 * scale, height: 792 * scale }),
      render: () => {
        state.renders++;
        return { cancel: () => {}, promise: Promise.resolve() };
      },
    }),
    destroy: () => {},
  });
  return {
    GlobalWorkerOptions: { __state: state },
    getDocument: (src: string) => {
      state.srcs.push(src);
      if (src.startsWith('err:')) {
        return { promise: Promise.reject(new Error(`cannot open ${src}`)) };
      }
      if (src.startsWith('slow:')) {
        return {
          promise: new Promise((resolve) => { state.slowResolve = (pages: number) => resolve(makeDoc(pages)); }),
        };
      }
      return { promise: Promise.resolve(makeDoc(src.startsWith('doc:one') ? 1 : 3)) };
    },
  };
});

// @ts-ignore - the recording stand-in installed above replaces this module
import { GlobalWorkerOptions } from '../../../packages/components/src/pdf-viewer/pdf.min.mjs';
import '../../../packages/components/src/pdf-viewer/snice-pdf-viewer';

const state = (GlobalWorkerOptions as any).__state as {
  srcs: string[]; renders: number; slowResolve: null | ((pages: number) => void);
};

/**
 * Capture the viewer's composed, bubbling events from the DOCUMENT, before
 * anything mounts: an authored `src` attribute loads during `@ready`, so a
 * listener attached after mount would miss the attr channel's first event.
 * Only one viewer exists at a time here (`unmountAll` runs between tests), so
 * document level is the viewer level.
 */
function captureDocEvents(types: string[]) {
  const events: Array<{ type: string; detail: any }> = [];
  const handlers = types.map(type => {
    const handler = (event: Event) => {
      events.push({ type, detail: (event as CustomEvent).detail });
    };
    document.addEventListener(type, handler);
    return { type, handler };
  });
  return {
    events,
    types: () => events.map(e => e.type),
    stop: () => handlers.forEach(({ type, handler }) => document.removeEventListener(type, handler)),
  };
}

const plain = (over: Partial<ViewerCombo> = {}): ViewerCombo => ({
  page: 1, zoom: 1, fit: 'width', channel: 'attr', ...over,
});

afterEach(() => { unmountAll(); });

describe('pdf-viewer matrix: a src that loads', () => {
  let el: HTMLElement | undefined;

  for (const { pages, fit } of product({
    pages: [['doc:one', 1], ['doc:many', 3]] as Array<[string, number]>,
    fit: ['width', 'height', 'page'] as const,
  })) {
    it(`${pages[0]}/fit=${fit}: pdf-loaded reports totalPages and the toolbar follows`, async () => {
      const combo = plain({ src: pages[0], fit });
      const seen = captureDocEvents(['pdf-loaded', 'pdf-error']);
      el = await mountViewer(combo);
      // The @ready pass loads the authored src; its event is captured from
      // the document because it fires before a host listener could attach.
      await settle(el, 40);

      expect(seen.types()).toEqual(['pdf-loaded']);
      expect(seen.events[0].detail).toEqual({ totalPages: pages[1] });
      expect((el as any).totalPages).toBe(pages[1]);
      // The canvas state is the visible one once a document loaded.
      expect(stateVisible(el, 'canvas')).toBe(true);
      expect(stateVisible(el, 'empty')).toBe(false);
      // Document-aware toolbar: page input max, page total, and the next
      // boundary now that totalPages is real.
      expectShape(readToolbar(el), expectedToolbar(combo, pages[1]), `${pages[0]}/fit=${fit}`);
      seen.stop();
    });
  }

  afterEach(() => { if (el) removeComponent(el); el = undefined; });
});

describe('pdf-viewer matrix: a src that fails', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  for (const channel of ['attr', 'prop'] as const) {
    it(`${channel}: pdf-error carries the error and the error state shows`, async () => {
      const combo = plain({ src: 'err:broken.pdf', channel });
      const seen = captureDocEvents(['pdf-error']);
      el = await mountViewer(combo);
      // The error fires during the initial load (attr channel) or the first
      // watch pass (prop channel); either way it must have fired exactly once.
      await settle(el, 40);

      expect(seen.types()).toEqual(['pdf-error']);
      expect(seen.events[0].detail.error).toContain('broken.pdf');
      expect(stateVisible(el, 'error')).toBe(true);
      expect(stateVisible(el, 'canvas')).toBe(false);
      expect(stateVisible(el, 'empty')).toBe(false);
      seen.stop();
    });
  }
});

describe('pdf-viewer matrix: the loading state while a document is in flight', () => {
  it('the loading state is visible until the document resolves', async () => {
    const el = await mountViewer(plain());
    (el as any).src = 'slow:forever.pdf';
    await settle(el, 40);
    expect(stateVisible(el, 'loading')).toBe(true);
    expect(stateVisible(el, 'canvas')).toBe(false);

    state.slowResolve!(3);
    await settle(el, 40);
    expect(stateVisible(el, 'loading')).toBe(false);
    expect(stateVisible(el, 'canvas')).toBe(true);
    expect((el as any).totalPages).toBe(3);
  });
});

describe('pdf-viewer matrix: changing src loads the new document', () => {
  it('good -> bad swaps the canvas state for the error state', async () => {
    const el = await mountViewer(plain({ src: 'doc:many' }));
    await settle(el, 40);
    expect(stateVisible(el, 'canvas')).toBe(true);

    const seen = captureEvents(el, ['pdf-loaded', 'pdf-error']);
    (el as any).src = 'err:worse.pdf';
    await settle(el, 40);

    expect(seen.types()).toEqual(['pdf-error']);
    expect(stateVisible(el, 'error')).toBe(true);
    seen.stop();
  });

  it('bad -> good recovers into the canvas state', async () => {
    const el = await mountViewer(plain({ src: 'err:broken.pdf' }));
    await settle(el, 40);
    expect(stateVisible(el, 'error')).toBe(true);

    const seen = captureEvents(el, ['pdf-loaded', 'pdf-error']);
    (el as any).src = 'doc:one';
    await settle(el, 40);

    expect(seen.types()).toEqual(['pdf-loaded']);
    expect(seen.events[0].detail).toEqual({ totalPages: 1 });
    expect(stateVisible(el, 'canvas')).toBe(true);
    seen.stop();
  });

  it('each src value is requested exactly once', async () => {
    const before = state.srcs.length;
    const el = await mountViewer(plain({ src: 'doc:many' }));
    await settle(el, 40);
    expect(state.srcs.slice(before)).toEqual(['doc:many']);
  });
});

describe('pdf-viewer matrix: navigation with a document', () => {
  it('goToPage inside the document moves and fires page-change -> { page, totalPages }', async () => {
    const el = await mountViewer(plain({ src: 'doc:many' }));
    await settle(el, 40);
    const seen = captureEvents(el, ['page-change']);

    (el as any).goToPage(2);
    await settle(el, 40);

    expect(seen.types()).toEqual(['page-change']);
    expect(seen.events[0].detail).toEqual({ page: 2, totalPages: 3 });
    expect((el as any).page).toBe(2);
    seen.stop();
  });

  it('goToPage outside the document is ignored', async () => {
    const el = await mountViewer(plain({ src: 'doc:many' }));
    await settle(el, 40);
    const seen = captureEvents(el, ['page-change']);

    (el as any).goToPage(0);
    (el as any).goToPage(9);
    await settle(el, 40);

    expect((el as any).page).toBe(1);
    expect(seen.types()).toEqual([]);
    seen.stop();
  });

  it('nextPage stops at the last page and disables next', async () => {
    const el = await mountViewer(plain({ src: 'doc:many' }));
    await settle(el, 40);
    const k = el as any;
    k.goToPage(2);
    await settle(el, 40);

    k.nextPage();
    await settle(el, 40);
    expect(k.page).toBe(3);
    const seen = captureEvents(el, ['page-change']);
    k.nextPage();
    await settle(el, 40);
    expect(k.page).toBe(3);
    expect(seen.types()).toEqual([]);
    expectShape(readToolbar(el), expectedToolbar(plain({ src: 'doc:many', page: 3 }), 3), 'at last page');
    seen.stop();
  });

  it('prevPage stops at the first page', async () => {
    const el = await mountViewer(plain({ src: 'doc:many' }));
    await settle(el, 40);
    const k = el as any;
    k.goToPage(2);
    await settle(el, 40);

    k.prevPage();
    await settle(el, 40);
    expect(k.page).toBe(1);
    k.prevPage();
    await settle(el, 40);
    expect(k.page).toBe(1);
  });

  it('keyboard ArrowRight turns the page inside a document', async () => {
    const el = await mountViewer(plain({ src: 'doc:many' }));
    await settle(el, 40);
    const seen = captureEvents(el, ['page-change']);

    pressKey(el, 'ArrowRight');
    await settle(el, 40);

    expect((el as any).page).toBe(2);
    expect(seen.types()).toEqual(['page-change']);
    expect(seen.events[0].detail).toEqual({ page: 2, totalPages: 3 });
    seen.stop();
  });

  it('a one-page document disables both navigation buttons at page 1', async () => {
    const el = await mountViewer(plain({ src: 'doc:one' }));
    await settle(el, 40);
    expectShape(readToolbar(el), expectedToolbar(plain({ src: 'doc:one' }), 1), 'single page');
  });
});
