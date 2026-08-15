/**
 * snice-leaderboard matrix — oracle module.
 *
 * Every expectation here is transcribed from `docs/ai/components/leaderboard.md`
 * (plus the prose of `docs/components/leaderboard.md`, which is the same
 * contract written long-hand) and `snice-leaderboard.types.ts`:
 *
 *   · "Ranked list with podium variant, avatars, change indicators."
 *   · "Dual API: declarative children or imperative setter" — and
 *     "setEntries(entries) … slot children take precedence".
 *   · "The top 3 entries are displayed in a podium layout (2nd, 1st, 3rd).
 *     Remaining entries appear as a regular list below."
 *   · `title` is "JS-only; a title attribute is the native tooltip, not this".
 *   · Parts: `base`, `title`, `list`, `empty`.
 *   · `entry-click` → `{ entry: LeaderboardEntry, index: number }`.
 *
 * Nothing here is read off the component. Where the docs name a feature but not
 * its glyph (the change indicator's arrow, the avatar fallback's initial), the
 * oracle asserts the DOCUMENTED fact — an indicator exists, carries the
 * magnitude, and up and down are distinguishable — rather than transcribing the
 * component's private markup and calling that a specification.
 */
import type {
  LeaderboardEntry,
  LeaderboardVariant,
  LeaderboardSize,
} from '../../../packages/components/src/leaderboard/snice-leaderboard.types';
import '../../../packages/components/src/leaderboard/snice-leaderboard';
import { mount, settle } from './matrix-utils';

/** The documented `LeaderboardVariant` union, in declaration order. */
export const VARIANTS: readonly LeaderboardVariant[] = ['default', 'podium', 'compact'] as const;

/** The documented `LeaderboardSize` union, in declaration order. */
export const SIZES: readonly LeaderboardSize[] = ['small', 'medium', 'large'] as const;

/** The two halves of the documented dual API. */
export const SOURCES = ['slot', 'imperative'] as const;
export type Source = typeof SOURCES[number];

export const AVATAR = 'https://example.test/a.png';

// ── Fixtures ────────────────────────────────────────────────────────────────

/**
 * Five entries — two more than the podium takes, so `podium` really has to
 * split its input, and every documented per-entry extra appears at least once.
 * Scores are strings and numbers both, because `score: number | string`.
 */
export function board(): LeaderboardEntry[] {
  return [
    { rank: 1, name: 'Alice', score: 2500, avatar: AVATAR, change: 3, highlighted: true },
    { rank: 2, name: 'Bob', score: 2100, change: -1 },
    { rank: 3, name: 'Cleo', score: '1,950', change: 0 },
    { rank: 4, name: 'Dev', score: 1200, avatar: AVATAR },
    { rank: 5, name: 'Eve', score: 900, change: 12, highlighted: true },
  ];
}

/** The documented board sizes a variant has to survive. */
export const COUNTS = [0, 1, 3, 5] as const;
export type Count = typeof COUNTS[number];

export function boardOf(count: Count): LeaderboardEntry[] {
  return board().slice(0, count);
}

/**
 * The documented per-entry axes. `change` is the interesting one: the docs
 * declare it optional and numeric, so "absent", "up", "down" and "no movement"
 * are four distinct documented states and all four must be distinguishable.
 */
export const CHANGES = [undefined, 3, -1, 0] as const;
export type Change = typeof CHANGES[number];

export function entryWith(overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return { rank: 1, name: 'Alice', score: 2500, ...overrides };
}

// ── Podium split ────────────────────────────────────────────────────────────

/**
 * "The top 3 entries are displayed in a podium layout … Remaining entries
 * appear as a regular list below." Only the `podium` variant splits; `default`
 * and `compact` list everything.
 */
export function podiumEntries(
  variant: LeaderboardVariant,
  entries: LeaderboardEntry[],
): LeaderboardEntry[] {
  return variant === 'podium' ? entries.slice(0, 3) : [];
}

