export type LeaderboardVariant = 'default' | 'podium' | 'compact';
export type LeaderboardSize = 'small' | 'medium' | 'large';

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number | string;
  avatar?: string;
  change?: number;
  highlighted?: boolean;
}

export interface SniceLeaderboardElement extends HTMLElement {
  variant: LeaderboardVariant;
  size: LeaderboardSize;
  title: string;
  setEntries(entries: LeaderboardEntry[]): void;
}

export interface SniceLeaderboardEntryElement extends HTMLElement {
  rank: number;
  name: string;
  score: string;
  avatar: string;
  change: number;
  highlighted: boolean;
}

export interface SniceLeaderboardEventMap {
  'entry-click': CustomEvent<{ entry: LeaderboardEntry; index: number }>;
}
