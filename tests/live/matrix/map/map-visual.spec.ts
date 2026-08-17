/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-map TRUE-VISUAL matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The DOM matrix (tests/matrix/map, `npm run test:matrix`) owns the tile-URL
 * arithmetic, the clamp, the events and the marker bookkeeping. It cannot own
 * the one thing a map IS: a projection from coordinates to screen positions.
 * In happy-dom the container measures 0x0, so `latLngToPixel` returns the
 * origin for every marker on earth and every marker stacks in the same corner.
 *
 * So the claims below are the ones only a browser can settle:
 *
 * ── Layer 1 (every combo): geometry + computed style + occlusion ────────────
 *   · the documented `base`/`tiles`/`markers`/`controls` parts have real boxes,
 *     and the three layers cover the map container rather than collapsing;
 *   · the tile grid really tiles: adjacent tiles abut without a gap and the
 *     union of them covers the visible container, which is what stops a slippy
 *     map showing bands of background between its tiles;
 *   · THE PROJECTION — a marker further north paints higher on the screen, a
 *     marker further east paints further right, and two markers at the same
 *     coordinates paint at the same point. This is the component's entire
 *     purpose and it exists only in pixels;
 *   · markers paint ON TOP of the tile layer (elementFromPoint at a pin lands
 *     on that pin, not on a tile), and the zoom controls paint on top of both;
 *   · an open popup is not occluded by its own marker or by any other layer.
 *
 * ── Layer 2 (a pinned handful): real screenshots ───────────────────────────
 *   The pin's fill is `--snice-color-danger` and the tile layer is a real
 *   image; both can "resolve" to something and still paint nothing. The
 *   marquee captures decode the PNG inside the browser under test and assert
 *   that the tile layer really painted, that a pin really paints red pixels
 *   distinct from the tiles behind it, and that popup text really contrasts
 *   against the popup it sits in.
 *
 * The fixture serves its OWN tile image rather than reaching
 * tile.openstreetmap.org: this tier must not be slow, rate-limited or offline-
 * fragile for reasons unrelated to the component. The three documented
 * placeholders are still substituted, so the template contract is exercised.
 *
 * No findings: every claim in this file passes.
 */
import { test, expect, type Page } from '@playwright/test';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const FIXTURE = '/tests/live/fixtures/map/matrix.html';

type MarkerSet = 'none' | 'doc' | 'bare' | 'label-only' | 'popup-only'
  | 'icons' | 'compass' | 'many' | 'coincident';

interface Combo {
  id: string;
  markers: MarkerSet;
  zoom: number;
  center: { lat: number; lng: number };
}

const MARKER_SETS: MarkerSet[] = [
  'none', 'doc', 'bare', 'label-only', 'popup-only', 'icons', 'compass', 'many', 'coincident',
];
const ZOOMS = [3, 8, 13];

/**
 * The cross: marker set (9) x zoom (3) = 27 combos. The centre is rotated
 * across them — London for the sets authored around it, and the set's own
 * neighbourhood otherwise — so a marker layer is never measured on a view that
 * cannot contain it.
 */
const CENTRES: Record<MarkerSet, { lat: number; lng: number }> = {
  none: { lat: 51.505, lng: -0.09 },
  doc: { lat: 41.5, lng: -72.5 },
  bare: { lat: 51.505, lng: -0.09 },
  'label-only': { lat: 50.7, lng: 7.9 },
  'popup-only': { lat: 35.6762, lng: 139.6503 },
  icons: { lat: 48.8, lng: 25.0 },
  compass: { lat: 51.505, lng: -0.09 },
  many: { lat: 51.51, lng: -0.03 },
  coincident: { lat: 51.505, lng: -0.09 },
};

