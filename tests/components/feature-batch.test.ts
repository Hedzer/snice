import { describe, it, expect, afterEach } from 'vitest';
import { wait } from './test-utils';

// Batch: feature/correctness bugs. radio, list, scheduler, pdf-viewer.

afterEach(() => { document.body.innerHTML = ''; });

// ---------------------------------------------------------------------------
// radio: group lookup must find radios across shadow / form boundaries.
// ---------------------------------------------------------------------------

describe('radio: group coordinates radios inside a shadow root', () => {
  it('findGroupRadios finds siblings within the enclosing shadow root', async () => {
    await import('../../components/radio/snice-radio');

    const wrapper = document.createElement('div');
    const sr = wrapper.attachShadow({ mode: 'open' });
    const a = document.createElement('snice-radio') as any;
    const b = document.createElement('snice-radio') as any;
    a.setAttribute('name', 'g1'); a.setAttribute('value', 'a');
    b.setAttribute('name', 'g1'); b.setAttribute('value', 'b');
    sr.appendChild(a);
    sr.appendChild(b);
    document.body.appendChild(wrapper);
    await a.ready; await b.ready;

    // Verify the fix: findGroupRadios (private) finds BOTH radios from the
    // shadow scope, not from document (which would return []).
    const found = (a as any).findGroupRadios();
    expect(found.length).toBe(2);
    expect(found.includes(a)).toBe(true);
    expect(found.includes(b)).toBe(true);
  });

  it('radios in two separate <form> elements do not cross-contaminate', async () => {
    await import('../../components/radio/snice-radio');
    const form1 = document.createElement('form');
    const form2 = document.createElement('form');
    form1.innerHTML = `<snice-radio name="g" value="a" checked></snice-radio>`;
    form2.innerHTML = `<snice-radio name="g" value="b"></snice-radio>`;
    document.body.appendChild(form1);
    document.body.appendChild(form2);
    const a = form1.querySelector('snice-radio') as any;
    const b = form2.querySelector('snice-radio') as any;
    await a.ready; await b.ready;

    b.checked = true;
    await wait(30);

    // form1's radio must stay checked — different form, same name is OK
    expect(a.checked).toBe(true);
    expect(b.checked).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// list: infinite-scroll attaches the sentinel observer reliably
// ---------------------------------------------------------------------------

describe('list: infinite scroll attaches its IntersectionObserver', () => {
  it('creates an observer after @ready even when sentinel renders after @ready fires', async () => {
    await import('../../components/list/snice-list');

    let observerCreated = false;
    let observedSentinel = false;
    const origIO = (globalThis as any).IntersectionObserver;
    class SpyIO {
      _cb: any;
      constructor(cb: any) { this._cb = cb; observerCreated = true; }
      observe(node: Element) {
        if (node.classList.contains('list__sentinel')) observedSentinel = true;
      }
      unobserve() {}
      disconnect() {}
    }
    (globalThis as any).IntersectionObserver = SpyIO as any;

    try {
      const el = document.createElement('snice-list') as any;
      el.setAttribute('infinite', '');
      document.body.appendChild(el);
      await el.ready;
      // Give the microtask deferral time to run
      await wait(50);

      expect(observerCreated).toBe(true);
      expect(observedSentinel).toBe(true);
    } finally {
      (globalThis as any).IntersectionObserver = origIO;
    }
  });
});

// ---------------------------------------------------------------------------
// scheduler: full re-render is suppressed while a drag is in progress
// ---------------------------------------------------------------------------

describe('scheduler: property changes during drag do not trigger full re-render', () => {
  it('mutating events while dragState is set does not call renderGrid', async () => {
    await import('../../components/scheduler/snice-scheduler');
    const el = document.createElement('snice-scheduler') as any;
    el.resources = [{ id: 'r1', title: 'Room 1' }];
    el.events = [];
    document.body.appendChild(el);
    await el.ready;
    await wait(30);

    let renderCount = 0;
    const origRender = el.renderGrid.bind(el);
    el.renderGrid = () => { renderCount++; origRender(); };

    // Baseline: a property change with NO drag in progress fires renderGrid
    el.events = [{ id: 'e0', resourceId: 'r1', start: new Date(), end: new Date(), title: 'baseline' }];
    await wait(30);
    const baseline = renderCount;
    expect(baseline).toBeGreaterThan(0);

    // Now simulate a drag and mutate events — renderGrid MUST NOT fire.
    (el as any).dragState = { type: 'move' };
    el.events = [{ id: 'e1', resourceId: 'r1', start: new Date(), end: new Date(), title: 'during-drag' }];
    await wait(30);
    expect(renderCount).toBe(baseline);
  });
});

// ---------------------------------------------------------------------------
// pdf-viewer: rapid page changes are not silently dropped
// ---------------------------------------------------------------------------

describe('pdf-viewer: rapid page changes eventually render the latest page', () => {
  it('requesting page 3 while page 2 is rendering ends on page 3', async () => {
    // happy-dom needs a canvas context stub
    (HTMLCanvasElement.prototype as any).getContext = () => ({});
    await import('../../components/pdf-viewer/snice-pdf-viewer');
    const el = document.createElement('snice-pdf-viewer') as any;
    document.body.appendChild(el);
    await el.ready;

    const renderedPages: number[] = [];
    let resolveCurrent: (() => void) | null = null;

    // Install a fake pdfDoc with controllable render timing
    (el as any).pdfDoc = {
      numPages: 10,
      async getPage(n: number) {
        return {
          getViewport: () => ({ width: 100, height: 100 }),
          render: () => ({
            promise: new Promise<void>(resolve => {
              resolveCurrent = () => { renderedPages.push(n); resolve(); };
            }),
          }),
        };
      },
    };
    (el as any).totalPages = 10;

    // Kick off page 2 render; don't resolve yet.
    (el as any).page = 2;
    el.renderPage();
    await wait(20);
    expect(resolveCurrent).not.toBeNull();

    // While page 2 is "rendering", change to page 3.
    (el as any).page = 3;
    el.renderPage();
    await wait(20);

    // Finish page 2; then the pending page 3 render should kick off.
    resolveCurrent!();
    await wait(50);
    resolveCurrent!();   // resolve page 3
    await wait(50);

    expect(renderedPages).toContain(3);
  });
});
