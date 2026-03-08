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
export declare const MusicPlayer: import("react").ForwardRefExoticComponent<Omit<MusicPlayerProps, "ref"> & import("react").RefAttributes<any>>;
//# sourceMappingURL=music-player.d.ts.map