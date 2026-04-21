// GENERATED FILE — DO NOT EDIT.
// Source: components/music-player/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
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
    properties: ["tracks", "currentTrackIndex", "currentTrack", "currentTime", "duration", "volume", "muted", "shuffle", "repeat", "state", "autoplay", "showPlaylist", "showControls", "showVolume", "showArtwork", "showTrackInfo", "compact", "showVolumeSlider"],
    events: { "player-play": "onPlayerPlay", "player-pause": "onPlayerPause", "player-stop": "onPlayerStop", "player-track-change": "onPlayerTrackChange", "player-track-ended": "onPlayerTrackEnded", "player-seek": "onPlayerSeek", "player-volume-change": "onPlayerVolumeChange", "player-shuffle-change": "onPlayerShuffleChange", "player-repeat-change": "onPlayerRepeatChange", "player-time-update": "onPlayerTimeUpdate", "player-error": "onPlayerError" },
    formAssociated: false
});
//# sourceMappingURL=music-player.js.map