function generateCombos(): Combo[] {
  const combos: Combo[] = [];
  for (const markers of MARKER_SETS) {
    for (const zoom of ZOOMS) {
      combos.push({ id: `${markers}/z${zoom}`, markers, zoom, center: CENTRES[markers] });
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

/**
 * LAYER 1. One evaluate per combo, returning every violation at once so a
 * failing combo reports its whole story rather than one problem per re-run.
 */
async function visualProblems(combo: Combo): Promise<string[]> {
  return page.evaluate(async (combo) => {
    const problems: string[] = [];
    const say = (m: string) => problems.push(m);

    await (window as any).matrix.mount(combo);
    const host = document.getElementById('subject') as HTMLElement | null;
    if (!host) { say('nothing mounted'); return problems; }
    const sr = host.shadowRoot;
    if (!sr) { say('no shadow root'); return problems; }

    const rect = (el: Element) => el.getBoundingClientRect();
    const hostBox = rect(host);
    if (hostBox.width <= 0 || hostBox.height <= 0) {
      say(`host renders at ${hostBox.width}x${hostBox.height}`);
      return problems;
    }

    // ── The documented parts ────────────────────────────────────────────────
    const partOf = (name: string) => sr.querySelector(`[part~="${name}"]`) as HTMLElement | null;
    const base = partOf('base');
    const tiles = partOf('tiles');
    const markersLayer = partOf('markers');
    const controls = partOf('controls');
    for (const [name, node] of Object.entries({ base, tiles, markers: markersLayer, controls })) {
      if (!node) say(`no [part="${name}"] rendered`);
    }
    if (!base || !tiles || !markersLayer || !controls) return problems;

    const baseBox = rect(base);
    if (baseBox.width <= 0 || baseBox.height <= 0) {
      say(`base renders at ${baseBox.width}x${baseBox.height}`);
      return problems;
    }
    // "tiles — Tile layer container" and "markers — Markers layer container"
    // are LAYERS: each spans the map, stacked, not laid out side by side.
    for (const [name, node] of [['tiles', tiles], ['markers', markersLayer]] as const) {
      const box = rect(node);
      if (Math.abs(box.width - baseBox.width) > 2 || Math.abs(box.height - baseBox.height) > 2) {
        say(`${name} layer is ${box.width.toFixed(0)}x${box.height.toFixed(0)} `
          + `over a ${baseBox.width.toFixed(0)}x${baseBox.height.toFixed(0)} map`);
      }
    }

    // ── The tile grid really tiles ──────────────────────────────────────────
    const tileNodes = [...sr.querySelectorAll('.map-tile')] as HTMLElement[];
    if (tileNodes.length === 0) {
      say('no tiles rendered');
    } else {
      const boxes = tileNodes.map(rect);
      for (const [index, box] of boxes.entries()) {
        if (box.width <= 0 || box.height <= 0) say(`tile ${index} renders at ${box.width}x${box.height}`);
      }
      // Columns and rows must abut: every distinct left edge is one tile width
      // from the next, so no strip of background shows through.
      const width = boxes[0].width;
      const height = boxes[0].height;
      const lefts = [...new Set(boxes.map(b => Math.round(b.left)))].sort((a, b) => a - b);
      const tops = [...new Set(boxes.map(b => Math.round(b.top)))].sort((a, b) => a - b);
      for (let i = 1; i < lefts.length; i++) {
        if (Math.abs(lefts[i] - lefts[i - 1] - width) > 2) {
          say(`tile columns at ${lefts[i - 1]} and ${lefts[i]} are not ${width}px apart`);
        }
      }
      for (let i = 1; i < tops.length; i++) {
        if (Math.abs(tops[i] - tops[i - 1] - height) > 2) {
          say(`tile rows at ${tops[i - 1]} and ${tops[i]} are not ${height}px apart`);
        }
      }
      // …and the grid covers the visible map.
      const coverLeft = Math.min(...boxes.map(b => b.left));
      const coverRight = Math.max(...boxes.map(b => b.right));
      const coverTop = Math.min(...boxes.map(b => b.top));
      const coverBottom = Math.max(...boxes.map(b => b.bottom));
      if (coverLeft > baseBox.left + 1 || coverRight < baseBox.right - 1
        || coverTop > baseBox.top + 1 || coverBottom < baseBox.bottom - 1) {
        say('the tile grid does not cover the whole map container');
      }
      // Every tile carries a substituted URL, still — the template contract
      // has to survive the trip through a real <img>.
      for (const node of tileNodes) {
        const src = node.querySelector('img')?.getAttribute('src') ?? '';
        if (/\{[xyz]\}/.test(src)) say(`tile src "${src}" still holds a placeholder`);
      }
    }

    // ── The projection ──────────────────────────────────────────────────────
    const markerData = (host as any).markers as Array<{ id: string; lat: number; lng: number }>;
    const markerNodes = [...sr.querySelectorAll('.map-marker')] as HTMLElement[];
    if (markerNodes.length !== markerData.length) {
      say(`${markerNodes.length} markers painted for ${markerData.length} MapMarkers`);
      return problems;
    }

    const placed = markerNodes.map((node, index) => ({ data: markerData[index], box: rect(node) }));
    for (const { data, box } of placed) {
      if (box.width <= 0 || box.height <= 0) say(`marker "${data.id}" renders at ${box.width}x${box.height}`);
    }

    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i];
        const b = placed[j];
        // Mercator is monotone in both axes: more north is higher up the
        // screen, more east is further right. Only clearly different
        // coordinates are compared, so sub-pixel rounding cannot decide it.
        if (Math.abs(a.data.lat - b.data.lat) > 0.05) {
          const higher = a.data.lat > b.data.lat ? a : b;
          const lower = a.data.lat > b.data.lat ? b : a;
          if (higher.box.top >= lower.box.top) {
            say(`"${higher.data.id}" (lat ${higher.data.lat}) does not paint above `
              + `"${lower.data.id}" (lat ${lower.data.lat})`);
          }
        }
        if (Math.abs(a.data.lng - b.data.lng) > 0.05) {
          const easter = a.data.lng > b.data.lng ? a : b;
          const wester = a.data.lng > b.data.lng ? b : a;
          if (easter.box.left <= wester.box.left) {
            say(`"${easter.data.id}" (lng ${easter.data.lng}) does not paint right of `
              + `"${wester.data.id}" (lng ${wester.data.lng})`);
          }
        }
        // Identical coordinates must land on the same point.
        if (a.data.lat === b.data.lat && a.data.lng === b.data.lng) {
          if (Math.abs(a.box.left - b.box.left) > 1 || Math.abs(a.box.top - b.box.top) > 1) {
            say(`coincident markers "${a.data.id}" and "${b.data.id}" paint at different points`);
          }
        }
      }
    }

    // ── Stacking: markers above tiles, controls above everything ────────────
    for (const { data, box } of placed) {
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 3;
      if (x < baseBox.left || x > baseBox.right || y < baseBox.top || y > baseBox.bottom) continue;
      const hit = sr.elementFromPoint(x, y);
      if (hit && hit.closest && !hit.closest('.map-marker')) {
        say(`marker "${data.id}" is covered at its pin by "${(hit as HTMLElement).className || hit.nodeName}"`);
      }
    }

    const controlButtons = [...sr.querySelectorAll('.map-control-btn')] as HTMLElement[];
    if (controlButtons.length !== 2) {
      say(`${controlButtons.length} zoom controls painted, expected 2`);
    }
    for (const button of controlButtons) {
      const box = rect(button);
      if (box.width <= 0 || box.height <= 0) {
        say(`zoom control "${button.textContent!.trim()}" has no box`);
        continue;
      }
      if (box.left < baseBox.left || box.right > baseBox.right
        || box.top < baseBox.top || box.bottom > baseBox.bottom) {
        say(`zoom control "${button.textContent!.trim()}" is outside the map`);
      }
      const hit = sr.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      if (hit !== button && !button.contains(hit as Node)) {
        say(`zoom control "${button.textContent!.trim()}" is covered by `
          + `"${(hit as HTMLElement)?.className || hit?.nodeName}"`);
      }
    }

    return problems;
  }, combo);
}

