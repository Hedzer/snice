/**
 * LAYER 2: the small PINNED set that pays for real screenshots.
 *
 * Layer 1 (matrix-local.spec.ts / matrix-remote.spec.ts) measures the model
 * the browser built: boxes, computed styles, hit-tests. It cannot tell
 * you whether a colour that *differs* differs VISIBLY. The field report behind
 * tests/live/components/table/table-stripes-and-loading.spec.ts is exactly that
 * failure: `striped` was applied the whole time, and painted a stripe two
 * luminance points from the surface that nobody could see. A computed-style
 * assertion passes on that bug. Pixels do not.
 *
 * So six marquee combos are captured for real — striping, loading spinner,
 * empty state, squished right edge, fill row, density — decoded inside the
 * browser under test, and judged on WCAG contrast between painted samples.
 * Every capture is also written to `test-results/matrix-visual/*.png` so the
 * frame can be opened and looked at.
 *
 * The set is small ON PURPOSE: screenshots are what would push this tier past
 * its ~5 minute budget. New feature combinations belong in the layer-1
 * generator, not here.
 */
import { test, expect, type Page } from '@playwright/test';
import {
  MATRIX_FIXTURE, SIZED_HEIGHT, SQUISH_WIDTH, WIDE_WIDTH, type Combo,
} from '../matrix-harness';
import { capture, contrast, sameColor, type RGB } from '../pixel-probe';

const SUBJECT = '#subject';

function combo(overrides: Partial<Combo>): Combo {
  return {
    id: overrides.id ?? 'marquee',
    delivery: 'local',
    pipeline: 'none',
    pattern: 'initial',
    virtualize: false,
    height: 0,
    squish: false,
    striped: false,
    selectable: false,
    width: WIDE_WIDTH,
    rows: 12,
    ...overrides,
  };
}

async function open(page: Page, scheme: 'dark' | 'light', c: Combo) {
  await page.emulateMedia({ colorScheme: scheme });
  await page.goto(MATRIX_FIXTURE);
  await page.waitForFunction(() => document.documentElement.dataset.matrixReady === 'true');
  await page.evaluate(x => (window as any).matrix.mount(x), c as any);
  // Element screenshots freeze animations, but the spinner's own layout settles
  // a frame later than the body it sits in.
  await page.waitForTimeout(200);
}

// ── Probes ──────────────────────────────────────────────────────────────────

/** Background gutter of the first four body rows: no glyphs, just the row fill. */
const ROW_GUTTER_PROBE = `(host) => [...host.shadowRoot.querySelectorAll('tbody tr[data-index]')].slice(0, 4).map((row) => {
  const b = row.getBoundingClientRect();
  return { x: b.x + b.width - 6, y: b.y + b.height / 2 };
})`;

/**
 * A grid of angles x radii across the spinner's track band. The best sample per
 * angle answers "did the ring paint here at all"; the worst angle then decides.
 * Several radii per angle are needed because a curved 4px band rounded to whole
 * pixels is partly anti-aliased. The last point is bare surface, clear of the ring.
 */
const RING_ANGLES = 16;
const RING_RADII = 5;
const RING_PROBE = `(host) => {
  const track = host.shadowRoot
    .querySelector('.table-loading-state snice-progress')
    .shadowRoot.querySelector('.progress__circle-bg');
  const b = track.getBoundingClientRect();
  const stroke = parseFloat(getComputedStyle(track).strokeWidth) || 4;
  const cx = b.x + b.width / 2;
  const cy = b.y + b.height / 2;
  const mid = b.width / 2 - stroke / 2;
  const points = [];
  for (let i = 0; i < ${RING_ANGLES}; i++) {
    const a = (i * 2 * Math.PI) / ${RING_ANGLES};
    for (let k = 0; k < ${RING_RADII}; k++) {
      const r = mid + (k - (${RING_RADII} - 1) / 2) * (stroke / (${RING_RADII} - 1));
      points.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
  }
  points.push({ x: b.x - b.width, y: cy });
  return points;
}`;

/** A single bare-background sample inside the zero-row body cell. */
const NO_DATA_SURFACE_PROBE = `(host) => {
  const b = host.shadowRoot.querySelector('td.no-data').getBoundingClientRect();
  return [{ x: b.x + 12, y: b.y + b.height / 2 }];
}`;

/**
 * Two samples per body row: one in the row's own gutter, one in the strip
 * between the last column's right edge and the frame's inner edge. Under
 * `squish` those two must be the same colour — a different colour there is the
 * dead gutter the mode exists to eliminate.
 */