export function listEntries(
  variant: LeaderboardVariant,
  entries: LeaderboardEntry[],
): LeaderboardEntry[] {
  return variant === 'podium' ? entries.slice(3) : entries;
}

/** The index an entry occupies in the entries array — the `index` of `entry-click`. */
export function indexOf(entries: LeaderboardEntry[], entry: LeaderboardEntry): number {
  return entries.findIndex(candidate => candidate.rank === entry.rank);
}

// ── Declarative markup ──────────────────────────────────────────────────────

/**
 * The documented declarative form: one `<snice-leaderboard-entry>` per entry
 * carrying `rank`, `name`, `score`, `avatar`, `change`, `highlighted`.
 */
export function slotMarkup(entries: LeaderboardEntry[]): string {
  return entries.map(entry => {
    const attrs = [
      `rank="${entry.rank}"`,
      `name="${entry.name}"`,
      `score="${entry.score}"`,
      entry.avatar ? `avatar="${entry.avatar}"` : '',
      entry.change === undefined ? '' : `change="${entry.change}"`,
      entry.highlighted ? 'highlighted' : '',
    ].filter(Boolean).join(' ');
    return `<snice-leaderboard-entry ${attrs}></snice-leaderboard-entry>`;
  }).join('');
}

/**
 * The same entries as the component reports them back through `entry-click`.
 * The declarative channel is attribute-borne, so `score` arrives as a string
 * and an absent `avatar`/`change` is absent rather than empty.
 */
export function asDelivered(entries: LeaderboardEntry[], source: Source): LeaderboardEntry[] {
  if (source === 'imperative') return entries;
  return entries.map(entry => ({
    rank: entry.rank,
    name: entry.name,
    score: String(entry.score),
    avatar: entry.avatar,
    change: entry.change,
    highlighted: !!entry.highlighted,
  }));
}

// ── Rendered-text oracles ───────────────────────────────────────────────────

/** Digits a rendered fragment contains — the magnitude a change indicator owes. */
export function digits(value: string): string {
  return value.replace(/[^\d]/g, '');
}

/** The text an entry's score renders as: the value, verbatim. */
export function scoreText(entry: LeaderboardEntry): string {
  return String(entry.score);
}

// ── Mounting one combo ──────────────────────────────────────────────────────

/**
 * Mount a board through the requested half of the documented dual API.
 *
 *   · `slot`       — `<snice-leaderboard-entry>` children, present BEFORE the
 *                    element connects (the authored-markup order).
 *   · `imperative` — `setEntries()`, the documented setter.
 *
 * `variant` and `size` cross the ATTRIBUTE channel because both are documented
 * as attributes; `title` crosses the PROPERTY channel because the docs say the
 * attribute of that name is the native tooltip and not this property.
 */
export async function mountBoard(options: {
  variant?: LeaderboardVariant;
  size?: LeaderboardSize;
  title?: string;
  titleAttr?: string;
  entries?: LeaderboardEntry[];
  source?: Source;
}): Promise<HTMLElement & { setEntries(entries: LeaderboardEntry[]): void }> {
  const { variant, size, title, titleAttr, entries = [], source = 'imperative' } = options;
  const attrs: Record<string, string> = {};
  if (variant) attrs.variant = variant;
  if (size) attrs.size = size;
  if (titleAttr !== undefined) attrs.title = titleAttr;

  // The `html` channel is used even when there is no markup to seed, because it
  // is the path that applies `attrs` as PURE ATTRIBUTES. `createComponent` also
  // mirrors string attributes onto the matching property, which would defeat the
  // very rule the `title` cases exist to check.
  const el = await mount<any>('snice-leaderboard', {
    attrs,
    html: source === 'slot' ? slotMarkup(entries) : '',
  });
  if (title !== undefined) {
    el.title = title;
    await settle();
  }
  if (source === 'imperative' && entries.length) {
    el.setEntries(entries);
    await settle();
  }
  return el;
}
