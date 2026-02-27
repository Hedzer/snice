[//]: # (AI: For a low-token version of this doc, use docs/ai/components/podcast-player.md instead)

# Podcast Player Component

`<snice-podcast-player>`

A full-featured podcast player with playback controls, playback speed adjustment, episode list, chapter support, RSS feed parsing, sleep timer, and position memory via localStorage.

## Table of Contents
- [Basic Usage](#basic-usage)
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Types](#types)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Basic Usage

```typescript
import 'snice/components/podcast-player/snice-podcast-player';
```

```html
<snice-podcast-player
  src="/audio/episode.mp3"
  title="Episode 1"
  show="My Podcast"
></snice-podcast-player>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/podcast-player/snice-podcast-player';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-podcast-player.min.js"></script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `src` | `string` | `''` | Audio source URL for direct playback |
| `fromRss` (attr: `from-rss`) | `string` | `''` | RSS feed URL. Fetches and displays the episode list automatically |
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
| `state` | `PodcastPlayerState` | `'stopped'` | Current playback state (read-only) |
| `episodes` | `PodcastEpisode[]` | `[]` | Array of episodes (set via JavaScript) |
| `currentEpisodeIndex` (attr: `current-episode-index`) | `number` | `0` | Index of the currently active episode |
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
| `podcast-time-update` | `{ player, currentTime, duration }` | Fired periodically during playback with current time |
| `podcast-rate-change` | `{ player, rate }` | Fired when the playback speed changes |
| `podcast-episode-change` | `{ player, episode, index }` | Fired when a different episode is selected |
| `podcast-feed-loaded` | `{ player, feed: RSSFeedData }` | Fired when an RSS feed has been parsed successfully |

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

snice-podcast-player::part(controls) {
  padding: 1rem;
}
```

## Types

### PodcastEpisode

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
```

### PodcastChapter

```typescript
interface PodcastChapter {
  title: string;          // Chapter title
  startTime: number;      // Start time in seconds
  endTime?: number;       // End time in seconds
  artwork?: string;       // Chapter-specific artwork URL
}
```

### RSSFeedData

```typescript
interface RSSFeedData {
  title: string;                   // Podcast title from feed
  artwork?: string;                // Show artwork URL from feed
  description?: string;            // Show description from feed
  episodes: PodcastEpisode[];      // Parsed episode list
}
```

### PodcastPlayerState

```typescript
type PodcastPlayerState = 'playing' | 'paused' | 'stopped' | 'loading' | 'error';
```

## Examples

### Single Episode Playback

Play a single episode by setting the source URL directly.

```html
<snice-podcast-player
  src="/audio/episode-42.mp3"
  title="Episode 42: Web Components"
  show="The Dev Podcast"
  artwork="/images/dev-podcast-cover.jpg"
  description="A deep dive into modern web component patterns."
></snice-podcast-player>
```

### RSS Feed Mode

Load an entire podcast from an RSS feed. The player automatically parses the feed to populate the show name, artwork, and episode list.

```html
<snice-podcast-player
  from-rss="https://example.com/podcast/feed.xml"
></snice-podcast-player>

<script type="module">
  import 'snice/components/podcast-player/snice-podcast-player';

  const player = document.querySelector('snice-podcast-player');

  player.addEventListener('podcast-feed-loaded', (e) => {
    console.log('Podcast:', e.detail.feed.title);
    console.log('Episodes:', e.detail.feed.episodes.length);
  });
</script>
```

### Episode List with Chapters

Provide an array of episodes with chapter markers for enhanced navigation.

```html
<snice-podcast-player id="player"></snice-podcast-player>

<script type="module">
  import 'snice/components/podcast-player/snice-podcast-player';

  const player = document.getElementById('player');
  player.show = 'Tech Weekly';
  player.artwork = '/images/tech-weekly.jpg';

  player.episodes = [
    {
      title: 'Episode 1: Getting Started',
      src: '/audio/ep1.mp3',
      duration: 1800,
      pubDate: '2025-01-15',
      chapters: [
        { title: 'Intro', startTime: 0 },
        { title: 'Main Topic', startTime: 120 },
        { title: 'Q&A', startTime: 1200 },
        { title: 'Outro', startTime: 1700 }
      ]
    },
    {
      title: 'Episode 2: Advanced Patterns',
      src: '/audio/ep2.mp3',
      duration: 2400,
      pubDate: '2025-01-22'
    },
    {
      title: 'Episode 3: Performance Tips',
      src: '/audio/ep3.mp3',
      duration: 2100,
      pubDate: '2025-01-29'
    }
  ];

  player.loadEpisode(0);
</script>
```

### Playback Speed and Skip Duration

Customize skip intervals and playback speed for different listening preferences.

```html
<snice-podcast-player
  src="/audio/interview.mp3"
  title="Interview with the Author"
  show="Book Club Podcast"
  skip-forward="15"
  skip-back="10"
  playback-rate="1.5"
></snice-podcast-player>
```

### Event Handling

Listen for playback events to integrate with analytics or custom UI.

```html
<snice-podcast-player id="player" src="/audio/episode.mp3" title="Episode 1"></snice-podcast-player>
<div id="status">Stopped</div>

<script type="module">
  import 'snice/components/podcast-player/snice-podcast-player';

  const player = document.getElementById('player');
  const status = document.getElementById('status');

  player.addEventListener('podcast-play', () => {
    status.textContent = 'Playing';
  });

  player.addEventListener('podcast-pause', () => {
    status.textContent = 'Paused';
  });

  player.addEventListener('podcast-time-update', (e) => {
    const { currentTime, duration } = e.detail;
    const percent = Math.round((currentTime / duration) * 100);
    status.textContent = `Playing: ${percent}%`;
  });

  player.addEventListener('podcast-ended', () => {
    status.textContent = 'Finished';
  });

  player.addEventListener('podcast-episode-change', (e) => {
    status.textContent = `Now playing: ${e.detail.episode.title}`;
  });
</script>
```

## Accessibility

- Playback controls (play/pause, skip forward/back) are keyboard accessible
- The progress bar supports seeking via click or drag
- Playback speed selector allows choosing from common speed options (0.5x through 2x)
- Volume control provides mute toggle and level adjustment
- Episode list items are interactive and indicate the currently playing episode
- The player remembers playback position via localStorage, restoring it on reload
- Chapter markers provide named navigation points within an episode
