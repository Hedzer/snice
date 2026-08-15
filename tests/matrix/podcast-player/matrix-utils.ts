/**
 * Shared oracle for the snice-podcast-player feature-combination matrix.
 *
 * Every assertion in this directory routes through the helpers below, so the
 * matrix cannot drift into asserting something weaker than the documented
 * contract in `docs/ai/components/podcast-player.md` plus
 * `snice-podcast-player.types.ts`:
 *
 *   · CSS PARTS — the doc names exactly three: `base` (outer player
 *     container), `info` (artwork and metadata section) and `controls`
 *     (playback controls and progress bar). All three exist in every combo;
 *     nothing the component can be configured into is allowed to drop one.
 *   · METADATA — `title` (attr `episode-title`), `show`, `artwork` and
 *     `description` are documented as the episode's displayed metadata, and
 *     `episodes[currentEpisodeIndex]` is documented as the loaded episode. A
 *     loaded episode's own title/artwork/description is therefore what the
 *     player shows; the element-level properties are the fallback.
 *   · CONTROLS — the doc promises play/pause, skip and speed controls, a
 *     volume control with mute toggle, and that they are keyboard accessible.
 *     "Keyboard accessible" for an icon-only button is an accessible NAME plus
 *     a real <button>; `skipForward` / `skipBack` are documented in SECONDS, so
 *     the number a control announces is the number the property carries.
 *   · PROGRESS — "Progress bar supports click seeking" and the a11y section
 *     make the progress bar an interactive slider: `role="slider"`,
 *     focusable, with the min/now/max triple derived from `currentTime` and
 *     `duration` (both documented, in seconds).
 *   · EPISODES / CHAPTERS — `episodes` is an ORDERED list; one rendered row per
 *     entry in the same order. "Episode list items indicate currently playing
 *     episode" means the row at `currentEpisodeIndex` is marked and no other
 *     row is. `PodcastEpisode.chapters` renders one row per chapter, in order.
 *   · METHODS — `seekTo`, `setPlaybackRate` (documented range 0.5–2),
 *     `loadEpisode(index)` and `toggle()` behave as the doc's one-liners say,
 *     including at their documented boundaries.
 *
 * Things the docs do NOT specify — the exact SVG path of an icon, the palette,
 * the `M:SS` vs `H:MM:SS` switchover, the class names themselves — are asserted
 * STRUCTURALLY (present / absent / ordered / non-empty), never pinned to an
 * observed literal. That is what keeps a restyle from failing this suite while
 * still catching a control that stopped rendering.
 */
import { expect } from 'vitest';
import { createComponent, wait } from '../../components/test-utils';
import '../../../packages/components/src/podcast-player/snice-podcast-player';
import type {
  PodcastEpisode, SnicePodcastPlayerElement,
} from '../../../packages/components/src/podcast-player/snice-podcast-player.types';

export { wait };
export type { PodcastEpisode, SnicePodcastPlayerElement };

/** Settle window: the player renders on a microtask plus a queued task. */
export const SETTLE = 40;

export interface PlayerCombo {
  /** Audio source URL (`src`). */
  src?: string;
  /** Episode title — authored through the documented `episode-title` attribute. */
  title?: string;
  show?: string;
  artwork?: string;
  description?: string;
  playbackRate?: number;
  skipForward?: number;
  skipBack?: number;
  currentTime?: number;
  duration?: number;
  volume?: number;
  muted?: boolean;
  episodes?: PodcastEpisode[];
  currentEpisodeIndex?: number;
}

/**
 * Mount a player for one combo.
 *
 * Scalars cross the ATTRIBUTE channel under their documented attribute names
 * (`episode-title`, `playback-rate`, `skip-forward`, `skip-back`,
 * `current-time`, `current-episode-index`) so the matrix exercises the
 * documented declarative surface. `episodes` is documented as "attr: none (JS
 * only)" and therefore crosses the property channel, after `ready`.
 */
