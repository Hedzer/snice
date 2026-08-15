/**
 * Matrix slice LOCATION / ACTIVATION — the § Activation Contract, rule by rule.
 *
 * The doc states these as requirements:
 *
 *   · `clickable=true` renders the internal base with `role="link"` and
 *     `tabindex="0"`.
 *   · Pointer activation, Enter, and `element.click()` each emit ONE
 *     `location-click`, then attempt safe navigation.
 *   · Space and unrelated keys do not activate link semantics.
 *   · An unsafe/missing destination still emits the activation event but never
 *     opens.
 *   · Direct `openMap()` validates/opens without checking `clickable` and
 *     without emitting the event.
 *   · `clickable=false` removes the interactive role/tab stop and makes
 *     pointer, keyboard, and host `click()` activation inert.
 *
 * And from § Events: `location-click` -> `LocationData`; synchronous, bubbling,
 * composed; emitted BEFORE navigation.
 *
 * Dimensions: clickable (2) x activation path (5) x destination (3: safe
 * authored / generated fallback / none) = 30 combos, plus the ordering and
 * payload cases.
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { mount, unmountAll, product, captureEvents, click, key } from '../matrix-utils';
import {
  CENTRAL_PARK, location, attrsOf, propsOf, locationProblems, read,
  type LocationCombo,
} from './location-support';

const SAFE = 'https://maps.example.com/place/1';
const UNSAFE = 'javascript:alert(1)';

/** The three destination shapes the contract distinguishes. */
const DESTINATIONS = {
  authored: { mapUrl: SAFE, opens: true },
  generated: { mapUrl: '', opens: true },
  unsafe: { mapUrl: UNSAFE, opens: false },
  none: { mapUrl: '', opens: false },
} as const;

const mountLocation = (c: LocationCombo) =>
  mount<HTMLElement>('snice-location', attrsOf(c), '', propsOf(c));

