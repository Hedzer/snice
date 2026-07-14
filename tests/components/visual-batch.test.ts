import { describe, it, expect, afterEach } from 'vitest';
import { wait } from './test-utils';

// Batch: visual / lifecycle. calendar, segmented-control, carousel, spotlight.

afterEach(() => {
  try { document.body.innerHTML = ''; } catch {}
  // Clean portals some components leave on document.body
  document.querySelectorAll('[data-snice-spotlight-portal]').forEach(n => {
    try { n.remove(); } catch {}
  });
});

// ---------------------------------------------------------------------------
// spotlight: missing target emits an event instead of silently disappearing.
// ---------------------------------------------------------------------------

describe('spotlight: missing step target emits a recoverable event', () => {
  it('dispatches spotlight-target-missing when the step.target selector has no match', async () => {
    await import('../../packages/components/src/spotlight/snice-spotlight');
    const el = document.createElement('snice-spotlight') as any;
    el.steps = [{ target: '#does-not-exist', title: 'Step 1', description: 'x' }];
    document.body.appendChild(el);
    await el.ready;

    let fired: any = null;
    el.addEventListener('spotlight-target-missing', (e: any) => { fired = e.detail; });

    el.start();
    await wait(40);

    expect(fired).not.toBeNull();
    expect(fired.step?.target).toBe('#does-not-exist');
  });
});

// ---------------------------------------------------------------------------
// calendar: weekday headers update when locale or firstDayOfWeek change.
// ---------------------------------------------------------------------------

describe('calendar: weekday headers rebuild on locale change', () => {
  it('changing firstDayOfWeek reorders the rendered weekday row', async () => {
    await import('../../packages/components/src/calendar/snice-calendar');
    const el = document.createElement('snice-calendar') as any;
    el.locale = 'en-US';
    el.firstDayOfWeek = 0; // Sunday first
    document.body.appendChild(el);
    await el.ready;
    await wait(30);

    const getFirst = () => {
      const first = el.shadowRoot.querySelector('.calendar__weekday');
      return first?.textContent?.trim();
    };
    const sundayFirst = getFirst();

    el.firstDayOfWeek = 1; // Monday first
    await wait(30);
    const mondayFirst = getFirst();

    expect(sundayFirst).not.toBe(mondayFirst);
  });
});

// ---------------------------------------------------------------------------
// segmented-control: ResizeObserver re-measures indicator on container resize.
// ---------------------------------------------------------------------------

describe('segmented-control: installs a ResizeObserver for indicator reposition', () => {
  it('creates a ResizeObserver on @ready', async () => {
    let created = false;
    const origRO = (globalThis as any).ResizeObserver;
    class SpyRO {
      constructor(_cb: any) { created = true; }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    (globalThis as any).ResizeObserver = SpyRO as any;

    try {
      await import('../../packages/components/src/segmented-control/snice-segmented-control');
      const el = document.createElement('snice-segmented-control') as any;
      el.options = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }];
      document.body.appendChild(el);
      await el.ready;
      await wait(30);
      expect(created).toBe(true);
    } finally {
      (globalThis as any).ResizeObserver = origRO;
    }
  });
});

// ---------------------------------------------------------------------------
// carousel: slidesPerView change reactively updates CSS custom properties.
// ---------------------------------------------------------------------------

describe('carousel: slidesPerView change updates slide width', () => {
  it('changing slidesPerView updates --carousel-slide-width', async () => {
    await import('../../packages/components/src/carousel/snice-carousel');
    const el = document.createElement('snice-carousel') as any;
    el.slidesPerView = 1;
    el.spaceBetween = 0;
    document.body.appendChild(el);
    await el.ready;
    await wait(30);
    const before = el.style.getPropertyValue('--carousel-slide-width');

    el.slidesPerView = 3;
    await wait(30);
    const after = el.style.getPropertyValue('--carousel-slide-width');

    expect(before).toBe('100%');
    expect(after).toBe(`${100 / 3}%`);
  });
});
