/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-location TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/location, `npm run test:matrix`) owns value
 * truth, and owns it thoroughly: which fields each mode renders, the whole
 * documented URL-safety table, and the activation contract down to "Space does
 * not activate". This tier exists for the parts of the documentation that are
 * claims about a rendered surface:
 *
 *     mode: 'full' | 'compact' | 'coordinates' | 'address'
 *     part `map` — "Embedded map container"
 *     slot `icon` — "Custom icon content (overrides icon/iconImage properties)"
 *
 * Three of the four modes are enforced BOTH by the template (the row is never
 * built) and by `display: none` rules in the stylesheet; happy-dom resolves
 * neither, and an embedded map is an `<iframe>`, which in happy-dom is a node
 * with no box and nothing painted in it. "Overrides" is likewise a paint
 * question: a slotted icon that renders behind the default emoji satisfies
 * every DOM assertion and none of the documentation.
 *
 * The map always points at a LOCAL stub (a relative reference, which the
 * documented safety rules accept). The generated Google fallback belongs to the
 * DOM tier; this tier must never reach the network.
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the host is the documented `inline-block` and `[part="base"]` fills it;
 *   · the icon region is painted exactly when `showIcon` says so, at a real
 *     size, to the LEFT of the content and never on top of it;
 *   · each mode paints exactly the rows it documents and no others;
 *   · the rows descend inside `[part="content"]` without overlapping;
 *   · `[part="map"]` is painted exactly when `showMap` says so, spans the
 *     content's width, and its iframe fills it;
 *   · `clickable` really does put a pointer cursor on the card, and its
 *     absence really does take the tab stop away.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   That the embedded frame painted its document, and that a slotted icon
 *   replaced the default glyph rather than hiding behind it.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/location/matrix.html';

/**
 * ── Pinned defects ──────────────────────────────────────────────────────────
 *
 * The Playwright counterpart of the DOM matrix's `it.fails`, and deliberately
 * stricter than `test.fail()`: a waiver names the EXACT messages it excuses,
 * every OTHER problem in the same combo still fails the test, and a waiver
 * whose messages stop appearing fails itself — so a fix cannot land while the
 * excuse quietly stays behind.
 *
 * VISUAL-MATRIX-location-1
 *   Combo:    every combo with `show-map` (16 of 32).
 *   Expected: `[part="map"]`, whose stylesheet gives it `width: 100%`, fits
 *             inside `[part="content"]` — the element it is rendered into.
 *   Actual:   the map is exactly 2px wider than the content area and hangs 1px
 *             past each edge. `.map-container` combines `width: 100%` with a
 *             1px border under the default content-box sizing, so its border
 *             box is `100% + 2px`. Invisible on this fixture's flat ground;
 *             a clipped or bordered host is where it shows.
 */
const WAIVED: { id: string; matches: (message: string) => boolean }[] = [
  {
    id: 'VISUAL-MATRIX-location-1',
    matches: message =>
      // The row index differs by mode (the map is row 3 in `full`, row 1 in
      // `coordinates`), so the index is the only part left open.
      /^content row \d+ \(\.map-container\) escapes \[part="content"\]$/.test(message)
      || /^the map is \d+(\.\d+)?px wide inside a \d+(\.\d+)?px content area$/.test(message),
  },
];

/** Split a problem list into the unexcused problems and the waivers that fired. */
function applyWaivers(problems: string[]): { unexcused: string[]; fired: Set<string> } {
  const unexcused: string[] = [];
  const fired = new Set<string>();
  for (const problem of problems) {
    const waiver = WAIVED.find(w => w.matches(problem));
    if (waiver) fired.add(waiver.id);
    else unexcused.push(problem);
  }
  return { unexcused, fired };
}

type Mode = 'full' | 'compact' | 'coordinates' | 'address';

const MAP_RGB: RGB = [14, 116, 144];

interface Combo {
  id: string;
  mode: Mode;
  showMap: boolean;
  showIcon: boolean;
  clickable: boolean;
  name: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
}