describe('location matrix: activation contract', () => {
  let opened: any[];

  beforeEach(() => {
    opened = [];
    vi.stubGlobal('open', (url: any) => { opened.push(url); return null; });
  });

  afterEach(() => { vi.unstubAllGlobals(); unmountAll(); });

  /** Perform one activation path on a mounted element. */
  function activate(el: HTMLElement, how: string): void {
    const base = read(el).base;
    switch (how) {
      case 'pointer': click(base); break;
      case 'Enter': key(base, 'Enter'); break;
      case 'Space': key(base, ' '); break;
      case 'other key': key(base, 'ArrowRight'); break;
      case 'host click()': el.click(); break;
      default: throw new Error(`unknown activation path "${how}"`);
    }
  }

  /** The paths the contract says DO activate, and the ones it says do not. */
  const ACTIVATES = ['pointer', 'Enter', 'host click()'];
  const INERT = ['Space', 'other key'];
  const PATHS = [...ACTIVATES, ...INERT];

  // ── The full cross ───────────────────────────────────────────────────────

  for (const point of product({
    clickable: [true, false],
    how: PATHS,
    destination: Object.keys(DESTINATIONS) as Array<keyof typeof DESTINATIONS>,
  })) {
    const spec = DESTINATIONS[point.destination];
    const id = `clickable=${point.clickable} via ${point.how}, ${point.destination} destination`;

    it(id, async () => {
      const hasPlace = point.destination !== 'none';
      const c = location({
        ...(hasPlace ? CENTRAL_PARK : { name: 'Nameless' }),
        mapUrl: spec.mapUrl,
        clickable: point.clickable,
      });
      const el = await mountLocation(c);
      expect(locationProblems(el, c), `${id}: rendering`).toEqual([]);

      const recorder = captureEvents(el, ['location-click']);
      activate(el, point.how);

      const shouldEmit = point.clickable && ACTIVATES.includes(point.how);
      expect(recorder.types(), `${id}: emitted events`)
        .toEqual(shouldEmit ? ['location-click'] : []);

      const shouldOpen = shouldEmit && spec.opens;
      expect(opened.length, `${id}: opened ${JSON.stringify(opened)}`).toBe(shouldOpen ? 1 : 0);
    });
  }

  // ── The payload ──────────────────────────────────────────────────────────

  it('location-click carries the same LocationData getData() returns', async () => {
    const c = location({ ...CENTRAL_PARK, clickable: true });
    const el = await mountLocation(c);
    const recorder = captureEvents(el, ['location-click']);

    click(read(el).base);

    expect(recorder.events[0].detail).toEqual((el as any).getData());
  });

  it('location-click is synchronous, bubbling, and composed', async () => {
    const c = location({ ...CENTRAL_PARK, clickable: true });
    const el = await mountLocation(c);
    const seen: Array<{ bubbles: boolean; composed: boolean }> = [];
    document.addEventListener('location-click', (event: Event) => {
      seen.push({ bubbles: event.bubbles, composed: event.composed });
    }, { once: true });

    click(read(el).base);

    // No await: the doc says synchronous, so the listener has already run.
    expect(seen, 'a page-level listener never saw location-click').toHaveLength(1);
    expect(seen[0]).toEqual({ bubbles: true, composed: true });
  });

  it('location-click is emitted BEFORE navigation is attempted', async () => {
    const order: string[] = [];
    vi.stubGlobal('open', (url: any) => { order.push(`open:${url}`); return null; });
    const c = location({ ...CENTRAL_PARK, mapUrl: SAFE, clickable: true });
    const el = await mountLocation(c);
    el.addEventListener('location-click', () => order.push('event'));

    click(read(el).base);

    expect(order).toEqual(['event', `open:${SAFE}`]);
  });

  it('an unsafe destination still emits, but never opens', async () => {
    const c = location({ ...CENTRAL_PARK, mapUrl: UNSAFE, clickable: true });
    const el = await mountLocation(c);
    const recorder = captureEvents(el, ['location-click']);

    click(read(el).base);
    el.click();
    key(read(el).base, 'Enter');

    expect(recorder.types()).toEqual(['location-click', 'location-click', 'location-click']);
    expect(opened).toEqual([]);
  });

  // ── openMap() is the caller's own path ───────────────────────────────────

  for (const clickable of [true, false]) {
    it(`openMap() ignores clickable=${clickable} and emits nothing`, async () => {
      const c = location({ ...CENTRAL_PARK, mapUrl: SAFE, clickable });
      const el = await mountLocation(c);
      const recorder = captureEvents(el, ['location-click']);

      (el as any).openMap();

      expect(recorder.types(), 'openMap() emitted location-click').toEqual([]);
      expect(opened, 'openMap() did not open the safe destination').toEqual([SAFE]);
    });
  }

  // ── Turning clickable on and off ─────────────────────────────────────────

  it('toggling clickable adds and removes the role and tab stop', async () => {
    const c = location({ ...CENTRAL_PARK });
    const el = await mountLocation(c);
    expect(read(el).role).toBeNull();
    expect(read(el).tabindex).toBeNull();

    (el as any).clickable = true;
    await (el as any).rendered;
    expect(read(el).role).toBe('link');
    expect(read(el).tabindex).toBe('0');

    (el as any).clickable = false;
    await (el as any).rendered;
    expect(read(el).role).toBeNull();
    expect(read(el).tabindex).toBeNull();

    const recorder = captureEvents(el, ['location-click']);
    click(read(el).base);
    expect(recorder.types(), 'a de-clickable card still activated').toEqual([]);
  });

  it('each activation emits exactly one event, not one per path', async () => {
    // "Pointer activation, Enter, and element.click() each emit ONE
    // location-click" — a keydown that synthesises a click must not double up.
    const c = location({ ...CENTRAL_PARK, mapUrl: SAFE, clickable: true });
    const el = await mountLocation(c);
    const recorder = captureEvents(el, ['location-click']);

    key(read(el).base, 'Enter');

    expect(recorder.types()).toEqual(['location-click']);
    expect(opened).toEqual([SAFE]);
  });
});
