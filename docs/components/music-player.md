# Music Player Component

A full-featured audio player with playlist support, shuffle, repeat modes, and volume control.

## Basic Usage

```html
<snice-music-player id="player"></snice-music-player>

<script>
  const player = document.getElementById('player');

  // Set tracks
  player.tracks = [
    {
      id: 'track-1',
      title: 'Song Title',
      artist: 'Artist Name',
      album: 'Album Name',
      artwork: 'https://example.com/artwork.jpg',
      src: 'https://example.com/audio.mp3',
      duration: 180
    }
  ];

  // Listen for events
  player.addEventListener('player-play', (e) => {
    console.log('Playing:', e.detail.track.title);
  });
</script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `tracks` | `Track[]` | `[]` | Array of tracks |
| `currentTrackIndex` | `number` | `0` | Current track index |
| `currentTrack` | `string` | `''` | Current track ID (reflected attribute) |
| `currentTime` | `number` | `0` | Current playback time (read-only, use seek() to set) |
| `duration` | `number` | `0` | Track duration (seconds) |
| `volume` | `number` | `1` | Volume (0-1) |
| `muted` | `boolean` | `false` | Mute state |
| `shuffle` | `boolean` | `false` | Shuffle mode |
| `repeat` | `RepeatMode` | `'off'` | Repeat mode |
| `state` | `PlayerState` | `'stopped'` | Playback state |
| `autoplay` | `boolean` | `false` | Auto-play on load |
| `showPlaylist` | `boolean` | `true` | Show playlist |
| `showControls` | `boolean` | `true` | Show control buttons |
| `showVolume` | `boolean` | `true` | Show volume control |
| `showArtwork` | `boolean` | `true` | Show artwork |
| `showTrackInfo` | `boolean` | `true` | Show track info |
| `compact` | `boolean` | `false` | Compact mode |

## Track Interface

```typescript
interface Track {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  artwork?: string;
  src: string;
  duration?: number;
}
```

## Repeat Modes

- `'off'` - No repeat
- `'all'` - Repeat all tracks
- `'one'` - Repeat current track

## Player States

- `'playing'` - Currently playing
- `'paused'` - Paused
- `'stopped'` - Stopped
- `'loading'` - Loading track
- `'error'` - Error occurred

## Methods

### `play(): Promise<void>`
Start or resume playback.

### `pause(): void`
Pause playback.

### `stop(): void`
Stop playback and reset position.

### `next(): void`
Skip to next track.

### `previous(): void`
Skip to previous track.

### `seek(time: number): void`
Seek to specific time (seconds).

### `setVolume(volume: number): void`
Set volume (0-1).

### `toggleShuffle(): void`
Toggle shuffle mode.

### `setRepeat(mode: RepeatMode): void`
Set repeat mode.

### `loadTrack(index: number): Promise<void>`
Load track by index.

### `getCurrentTrack(): Track | null`
Get current track.

## Events

- `player-play` - Playback started
- `player-pause` - Playback paused
- `player-stop` - Playback stopped
- `player-track-change` - Track changed
- `player-track-ended` - Track ended
- `player-shuffle-change` - Shuffle changed
- `player-repeat-change` - Repeat mode changed
- `player-volume-change` - Volume changed
- `@snice/player-time-update` - Playback time updated
- `player-error` - Error occurred

## Examples

### Full Player with Playlist

```html
<snice-music-player id="player"></snice-music-player>

<script>
  const player = document.getElementById('player');

  player.tracks = [
    {
      id: '1',
      title: 'Summer Breeze',
      artist: 'The Acoustic Collective',
      album: 'Peaceful Moments',
      artwork: 'https://example.com/art1.jpg',
      src: 'https://example.com/track1.mp3',
      duration: 360
    },
    {
      id: '2',
      title: 'Midnight Jazz',
      artist: 'Smooth Notes Ensemble',
      album: 'Late Night Sessions',
      artwork: 'https://example.com/art2.jpg',
      src: 'https://example.com/track2.mp3',
      duration: 420
    }
  ];
</script>
```

### Compact Player (No Playlist)

```html
<snice-music-player
  show-playlist="false"
  compact>
</snice-music-player>
```

### Minimal Player

```html
<snice-music-player
  show-playlist="false"
  show-artwork="false"
  show-track-info="false">
</snice-music-player>
```

### Programmatic Control

```javascript
const player = document.querySelector('snice-music-player');

// Play/Pause
await player.play();
player.pause();
player.stop();

// Navigation
player.next();
player.previous();

// Seek
player.seek(30); // Jump to 30 seconds

// Volume
player.setVolume(0.5); // 50% volume

// Shuffle
player.toggleShuffle();

// Repeat
player.setRepeat('all');
player.setRepeat('one');
player.setRepeat('off');

// Load track
await player.loadTrack(2); // Load third track

// Get current track
const track = player.getCurrentTrack();
console.log(track.title, track.artist);

// Get/set via currentTrack attribute
console.log(player.currentTrack); // Returns track ID
player.currentTrack = 'track-2'; // Loads track with this ID

// Change time via seek (currentTime is read-only)
player.seek(30); // Jump to 30 seconds
```

### Event Handling

```javascript
const player = document.querySelector('snice-music-player');

player.addEventListener('player-play', (e) => {
  console.log('Playing:', e.detail.track);
});

player.addEventListener('player-pause', (e) => {
  console.log('Paused:', e.detail.track);
});

player.addEventListener('player-track-change', (e) => {
  console.log('Track changed:', e.detail.track);
});

player.addEventListener('player-track-ended', (e) => {
  console.log('Track ended:', e.detail.track);
});

player.addEventListener('@snice/player-time-update', (e) => {
  console.log('Time:', e.detail.currentTime, '/', e.detail.duration);
});

player.addEventListener('player-error', (e) => {
  console.error('Error:', e.detail.error);
});
```

### Auto-play

```html
<snice-music-player autoplay></snice-music-player>
```

**Note:** Autoplay may be blocked by browser policies. User interaction is usually required.

### Dynamic Track Loading

```javascript
const player = document.querySelector('snice-music-player');

// Load tracks from API
const response = await fetch('/api/tracks');
const tracks = await response.json();

player.tracks = tracks;
await player.loadTrack(0);
await player.play();
```

### Playlist Click Handler

```javascript
// Tracks in playlist are clickable by default
// Listen for track changes
player.addEventListener('player-track-change', (e) => {
  console.log('User selected:', e.detail.track.title);
});
```

## Features

- Full-featured audio player with HTML5 Audio API
- Playlist support with clickable tracks
- Play, pause, stop, next, previous controls
- Shuffle mode with randomization
- Repeat modes: off, all, one
- Volume control with vertical slider
- Progress bar with seek support
- Real-time progress updates
- Track artwork and metadata display
- Compact mode for smaller layouts
- Fully customizable with show/hide options
- Event-driven architecture
- TypeScript support

## Browser Support

- Modern browsers with HTML5 Audio support
- Requires JavaScript enabled

## Accessibility

- Keyboard navigation support
- ARIA labels on controls
- Semantic HTML structure
- Focus indicators