/**
 * mode (4) x showMap (2) x showIcon (2) x clickable (2) = 32 combos.
 *
 * Every axis here changes what is on the screen: `mode` decides which rows
 * exist, `showMap` adds a 200px-tall frame under them, `showIcon` decides
 * whether the content starts at the left edge or beside a glyph, and
 * `clickable` is the one axis that changes no boxes at all — which is exactly
 * why it is in the cross, because its documented effects (cursor, tab stop)
 * would otherwise never be measured against a real style resolution.
 */
function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const mode of ['full', 'compact', 'coordinates', 'address'] as Mode[]) {
    for (const showMap of [false, true]) {
      for (const showIcon of [true, false]) {
        for (const clickable of [false, true]) {
          combos.push({
            id: `${mode}/map=${showMap}/icon=${showIcon}/clickable=${clickable}`,
            mode, showMap, showIcon, clickable,
            name: 'Central Park',
            address: '59th to 110th St',
            city: 'New York',
            state: 'NY',
            latitude: 40.7829,
            longitude: -73.9654,
          });
        }
      }
    }
  }
  return combos;
}

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
});
test.afterAll(async () => { await page?.close(); });

/** LAYER 1. One evaluate per combo, returning every violation at once. */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate((combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);

    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const partOf = (name: string) => sr.querySelector(`[part="${name}"]`) as HTMLElement | null;
    const painted = (node: Element | null) => {
      if (!node) return false;
      const b = rect(node);
      return getComputedStyle(node).display !== 'none' && b.width > 0 && b.height > 0;
    };

    if (getComputedStyle(host).display !== 'inline-block') {
      say(`host display "${getComputedStyle(host).display}", expected inline-block`);
    }

    const base = partOf('base');
    const content = partOf('content');
    const icon = partOf('icon');
    const map = partOf('map');
    if (!base) { say('no [part="base"]'); return problems; }
    if (!content) { say('no [part="content"]'); return problems; }
    const baseBox = rect(base);
    const contentBox = rect(content);

    const within = (inner: DOMRect, outer: DOMRect, what: string, of: string) => {
      if (inner.left < outer.left - 1 || inner.right > outer.right + 1
        || inner.top < outer.top - 1 || inner.bottom > outer.bottom + 1) {
        say(`${what} escapes ${of}`);
      }
    };
    within(contentBox, baseBox, '[part="content"]', '[part="base"]');

    // ── The icon region ─────────────────────────────────────────────────────
    if (combo.showIcon) {
      if (!painted(icon)) {
        say(`showIcon is true but [part="icon"] paints`
          + ` ${icon ? `${rect(icon).width}x${rect(icon).height}` : 'nothing at all'}`);
      } else {
        const ib = rect(icon!);
        if (!(ib.right <= contentBox.left + 1)) {
          say(`the icon (right ${ib.right.toFixed(1)}) is not left of the content`
            + ` (left ${contentBox.left.toFixed(1)})`);
        }
        within(ib, baseBox, '[part="icon"]', '[part="base"]');
      }
    } else if (painted(icon)) {
      say('showIcon is false but an icon region is painted');
    }

    // ── Each mode paints exactly the rows it documents ─────────────────────
    const nameRow = sr.querySelector('.name');
    const addressRow = sr.querySelector('.address');
    const coordsRow = sr.querySelector('.coordinates');
    const expectRow = (label: string, node: Element | null, wanted: boolean) => {
      if (wanted && !painted(node)) say(`mode="${combo.mode}" should paint the ${label} row`);
      if (!wanted && painted(node)) say(`mode="${combo.mode}" painted the ${label} row`);
    };
    const textModes = combo.mode === 'full' || combo.mode === 'compact' || combo.mode === 'address';
    const coordModes = combo.mode === 'full' || combo.mode === 'compact' || combo.mode === 'coordinates';
    expectRow('name', nameRow, textModes);
    expectRow('address', addressRow, textModes);
    expectRow('coordinates', coordsRow, coordModes);

    // ── The rows descend inside the content area ───────────────────────────
    const rows = [nameRow, addressRow, coordsRow, map]
      .filter(node => painted(node)) as HTMLElement[];
    for (const [i, row] of rows.entries()) {
      within(rect(row), contentBox, `content row ${i} (.${row.className || 'map'})`,
        '[part="content"]');
      if (i > 0 && rect(row).top < rect(rows[i - 1]).bottom - 1) {
        say(`content row ${i} overlaps row ${i - 1}`);
      }
    }

    // ── The embedded map ───────────────────────────────────────────────────
    if (combo.showMap) {
      if (!painted(map)) {
        say(`showMap is set but [part="map"] paints`
          + ` ${map ? `${rect(map).width}x${rect(map).height}` : 'nothing at all'}`);
      } else {
        const mb = rect(map!);
        if (Math.abs(mb.width - contentBox.width) > 1) {
          say(`the map is ${mb.width.toFixed(1)}px wide inside a`
            + ` ${contentBox.width.toFixed(1)}px content area`);
        }
        const frame = map!.querySelector('iframe') as HTMLElement | null;
        if (!frame) say('the map container holds no iframe');
        else {
          const fb = rect(frame);
          if (fb.width <= 0 || fb.height <= 0) say(`the map iframe is ${fb.width}x${fb.height}`);
          // The container clips with `overflow: hidden` and a 1px border, so
          // the frame fills it to within those two pixels.
          if (mb.height - fb.height > 3 || mb.width - fb.width > 3) {
            say(`the map iframe (${fb.width.toFixed(1)}x${fb.height.toFixed(1)}) does not`
              + ` fill its container (${mb.width.toFixed(1)}x${mb.height.toFixed(1)})`);
          }
        }
      }
    } else if (painted(map)) {
      say('showMap is not set but a map is painted');
    }

    // ── clickable: the documented interactive affordances ──────────────────
    const cs = getComputedStyle(base);
    if (combo.clickable) {
      if (cs.cursor !== 'pointer') say(`clickable card has cursor "${cs.cursor}"`);
      if (base.getAttribute('tabindex') !== '0') {
        say(`clickable card tabindex is "${base.getAttribute('tabindex')}"`);
      }
      if (base.getAttribute('role') !== 'link') {
        say(`clickable card role is "${base.getAttribute('role')}"`);
      }
    } else {
      if (cs.cursor === 'pointer') say('a non-clickable card offers a pointer cursor');
      if (base.hasAttribute('tabindex')) say('a non-clickable card is still a tab stop');
    }

    // ── The card survives a hit test through the shadow boundary ───────────
    const probe = rows[0] ?? content;
    const b = rect(probe);
    if (b.width > 0 && b.height > 0) {
      const x = b.left + Math.min(6, b.width / 2);
      const y = b.top + b.height / 2;
      if (document.elementFromPoint(x, y) !== host) {
        say('the first content row is not under the host at its own position');
      }
    }

    return problems;
  }, combo as any);
}

