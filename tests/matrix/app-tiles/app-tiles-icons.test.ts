/**
 * MATRIX slice — snice-app-tiles icon resolution x badge x color x channel.
 *
 * Dimensions:
 *   icons:   kind (5 documented treatments) x badge (2) x channel (2) = 20
 *   color:   kind (letter, ligature — the doc scopes color to these) x
 *            color (authored/absent) x channel (2)                    = 8
 *
 * docs/ai/components/app-tiles.md "Icon Resolution" is a 4-step ladder, and
 * its CSS Parts section scopes `part="icon"` to the ligature span — so every
 * kind is judged on its own treatment AND on not borrowing another's, in both
 * authoring channels, with and without the badge wrapper that "uses
 * snice-badge".
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { product, comboId, expectShape, removeComponent } from '../matrix-utils';
import {
  CHANNELS, ICON_KINDS, KIND_TILES, DEFAULTS,
  mountTiles, expectedIconShape, readIconShape, tileButtons,
  type TilesCombo, type IconKind,
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

/** The doc's letter-fallback example color. */
const COLOR = 'rgb(97 31 105)';

describe('app-tiles matrix: icon resolution x badge', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  const COMBOS = product({
    icon: ICON_KINDS,
    badge: [false, true],
    channel: CHANNELS,
  });

  for (const { icon, badge, channel } of COMBOS) {
    const id = `icon=${icon}/${badge ? 'badged' : 'plain'}/${channel}`;

    it(`${id}: the documented treatment, and only that treatment`, async () => {
      const combo = base({ channel });
      const tile = { ...KIND_TILES[icon as IconKind] };
      if (badge) tile.badge = '3';
      el = await mountTiles(combo, [tile]);

      // One tile, one button, its title names the tile, its label is the name.
      const buttons = tileButtons(el);
      expect(buttons.length, `${id} tile count`).toBe(1);
      expect(buttons[0].getAttribute('title')).toBe(tile.name);
      expect(buttons[0].querySelector('.tile__name')?.textContent).toBe(tile.name);

      expectShape(readIconShape(el), expectedIconShape(icon as IconKind, null), id);
    });

    it(`${id}: the badge wrapper exists exactly when a badge is authored`, async () => {
      // "badge?: string; // Badge content (uses snice-badge)" — the badge
      // wraps the icon so the count can sit on its corner.
      const combo = base({ channel });
      const tile = { ...KIND_TILES[icon as IconKind] };
      if (badge) tile.badge = '3';
      el = await mountTiles(combo, [tile]);

      const badgeEl = tileButtons(el)[0].querySelector('snice-badge');
      expect(!!badgeEl, `${id} snice-badge presence`).toBe(badge);
      if (badge) {
        expect(badgeEl!.getAttribute('content')).toBe('3');
        expect(badgeEl!.contains(tileButtons(el)[0].querySelector('.tile__icon'))).toBe(true);
      }
    });
  }
});

describe('app-tiles matrix: color is the letter/ligature background', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  const COMBOS = product({
    icon: ['letter', 'ligature'] as const,
    color: [false, true],
    channel: CHANNELS,
  });

  for (const { icon, color, channel } of COMBOS) {
    const id = `icon=${icon}/${color ? 'color' : 'no-color'}/${channel}`;

    it(`${id}: the authored color paints the icon background`, async () => {
      const combo = base({ channel });
      const tile = { ...KIND_TILES[icon as IconKind] };
      if (color) tile.color = COLOR;
      el = await mountTiles(combo, [tile]);
      expectShape(readIconShape(el), expectedIconShape(icon as IconKind, color ? COLOR : null), id);
    });
  }
});
