import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the AudioRecorder component
 */
export interface AudioRecorderProps extends SniceBaseProps {
  autoStart?: any;
  format?: any;
  bitrate?: any;
  showControls?: any;
  showVisualizer?: any;
  maxDuration?: any;
  showTimer?: any;
  showPlayback?: any;
  state?: any;
  errorMessage?: any;
  recordedUrl?: any;
  isPlaying?: any;
  playbackTime?: any;

}

/**
 * AudioRecorder - React adapter for snice-audio-recorder
 *
 * This is an auto-generated React wrapper for the Snice audio-recorder component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/audio-recorder';
 * import { AudioRecorder } from 'snice/react';
 *
 * function MyComponent() {
 *   return <AudioRecorder />;
 * }
 * ```
 */
export const AudioRecorder = createReactAdapter<AudioRecorderProps>({
  tagName: 'snice-audio-recorder',
  properties: ["autoStart","format","bitrate","showControls","showVisualizer","maxDuration","showTimer","showPlayback","state","errorMessage","recordedUrl","isPlaying","playbackTime"],
  events: {},
  formAssociated: false
});
