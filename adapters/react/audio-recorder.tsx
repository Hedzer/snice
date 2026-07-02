// GENERATED FILE — DO NOT EDIT.
// Source: components/audio-recorder/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
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
  recordedUrl?: any;
  onRecorderStart?: (event: any) => void;
  onRecorderError?: (event: any) => void;
  onRecorderPause?: (event: any) => void;
  onRecorderResume?: (event: any) => void;
  onRecorderCancel?: (event: any) => void;
  onRecorderStop?: (event: any) => void;
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
  properties: ["autoStart","format","bitrate","showControls","showVisualizer","maxDuration","showTimer","showPlayback","recordedUrl"],
  events: {"recorder-start":"onRecorderStart","recorder-error":"onRecorderError","recorder-pause":"onRecorderPause","recorder-resume":"onRecorderResume","recorder-cancel":"onRecorderCancel","recorder-stop":"onRecorderStop"},
  formAssociated: false
});