for (const combo of generateCombos()) {
  test(`layer1 ${combo.id}`, async () => {
    expect(await visualProblems(combo), `combo ${combo.id}`).toEqual([]);
  });
}

test('layer1 popup: an open popup is painted and unoccluded', async () => {
  const problems = await page.evaluate(async () => {
    const out: string[] = [];
    await (window as any).matrix.mount({ markers: 'doc', zoom: 6, center: { lat: 41.5, lng: -72.5 } });
    const count = await (window as any).matrix.clickMarker(0);
    if (count !== 1) { out.push(`${count} popups open after one marker click`); return out; }

    const host = document.getElementById('subject') as HTMLElement;
    const sr = host.shadowRoot!;
    const popup = sr.querySelector('.map-popup') as HTMLElement;
    const marker = popup.closest('.map-marker') as HTMLElement;
    const popupBox = popup.getBoundingClientRect();
    const markerBox = marker.getBoundingClientRect();

    if (popupBox.width <= 0 || popupBox.height <= 0) out.push(`popup renders at ${popupBox.width}x${popupBox.height}`);
    if ((popup.textContent ?? '').trim() !== 'New York City') {
      out.push(`popup reads "${popup.textContent}"`);
    }
    // The popup belongs to its marker, so it must be drawn near it.
    const gap = Math.hypot(
      popupBox.left + popupBox.width / 2 - (markerBox.left + markerBox.width / 2),
      popupBox.top + popupBox.height / 2 - (markerBox.top + markerBox.height / 2),
    );
    if (gap > 200) out.push(`popup is ${gap.toFixed(0)}px from its own marker`);

    const hit = sr.elementFromPoint(popupBox.left + popupBox.width / 2, popupBox.top + popupBox.height / 2);
    if (hit && hit.closest && !hit.closest('.map-popup')) {
      out.push(`popup is covered by "${(hit as HTMLElement).className || hit.nodeName}"`);
    }
    return out;
  });
  expect(problems).toEqual([]);
});

