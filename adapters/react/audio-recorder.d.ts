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
export declare const AudioRecorder: import("react").ForwardRefExoticComponent<Omit<AudioRecorderProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=audio-recorder.d.ts.map