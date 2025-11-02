export interface Track {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  artwork?: string;
  src: string;
  duration?: number;
}

export type RepeatMode = 'off' | 'all' | 'one';

export type PlayerState = 'playing' | 'paused' | 'stopped' | 'loading' | 'error';

export interface PlayerControls {
  play(): Promise<void>;
  pause(): void;
  stop(): void;
  next(): void;
  previous(): void;
  seek(time: number): void;
  setVolume(volume: number): void;
  toggleShuffle(): void;
  setRepeat(mode: RepeatMode): void;
}

export interface SniceMusicPlayerElement extends HTMLElement, PlayerControls {
  // Properties
  tracks: Track[];
  currentTrackIndex: number;
  currentTrack: string;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  state: PlayerState;
  autoplay: boolean;
  showPlaylist: boolean;
  showControls: boolean;
  showVolume: boolean;
  showArtwork: boolean;
  showTrackInfo: boolean;
  compact: boolean;

  // Methods
  loadTrack(index: number): Promise<void>;
  getCurrentTrack(): Track | null;
}
