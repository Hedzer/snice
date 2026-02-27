# snice-podcast-player

Full-featured podcast player with playback controls, episode list, chapters, RSS feed support, sleep timer, and position memory via localStorage.

## Properties

```ts
src: string                              // Audio source URL
fromRss: string                          // RSS feed URL (attr: from-rss)
title: string                            // Episode title
show: string                             // Show/podcast name
artwork: string                          // Artwork image URL
description: string                      // Episode description
playbackRate: number                     // Speed 0.5-2 (default: 1, attr: playback-rate)
skipForward: number                      // Skip forward seconds (default: 30, attr: skip-forward)
skipBack: number                         // Skip back seconds (default: 15, attr: skip-back)
currentTime: number                      // Current playback position (attr: current-time)
duration: number                         // Episode duration in seconds
volume: number                           // Volume 0-1 (default: 1)
muted: boolean                           // Muted state
state: PodcastPlayerState                // 'playing'|'paused'|'stopped'|'loading'|'error'
episodes: PodcastEpisode[]               // Episode list
currentEpisodeIndex: number              // Active episode index (attr: current-episode-index)
sleepTimer: number                       // Sleep timer minutes (attr: sleep-timer)
```

### Types

```ts
interface PodcastEpisode {
  title: string;
  src: string;
  artwork?: string;
  description?: string;
  pubDate?: string;
  duration?: number;
  chapters?: PodcastChapter[];
}

interface PodcastChapter {
  title: string;
  startTime: number;
  endTime?: number;
  artwork?: string;
}
```

## Methods

- `play()` -- Start playback (async)
- `pause()` -- Pause playback
- `toggle()` -- Toggle play/pause
- `seekTo(time: number)` -- Seek to time in seconds
- `setPlaybackRate(rate: number)` -- Set speed (0.5-2)
- `loadEpisode(index: number)` -- Load and switch to episode by index

## Events

- `podcast-play` -> `{ player, episode }` -- Playback started
- `podcast-pause` -> `{ player, episode }` -- Playback paused
- `podcast-ended` -> `{ player, episode }` -- Episode ended
- `podcast-time-update` -> `{ player, currentTime, duration }` -- Time update
- `podcast-rate-change` -> `{ player, rate }` -- Playback rate changed
- `podcast-episode-change` -> `{ player, episode, index }` -- Episode switched
- `podcast-feed-loaded` -> `{ player, feed: RSSFeedData }` -- RSS feed parsed

**CSS Parts:**
- `base` - Outer player container div
- `info` - Artwork and metadata section
- `controls` - Playback controls and progress bar section

## Usage

```html
<!-- Direct source -->
<snice-podcast-player
  src="/audio/episode.mp3"
  title="Episode 1"
  show="My Podcast"
  artwork="/images/cover.jpg"
></snice-podcast-player>

<!-- From RSS feed -->
<snice-podcast-player from-rss="https://example.com/feed.xml"></snice-podcast-player>
```

```js
const player = document.querySelector('snice-podcast-player');
player.episodes = [
  { title: 'Ep 1', src: '/audio/ep1.mp3', duration: 1800 },
  { title: 'Ep 2', src: '/audio/ep2.mp3', duration: 2400,
    chapters: [
      { title: 'Intro', startTime: 0 },
      { title: 'Main Topic', startTime: 120 }
    ]
  }
];
player.loadEpisode(0);
```
