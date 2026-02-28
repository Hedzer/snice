export type LeaderboardVariant = 'list' | 'podium';

export interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar?: string;
  score: number | string;
  change?: number;
  highlighted?: boolean;
}

export interface SniceLeaderboardElement extends HTMLElement {
  entries: LeaderboardEntry[];
  variant: LeaderboardVariant;
  metricLabel: string;
}

export interface EntryClickDetail {
  entry: LeaderboardEntry;
  index: number;
}

export interface SniceLeaderboardEventMap {
  'entry-click': CustomEvent<EntryClickDetail>;
}