test('layer1 scroll zoom really re-tiles the map', async () => {
  const result = await page.evaluate(async () => {
    await (window as any).matrix.mount({ markers: 'none', zoom: 8 });
    const el = (window as any).matrix.el;
    const before = [...el.shadowRoot.querySelectorAll('.map-tile img')]
      .map((img: any) => img.getAttribute('src'));
    const zoomedIn = await (window as any).matrix.wheel(-120);
    const afterIn = [...el.shadowRoot.querySelectorAll('.map-tile img')]
      .map((img: any) => img.getAttribute('src'));
    const zoomedOut = await (window as any).matrix.wheel(120);
    return { before, zoomedIn, afterIn, zoomedOut };
  });
  // "scroll zoom" in the component summary.
  expect(result.zoomedIn).toBe(9);
  expect(result.zoomedOut).toBe(8);
  expect(result.afterIn).not.toEqual(result.before);
  for (const src of result.afterIn) expect(src).toContain('z=9');
});

test('layer1 drag panning moves the view', async () => {
  const result = await page.evaluate(async () => {
    await (window as any).matrix.mount({ markers: 'none', zoom: 8, center: { lat: 40, lng: 10 } });
    return (window as any).matrix.dragPan(-150, 0);
  });
  // Pulling the map leftwards brings land from the east into view.
  expect(result.after.lng).toBeGreaterThan(result.before.lng);
});

test('layer1 zoom controls really re-tile the map', async () => {
  const result = await page.evaluate(async () => {
    await (window as any).matrix.mount({ markers: 'none', zoom: 8 });
    const el = (window as any).matrix.el;
    const inLevel = await (window as any).matrix.clickControl(0);
    const inSrc = el.shadowRoot.querySelector('.map-tile img').getAttribute('src');
    const outLevel = await (window as any).matrix.clickControl(1);
    const outSrc = el.shadowRoot.querySelector('.map-tile img').getAttribute('src');
    return { inLevel, inSrc, outLevel, outSrc };
  });
  expect(result.inLevel).toBe(9);
  expect(result.inSrc).toContain('z=9');
  expect(result.outLevel).toBe(8);
  expect(result.outSrc).toContain('z=8');
});

// ── LAYER 2: real screenshots ──────────────────────────────────────────────