export async function makePlayer(combo: PlayerCombo = {}): Promise<SnicePodcastPlayerElement> {
  const attrs: Record<string, any> = {};
  if (combo.src !== undefined) attrs.src = combo.src;
  if (combo.title !== undefined) attrs['episode-title'] = combo.title;
  if (combo.show !== undefined) attrs.show = combo.show;
  if (combo.artwork !== undefined) attrs.artwork = combo.artwork;
  if (combo.description !== undefined) attrs.description = combo.description;
  if (combo.playbackRate !== undefined) attrs['playback-rate'] = combo.playbackRate;
  if (combo.skipForward !== undefined) attrs['skip-forward'] = combo.skipForward;
  if (combo.skipBack !== undefined) attrs['skip-back'] = combo.skipBack;

  const el = await createComponent<SnicePodcastPlayerElement>('snice-podcast-player', attrs);

  if (combo.episodes) el.episodes = combo.episodes;
  if (combo.currentEpisodeIndex !== undefined && combo.currentEpisodeIndex >= 0) {
    el.loadEpisode(combo.currentEpisodeIndex);
  }
  if (combo.duration !== undefined) el.duration = combo.duration;
  if (combo.currentTime !== undefined) el.seekTo(combo.currentTime);
  if (combo.volume !== undefined) el.volume = combo.volume;
  if (combo.muted !== undefined) el.muted = combo.muted;

  await wait(SETTLE);
  return el;
}

// ── Readers ─────────────────────────────────────────────────────────────────

export function sr(el: SnicePodcastPlayerElement): ShadowRoot {
  const root = (el as HTMLElement).shadowRoot;
  if (!root) throw new Error('snice-podcast-player rendered no shadow root');
  return root;
}

export function partEl(el: SnicePodcastPlayerElement, name: string): HTMLElement | null {
  return sr(el).querySelector<HTMLElement>(`[part~="${name}"]`);
}

