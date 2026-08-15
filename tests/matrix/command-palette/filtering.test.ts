/**
 * snice-command-palette matrix — the SEARCH cross.
 *
 * FULL product of the three documented search dimensions:
 *   query {empty, label-only, wrong-case label, exact label, description-only,
 *          category-only, no-match}                                        (7)
 *     x case-sensitive {off, on}                                           (2)
 *     x max-results {50 (default), 2 (a cap that really bites)}            (2)
 *   = 28 combos, each judged by `expectPaletteMatches`.
 *
 * The product is worth enumerating rather than sampling because the three
 * searchable fields SHARE ONE PREDICATE (`label || description || category`)
 * and one case fold. "Matches on description but not label, with the fold off,
 * under a cap" is precisely the cell that is never tried by hand, and the cap
 * interacts with the filter (cap the FILTERED list, not the source list).
 *
 * Every combo here sets `show-recent-commands="false"` so the list under test is
 * the command list itself. The recent-command path — and the divergence the
 * default value produces — is owned by `recent-commands.test.ts`.
 */
import { describe, it, beforeEach, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makePalette, expectPaletteMatches, expectOpenChrome, typeSearch,
  clearRecent, CANONICAL,
  type SniceCommandPaletteElement,
} from './matrix-utils';

/**
 * Each query is chosen to hit ONE documented field and nothing else, so a
 * failure names the field that broke:
 *   · `file`        — label "New File" AND category "File" (fold-sensitive)
 *   · `FILE`        — same target in the wrong case
 *   · `Save`        — an exact label, the only case-stable match
 *   · `persist`     — description-only ("Persist the current buffer")
 *   · `preferences` — category-only, matching two commands at once
 *   · `zzz`         — nothing, the empty-state path
 */
const QUERIES = ['', 'file', 'FILE', 'Save', 'persist', 'preferences', 'zzz'] as const;
const CASE_SENSITIVE = [false, true] as const;
const MAX_RESULTS = [50, 2] as const;

describe('snice-command-palette matrix: search cross', () => {
  let el: SniceCommandPaletteElement | undefined;

  beforeEach(() => { clearRecent(); });
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  for (const query of QUERIES) {
    for (const caseSensitive of CASE_SENSITIVE) {
      for (const maxResults of MAX_RESULTS) {
        const id = `query=${query || '∅'}/case-sensitive=${caseSensitive}/max-results=${maxResults}`;

        it(`filters to the documented result set: ${id}`, async () => {
          el = await makePalette({
            open: true,
            commands: CANONICAL,
            showRecentCommands: false,
            caseSensitive,
            maxResults,
          });
          expectOpenChrome(el);
          if (query) await typeSearch(el, query);
          expectPaletteMatches(el, {
            commands: CANONICAL, query, caseSensitive, maxResults,
          });
        });
      }
    }
  }
});

describe('snice-command-palette matrix: search edges', () => {
  let el: SniceCommandPaletteElement | undefined;

  beforeEach(() => { clearRecent(); });
  afterEach(() => { if (el) removeComponent(el); el = undefined; });

  // Doc: `no-results-text` (default "No results found") is what the empty state
  // says. An author-supplied value must reach `part="empty"` verbatim.
  it('renders the author\'s no-results-text when nothing matches', async () => {
    el = await makePalette({
      open: true, commands: CANONICAL, showRecentCommands: false,
      noResultsText: 'Nothing here, sorry',
    });
    await typeSearch(el, 'qqqqq');
    expectPaletteMatches(el, {
      commands: CANONICAL, query: 'qqqqq', noResultsText: 'Nothing here, sorry',
    });
  });

  // Doc: search matches label OR description OR category. A whitespace-only
  // query is not a search — `!query.trim()` restores the unfiltered list.
  it('treats a whitespace-only query as no query at all', async () => {
    el = await makePalette({ open: true, commands: CANONICAL, showRecentCommands: false });
    await typeSearch(el, '   ');
    expectPaletteMatches(el, { commands: CANONICAL, query: '   ' });
  });

  // Doc: `disabled?: boolean` on a CommandItem. A disabled command is still a
  // command in the list; it is the ACTIVATION that is refused (api-events).
  it('narrowing then clearing the query restores the full list', async () => {
    el = await makePalette({ open: true, commands: CANONICAL, showRecentCommands: false });
    await typeSearch(el, 'Save');
    expectPaletteMatches(el, { commands: CANONICAL, query: 'Save' });
    await typeSearch(el, '');
    expectPaletteMatches(el, { commands: CANONICAL, query: '' });
  });

  // Doc: `max-results` caps the results. With more commands than the cap the
  // list must be truncated from the FRONT of the surviving order.
  it('caps a large command list at max-results', async () => {
    const many = Array.from({ length: 40 }, (_, i) => ({ id: `c${i}`, label: `Command ${i}` }));
    el = await makePalette({
      open: true, commands: many, showRecentCommands: false, maxResults: 7,
    });
    expectPaletteMatches(el, { commands: many, query: '', maxResults: 7 });
    await typeSearch(el, 'Command');
    expectPaletteMatches(el, { commands: many, query: 'Command', maxResults: 7 });
  });

  // Doc: `commands: CommandItem[] = []`. An empty palette is the empty state,
  // not a crash and not a stale list.
  it('shows the empty state for an empty command list', async () => {
    el = await makePalette({ open: true, commands: [], showRecentCommands: false });
    expectPaletteMatches(el, { commands: [], query: '' });
  });
});
