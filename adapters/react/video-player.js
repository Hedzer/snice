import { createReactAdapter } from './wrapper';
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
export const VideoPlayer = createReactAdapter({
    tagName: 'snice-video-player',
    properties: ["src", "poster", "autoplay", "muted", "loop", "controls", "playbackRate", "currentTime", "volume", "variant"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=video-player.js.map