export function textOf(node: Element | null | undefined): string {
  return (node?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

export function buttons(el: SnicePodcastPlayerElement): HTMLButtonElement[] {
  return [...sr(el).querySelectorAll('button')] as HTMLButtonElement[];
}

export function progressEl(el: SnicePodcastPlayerElement): HTMLElement | null {
  return sr(el).querySelector<HTMLElement>('.podcast-progress');
}

export function episodeRows(el: SnicePodcastPlayerElement): HTMLElement[] {
  return [...sr(el).querySelectorAll<HTMLElement>('.podcast-episode-item')];
}

export function chapterRows(el: SnicePodcastPlayerElement): HTMLElement[] {
  return [...sr(el).querySelectorAll<HTMLElement>('.podcast-chapter-item')];
}

/** The accessible name of a control, however the component chose to spell it. */
export function accessibleName(button: HTMLButtonElement): string {
  return button.getAttribute('aria-label')
    || button.getAttribute('title')
    || textOf(button);
}

/** The one speed control — documented as a "speed" control showing the rate. */
export function speedButton(el: SnicePodcastPlayerElement): HTMLButtonElement | null {
  return buttons(el).find(b => /speed/i.test(accessibleName(b))) ?? null;
}

export function skipBackButton(el: SnicePodcastPlayerElement): HTMLButtonElement | null {
  return buttons(el).find(b => /skip back/i.test(accessibleName(b))) ?? null;
}

export function skipForwardButton(el: SnicePodcastPlayerElement): HTMLButtonElement | null {
  return buttons(el).find(b => /skip forward/i.test(accessibleName(b))) ?? null;
}

export function playButton(el: SnicePodcastPlayerElement): HTMLButtonElement | null {
  return buttons(el).find(b => /^(play|pause)$/i.test(accessibleName(b))) ?? null;
}

export function volumeButton(el: SnicePodcastPlayerElement): HTMLButtonElement | null {
  return buttons(el).find(b => /volume/i.test(accessibleName(b))) ?? null;
}

// ── Oracles ─────────────────────────────────────────────────────────────────

/**
 * The metadata the player must display for a combo, derived from the doc's
 * property table: a loaded episode supplies its own title/artwork/description,
 * and the element-level properties are the fallback for each field
 * independently.
 */
export function expectedMetadata(combo: PlayerCombo): {
  title: string; show: string; artwork: string; description: string;
} {
  const index = combo.currentEpisodeIndex ?? -1;
  const episodes = combo.episodes ?? [];
  const episode = index >= 0 && index < episodes.length ? episodes[index] : null;
  return {
    // `loadEpisode` is documented as "Load and switch to episode by index", so
    // after it runs the episode's title IS the player's title.
    title: episode?.title || combo.title || '',
    show: combo.show || '',
    artwork: episode?.artwork || combo.artwork || '',
    description: episode?.description || combo.description || '',
  };
}

/**
 * The whole-shell oracle: parts, metadata, controls, progress slider, episode
 * and chapter lists — every violation reported at once, so one run tells you
 * everything wrong with a combo instead of one thing per re-run.
 */
export function expectPlayerMatches(el: SnicePodcastPlayerElement, combo: PlayerCombo): void {
  const problems: string[] = [];
  const want = expectedMetadata(combo);

  // ── CSS parts: the documented public shadow API ──────────────────────────
  for (const name of ['base', 'info', 'controls']) {
    if (!partEl(el, name)) problems.push(`missing part="${name}"`);
  }

  // ── Metadata ────────────────────────────────────────────────────────────
  const titleText = textOf(sr(el).querySelector('.podcast-title'));
  if (want.title && titleText !== want.title) {
    problems.push(`title "${titleText}" != "${want.title}"`);
  }

  const showNode = sr(el).querySelector('.podcast-show');
  if (want.show) {
    if (!showNode) problems.push(`show "${want.show}" set but no show text rendered`);
    else if (textOf(showNode) !== want.show) {
      problems.push(`show "${textOf(showNode)}" != "${want.show}"`);
    }
  } else if (showNode) {
    problems.push(`no show set but show text "${textOf(showNode)}" rendered`);
  }

  const descNode = sr(el).querySelector('.podcast-description');
  if (want.description) {
    if (!descNode) problems.push(`description set but no description text rendered`);
    else if (textOf(descNode) !== want.description) {
      problems.push(`description "${textOf(descNode)}" != "${want.description}"`);
    }
  } else if (descNode) {
    problems.push(`no description set but "${textOf(descNode)}" rendered`);
  }

  const img = sr(el).querySelector<HTMLImageElement>('.podcast-artwork img');
  if (want.artwork) {
    if (!img) problems.push(`artwork "${want.artwork}" set but no <img> rendered`);
    else if (img.getAttribute('src') !== want.artwork) {
      problems.push(`artwork src "${img.getAttribute('src')}" != "${want.artwork}"`);
    }
  } else if (img) {
    problems.push(`no artwork set but <img src="${img.getAttribute('src')}"> rendered`);
  }

  // ── Controls: named, real buttons ───────────────────────────────────────
  const unnamed = buttons(el).filter(b => !accessibleName(b)).map(b => b.className);
  if (unnamed.length) problems.push(`unnamed control(s): ${unnamed.join(', ')}`);

  const speed = speedButton(el);
  if (!speed) problems.push('no playback-speed control');
  else {
    const rate = combo.playbackRate ?? 1;
    if (!textOf(speed).includes(String(rate))) {
      problems.push(`speed control shows "${textOf(speed)}", expected the rate ${rate}`);
    }
  }

  const back = skipBackButton(el);
  const forward = skipForwardButton(el);
  const wantBack = combo.skipBack ?? 15;
  const wantForward = combo.skipForward ?? 30;
  if (!back) problems.push('no skip-back control');
  else if (!accessibleName(back).includes(String(wantBack))) {
    problems.push(`skip-back announces "${accessibleName(back)}", expected ${wantBack}s`);
  }
  if (!forward) problems.push('no skip-forward control');
  else if (!accessibleName(forward).includes(String(wantForward))) {
    problems.push(`skip-forward announces "${accessibleName(forward)}", expected ${wantForward}s`);
  }

  if (!playButton(el)) problems.push('no play/pause control');
  if (!volumeButton(el)) problems.push('no volume control');

  // ── Progress bar: an interactive, keyboard-reachable slider ─────────────
  const progress = progressEl(el);
  if (!progress) {
    problems.push('no progress bar');
  } else {
    if (progress.getAttribute('role') !== 'slider') {
      problems.push(`progress role "${progress.getAttribute('role')}", expected slider`);
    }
    if (progress.getAttribute('tabindex') !== '0') {
      problems.push(`progress tabindex "${progress.getAttribute('tabindex')}", expected 0`);
    }
    if (!progress.getAttribute('aria-label')) problems.push('progress bar has no aria-label');
    if (progress.getAttribute('aria-valuemin') !== '0') {
      problems.push(`progress aria-valuemin "${progress.getAttribute('aria-valuemin')}", expected 0`);
    }
    const wantMax = String(Math.floor(el.duration));
    if (progress.getAttribute('aria-valuemax') !== wantMax) {
      problems.push(`progress aria-valuemax "${progress.getAttribute('aria-valuemax')}" != "${wantMax}"`);
    }
    const wantNow = String(Math.floor(el.currentTime));
    if (progress.getAttribute('aria-valuenow') !== wantNow) {
      problems.push(`progress aria-valuenow "${progress.getAttribute('aria-valuenow')}" != "${wantNow}"`);
    }
  }

  // ── Episode list ────────────────────────────────────────────────────────
  const episodes = combo.episodes ?? [];
  const rows = episodeRows(el);
  if (rows.length !== episodes.length) {
    problems.push(`${rows.length} episode rows, expected ${episodes.length}`);
  }
  rows.forEach((row, i) => {
    const spec = episodes[i];
    if (!spec) { problems.push(`episode row ${i}: rendered but not in episodes`); return; }
    const rowTitle = textOf(row.querySelector('.podcast-episode-title'));
    if (rowTitle !== spec.title) {
      problems.push(`episode row ${i}: title "${rowTitle}" != "${spec.title}"`);
    }
    const marked = row.classList.contains('active');
    const shouldBeMarked = i === (combo.currentEpisodeIndex ?? -1);
    if (marked !== shouldBeMarked) {
      problems.push(`episode row ${i}: marked=${marked}, expected ${shouldBeMarked}`);
    }
  });

  // ── Chapter list ────────────────────────────────────────────────────────
  const index = combo.currentEpisodeIndex ?? -1;
  const chapters = (index >= 0 && index < episodes.length ? episodes[index].chapters : undefined) ?? [];
  const chapterEls = chapterRows(el);
  if (chapterEls.length !== chapters.length) {
    problems.push(`${chapterEls.length} chapter rows, expected ${chapters.length}`);
  }
  chapterEls.forEach((row, i) => {
    const spec = chapters[i];
    if (!spec) { problems.push(`chapter row ${i}: rendered but not in chapters`); return; }
    if (!textOf(row).includes(spec.title)) {
      problems.push(`chapter row ${i}: "${textOf(row)}" omits "${spec.title}"`);
    }
  });

  expect(problems).toEqual([]);
}

/** Assert a collected problem list is empty, naming the combo. */
export function expectClean(problems: string[], comboId: string): void {
  expect(problems, `combo ${comboId}`).toEqual([]);
}

/** Record the named events in dispatch order. */
export function captureEvents(el: SnicePodcastPlayerElement, types: string[]): Array<{ type: string; detail: any }> {
  const seen: Array<{ type: string; detail: any }> = [];
  for (const type of types) {
    (el as HTMLElement).addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return seen;
}

// ── Canonical fixtures ──────────────────────────────────────────────────────

/** The doc's own programmatic-episodes example, with its chapter list. */
export const EPISODES: PodcastEpisode[] = [
  { title: 'Ep 1', src: '/audio/ep1.mp3', duration: 1800 },
  {
    title: 'Ep 2', src: '/audio/ep2.mp3', duration: 2400,
    chapters: [{ title: 'Intro', startTime: 0 }, { title: 'Main', startTime: 120 }],
  },
  {
    title: 'Ep 3', src: '/audio/ep3.mp3', duration: 3600,
    artwork: '/art/ep3.png', description: 'Third episode',
    chapters: [
      { title: 'Cold open', startTime: 0 },
      { title: 'Interview', startTime: 300 },
      { title: 'Outro', startTime: 3300 },
    ],
  },
];

/** The documented playback-rate range: 0.5–2. */
export const RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
