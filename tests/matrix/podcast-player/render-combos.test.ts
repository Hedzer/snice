/**
 * snice-podcast-player matrix — metadata x source-mode cross.
 *
 * The four documented metadata fields (`artwork`, `show`, `description`, plus
 * the `episode-title`-backed `title`) are INDEPENDENT switches over the
 * player's info section, and they interact with how the player was given a
 * source: a bare `src`, an `episodes` list with nothing loaded, or an
 * `episodes` list with one loaded. The loaded case is the interesting one —
 * `loadEpisode` is documented to "load and switch to episode by index", so the
 * episode's own title/artwork/description takes over per field, and the
 * element-level property is only the fallback for the fields the episode omits.
 *
 * 8 metadata vectors x 3 source modes = 24 combos.
 */
import { describe, it, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  makePlayer, expectPlayerMatches, EPISODES,
  type PlayerCombo, type SnicePodcastPlayerElement,
} from './matrix-utils';

const ARTWORKS = ['', '/art/cover.png'];
const SHOWS = ['', 'The Show'];
const DESCRIPTIONS = ['', 'A description of the episode'];

/**
 * Source modes:
 *   · `src`        — the doc's basic-usage markup form;
 *   · `list`       — `episodes` assigned, nothing loaded (index stays -1);
 *   · `loaded`     — `episodes` assigned and `loadEpisode(2)` run. Episode 3
 *                    carries its OWN artwork and description, so this is the
 *                    mode where the episode-over-element precedence is decided.
 */
const SOURCES: Array<{ id: string; apply: (c: PlayerCombo) => PlayerCombo }> = [
  { id: 'src', apply: c => ({ ...c, src: '/audio/episode.mp3' }) },
  { id: 'list', apply: c => ({ ...c, episodes: EPISODES }) },
  { id: 'loaded', apply: c => ({ ...c, episodes: EPISODES, currentEpisodeIndex: 2 }) },
];

describe('snice-podcast-player matrix: metadata x source', () => {
  let el: SnicePodcastPlayerElement | undefined;
  afterEach(() => { if (el) removeComponent(el as HTMLElement); el = undefined; });

  for (const source of SOURCES) {
    for (const artwork of ARTWORKS) {
      for (const show of SHOWS) {
        for (const description of DESCRIPTIONS) {
          const id = `${source.id}/artwork=${artwork ? 'set' : 'none'}`
            + `/show=${show ? 'set' : 'none'}/description=${description ? 'set' : 'none'}`;

          it(id, async () => {
            const combo = source.apply({
              title: 'Episode 1: Getting Started',
              artwork, show, description,
            });
            el = await makePlayer(combo);
            expectPlayerMatches(el, combo);
          });
        }
      }
    }
  }
});
