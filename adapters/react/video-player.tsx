// GENERATED FILE — DO NOT EDIT.
// Source: components/video-player/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the VideoPlayer component
 */
export interface VideoPlayerProps extends SniceBaseProps {
  src?: any;
  poster?: any;
  autoplay?: any;
  muted?: any;
  loop?: any;
  controls?: any;
  playbackRate?: any;
  currentTime?: any;
  volume?: any;
  variant?: any;
  onVideoPlay?: (event: any) => void;
  onVideoPause?: (event: any) => void;
  onVideoEnded?: (event: any) => void;
  onVideoTimeUpdate?: (event: any) => void;
  onVideoFullscreenChange?: (event: any) => void;
  onVideoVolumeChange?: (event: any) => void;
}

/**
 * VideoPlayer - React adapter for snice-video-player
 *
 * This is an auto-generated React wrapper for the Snice video-player component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/video-player';
 * import { VideoPlayer } from 'snice/react';
 *
 * function MyComponent() {
 *   return <VideoPlayer />;
 * }
 * ```
 */
export const VideoPlayer = createReactAdapter<VideoPlayerProps>({
  tagName: 'snice-video-player',
  properties: ["src","poster","autoplay","muted","loop","controls","playbackRate","currentTime","volume","variant"],
  events: {"video-play":"onVideoPlay","video-pause":"onVideoPause","video-ended":"onVideoEnded","video-time-update":"onVideoTimeUpdate","video-fullscreen-change":"onVideoFullscreenChange","video-volume-change":"onVideoVolumeChange"},
  formAssociated: false
});
