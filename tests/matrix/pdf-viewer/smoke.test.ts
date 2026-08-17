/**
 * Smoke slice of the snice-pdf-viewer matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include (vitest.config.ts);
 * the ~90-combo matrix runs only via `npm run test:matrix`. This file is the
 * standing cost the everyday loop DOES pay, so it lives at `smoke.test.ts`
 * where the config keeps it collected.
 *
 * One combo per feature family of docs/ai/components/pdf-viewer.md: the
 * unconditional chrome, the toolbar readouts and boundary disables, the
 * reflection channel, the no-document no-ops, and — through the same offline
 * loader stand-in the matrix uses — one document lifecycle pass. Structural
 * assertions route through the matrix's own oracles.
 *
 * BUDGET: well under 1s. New feature combinations belong in the matrix.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { expectShape, settle, unmountAll } from '../matrix-utils';
import {
  mountViewer, expectedShell, readShell, expectedToolbar, readToolbar,
  expectedAxes, readAxes, toolbarButton, pressKey, type ViewerCombo,
} from './pdf-viewer-support';

/**
 * Capture the viewer's composed, bubbling events from the DOCUMENT before
 * anything mounts: an authored `src` loads during `@ready`, earlier than a
 * host listener could attach. One viewer exists at a time here.
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

vi.mock('../../../packages/components/src/pdf-viewer/pdf.min.mjs', () => ({
  GlobalWorkerOptions: {},
  getDocument: (src: string) => {
    if (src.startsWith('err:')) {
      return { promise: Promise.reject(new Error(`cannot open ${src}`)) };
    }
    return {
      promise: Promise.resolve({
        numPages: 3,
        getPage: async () => ({
          getViewport: ({ scale }: { scale: number }) => ({ width: 612 * scale, height: 792 * scale }),
          render: () => ({ cancel: () => {}, promise: Promise.resolve() }),
        }),
        destroy: () => {},
      }),
    };
  },
}));

import '../../../packages/components/src/pdf-viewer/snice-pdf-viewer';

const plain = (over: Partial<ViewerCombo> = {}): ViewerCombo => ({
  page: 1, zoom: 1, fit: 'width', channel: 'attr', ...over,
});

afterEach(() => { unmountAll(); });

describe('pdf-viewer matrix smoke', () => {
  it('a bare viewer renders the documented chrome and the empty state', async () => {
    const el = await mountViewer(plain());
    expectShape(readShell(el), expectedShell(), 'smoke/shell');
    expectShape(readToolbar(el), expectedToolbar(plain()), 'smoke/toolbar');
    expect((el as any).totalPages).toBe(0);
  });

  it('the documented defaults hold and reflect nothing', async () => {
    // The property channel with default values authors no markup: per
    // docs/ai/properties.md a default the framework was never told about
    // never reaches an attribute.
    const el = await mountViewer(plain({ channel: 'prop' }));
    expect((el as any).src).toBe('');
    expect((el as any).page).toBe(1);
    expect((el as any).zoom).toBe(1);
    expect((el as any).fit).toBe('width');
    expect(el.getAttribute('fit')).toBeNull();
    expect(el.getAttribute('zoom')).toBeNull();
    expect(el.getAttribute('page')).toBeNull();
  });

  it('the property channel reflects non-default axes to their attributes', async () => {
    const combo = plain({ zoom: 2.5, page: 3, fit: 'page', channel: 'prop' });
    const el = await mountViewer(combo);
    expectShape(readAxes(el, combo), expectedAxes(combo), 'smoke/axes');
    expect(el.getAttribute('fit')).toBe('page');
    expect(el.getAttribute('zoom')).toBe('2.5');
  });

  it('the zoom range caps the zoom buttons', async () => {
    const el = await mountViewer(plain({ zoom: 0.25 }));
    expect(toolbarButton(el, 'zoom-out')!.disabled).toBe(true);
    expect(toolbarButton(el, 'zoom-in')!.disabled).toBe(false);
    toolbarButton(el, 'zoom-in')!.click();
    await settle(el, 10);
    expect((el as any).zoom).toBe(0.5);
  });

  it('without a document every navigation is the documented no-op', async () => {
    const el = await mountViewer(plain());
    const seen = captureDocEvents(['page-change']);
    const k = el as any;
    k.goToPage(2); k.nextPage(); k.prevPage();
    pressKey(el, 'ArrowRight'); pressKey(el, 'PageDown');
    await settle(el, 10);
    expect(k.page).toBe(1);
    expect(seen.types()).toEqual([]);
    seen.stop();
  });

  it('a loading src reports pdf-loaded and unlocks the navigation', async () => {
    const seen = captureDocEvents(['pdf-loaded', 'page-change']);
    const el = await mountViewer(plain({ src: 'doc:many' }));
    await settle(el, 40);

    expect(seen.types()).toEqual(['pdf-loaded']);
    expect(seen.events[0].detail).toEqual({ totalPages: 3 });
    expectShape(readToolbar(el), expectedToolbar(plain({ src: 'doc:many' }), 3), 'smoke/loaded toolbar');

    (el as any).goToPage(2);
    await settle(el, 40);
    expect((el as any).page).toBe(2);
    expect(seen.events[1].detail).toEqual({ page: 2, totalPages: 3 });
    seen.stop();
  });

  it('a failing src reports pdf-error with the error', async () => {
    const seen = captureDocEvents(['pdf-error']);
    const el = await mountViewer(plain({ src: 'err:gone.pdf' }));
    await settle(el, 40);
    expect(seen.types()).toEqual(['pdf-error']);
    expect(seen.events[0].detail.error).toContain('gone.pdf');
    seen.stop();
  });
});
