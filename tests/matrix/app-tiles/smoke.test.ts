/**
 * Smoke slice of the snice-app-tiles matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include (vitest.config.ts);
 * the full matrix runs only via `npm run test:matrix`. This file is the
 * standing cost the everyday loop DOES pay, so it lives at `smoke.test.ts`
 * where the config keeps it collected.
 *
 * One combo per feature family of docs/ai/components/app-tiles.md: the
 * documented empty default, the icon-resolution ladder's two structural
 * extremes (letter fallback and the ligature span that owns `part="icon"`),
 * the badge wrapper, the declarative channel, the style axes' journey to the
 * container class / inline var / attribute, and the `tile-click` contract.
 * Structural assertions route through the matrix's own oracle
 * (`expectedIconShape`/`readIconShape`, `expectedAxes`/`readAxes`), so this
 * file cannot drift into asserting something weaker than the suite it stands
 * in for.
 *
 * BUDGET: well under 1s. New feature combinations belong in the matrix.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { expectShape, captureEvents, click, unmountAll } from '../matrix-utils';
import {
  KIND_TILES, DEFAULTS,
  mountTiles, expectedIconShape, readIconShape, expectedAxes, readAxes,
  tileButtons, tilesContainer, type TilesCombo,
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

afterEach(() => { unmountAll(); });

describe('app-tiles matrix smoke', () => {
  it('a bare snice-app-tiles renders the base part, the default columns var, and no tiles', async () => {
    const combo = base();
    const el = await mountTiles(combo, []);
    expectShape(readAxes(el, combo), expectedAxes(combo), 'smoke/bare axes');
    expect(tileButtons(el).length).toBe(0);
    expect(tilesContainer(el).getAttribute('part')).toBe('base');
  });

  it('a missing icon falls back to the first letter on a colored circle', async () => {
    const combo = base();
    const el = await mountTiles(combo, [KIND_TILES.letter]);
    expectShape(readIconShape(el), expectedIconShape('letter', null), 'smoke/letter');
    expect(tileButtons(el)[0].querySelector('.tile__name')?.textContent).toBe('Slack');
  });

  it('an ASCII icon is the ligature span that owns part="icon"', async () => {
    const combo = base();
    const el = await mountTiles(combo, [KIND_TILES.ligature]);
    expectShape(readIconShape(el), expectedIconShape('ligature', null), 'smoke/ligature');
    // The only icon kind the doc gives a part to.
    expect(tilesContainer(el).querySelector('span[part="icon"]')?.textContent).toBe('mail');
  });

  it('a badge wraps the icon in a snice-badge carrying the badge content', async () => {
    const combo = base();
    const el = await mountTiles(combo, [{ ...KIND_TILES.emoji, badge: '12' }]);
    const badge = tileButtons(el)[0].querySelector('snice-badge');
    expect(badge?.getAttribute('content')).toBe('12');
    expect(badge!.contains(tileButtons(el)[0].querySelector('.tile__icon')!)).toBe(true);
  });

  it('declarative children become tiles through the default slot', async () => {
    const combo = base();
    const el = await mountTiles(combo, [KIND_TILES.ligature, KIND_TILES.emoji, KIND_TILES.letter]);
    expect(tileButtons(el).length).toBe(3);
    expect([...el.querySelectorAll('snice-app-tile')].length).toBe(3);
  });

  it('clicking a tile emits tile-click -> { tile, index } with tile identity', async () => {
    const combo = base({ channel: 'programmatic' });
    const el = await mountTiles(combo, [KIND_TILES.ligature]);
    const seen = captureEvents(el, ['tile-click']);
    click(tileButtons(el)[0]);
    expect(seen.types()).toEqual(['tile-click']);
    expect(seen.events[0].detail.tile).toBe((el as any).tiles[0]);
    expect(seen.events[0].detail.index).toBe(0);
  });

  it('property-assigned non-default axes reflect and repaint the container', async () => {
    const combo = base({ variant: 'list', columns: 3, size: 'lg', channel: 'programmatic' });
    const el = await mountTiles(combo, [KIND_TILES.ligature]);
    expectShape(readAxes(el, combo), expectedAxes(combo), 'smoke/axes');
    expect(el.getAttribute('variant')).toBe('list');
    expect(el.getAttribute('columns')).toBe('3');
    expect(el.getAttribute('size')).toBe('lg');
  });
});
