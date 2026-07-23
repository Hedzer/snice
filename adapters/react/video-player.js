// GENERATED FILE — DO NOT EDIT.
// Source: components/video-player/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
import { createReactAdapter } from './wrapper';
/**
 * VideoPlayer - React adapter for snice-video-player
 *
 * This is an auto-generated React wrapper for the Snice video-player component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/video-player/snice-video-player';
 * import { VideoPlayer } from 'snice/react';
 *
 * function MyComponent() {
 *   return <VideoPlayer />;
 * }
 * ```
 */
export const VideoPlayer = createReactAdapter({
    tagName: 'snice-video-player',
    properties: ["src", "poster", "autoplay", "muted", "loop", "controls", "playbackRate", "currentTime", "volume", "variant", "duration"],
    events: { "video-play": "onVideoPlay", "video-pause": "onVideoPause", "video-ended": "onVideoEnded", "video-time-update": "onVideoTimeUpdate", "video-fullscreen-change": "onVideoFullscreenChange", "video-volume-change": "onVideoVolumeChange" },
    formAssociated: false
});
//# sourceMappingURL=video-player.js.map