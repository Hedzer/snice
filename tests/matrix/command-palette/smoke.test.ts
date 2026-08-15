/**
 * Smoke slice of the snice-command-palette matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/command-palette, 129 combos) is
 * excluded from the default Vitest include and runs via `npm run test:matrix`.
 * This file is the standing cost the everyday loop pays, and it lives at
 * `smoke.test.ts` so it stays collected.
 *
 * Marquee combos only — one per family the matrix is built around:
 *   · the doc's own command list, opened, listing every command with the exact
 *     parts each optional field is documented to gate;
 *   · a search that matches on DESCRIPTION rather than label, the branch of the
 *     predicate that regresses silently when someone "simplifies" the filter;
 *   · arrow navigation clamped at the end of the list;
 *   · an activation, the load-bearing event sequence (execute, then close);
 *   · the empty state, the only combo with no `item` to look at;
 *   · closed, which must render nothing at all.
 *
 * BUDGET: under ~1s. New combinations belong in the matrix, not here.
 */
import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makePalette, expectPaletteMatches, expectOpenChrome, expectClosed,
  typeSearch, press, clickItem, captureEvents, activeIndex, renderedLabels,
  clearRecent, wait, SETTLE, CANONICAL,
  type SniceCommandPaletteElement,
} from './matrix-utils';

describe('snice-command-palette matrix smoke', () => {
  let el: SniceCommandPaletteElement | undefined;

  beforeEach(() => { clearRecent(); });
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  it('opens listing every documented command with its parts', async () => {
    el = await makePalette({ open: true, commands: CANONICAL, showRecentCommands: false });
    expectOpenChrome(el);
    expectPaletteMatches(el, { commands: CANONICAL, query: '' });
  });

  it('matches on description, not just label', async () => {
    el = await makePalette({ open: true, commands: CANONICAL, showRecentCommands: false });
    await typeSearch(el, 'persist');
    expect(renderedLabels(el)).toEqual(['Save']);
    expectPaletteMatches(el, { commands: CANONICAL, query: 'persist' });
  });

  it('clamps arrow navigation at the end of the list', async () => {
    el = await makePalette({ open: true, commands: CANONICAL, showRecentCommands: false });
    for (let i = 0; i < CANONICAL.length + 2; i++) await press(el, 'ArrowDown');
    expect(activeIndex(el)).toBe(CANONICAL.length - 1);
  });

  it('clicking a command executes it and closes the palette', async () => {
    el = await makePalette({ open: true, commands: CANONICAL, showRecentCommands: false });
    const seen = captureEvents(el, ['command-execute', 'command-palette-close']);
    await clickItem(el, 1);
    await wait(SETTLE);
    expect(seen.map(event => event.type))
      .toEqual(['command-execute', 'command-palette-close']);
    expect(seen[0].detail.command.id).toBe('save');
    expect(el.open).toBe(false);
  });

  it('shows the no-results text when nothing matches', async () => {
    el = await makePalette({ open: true, commands: CANONICAL, showRecentCommands: false });
    await typeSearch(el, 'zzzz');
    expectPaletteMatches(el, { commands: CANONICAL, query: 'zzzz' });
  });

  it('renders nothing while closed', async () => {
    el = await makePalette({ commands: CANONICAL, showRecentCommands: false });
    expectClosed(el);
  });
});