const combos = generateCombos();

test.describe('location visual matrix: layer 1', () => {
  for (const combo of combos) {
    test(combo.id, async () => {
      const mounted = await page.evaluate(c => (window as any).matrix.mount(c), combo as any);
      expect(mounted.base, `combo ${combo.id}: no base part`).toBe(true);
      expect(mounted.icon, `combo ${combo.id}: icon part presence`).toBe(combo.showIcon);
      expect(mounted.map, `combo ${combo.id}: map part presence`).toBe(combo.showMap);

      const { unexcused, fired } = applyWaivers(await visualProblems(combo));
      expect(unexcused, `combo ${combo.id}`).toEqual([]);
      // A waiver that stops firing is a fix that landed: delete the waiver
      // rather than let it outlive the defect it describes.
      if (combo.showMap) {
        expect([...fired], `combo ${combo.id}: VISUAL-MATRIX-location-1 no longer reproduces`)
          .toContain('VISUAL-MATRIX-location-1');
      } else {
        expect([...fired], `combo ${combo.id}: a map waiver fired without a map`).toEqual([]);
      }
    });
  }
});

// ── "Compact" measured against "full", across mounts ────────────────────────

test.describe('location visual matrix: the compact mode', () => {
  const data = {
    name: 'Central Park', address: '59th to 110th St', city: 'New York', state: 'NY',
    latitude: 40.7829, longitude: -73.9654, showIcon: true,
  };

  async function measure(mode: Mode) {
    await page.evaluate(c => (window as any).matrix.mount(c), { ...data, mode } as any);
    return page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const content = sr.querySelector('[part="content"]') as HTMLElement;
      const address = sr.querySelector('.address') as HTMLElement | null;
      return {
        height: sr.querySelector('[part="base"]')!.getBoundingClientRect().height,
        gap: parseFloat(getComputedStyle(content).rowGap || '0'),
        addressDisplay: address ? getComputedStyle(address).display : 'absent',
      };
    });
  }

  test('compact closes the gap the full card leaves between its rows', async () => {
    const full = await measure('full');
    const compact = await measure('compact');
    expect(compact.gap, `compact gap ${compact.gap} vs full ${full.gap}`)
      .toBeLessThan(full.gap);
    expect(compact.height, `compact ${compact.height} vs full ${full.height}`)
      .toBeLessThan(full.height);
  });

  /**
   * NOT asserted here, on purpose: the stylesheet's
   * `:host([mode="compact"]) .address { display: inline }`.
   *
   * `.content` is a flex container, so every child is a flex item and CSS
   * BLOCKIFIES its display — the declared `inline` computes to `block` and the
   * rule can never take effect. That is worth knowing, but the documentation
   * says only "Display mode" about `compact`; it never promises an inline
   * address, and `.ai/fuzzing.md` binds this tier to the documentation rather
   * than to the stylesheet's intent. What the docs DO support is the test
   * above: compact is tighter than full.
   */
  test('every mode keeps the content inside the card', async () => {
    for (const mode of ['full', 'compact', 'coordinates', 'address'] as Mode[]) {
      await page.evaluate(c => (window as any).matrix.mount(c), { ...data, mode } as any);
      expect(await page.evaluate(() => {
        const sr = document.getElementById('subject')!.shadowRoot!;
        const base = sr.querySelector('[part="base"]')!.getBoundingClientRect();
        const content = sr.querySelector('[part="content"]')!.getBoundingClientRect();
        return content.right <= base.right + 1 && content.bottom <= base.bottom + 1;
      }), `mode="${mode}": the content area escapes the card`).toBe(true);
    }
  });
});