const RIGHT_EDGE_PROBE = `(host) => {
  const frame = host.shadowRoot.querySelector('.table-frame');
  const cs = getComputedStyle(frame);
  const fb = frame.getBoundingClientRect();
  const inner = fb.right - parseFloat(cs.borderRightWidth) - parseFloat(cs.paddingRight);
  const rows = [...host.shadowRoot.querySelectorAll('tbody tr[data-index]')].slice(0, 4);
  const points = [];
  for (const row of rows) {
    const b = row.getBoundingClientRect();
    const y = b.y + b.height / 2;
    points.push({ x: b.x + b.width * 0.55, y });
    points.push({ x: inner - 2, y });
  }
  return points;
}`;

/**
 * The bottom strip of a sized frame, plus a data-row gutter to compare it to.
 * With a fill row present the two must match: the grid reaches the frame's
 * bottom edge instead of leaving a bare band under the last row.
 */
const FILL_BOTTOM_PROBE = `(host) => {
  const frame = host.shadowRoot.querySelector('.table-frame');
  const cs = getComputedStyle(frame);
  const fb = frame.getBoundingClientRect();
  const bottom = fb.bottom - parseFloat(cs.borderBottomWidth);
  const row = host.shadowRoot.querySelector('tbody tr[data-index]');
  const rb = row.getBoundingClientRect();
  return [
    { x: rb.x + rb.width * 0.5, y: rb.y + rb.height / 2 },
    { x: rb.x + rb.width * 0.5, y: bottom - 4 },
    { x: rb.x + rb.width * 0.5, y: bottom - 12 },
  ];
}`;

/** A 220px vertical scanline down the first column, one sample per pixel. */
const SCANLINE_HEIGHT = 220;
const SCANLINE_PROBE = `(host) => {
  const row = host.shadowRoot.querySelector('tbody tr[data-index]');
  const b = row.getBoundingClientRect();
  const x = b.x + 6;
  const points = [];
  for (let i = 0; i < ${SCANLINE_HEIGHT}; i++) points.push({ x, y: b.y + i });
  return points;
}`;

/** How many colour changes a scanline crosses — one per painted row border. */
function transitions(samples: RGB[]): number {
  let count = 0;
  for (let i = 1; i < samples.length; i++) if (!sameColor(samples[i], samples[i - 1])) count++;
  return count;
}

// Dark mode is where the striping bug lived and where the tint has the least
// room, so it carries the strict threshold. Light mode keeps its long-standing
// subtle stripe; there it only has to be non-zero and visible.
const STRIPE_THRESHOLD: Record<'dark' | 'light', number> = { dark: 1.25, light: 1.03 };

