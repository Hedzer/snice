import { test, expect } from '@playwright/test';
import { collectVisualViolations } from '../../support/visual-invariants';

const demoPath = 'http://localhost:5566/components/map/demo.html';

test.describe('Snice Map visual integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(demoPath);
    await page.waitForFunction(() => !!customElements.get('snice-map'));
    // #map-default never paints (see the fixme below), so wait on a map the
    // showcase re-assigns a center to.
    await page.waitForFunction(() =>
      (document.querySelector('#map-z3')?.shadowRoot?.querySelectorAll('.map-tile').length ?? 0) > 0);
  });

  test('showcase passes the shared visual invariants', async ({ page }) => {
    expect(await collectVisualViolations(page)).toEqual([]);
  });

  test('the tile mosaic is a gapless 256px lattice covering the whole viewport', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-map').forEach((host: any) => {
        const id = host.id || 'map';
        if (id === 'map-default') return; // tracked by the blank-map fixme below
        const container = host.shadowRoot.querySelector('.map-container') as HTMLElement;
        const cr = container.getBoundingClientRect();
        const tiles = [...host.shadowRoot.querySelectorAll('.map-tile')] as HTMLElement[];
        if (!tiles.length) { problems.push(`${id}: no tiles rendered`); return; }
        const rects = tiles.map(t => t.getBoundingClientRect());

        rects.forEach((r, n) => {
          if (Math.round(r.width) !== 256 || Math.round(r.height) !== 256) {
            problems.push(`${id} tile[${n}]: ${Math.round(r.width)}x${Math.round(r.height)}, expected 256x256`);
          }
        });

        // Every tile must sit on the same 256px lattice, or the mosaic seams.
        // Spread is measured modulo the tile size so sub-pixel rounding on a
        // fractional offset does not read as a seam.
        const latticeSpread = (values: number[]) => {
          const base = values[0];
          const deltas = values.map(v => ((v - base + 384) % 256) - 128);
          return Math.max(...deltas) - Math.min(...deltas);
        };
        const spreadX = latticeSpread(rects.map(r => (r.left - cr.left) % 256));
        const spreadY = latticeSpread(rects.map(r => (r.top - cr.top) % 256));
        if (spreadX > 1.5) problems.push(`${id}: tiles off the horizontal lattice by ${spreadX.toFixed(1)}px`);
        if (spreadY > 1.5) problems.push(`${id}: tiles off the vertical lattice by ${spreadY.toFixed(1)}px`);

        // The mosaic must extend past every edge of the visible map.
        const left = Math.min(...rects.map(r => r.left));
        const right = Math.max(...rects.map(r => r.right));
        const top = Math.min(...rects.map(r => r.top));
        const bottom = Math.max(...rects.map(r => r.bottom));
        if (left > cr.left + 0.5 || right < cr.right - 0.5
            || top > cr.top + 0.5 || bottom < cr.bottom - 0.5) {
          problems.push(`${id}: mosaic leaves an uncovered strip`);
        }

        // No two tiles may claim the same lattice cell (double-painted tiles).
        const cells = rects.map(r => `${Math.round(r.left)}:${Math.round(r.top)}`);
        if (new Set(cells).size !== cells.length) {
          problems.push(`${id}: duplicate tiles at the same position`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('zoom controls and attribution stay pinned inside the map frame', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-map').forEach((host: any) => {
        const id = host.id || 'map';
        const cr = host.shadowRoot.querySelector('.map-container').getBoundingClientRect();
        const buttons = [...host.shadowRoot.querySelectorAll('.map-control-btn')] as HTMLElement[];
        if (buttons.length !== 2) { problems.push(`${id}: ${buttons.length} zoom buttons`); return; }
        const [plus, minus] = buttons.map(b => b.getBoundingClientRect());
        [plus, minus].forEach((r, n) => {
          if (r.width < 24 || r.height < 24) {
            problems.push(`${id} zoom[${n}]: ${Math.round(r.width)}x${Math.round(r.height)} too small to tap`);
          }
          if (r.right > cr.right - 1 || r.top < cr.top + 1 || r.bottom > cr.bottom) {
            problems.push(`${id} zoom[${n}]: not inset inside the map frame`);
          }
        });
        // Stacked vertically, sharing a left edge, abutting.
        if (Math.abs(plus.left - minus.left) > 0.5) {
          problems.push(`${id}: zoom buttons not aligned on a column`);
        }
        if (minus.top - plus.bottom < 0 || minus.top - plus.bottom > 3) {
          problems.push(`${id}: zoom buttons seam ${(minus.top - plus.bottom).toFixed(1)}px`);
        }

        const attr = host.shadowRoot.querySelector('.map-attribution').getBoundingClientRect();
        if (attr.right > cr.right + 1 || attr.bottom > cr.bottom + 1 || attr.left < cr.left - 1) {
          problems.push(`${id}: attribution escapes the map frame`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  // BUG: `getVisibleTiles()`/`latLngToPixel()` bail out when `containerEl` is
  // still undefined, which is the case during the component's first render.
  // Nothing schedules a second render, so a map that is never reassigned a
  // property after upgrade (here `#map-default`) stays permanently blank.
  test.fixme('every map paints its tiles without needing a property write', async ({ page }) => {
    const counts = await page.evaluate(() =>
      [...document.querySelectorAll('snice-map')].map((m: any) => ({
        id: m.id, tiles: m.shadowRoot.querySelectorAll('.map-tile').length
      })));
    expect(counts.filter(c => c.tiles === 0)).toEqual([]);
  });

  // BUG: `.map-container` is hard-coded to `height: 25rem` instead of
  // following the host, so the showcase's `snice-map { height: 300px }` leaves
  // ~100px of map — including the attribution and the zoom-out button —
  // rendered outside the element's own box.
  test.fixme('the map frame follows the height set on the host', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      document.querySelectorAll('snice-map').forEach((host: any) => {
        const hr = host.getBoundingClientRect();
        const cr = host.shadowRoot.querySelector('.map-container').getBoundingClientRect();
        if (Math.abs(cr.height - hr.height) > 1) {
          problems.push(`${host.id}: frame ${Math.round(cr.height)}px vs host ${Math.round(hr.height)}px`);
        }
      });
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('marker pins hang from their anchor point at a legible size', async ({ page }) => {
    const failures = await page.evaluate(() => {
      const problems: string[] = [];
      const host = document.querySelector('#map-markers') as any;
      const cr = host.shadowRoot.querySelector('.map-container').getBoundingClientRect();
      const markers = [...host.shadowRoot.querySelectorAll('.map-marker')] as HTMLElement[];
      if (markers.length !== 5) return [`expected 5 markers, got ${markers.length}`];
      markers.forEach((m, n) => {
        const r = m.getBoundingClientRect();
        const pin = m.querySelector('.map-marker-pin')!.getBoundingClientRect();
        if (pin.width < 16 || pin.height < 24 || pin.width > 64 || pin.height > 80) {
          problems.push(`marker[${n}]: pin ${Math.round(pin.width)}x${Math.round(pin.height)} outside sane range`);
        }
        // translate(-50%,-100%) must put the pin tip on the anchor: the
        // marker box bottom is the geographic point, box centred on it in x.
        const anchorX = cr.left + parseFloat(m.style.left);
        const anchorY = cr.top + parseFloat(m.style.top);
        if (Math.abs((r.left + r.width / 2) - anchorX) > 1.5) {
          problems.push(`marker[${n}]: pin not horizontally centred on its anchor`);
        }
        if (Math.abs(r.bottom - anchorY) > 1.5) {
          problems.push(`marker[${n}]: pin tip ${Math.round(r.bottom - anchorY)}px off its anchor`);
        }
      });
      // Distinct coordinates must not collapse onto one screen point.
      const xs = markers.map(m => Math.round(m.getBoundingClientRect().left));
      if (new Set(xs).size !== xs.length) problems.push('markers stack on the same x');
      return problems;
    });
    expect(failures).toEqual([]);
  });

  test('clicking a marker opens a popup above the pin, centred on it', async ({ page }) => {
    const geometry = await page.evaluate(async () => {
      const host = document.querySelector('#map-popups') as any;
      const marker = host.shadowRoot.querySelectorAll('.map-marker')[1] as HTMLElement;
      marker.click();
      await host.rendered;
      const fresh = host.shadowRoot.querySelectorAll('.map-marker')[1] as HTMLElement;
      const popup = fresh.querySelector('.map-popup') as HTMLElement | null;
      if (!popup) return null;
      const pr = popup.getBoundingClientRect();
      const pin = fresh.querySelector('.map-marker-pin')!.getBoundingClientRect();
      return {
        width: pr.width, height: pr.height,
        dx: (pr.left + pr.width / 2) - (pin.left + pin.width / 2),
        gap: pin.top - pr.bottom
      };
    });

    expect(geometry, 'popup did not open').not.toBeNull();
    expect(geometry!.width).toBeGreaterThan(40);
    expect(geometry!.height).toBeGreaterThan(16);
    // Sits directly above the pin with the tail gap, horizontally centred.
    expect(Math.abs(geometry!.dx)).toBeLessThanOrEqual(1.5);
    expect(geometry!.gap).toBeGreaterThanOrEqual(0);
    expect(geometry!.gap).toBeLessThanOrEqual(16);
  });
});
