/**
 * Paint-level regression coverage for two table states that a unit test can
 * only ever half-prove: `striped` and the zero-row loading indicator.
 *
 * Field report (dark theme):
 *  - `striped` produced no visible striping. The CSS was applied the whole
 *    time — `surface-container-low` simply lands ~2 luminance points from the
 *    body surface in dark mode, so the rule painted a stripe nobody could see.
 *    Asserting "the rule is present" would have passed; asserting the PIXELS
 *    differ is what catches it.
 *  - the loading card showed a ~14px near-black ring on a near-black surface,
 *    with no label naming the state.
 *
 * Both are judged from real pixels. The screenshot is decoded by the browser
 * under test (createImageBitmap + canvas), so the numbers come from the same
 * engine that painted them and the repo gains no image dependency. Probe points
 * are resolved from the live DOM in the SAME evaluate that reads the pixels — a
 * screenshot scrolls its element into view, and geometry captured before that
 * scroll no longer lines up with the image.
 */
import { test, expect, type Page } from '@playwright/test';

// Relative so the spec follows the config's baseURL (the managed 5566 server).
const fixture = '/tests/live/fixtures/table/stripes-and-loading.html';

type RGB = [number, number, number];

/** WCAG relative luminance. */
function luminance([r, g, b]: RGB): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: RGB, b: RGB): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Screenshot `selector`, then read the painted pixels at the viewport points
 * `probe` returns. `probe` is source for a browser-side `(host) => Point[]`; it
 * runs after the screenshot, next to the element's own box, so both come from
 * the same layout.
 */
async function readPixels(page: Page, selector: string, probe: string): Promise<RGB[]> {
  const png = (await page.locator(selector).screenshot({ animations: 'disabled' })).toString('base64');
  return page.evaluate(async ({ png, selector, probe }) => {
    const host = document.querySelector(selector) as HTMLElement;
    const resolve = new Function(`return (${probe})`)() as (h: HTMLElement) => { x: number; y: number }[];
    const points = resolve(host);
    const box = host.getBoundingClientRect();

    const blob = await (await fetch(`data:image/png;base64,${png}`)).blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0);
    const scale = bitmap.width / box.width;

    return points.map((p) => {
      const x = Math.min(bitmap.width - 1, Math.max(0, Math.round((p.x - box.x) * scale)));
      const y = Math.min(bitmap.height - 1, Math.max(0, Math.round((p.y - box.y) * scale)));
      const d = ctx.getImageData(x, y, 1, 1).data;
      return [d[0], d[1], d[2]] as [number, number, number];
    });
  }, { png, selector, probe });
}

/** Background gutter of the first four body rows: no glyphs, just the row fill. */
const ROW_PROBE = `(host) => [...host.shadowRoot.querySelectorAll('tbody tr')].slice(0, 4).map((row) => {
  const b = row.getBoundingClientRect();
  return { x: b.x + b.width - 6, y: b.y + b.height / 2 };
})`;

