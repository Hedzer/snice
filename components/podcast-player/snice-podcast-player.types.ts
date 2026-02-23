export interface PodcastEpisode {
  title: string;
  src: string;
  artwork?: string;
  description?: string;
  pubDate?: string;
  duration?: number;
  chapters?: PodcastChapter[];
}

export interface PodcastChapter {
  title: string;
  startTime: number;
  endTime?: number;
  artwork?: string;
}

export interface RSSFeedData {
  title: string;
  artwork?: string;
  description?: string;
  episodes: PodcastEpisode[];
}

export type PodcastPlayerState = 'playing' | 'paused' | 'stopped' | 'loading' | 'error';

export interface SnicePodcastPlayerElement extends HTMLElement {
  // Properties
  src: string;
  fromRss: string;
  title: string;
  show: string;
  artwork: string;
  description: string;
  playbackRate: number;
  skipForward: number;
  skipBack: number;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  state: PodcastPlayerState;
  episodes: PodcastEpisode[];
  currentEpisodeIndex: number;
  sleepTimer: number;

  // Methods
  play(): Promise<void>;
  pause(): void;
  toggle(): void;
  seekTo(time: number): void;
  setPlaybackRate(rate: number): void;
  loadEpisode(index: number): void;
}

export interface SnicePodcastPlayerEventMap {
  'podcast-play': CustomEvent<{ player: SnicePodcastPlayerElement; episode: PodcastEpisode | null }>;
  'podcast-pause': CustomEvent<{ player: SnicePodcastPlayerElement; episode: PodcastEpisode | null }>;
  'podcast-ended': CustomEvent<{ player: SnicePodcastPlayerElement; episode: PodcastEpisode | null }>;
  'podcast-time-update': CustomEvent<{ player: SnicePodcastPlayerElement; currentTime: number; duration: number }>;
  'podcast-rate-change': CustomEvent<{ player: SnicePodcastPlayerElement; rate: number }>;
  'podcast-episode-change': CustomEvent<{ player: SnicePodcastPlayerElement; episode: PodcastEpisode; index: number }>;
  'podcast-feed-loaded': CustomEvent<{ player: SnicePodcastPlayerElement; feed: RSSFeedData }>;
}
