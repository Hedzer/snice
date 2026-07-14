import { element, property } from 'snice';
import type { SniceLeaderboardEntryElement } from './snice-leaderboard.types';

/**
 * Data container element for leaderboard entries.
 * Does NOT render its own shadow DOM — the parent <snice-leaderboard> reads
 * attributes from these children and renders the full UI.
 */
@element('snice-leaderboard-entry')
export class SniceLeaderboardEntry extends HTMLElement implements SniceLeaderboardEntryElement {
  @property({ type: Number })
  rank = 0;

  @property()
  name = '';

  @property()
  score = '';

  @property()
  avatar = '';

  @property({ type: Number })
  change = 0;

  @property({ type: Boolean })
  highlighted = false;
}