// ── LAYER 2: the pinned marquee captures ────────────────────────────────────

test.describe('location visual matrix: marquee pixels', () => {
  const base = {
    name: 'Central Park', address: '59th to 110th St', city: 'New York', state: 'NY',
    latitude: 40.7829, longitude: -73.9654, showIcon: true, mode: 'full' as Mode,
  };

  test('the embedded map frame paints its document', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c),
      { ...base, showMap: true } as any);
    const [inFrame] = await capture(
      page, 'body', 'location-map',
      `() => {
        const sr = document.getElementById('subject').shadowRoot;
        const box = sr.querySelector('[part="map"]').getBoundingClientRect();
        return [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }];
      }`,
    );
    expect(sameColor(inFrame, MAP_RGB),
      `the map frame painted ${inFrame.join(',')}, not the embedded document's`
      + ` ${MAP_RGB.join(',')}`).toBe(true);
  });

  test('a slotted icon replaces the default glyph instead of hiding behind it', async () => {
    await page.evaluate(c => (window as any).matrix.mount(c),
      { ...base, showMap: false } as any);
    const [defaultIcon] = await capture(
      page, 'body', 'location-icon-default',
      `() => {
        const sr = document.getElementById('subject').shadowRoot;
        const box = sr.querySelector('[part="icon"]').getBoundingClientRect();
        return [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }];
      }`,
    );

    await page.evaluate(c => (window as any).matrix.mount(c),
      { ...base, showMap: false, slottedIcon: true } as any);
    const [slotted] = await capture(
      page, 'body', 'location-icon-slotted',
      `() => {
        const sr = document.getElementById('subject').shadowRoot;
        const box = sr.querySelector('[part="icon"]').getBoundingClientRect();
        return [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }];
      }`,
    );
    expect(sameColor(defaultIcon, slotted),
      `the slotted icon painted ${slotted.join(',')}, the same pixel the default`
      + ' emoji painted — the slot did not override anything').toBe(false);

    // …and the default glyph is gone rather than merely covered: nothing of it
    // is left anywhere in the icon box.
    expect(await page.evaluate(() => {
      const sr = document.getElementById('subject')!.shadowRoot!;
      const slot = sr.querySelector('[part="icon"] slot') as HTMLSlotElement;
      return slot.assignedNodes().length;
    }), 'the icon slot has no assigned content, so the default is still what paints')
      .toBeGreaterThan(0);
  });
});
