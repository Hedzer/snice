// GENERATED FILE — DO NOT EDIT.
// Source: components/music-player/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the MusicPlayer component
 */
export interface MusicPlayerProps extends SniceBaseProps {
  tracks?: any;
  currentTrackIndex?: any;
  currentTrack?: any;
  volume?: any;
  muted?: any;
  shuffle?: any;
  repeat?: any;
  state?: any;
  autoplay?: any;
  showPlaylist?: any;
  showControls?: any;
  showVolume?: any;
  showArtwork?: any;
  showTrackInfo?: any;
  compact?: any;
  showVolumeSlider?: any;
  onPlayerPlay?: (event: any) => void;
  onPlayerPause?: (event: any) => void;
  onPlayerStop?: (event: any) => void;
  onPlayerTrackChange?: (event: any) => void;
  onPlayerTrackEnded?: (event: any) => void;
  onPlayerSeek?: (event: any) => void;
  onPlayerVolumeChange?: (event: any) => void;
  onPlayerShuffleChange?: (event: any) => void;
  onPlayerRepeatChange?: (event: any) => void;
  onPlayerTimeUpdate?: (event: any) => void;
  onPlayerError?: (event: any) => void;
}

/**
 * MusicPlayer - React adapter for snice-music-player
 *
 * This is an auto-generated React wrapper for the Snice music-player component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/music-player';
 * import { MusicPlayer } from 'snice/react';
 *
 * function MyComponent() {
 *   return <MusicPlayer />;
 * }
 * ```
 */
export const MusicPlayer = createReactAdapter<MusicPlayerProps>({
  tagName: 'snice-music-player',
  properties: ["tracks","currentTrackIndex","currentTrack","volume","muted","shuffle","repeat","state","autoplay","showPlaylist","showControls","showVolume","showArtwork","showTrackInfo","compact","showVolumeSlider"],
  events: {"player-play":"onPlayerPlay","player-pause":"onPlayerPause","player-stop":"onPlayerStop","player-track-change":"onPlayerTrackChange","player-track-ended":"onPlayerTrackEnded","player-seek":"onPlayerSeek","player-volume-change":"onPlayerVolumeChange","player-shuffle-change":"onPlayerShuffleChange","player-repeat-change":"onPlayerRepeatChange","player-time-update":"onPlayerTimeUpdate","player-error":"onPlayerError"},
  formAssociated: false
});
