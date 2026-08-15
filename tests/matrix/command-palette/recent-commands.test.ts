/**
 * snice-command-palette matrix — the RECENT-COMMANDS slice.
 *
 * Doc Properties:
 *   `showRecentCommands: boolean = true`   (attribute `show-recent-commands`)
 *   `recentCommandsLimit: number = 5`      (attribute `recent-commands-limit`)
 *
 * Two things are documented here and both are crossed: the limit is a CAP on a
 * most-recent-first list, and the flag switches the no-query list between "the
 * recently used" and "everything". The slice is small on purpose — it is one
 * list with one bound — but it is separated from `filtering.test.ts` because it
 * is the only part of the component with PERSISTENT state (`localStorage`), and
 * a leaked recent list would silently change every other combo's expectation.
 */
import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makePalette, expectPaletteMatches, renderedLabels, clickItem, typeSearch,
  clearRecent, wait, SETTLE, CANONICAL, finding,
  type CommandItem, type SniceCommandPaletteElement,
} from './matrix-utils';

const LIMITS = [1, 2, 5] as const;

describe('snice-command-palette matrix: recent commands', () => {
  let el: SniceCommandPaletteElement | undefined;

  beforeEach(() => { clearRecent(); });
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  // Doc: `recentCommandsLimit` caps the remembered list. The cross is the limit
  // against a run of executions longer than it, which is the only shape where
  // the cap and the most-recent-first ordering can disagree.
  for (const limit of LIMITS) {
    it(`remembers at most ${limit} commands, most recent first`, async () => {
      const commands: CommandItem[] = [
        { id: 'a', label: 'Alpha' },
        { id: 'b', label: 'Beta' },
        { id: 'c', label: 'Gamma' },
        { id: 'd', label: 'Delta' },
      ];
      el = await makePalette({
        open: true, commands, showRecentCommands: false, recentCommandsLimit: limit,
      });

      // Execute a, b, c, d in order — each activation closes the palette, so it
      // is reopened between them exactly as a user would.
      for (const id of ['a', 'b', 'c', 'd']) {
        if (!el.open) { el.show(); await wait(SETTLE); }
        el.executeCommand(id);
        await wait(SETTLE);
      }

      // Documented: most-recent-first, capped at the limit.
      const expected = ['Delta', 'Gamma', 'Beta', 'Alpha'].slice(0, limit);

      el.showRecentCommands = true;
      el.show();
      await wait(SETTLE);
      expect(renderedLabels(el), `limit=${limit}`).toEqual(expected);
    });
  }

  // Doc: re-running a command that is already remembered moves it to the front
  // rather than duplicating it — a "recent" list with the same entry twice is
  // not a recent list.
  it('re-executing a remembered command moves it to the front, once', async () => {
    const commands: CommandItem[] = [
      { id: 'a', label: 'Alpha' },
      { id: 'b', label: 'Beta' },
      { id: 'c', label: 'Gamma' },
    ];
    el = await makePalette({
      open: true, commands, showRecentCommands: false, recentCommandsLimit: 5,
    });
    for (const id of ['a', 'b', 'c', 'a']) {
      if (!el.open) { el.show(); await wait(SETTLE); }
      el.executeCommand(id);
      await wait(SETTLE);
    }

    el.showRecentCommands = true;
    el.show();
    await wait(SETTLE);
    expect(renderedLabels(el)).toEqual(['Alpha', 'Gamma', 'Beta']);
  });

  // Doc: `show-recent-commands="false"` switches the no-query list to the
  // commands themselves, regardless of what has been run before.
  it('show-recent-commands="false" ignores the remembered list entirely', async () => {
    el = await makePalette({
      open: true, commands: CANONICAL, showRecentCommands: false,
      recent: ['about', 'quit'],
    });
    expectPaletteMatches(el, { commands: CANONICAL, query: '' });
  });

  // Doc: recency is about the NO-QUERY list. Once the user types, the documented
  // search predicate owns the list — recency must not reorder or filter it.
  it('a search ignores recency and returns the documented match order', async () => {
    el = await makePalette({
      open: true, commands: CANONICAL, recent: ['keys', 'about'],
    });
    await typeSearch(el, 'File');
    expectPaletteMatches(el, { commands: CANONICAL, query: 'File' });
  });

  // Doc: activating a command by CLICK is the same activation as by Enter or by
  // `executeCommand`, so it must feed recency the same way.
  it('a clicked command becomes the most recent one', async () => {
    el = await makePalette({ open: true, commands: CANONICAL, showRecentCommands: false });
    await clickItem(el, 3);   // "Toggle Theme"

    el.showRecentCommands = true;
    el.show();
    await wait(SETTLE);
    expect(renderedLabels(el)).toEqual(['Toggle Theme']);
  });

  // ── FINDING ───────────────────────────────────────────────────────────────
  // Doc "Basic Usage" is the whole contract for a first-run palette: assign
  // `commands`, open it, and the commands are there to be searched. Doc
  // Properties documents `showRecentCommands` as SHOWING recent commands — an
  // additive convenience, defaulting to on.
  //
  // The implementation instead REPLACES the list: with no query and the flag on,
  // `filteredCommands` is built only from the remembered ids. On a first run
  // nothing is remembered, so the documented Basic Usage snippet opens a palette
  // that says "No results found" over a fully populated `commands` array. The
  // author cannot discover this from the docs, and the fix (`show-recent-commands
  // ="false"`) reads like it turns a feature OFF rather than making the palette
  // work at all.
  it.fails(finding(
    'MATRIX-command-palette-4',
    'with the documented defaults, an opened palette shows "No results found" '
    + 'instead of its commands until something has been run before',
  ), async () => {
    el = await makePalette({ open: true, commands: CANONICAL });
    expectPaletteMatches(el, { commands: CANONICAL, query: '' });
  });

  // ── FINDING ───────────────────────────────────────────────────────────────
  // Same defect seen from the other side, and the reason it is worth two tests:
  // even AFTER a command has been run, the default palette shows only that one
  // command — the rest of the list is unreachable without typing. Doc
  // "showRecentCommands" promises recent commands in ADDITION to the list a
  // palette exists to browse, not instead of it.
  it.fails(finding(
    'MATRIX-command-palette-5',
    'with recent commands remembered, the default no-query list is ONLY the '
    + 'remembered ids — the rest of `commands` disappears from the palette',
  ), async () => {
    el = await makePalette({ open: true, commands: CANONICAL, recent: ['about'] });
    const labels = renderedLabels(el);
    expect(labels[0], 'the most recent command should lead the list').toBe('About');
    expect(labels.length,
      `only ${labels.length} of ${CANONICAL.length} commands are reachable without typing`)
      .toBe(CANONICAL.length);
  });
});
