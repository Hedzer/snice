# snice-podcast-player

Full-featured podcast player with playback controls, episode list, chapters, RSS feed support, sleep timer, and position memory via localStorage.

## Properties

```typescript
src: string = '';                                    // Audio source URL
fromRss: string = '';                                // RSS feed URL (attr: from-rss)
title: string = '';                                  // Episode title
show: string = '';                                   // Show/podcast name
artwork: string = '';                                // Artwork image URL
description: string = '';                            // Episode description
playbackRate: number = 1;                            // Speed 0.5-2 (attr: playback-rate)
skipForward: number = 30;                            // Skip forward seconds (attr: skip-forward)
skipBack: number = 15;                               // Skip back seconds (attr: skip-back)
currentTime: number = 0;                             // Current position (attr: current-time)
duration: number = 0;                                // Duration in seconds
volume: number = 1;                                  // Volume 0-1
muted: boolean = false;
state: PodcastPlayerState;                           // 'playing'|'paused'|'stopped'|'loading'|'error' (not decorated)
episodes: PodcastEpisode[] = [];                     // attr: none (JS only)
currentEpisodeIndex: number = -1;                    // attr: current-episode-index
sleepTimer: number = 0;                              // Sleep timer minutes (attr: sleep-timer)
```

## Methods

- `play()` - Start playback (async)
- `pause()` - Pause playback
- `toggle()` - Toggle play/pause
- `seekTo(time: number)` - Seek to time in seconds
- `setPlaybackRate(rate: number)` - Set speed (0.5-2)
- `loadEpisode(index: number)` - Load and switch to episode by index

## Events

- `podcast-play` → `{ player, episode }` - Playback started
- `podcast-pause` → `{ player, episode }` - Playback paused
- `podcast-ended` → `{ player, episode }` - Episode ended
- `podcast-time-update` → `{ player, currentTime, duration }` - Time update
- `podcast-rate-change` → `{ player, rate }` - Playback rate changed
- `podcast-episode-change` → `{ player, episode, index }` - Episode switched
- `podcast-feed-loaded` → `{ player, feed: RSSFeedData }` - RSS feed parsed

## CSS Parts

- `base` - Outer player container
- `info` - Artwork and metadata section
- `controls` - Playback controls and progress bar

## Basic Usage

```html
<snice-podcast-player src="/audio/episode.mp3" title="Episode 1" show="My Podcast"></snice-podcast-player>
```

```typescript
import 'snice/components/podcast-player/snice-podcast-player';

// From RSS feed
// <snice-podcast-player from-rss="https://example.com/feed.xml"></snice-podcast-player>

// Programmatic episodes
player.episodes = [
  { title: 'Ep 1', src: '/audio/ep1.mp3', duration: 1800 },
  { title: 'Ep 2', src: '/audio/ep2.mp3', duration: 2400,
    chapters: [{ title: 'Intro', startTime: 0 }, { title: 'Main', startTime: 120 }]
  }
];
player.loadEpisode(0);
```

## Accessibility

- Play/pause, skip, and speed controls are keyboard accessible
- Progress bar supports click seeking
- Volume control with mute toggle
- Episode list items indicate currently playing episode
- Position memory via localStorage

## Types

```typescript
interface PodcastEpisode {
  title: string; src: string; artwork?: string; description?: string;
  pubDate?: string; duration?: number; chapters?: PodcastChapter[];
}
interface PodcastChapter { title: string; startTime: number; endTime?: number; artwork?: string; }
interface RSSFeedData { title: string; artwork?: string; description?: string; episodes: PodcastEpisode[]; }
type PodcastPlayerState = 'playing' | 'paused' | 'stopped' | 'loading' | 'error';
```
