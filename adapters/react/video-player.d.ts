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
export declare const VideoPlayer: import("react").ForwardRefExoticComponent<Omit<VideoPlayerProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=video-player.d.ts.map