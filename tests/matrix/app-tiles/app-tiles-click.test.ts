/**
 * MATRIX slice — snice-app-tiles `tile-click` contract and href navigation.
 *
 * Dimensions:
 *   click:    icon kind (5) x badge (2)                      = 10 (programmatic)
 *   variant:  variant (3)                                    = 3
 *   channel:  icon kind (5), declarative children            = 5
 *   href:     href (none / relative / absolute) x channel(2) = 6
 *
 * `tile-click -> { tile: AppTile, index: number }` is the component's ONLY
 * event (docs/ai/components/app-tiles.md Events), so it is crossed against
 * every icon treatment, the badge wrapper (whose button must still be the
 * click target), every variant, and both authoring channels rather than
 * sampled. `href?: string; // Navigate on click` stacks navigation on top of
 * the event: the safe href is opened in '_self' and the event still fires.
 *
 * Every assertion is the DOCUMENTED expectation. No findings in this slice.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { product, captureEvents, click, removeComponent } from '../matrix-utils';
import {
  VARIANTS, CHANNELS, ICON_KINDS, KIND_TILES, DEFAULTS,
  mountTiles, tileButtons, type TilesCombo, type IconKind,
} from './app-tiles-support';
import type { AppTile } from '../../../packages/components/src/app-tiles/snice-app-tiles.types';
import '../../../packages/components/src/app-tiles/snice-app-tiles';
import '../../../packages/components/src/badge/snice-badge';

const base = (over: Partial<TilesCombo> = {}): TilesCombo => ({
  variant: DEFAULTS.variant,
  size: DEFAULTS.size,
  columns: DEFAULTS.columns,
  channel: 'programmatic',
  ...over,
});

describe('app-tiles matrix: tile-click over every icon treatment x badge', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  const COMBOS = product({
    icon: ICON_KINDS,
    badge: [false, true],
  });

  for (const { icon, badge } of COMBOS) {
    const id = `icon=${icon}/${badge ? 'badged' : 'plain'}`;

    it(`${id}: first and last tile report { tile, index } with tile identity`, async () => {
      const combo = base();
      const fill = (kind: IconKind): AppTile[] => [
        { ...KIND_TILES[kind], badge: badge ? '3' : undefined },
        { ...KIND_TILES.ligature },
        { ...KIND_TILES.emoji, badge: badge ? '9+' : undefined },
      ];
      el = await mountTiles(combo, fill(icon as IconKind));

      const seen = captureEvents(el, ['tile-click']);
      const buttons = tileButtons(el);
      click(buttons[0]);
      click(buttons[buttons.length - 1]);

      // `tile` is the tile data itself — the very object in the array — and
      // `index` is its position, not a fresh copy.
      expect(seen.types()).toEqual(['tile-click', 'tile-click']);
      expect(seen.events[0].detail.tile).toBe((el as any).tiles[0]);
      expect(seen.events[0].detail.index).toBe(0);
      expect(seen.events[1].detail.tile).toBe((el as any).tiles[2]);
      expect(seen.events[1].detail.index).toBe(2);
      seen.stop();
    });
  }
});

describe('app-tiles matrix: tile-click under every variant', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  for (const variant of VARIANTS) {
    it(`variant=${variant}: clicking the tile still reports { tile, index }`, async () => {
      el = await mountTiles(base({ variant }), [KIND_TILES.ligature, KIND_TILES.emoji]);
      const seen = captureEvents(el, ['tile-click']);
      click(tileButtons(el)[1]);
      expect(seen.types()).toEqual(['tile-click']);
      expect(seen.events[0].detail.index).toBe(1);
      expect(seen.events[0].detail.tile.name).toBe(KIND_TILES.emoji.name);
      seen.stop();
    });
  }
});

describe('app-tiles matrix: tile-click from declarative children', () => {
  let el: HTMLElement | undefined;
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  for (const icon of ICON_KINDS) {
    it(`icon=${icon}/declarative: the authored attributes ride back on the detail`, async () => {
      el = await mountTiles(base({ channel: 'declarative' }), [KIND_TILES[icon as IconKind]]);
      const seen = captureEvents(el, ['tile-click']);
      click(tileButtons(el)[0]);
      expect(seen.types()).toEqual(['tile-click']);
      // A declarative tile has no pre-existing object to be identical to; the
      // documented contract is that the CLICKED TILE's data is carried.
      expect(seen.events[0].detail.index).toBe(0);
      expect(seen.events[0].detail.tile.name).toBe(KIND_TILES[icon as IconKind].name);
      expect(seen.events[0].detail.tile.icon).toBe(KIND_TILES[icon as IconKind].icon);
      seen.stop();
    });
  }
});

describe('app-tiles matrix: href navigates on click', () => {
  let el: HTMLElement | undefined;
  let openSpy: ReturnType<typeof vi.spyOn> | undefined;

  afterEach(() => {
    openSpy?.mockRestore();
    openSpy = undefined;
    if (el) removeComponent(el);
    el = undefined;
  });

  const HREFS = [null, '/mail', 'https://example.com/mail'];

  for (const href of HREFS) {
    for (const channel of CHANNELS) {
      const id = `href=${href ?? 'none'}/${channel}`;

      it(`${id}: navigation follows the safe href, and the event still fires`, async () => {
        openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
        const tile: AppTile = href
          ? { ...KIND_TILES.ligature, href }
          : { ...KIND_TILES.ligature };
        el = await mountTiles(base({ channel }), [tile]);

        const seen = captureEvents(el, ['tile-click']);
        click(tileButtons(el)[0]);

        expect(seen.types(), `${id} event`).toEqual(['tile-click']);
        seen.stop();
        if (href) {
          expect(openSpy).toHaveBeenCalledTimes(1);
          expect(openSpy).toHaveBeenCalledWith(href, '_self');
        } else {
          expect(openSpy).not.toHaveBeenCalled();
        }
      });
    }
  }
});
