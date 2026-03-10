<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/podcast-player.md -->

# Podcast Player
`<snice-podcast-player>`

A full-featured podcast player with playback controls, playback speed adjustment, episode list, chapter support, RSS feed parsing, sleep timer, and position memory via localStorage.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)
- [Data Types](#data-types)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `src` | `string` | `''` | Audio source URL for direct playback |
| `fromRss` (attr: `from-rss`) | `string` | `''` | RSS feed URL. Fetches and displays episode list automatically |
| `title` | `string` | `''` | Episode title |
| `show` | `string` | `''` | Show or podcast name |
| `artwork` | `string` | `''` | Artwork image URL |
| `description` | `string` | `''` | Episode description |
| `playbackRate` (attr: `playback-rate`) | `number` | `1` | Playback speed (range: 0.5 to 2) |
| `skipForward` (attr: `skip-forward`) | `number` | `30` | Skip forward duration in seconds |
| `skipBack` (attr: `skip-back`) | `number` | `15` | Skip back duration in seconds |
| `currentTime` (attr: `current-time`) | `number` | `0` | Current playback position in seconds |
| `duration` | `number` | `0` | Episode duration in seconds |
| `volume` | `number` | `1` | Volume level (range: 0 to 1) |
| `muted` | `boolean` | `false` | Whether audio is muted |
| `state` | `PodcastPlayerState` | `'stopped'` | Current playback state (not a decorated property) |
| `episodes` | `PodcastEpisode[]` | `[]` | Array of episodes (set via JS) |
| `currentEpisodeIndex` (attr: `current-episode-index`) | `number` | `-1` | Index of the currently active episode |
| `sleepTimer` (attr: `sleep-timer`) | `number` | `0` | Sleep timer duration in minutes (0 = disabled) |

## Methods

| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `play()` | -- | `Promise<void>` | Start playback |
| `pause()` | -- | `void` | Pause playback |
| `toggle()` | -- | `void` | Toggle between play and pause |
| `seekTo()` | `time: number` | `void` | Seek to a specific time in seconds |
| `setPlaybackRate()` | `rate: number` | `void` | Set playback speed (0.5 to 2) |
| `loadEpisode()` | `index: number` | `void` | Load and switch to an episode by its index |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `podcast-play` | `{ player, episode }` | Fired when playback starts |
| `podcast-pause` | `{ player, episode }` | Fired when playback is paused |
| `podcast-ended` | `{ player, episode }` | Fired when the current episode ends |
| `podcast-time-update` | `{ player, currentTime, duration }` | Fired periodically during playback |
| `podcast-rate-change` | `{ player, rate }` | Fired when the playback speed changes |
| `podcast-episode-change` | `{ player, episode, index }` | Fired when a different episode is selected |
| `podcast-feed-loaded` | `{ player, feed: RSSFeedData }` | Fired when an RSS feed has been parsed |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | Outer player container |
| `info` | `<div>` | Artwork and episode metadata section |
| `controls` | `<div>` | Playback controls, skip buttons, and progress bar |

```css
snice-podcast-player::part(base) {
  border-radius: 12px;
  background: #1a1a2e;
  color: white;
}
```

## Basic Usage

```typescript
import 'snice/components/podcast-player/snice-podcast-player';
```

```html
<snice-podcast-player
  src="/audio/episode.mp3"
  title="Episode 1"
  show="My Podcast"
  artwork="/images/cover.jpg"
></snice-podcast-player>
```

## Examples

### RSS Feed Mode

Load an entire podcast from an RSS feed.

```html
<snice-podcast-player from-rss="https://example.com/podcast/feed.xml"></snice-podcast-player>
```

```typescript
player.addEventListener('podcast-feed-loaded', (e) => {
  console.log('Podcast:', e.detail.feed.title);
  console.log('Episodes:', e.detail.feed.episodes.length);
});
```

### Episode List with Chapters

Provide episodes with chapter markers for enhanced navigation.

```typescript
player.show = 'Tech Weekly';
player.episodes = [
  {
    title: 'Episode 1: Getting Started',
    src: '/audio/ep1.mp3',
    duration: 1800,
    chapters: [
      { title: 'Intro', startTime: 0 },
      { title: 'Main Topic', startTime: 120 },
      { title: 'Q&A', startTime: 1200 }
    ]
  },
  { title: 'Episode 2: Advanced Patterns', src: '/audio/ep2.mp3', duration: 2400 }
];
player.loadEpisode(0);
```

### Custom Skip and Speed

Customize skip intervals and initial playback speed.

```html
<snice-podcast-player
  src="/audio/interview.mp3"
  title="Interview"
  skip-forward="15"
  skip-back="10"
  playback-rate="1.5"
></snice-podcast-player>
```

### Event Handling

Listen for playback events to integrate with analytics or custom UI.

```typescript
player.addEventListener('podcast-play', () => console.log('Playing'));
player.addEventListener('podcast-pause', () => console.log('Paused'));
player.addEventListener('podcast-ended', () => console.log('Finished'));

player.addEventListener('podcast-time-update', (e) => {
  const percent = Math.round((e.detail.currentTime / e.detail.duration) * 100);
  console.log(`Progress: ${percent}%`);
});

player.addEventListener('podcast-episode-change', (e) => {
  console.log(`Now playing: ${e.detail.episode.title}`);
});
```

## Accessibility

- Playback controls (play/pause, skip forward/back) are keyboard accessible
- Progress bar supports seeking via click
- Playback speed selector cycles through common speeds (0.5x through 2x)
- Volume control provides mute toggle and level adjustment
- Episode list items are interactive and indicate the currently playing episode
- The player remembers playback position via localStorage, restoring it on reload
- Chapter markers provide named navigation points within an episode

## Data Types

```typescript
interface PodcastEpisode {
  title: string;                   // Episode title
  src: string;                     // Audio source URL
  artwork?: string;                // Episode-specific artwork URL
  description?: string;            // Episode description
  pubDate?: string;                // Publication date string
  duration?: number;               // Duration in seconds
  chapters?: PodcastChapter[];     // Chapter markers
}

interface PodcastChapter {
  title: string;                   // Chapter title
  startTime: number;               // Start time in seconds
  endTime?: number;                // End time in seconds
  artwork?: string;                // Chapter-specific artwork URL
}

interface RSSFeedData {
  title: string;
  artwork?: string;
  description?: string;
  episodes: PodcastEpisode[];
}

type PodcastPlayerState = 'playing' | 'paused' | 'stopped' | 'loading' | 'error';
```
