import { createReactAdapter } from './wrapper';
/**
 * PodcastPlayer - React adapter for snice-podcast-player
 *
 * This is an auto-generated React wrapper for the Snice podcast-player component.
 * Make sure to import the Snice component before using this wrapper:
 *
 * @example
 * ```tsx
 * import 'snice/components/podcast-player';
 * import { PodcastPlayer } from 'snice/react';
 *
 * function MyComponent() {
 *   return <PodcastPlayer />;
 * }
 * ```
 */
export const PodcastPlayer = createReactAdapter({
    tagName: 'snice-podcast-player',
    properties: ["src", "fromRss", "title", "show", "artwork", "description", "playbackRate", "skipForward", "skipBack", "currentTime", "duration", "volume", "muted", "episodes", "currentEpisodeIndex", "sleepTimer"],
    events: {},
    formAssociated: false
});
//# sourceMappingURL=podcast-player.js.map