test('marquee: the tile layer really paints', async () => {
  await page.evaluate(() => (window as any).matrix.mount({ markers: 'none', zoom: 10 }));
  // Four points well away from the controls and the attribution strip.
  const probe = `(host) => {
    const base = host.shadowRoot.querySelector('[part~="base"]');
    const box = base.getBoundingClientRect();
    return [
      { x: box.left + box.width * 0.2, y: box.top + box.height * 0.2 },
      { x: box.left + box.width * 0.4, y: box.top + box.height * 0.35 },
      { x: box.left + box.width * 0.6, y: box.top + box.height * 0.2 },
      { x: box.left + box.width * 0.3, y: box.top + box.height * 0.6 },
    ];
  }`;
  const pixels = await capture(page, '#subject', 'map-tiles', probe);
  expect(pixels).toHaveLength(4);

  // The fixture's stand-in tile is a flat sage green with a faint grid. Every
  // probe must land on tile paint, not on the container's own background.
  const containerBg = await page.evaluate(() => {
    const host = document.getElementById('subject') as HTMLElement;
    return getComputedStyle(host.shadowRoot!.querySelector('[part~="base"]')!).backgroundColor;
  });
  const bg = (containerBg.match(/\d+/g) ?? ['255', '255', '255']).slice(0, 3).map(Number) as RGB;
  for (const pixel of pixels) {
    expect(sameColor(pixel, bg), `tile probe painted the container background ${pixel}`).toBe(false);
    // …and it really is the tile's green: more green than red or blue.
    expect(pixel[1]).toBeGreaterThan(pixel[0]);
    expect(pixel[1]).toBeGreaterThan(pixel[2]);
  }
});

test('marquee: a marker pin really paints red over the tiles', async () => {
  await page.evaluate(() => (window as any).matrix.mount({ markers: 'bare', zoom: 10 }));
  const probe = `(host) => {
    const sr = host.shadowRoot;
    const pin = sr.querySelector('.map-marker-pin');
    const pinBox = pin.getBoundingClientRect();
    const base = sr.querySelector('[part~="base"]').getBoundingClientRect();
    return [
      // Upper-left of the pin head: solid marker fill, clear of the white dot.
      { x: pinBox.left + pinBox.width * 0.25, y: pinBox.top + pinBox.height * 0.2 },
      // Well away from the pin: the tile layer behind it.
      { x: base.left + base.width * 0.15, y: base.top + base.height * 0.15 },
    ];
  }`;
  const [pin, tile] = await capture(page, '#subject', 'map-marker-pin', probe);

  // The pin's fill is `--snice-color-danger`; it has to paint as red, and it
  // has to be distinguishable from the map underneath it.
  expect(pin[0], `pin pixel rgb(${pin}) is not red`).toBeGreaterThan(pin[1] + 30);
  expect(pin[0], `pin pixel rgb(${pin}) is not red`).toBeGreaterThan(pin[2] + 30);
  expect(sameColor(pin, tile), 'the pin paints the same colour as the map behind it').toBe(false);
  expect(contrast(pin, tile)).toBeGreaterThan(1.3);
});

test('marquee: popup text is legible on its popup', async () => {
  await page.evaluate(async () => {
    await (window as any).matrix.mount({ markers: 'popup-only', zoom: 10, center: { lat: 35.6762, lng: 139.6503 } });
    await (window as any).matrix.clickMarker(0);
  });
  const probe = `(host) => {
    const popup = host.shadowRoot.querySelector('.map-popup');
    const box = popup.getBoundingClientRect();
    return [{ x: box.right - 3, y: box.top + box.height / 2 }];
  }`;
  const [surface] = await capture(page, '#subject', 'map-popup', probe);

  const textColor = await page.evaluate(() => {
    const host = document.getElementById('subject') as HTMLElement;
    return getComputedStyle(host.shadowRoot!.querySelector('.map-popup')!).color;
  });
  const rgb = (textColor.match(/\d+/g) ?? []).slice(0, 3).map(Number) as RGB;
  expect(contrast(rgb, surface), `popup text ${textColor} on ${surface}`).toBeGreaterThan(4.5);
});