for (const scheme of ['dark', 'light'] as const) {
  test.describe(`marquee (${scheme})`, () => {
    test('striping is visible in the painted pixels', async ({ page }) => {
      await open(page, scheme, combo({ id: 'striped', striped: true }));
      const px = await capture(page, SUBJECT, `striped-${scheme}`, ROW_GUTTER_PROBE);

      expect(px[0]).toEqual(px[2]);
      expect(px[1]).toEqual(px[3]);
      expect(px[1]).not.toEqual(px[0]);
      expect(contrast(px[0], px[1])).toBeGreaterThan(STRIPE_THRESHOLD[scheme]);
    });

    test('the zero-row loading spinner is drawn against the surface, not into it', async ({ page }) => {
      await open(page, scheme, combo({ id: 'loading', rows: 0, loading: true, height: SIZED_HEIGHT }));

      // Hide the indicator arc first: it is a full-strength primary stroke that
      // covers most of the circle once the animation is frozen, and it would
      // hide an invisible TRACK — exactly the half that regressed before.
      await page.evaluate(() => {
        const bar = (document.getElementById('subject') as any).shadowRoot
          .querySelector('.table-loading-state snice-progress')
          .shadowRoot.querySelector('.progress__circle-bar') as SVGElement;
        bar.style.display = 'none';
      });

      const px = await capture(page, SUBJECT, `loading-${scheme}`, RING_PROBE);
      const surface = px[px.length - 1];
      const perAngle: number[] = [];
      for (let i = 0; i < RING_ANGLES; i++) {
        const band = px.slice(i * RING_RADII, i * RING_RADII + RING_RADII);
        perAngle.push(Math.max(...band.map(p => contrast(p, surface))));
      }
      expect(Math.min(...perAngle)).toBeGreaterThan(1.4);

      const size = await page.evaluate(() => {
        const ring = (document.getElementById('subject') as any).shadowRoot
          .querySelector('.table-loading-state snice-progress')
          .shadowRoot.querySelector('.progress--circular') as HTMLElement;
        const b = ring.getBoundingClientRect();
        return { w: b.width, h: b.height };
      });
      expect(size.w).toBeGreaterThanOrEqual(32);
      expect(size.h).toBeGreaterThanOrEqual(32);
    });

    test('the zero-row empty state is readable against the surface', async ({ page }) => {
      await open(page, scheme, combo({ id: 'empty', rows: 0, height: SIZED_HEIGHT }));

      const placeholder = await page.evaluate(() => {
        const cell = (document.getElementById('subject') as any).shadowRoot
          .querySelector('td.no-data') as HTMLElement;
        const host = cell.querySelector('snice-empty-state') as any;
        const title = host?.shadowRoot?.querySelector('[part~="title"]') as HTMLElement | null;
        if (!title) return null;
        const b = title.getBoundingClientRect();
        return {
          text: (title.textContent ?? '').trim(),
          color: getComputedStyle(title).color,
          box: { w: b.width, h: b.height },
        };
      });

      expect(placeholder, 'zero-row body renders no empty-state placeholder').not.toBeNull();
      expect(placeholder!.text).toMatch(/no data/i);
      expect(placeholder!.box.w).toBeGreaterThan(0);
      expect(placeholder!.box.h).toBeGreaterThan(0);

      const [surface] = await capture(page, SUBJECT, `empty-${scheme}`, NO_DATA_SURFACE_PROBE);
      const rgb = placeholder!.color.match(/\d+(\.\d+)?/g)!.slice(0, 3).map(Number) as RGB;
      expect(contrast(rgb, surface)).toBeGreaterThan(3);
    });

    test('a squished table paints all the way to the frame edge', async ({ page }) => {
      await open(page, scheme, combo({ id: 'squish', squish: true, width: SQUISH_WIDTH }));

      const px = await capture(page, SUBJECT, `squish-${scheme}`, RIGHT_EDGE_PROBE);
      for (let i = 0; i < px.length; i += 2) {
        expect(px[i + 1], `row ${i / 2}: dead gutter beside the last column`).toEqual(px[i]);
      }

      const fit = await page.evaluate(() => {
        const host = document.getElementById('subject') as any;
        const frame = host.shadowRoot.querySelector('.table-frame') as HTMLElement;
        const cs = getComputedStyle(frame);
        const fb = frame.getBoundingClientRect();
        const inner = fb.right - parseFloat(cs.borderRightWidth) - parseFloat(cs.paddingRight);
        const ths = [...host.shadowRoot.querySelectorAll('thead tr.column-header-row th')] as HTMLElement[];
        return {
          overflow: frame.scrollWidth - frame.clientWidth,
          gap: inner - ths[ths.length - 1].getBoundingClientRect().right,
        };
      });
      expect(fit.overflow).toBeLessThanOrEqual(1);
      expect(Math.abs(fit.gap)).toBeLessThanOrEqual(2);
    });

    test('the fill row carries the grid to the bottom of a sized frame', async ({ page }) => {
      await open(page, scheme, combo({ id: 'fill', height: SIZED_HEIGHT, rows: 3 }));

      const present = await page.evaluate(() => {
        const sr = (document.getElementById('subject') as any).shadowRoot;
        return sr.querySelectorAll('tbody tr.table-fill-row').length;
      });
      expect(present, 'a 3-row body in a 320px frame must grow exactly one filler').toBe(1);

      const [rowFill, nearBottom, aboveBottom] = await capture(
        page, SUBJECT, `fill-${scheme}`, FILL_BOTTOM_PROBE);
      expect(nearBottom, 'bare band under the last row').toEqual(rowFill);
      expect(aboveBottom).toEqual(rowFill);
    });

    test('density changes the painted row rhythm', async ({ page }) => {
      await open(page, scheme, combo({ id: 'compact', density: 'compact', rows: 20 }));
      const compact = transitions(await capture(page, SUBJECT, `density-compact-${scheme}`, SCANLINE_PROBE));

      await open(page, scheme, combo({ id: 'comfortable', density: 'comfortable', rows: 20 }));
      const comfortable = transitions(await capture(page, SUBJECT, `density-comfortable-${scheme}`, SCANLINE_PROBE));

      // Same 220px of scanline: compact must cross strictly more row borders.
      expect(compact).toBeGreaterThan(comfortable);
      expect(comfortable).toBeGreaterThan(0);
    });
  });
}
