/**
 * MATRIX slice — snice-app-tiles style axes: variant, size, columns.
 *
 * Dimensions:
 *   variant: variant (3) x channel (2)                    = 6
 *   size:    size (5) x channel (2)                       = 10
 *   columns: columns (1,2,3,5,6,8) x channel (2)          = 12
 *   empty:   channel (2) — tiles = [] is the documented default = 2
 *
 * variant and columns are NOT `:host([...])` axes: rebuild() paints the
 * container modifier class (`tiles--list` / `tiles--compact`) and the
 * `--tiles-columns` inline custom property that
 * `grid-template-columns: repeat(var(--tiles-columns, 4), 1fr)` consumes
 * (snice-app-tiles.css) — both are readable in a layout-free DOM, so this
 * slice owns them. `size` is the `:host([size=…])` axis: here it owns only
 * the attribute-channel reflection contract (docs/ai/properties.md — defaults
 * are not reflected; authored attributes are always present; a property
 * assignment reflects exactly when it differs from the documented default).
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { product, expectShape, removeComponent } from '../matrix-utils';
import {
  VARIANTS, SIZES, COLUMNS_AXIS, CHANNELS, KIND_TILES, DEFAULTS,
  mountTiles, expectedAxes, readAxes, tileButtons, tilesContainer,
  type TilesCombo,
} from './app-tiles-support';
import '../../../packages/components/src/app-tiles/snice-app-tiles';
import '../../../packages/components/src/badge/snice-badge';

const base = (over: Partial<TilesCombo> = {}): TilesCombo => ({
  variant: DEFAULTS.variant,
  size: DEFAULTS.size,
  columns: DEFAULTS.columns,
  channel: 'declarative',
  ...over,
});

const ONE_TILE = [KIND_TILES.ligature];

describe('app-tiles matrix: variant reaches the container it lays out', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  for (const variant of VARIANTS) {
    for (const channel of CHANNELS) {
      const id = `variant=${variant}/${channel}`;

      it(`${id}: the modifier class and the axis state are the documented ones`, async () => {
        const combo = base({ variant, channel });
        el = await mountTiles(combo, ONE_TILE);
        expectShape(readAxes(el, combo), expectedAxes(combo), id);
        // A variant never changes WHICH tiles exist — only how they lay out.
        expect(tileButtons(el).length).toBe(1);
        // The container is the doc's `base` part — the root of the grid.
        expect(tilesContainer(el).hasAttribute('part')).toBe(true);
      });
    }
  }
});

describe('app-tiles matrix: size is an attribute-channel axis', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  for (const size of SIZES) {
    for (const channel of CHANNELS) {
      const id = `size=${size}/${channel}`;

      it(`${id}: the axis state reflects per the property contract`, async () => {
        const combo = base({ size, channel });
        el = await mountTiles(combo, ONE_TILE);
        expectShape(readAxes(el, combo), expectedAxes(combo), id);
      });
    }
  }
});

describe('app-tiles matrix: columns is the grid repeat count', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  for (const columns of COLUMNS_AXIS) {
    for (const channel of CHANNELS) {
      const id = `columns=${columns}/${channel}`;

      it(`${id}: --tiles-columns carries the count for the stylesheet`, async () => {
        const combo = base({ columns, channel });
        el = await mountTiles(combo, ONE_TILE);
        expectShape(readAxes(el, combo), expectedAxes(combo), id);
      });
    }
  }
});

describe('app-tiles matrix: the documented empty default', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  for (const channel of CHANNELS) {
    it(`${channel}: tiles=[] renders the grid container and no tiles`, async () => {
      const combo = base({ channel });
      el = await mountTiles(combo, []);
      expect(tileButtons(el).length).toBe(0);
      expect(tilesContainer(el)).toBeTruthy();
      expectShape(readAxes(el, combo), expectedAxes(combo), `${channel}/empty`);
    });
  }
});
