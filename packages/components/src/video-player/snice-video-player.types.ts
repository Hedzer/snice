export type VideoVariant = 'default' | 'minimal' | 'cinema';

export interface SniceVideoPlayerElement extends HTMLElement {
  src: string;
  poster: string;
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
  controls: boolean;
  playbackRate: number;
  currentTime: number;
  readonly duration: number;
  volume: number;
  variant: VideoVariant;

  play(): Promise<void>;
  pause(): void;
  toggle(): void;
  seekTo(time: number): void;
  requestFullscreen(): Promise<void>;
  exitFullscreen(): Promise<void>;
  requestPictureInPicture(): Promise<void>;
  setPlaybackRate(rate: number): void;
}

export interface SniceVideoPlayerEventMap {
  'video-play': CustomEvent<{ player: SniceVideoPlayerElement }>;
  'video-pause': CustomEvent<{ player: SniceVideoPlayerElement }>;
  'video-ended': CustomEvent<{ player: SniceVideoPlayerElement }>;
  'video-time-update': CustomEvent<{ player: SniceVideoPlayerElement; currentTime: number; duration: number }>;
  'video-fullscreen-change': CustomEvent<{ player: SniceVideoPlayerElement; fullscreen: boolean }>;
  'video-volume-change': CustomEvent<{ player: SniceVideoPlayerElement; volume: number; muted: boolean }>;
}
