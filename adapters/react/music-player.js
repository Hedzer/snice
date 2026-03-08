import { createReactAdapter } from './wrapper';
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
export const MusicPlayer = createReactAdapter({
    tagName: 'snice-music-player',
    properties: ["tracks", "currentTrackIndex", "currentTrack", "volume", "muted", "shuffle", "repeat", "state", "autoplay", "showPlaylist", "showControls", "showVolume", "showArtwork", "showTrackInfo", "compact", "showVolumeSlider"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=music-player.js.map