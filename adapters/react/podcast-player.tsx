import { createReactAdapter } from './wrapper';
import type { SniceBaseProps } from './types';

/**
 * Props for the PodcastPlayer component
 */
export interface PodcastPlayerProps extends SniceBaseProps {
  src?: any;
  fromRss?: any;
  title?: any;
  show?: any;
  artwork?: any;
  description?: any;
  playbackRate?: any;
  skipForward?: any;
  skipBack?: any;
  currentTime?: any;
  duration?: any;
  volume?: any;
  muted?: any;
  episodes?: any;
  currentEpisodeIndex?: any;
  sleepTimer?: any;

}

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
export const PodcastPlayer = createReactAdapter<PodcastPlayerProps>({
  tagName: 'snice-podcast-player',
  properties: ["src","fromRss","title","show","artwork","description","playbackRate","skipForward","skipBack","currentTime","duration","volume","muted","episodes","currentEpisodeIndex","sleepTimer"],
  events: {},
  formAssociated: false
});
