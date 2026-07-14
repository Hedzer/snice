import { describe, it, expect, afterEach } from 'vitest';
import { wait } from './test-utils';

// Regression guards for the recent batch of fixes. Each test exercises
// the "normal" path next to the changed code to make sure the fix didn't
// break the common case.

afterEach(() => {
  try { document.body.innerHTML = ''; } catch {}
  document.querySelectorAll('[data-snice-spotlight-portal]').forEach(n => {
    try { n.remove(); } catch {}
  });
});

// ---------------------------------------------------------------------------
// carousel: default slidesPerView=1 still produces full-width slide sizing
// ---------------------------------------------------------------------------

describe('carousel: CSS-variable-based sizing matches old single-value math', () => {
  it('default slidesPerView=1, spaceBetween=0 produces --carousel-slide-width=100%', async () => {
    await import('../../packages/components/src/carousel/snice-carousel');
    const el = document.createElement('snice-carousel') as any;
    document.body.appendChild(el);
    await el.ready;
    await wait(30);

    expect(el.style.getPropertyValue('--carousel-slide-width')).toBe('100%');
    expect(el.style.getPropertyValue('--carousel-gap-adjust')).toBe('0px');
    expect(el.style.getPropertyValue('--carousel-space-between')).toBe('0px');
  });
});

// ---------------------------------------------------------------------------
// split-pane: mouse drag still works after touch support was added
// ---------------------------------------------------------------------------

describe('split-pane: mouse drag still works', () => {
  it('mousedown on divider sets isDragging', async () => {
    await import('../../packages/components/src/split-pane/snice-split-pane');
    const el = document.createElement('snice-split-pane') as any;
    el.innerHTML = '<div slot="primary">A</div><div slot="secondary">B</div>';
    document.body.appendChild(el);
    await el.ready;
    await wait(30);

    const divider = el.shadowRoot.querySelector('[part="divider"]') as HTMLElement;
    const evt = new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: 100, clientY: 100 });
    divider.dispatchEvent(evt);
    await wait(30);
    expect((el as any).isDragging).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// calendar: default state still renders a weekday row of 7 elements
// ---------------------------------------------------------------------------

describe('calendar: default render still has 7 weekday headers', () => {
  it('initial render contains a weekday header row', async () => {
    await import('../../packages/components/src/calendar/snice-calendar');
    const el = document.createElement('snice-calendar') as any;
    document.body.appendChild(el);
    await el.ready;
    await wait(30);

    const days = el.shadowRoot.querySelectorAll('.calendar__weekday');
    expect(days.length).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// spotlight: valid target still positions without firing the missing event
// ---------------------------------------------------------------------------

describe('spotlight: valid target does NOT emit spotlight-target-missing', () => {
  it('start() with an existing target does not fire the missing event', async () => {
    await import('../../packages/components/src/spotlight/snice-spotlight');
    const target = document.createElement('div');
    target.id = 'sp-target';
    target.textContent = 'target';
    document.body.appendChild(target);

    const el = document.createElement('snice-spotlight') as any;
    el.steps = [{ target: '#sp-target', title: 'ok', description: 'ok' }];
    document.body.appendChild(el);
    await el.ready;

    let missing = false;
    el.addEventListener('spotlight-target-missing', () => { missing = true; });
    el.start();
    await wait(40);
    expect(missing).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// segmented-control: initial indicator rendering still works (pre-resize)
// ---------------------------------------------------------------------------

describe('segmented-control: initial ready still updates indicator once', () => {
  it('has a default value selected after options are set', async () => {
    await import('../../packages/components/src/segmented-control/snice-segmented-control');
    const el = document.createElement('snice-segmented-control') as any;
    el.options = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }];
    document.body.appendChild(el);
    await el.ready;
    await wait(30);

    expect(el.value).toBe('a');
  });
});

// ---------------------------------------------------------------------------
// CLI: default + positive minify still works
// ---------------------------------------------------------------------------

describe('CLI: --minify=true and default both produce minify=true', () => {
  function parseMinify(flags: Record<string, any>) {
    return flags.minify !== false && flags.minify !== 'false' && flags['no-minify'] !== true;
  }

  it('no flag → minify=true', () => {
    expect(parseMinify({})).toBe(true);
  });
  it('--minify alone → minify=true', () => {
    expect(parseMinify({ minify: true })).toBe(true);
  });
  it('--minify=true → minify=true', () => {
    expect(parseMinify({ minify: 'true' })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// radio: single-group lookup unchanged for light-DOM usage
// ---------------------------------------------------------------------------

describe('radio: light-DOM grouping still works', () => {
  it('two radios with same name in document body coordinate', async () => {
    await import('../../packages/components/src/radio/snice-radio');
    const a = document.createElement('snice-radio') as any;
    const b = document.createElement('snice-radio') as any;
    a.setAttribute('name', 'lg'); a.setAttribute('value', 'a');
    b.setAttribute('name', 'lg'); b.setAttribute('value', 'b');
    document.body.appendChild(a);
    document.body.appendChild(b);
    await a.ready; await b.ready;

    const found = (a as any).findGroupRadios();
    expect(found.length).toBe(2);
    expect(found).toContain(a);
    expect(found).toContain(b);
  });
});

// ---------------------------------------------------------------------------
// pdf-viewer: single page render (no queue) still completes normally
// ---------------------------------------------------------------------------

describe('pdf-viewer: single page render completes normally', () => {
  it('calling renderPage once resolves and leaves rendering=false', async () => {
    (HTMLCanvasElement.prototype as any).getContext = () => ({});
    await import('../../packages/components/src/pdf-viewer/snice-pdf-viewer');
    const el = document.createElement('snice-pdf-viewer') as any;
    document.body.appendChild(el);
    await el.ready;

    (el as any).pdfDoc = {
      numPages: 1,
      destroy() {},
      async getPage() {
        return {
          getViewport: () => ({ width: 100, height: 100 }),
          render: () => ({ promise: Promise.resolve() }),
        };
      },
    };
    (el as any).totalPages = 1;
    (el as any).page = 1;

    await el.renderPage();
    expect((el as any).rendering).toBe(false);
  });
});
