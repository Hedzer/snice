// GENERATED FILE — DO NOT EDIT.
// Source: components/podcast-player/ + scripts/generate-react-adapters.js
// Rebuild: npm run generate:react-adapters
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
    properties: ["src", "fromRss", "title", "show", "artwork", "description", "playbackRate", "skipForward", "skipBack", "currentTime", "duration", "volume", "muted", "episodes", "currentEpisodeIndex", "sleepTimer", "state"],
    events: { "podcast-play": "onPodcastPlay", "podcast-pause": "onPodcastPause", "podcast-ended": "onPodcastEnded", "podcast-time-update": "onPodcastTimeUpdate", "podcast-rate-change": "onPodcastRateChange", "podcast-episode-change": "onPodcastEpisodeChange", "podcast-feed-loaded": "onPodcastFeedLoaded" },
    formAssociated: false
});
//# sourceMappingURL=podcast-player.js.map