/**
 * A grid of angles x radii across the spinner's track band. The best sample per
 * angle answers "did the ring paint here at all"; the worst angle then decides.
 * Several radii per angle are needed because a curved 4px band rounded to whole
 * pixels is partly anti-aliased, and a half-covered pixel is not evidence that
 * the ring is faint. The last point is bare surface, well clear of the ring.
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
const CELL_SURFACE_PROBE = `(host) => {
  const b = host.shadowRoot.querySelector('td.no-data').getBoundingClientRect();
  return [{ x: b.x + 12, y: b.y + b.height / 2 }];
}`;

async function open(page: Page, scheme: 'dark' | 'light') {
  await page.emulateMedia({ colorScheme: scheme });
  await page.goto(fixture);
  await page.waitForFunction(() =>
    ((document.getElementById('striped') as any)?.shadowRoot?.querySelectorAll('tbody tr').length ?? 0) >= 8);
  await page.waitForFunction(() =>
    !!(document.getElementById('loading') as any)?.shadowRoot?.querySelector('.table-loading-state'));
  await page.waitForTimeout(300);
}

// Dark mode is where the bug lived and where the tint has the least room, so it
// carries the strict threshold. Light mode keeps its long-standing subtle
// stripe; there it only has to be non-zero and distinct from hover.
const STRIPE_THRESHOLD: Record<'dark' | 'light', number> = { dark: 1.25, light: 1.03 };

for (const scheme of ['dark', 'light'] as const) {
  test.describe(`snice-table striped rows (${scheme})`, () => {
    test.beforeEach(async ({ page }) => open(page, scheme));

    test('paints alternating rows in visibly different colors', async ({ page }) => {
      const pixels = await readPixels(page, '#striped', ROW_PROBE);

      // Rows 0/2 are unstriped, rows 1/3 carry the tint.
      expect(pixels[0]).toEqual(pixels[2]);
      expect(pixels[1]).toEqual(pixels[3]);
      expect(pixels[1]).not.toEqual(pixels[0]);
      expect(contrast(pixels[0], pixels[1])).toBeGreaterThan(STRIPE_THRESHOLD[scheme]);
    });

    test('keeps hover distinguishable from the stripe', async ({ page }) => {
      const before = await readPixels(page, '#striped', ROW_PROBE);
      const target = await page.evaluate(() => {
        const rows = [...(document.getElementById('striped') as any).shadowRoot
          .querySelectorAll('tbody tr')] as HTMLElement[];
        const b = rows[1].getBoundingClientRect();
        return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
      });

      await page.mouse.move(target.x, target.y);
      await page.waitForTimeout(200);
      const after = await readPixels(page, '#striped', ROW_PROBE);

      // The hovered (striped) row must move away from BOTH its stripe color and
      // the plain row color, or hover feedback is lost on every other row.
      expect(after[1]).not.toEqual(before[1]);
      expect(after[1]).not.toEqual(before[0]);
    });
  });

  test.describe(`snice-table zero-row loading state (${scheme})`, () => {
    test.beforeEach(async ({ page }) => open(page, scheme));

    test('draws a spinner big enough to see', async ({ page }) => {
      const size = await page.evaluate(() => {
        const ring = (document.getElementById('loading') as any).shadowRoot
          .querySelector('.table-loading-state snice-progress')
          .shadowRoot.querySelector('.progress--circular') as HTMLElement;
        const box = ring.getBoundingClientRect();
        return { w: box.width, h: box.height };
      });

      // The reported ring measured ~14px. A loading affordance alone in an empty
      // body has no excuse to be smaller than an icon in a touch target.
      expect(size.w).toBeGreaterThanOrEqual(32);
      expect(size.h).toBeGreaterThanOrEqual(32);
    });

    test('draws the spinner ring against the surface, not into it', async ({ page }) => {
      // Hide the indicator arc first. It is a full-strength primary stroke that
      // covers most of the circle once the animation is frozen, and it would
      // hide an invisible TRACK — which is exactly the half that regressed.
      await page.evaluate(() => {
        const bar = (document.getElementById('loading') as any).shadowRoot
          .querySelector('.table-loading-state snice-progress')
          .shadowRoot.querySelector('.progress__circle-bar') as SVGElement;
        bar.style.display = 'none';
      });

      const pixels = await readPixels(page, '#loading', RING_PROBE);
      const surface = pixels[pixels.length - 1];

      const perAngle: number[] = [];
      for (let i = 0; i < RING_ANGLES; i++) {
        const band = pixels.slice(i * RING_RADII, i * RING_RADII + RING_RADII);
        perAngle.push(Math.max(...band.map((px) => contrast(px, surface))));
      }

      expect(Math.min(...perAngle)).toBeGreaterThan(1.4);
    });

    test('names the state in readable text', async ({ page }) => {
      const label = await page.evaluate(() => {
        const el = (document.getElementById('loading') as any).shadowRoot
          .querySelector('.table-loading-label') as HTMLElement;
        const box = el.getBoundingClientRect();
        return {
          text: el.textContent?.trim() ?? '',
          color: getComputedStyle(el).color,
          box: { w: box.width, h: box.height },
        };
      });

      expect(label.text).toMatch(/loading/i);
      expect(label.box.w).toBeGreaterThan(0);
      expect(label.box.h).toBeGreaterThan(0);

      const [surface] = await readPixels(page, '#loading', CELL_SURFACE_PROBE);
      const rgb = label.color.match(/\d+(\.\d+)?/g)!.slice(0, 3).map(Number) as RGB;
      expect(contrast(rgb, surface)).toBeGreaterThan(4.5);
    });
  });
}
