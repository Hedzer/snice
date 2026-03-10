<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/music-player.md -->

# Music Player
`<snice-music-player>`

A full-featured audio player with playlist support, shuffle, repeat modes, and volume control.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `tracks` | `Track[]` | `[]` | Array of track objects (set via JavaScript) |
| `currentTrackIndex` (attr: `current-track-index`) | `number` | `0` | Index of the current track |
| `currentTrack` (attr: `current-track`) | `string` | `''` | Current track ID |
| `volume` | `number` | `1` | Volume level (0-1) |
| `muted` | `boolean` | `false` | Whether audio is muted |
| `shuffle` | `boolean` | `false` | Shuffle mode enabled |
| `repeat` | `'off' \| 'all' \| 'one'` | `'off'` | Repeat mode |
| `state` | `'playing' \| 'paused' \| 'stopped' \| 'loading' \| 'error'` | `'stopped'` | Playback state |
| `autoplay` | `boolean` | `false` | Auto-play on load |
| `showPlaylist` (attr: `show-playlist`) | `boolean` | `true` | Show playlist section |
| `showControls` (attr: `show-controls`) | `boolean` | `true` | Show control buttons |
| `showVolume` (attr: `show-volume`) | `boolean` | `true` | Show volume control |
| `showArtwork` (attr: `show-artwork`) | `boolean` | `true` | Show track artwork |
| `showTrackInfo` (attr: `show-track-info`) | `boolean` | `true` | Show track metadata |
| `compact` | `boolean` | `false` | Compact layout mode |

> **Note:** `currentTime` and `duration` are plain class fields (not `@property`). They are updated internally during playback. Use `seek()` to set playback position.

### Track Interface

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

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `play()` | -- | Start or resume playback (async) |
| `pause()` | -- | Pause playback |
| `stop()` | -- | Stop playback and reset position |
| `next()` | -- | Skip to next track |
| `previous()` | -- | Skip to previous track (restarts if >3s in) |
| `seek()` | `time: number` | Seek to time in seconds |
| `setVolume()` | `volume: number` | Set volume (0-1) |
| `toggleShuffle()` | -- | Toggle shuffle mode |
| `setRepeat()` | `mode: 'off' \| 'all' \| 'one'` | Set repeat mode |
| `loadTrack()` | `index: number` | Load track by index (async) |
| `getCurrentTrack()` | -- | Returns the current Track or null |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `player-play` | `{ player, track: Track }` | Playback started |
| `player-pause` | `{ player, track: Track }` | Playback paused |
| `player-stop` | `{ player }` | Playback stopped |
| `player-track-change` | `{ player, track: Track }` | Track changed |
| `player-track-ended` | `{ player, track: Track }` | Track finished playing |
| `player-shuffle-change` | `{ player, shuffle: boolean }` | Shuffle mode toggled |
| `player-repeat-change` | `{ player, repeat: RepeatMode }` | Repeat mode changed |
| `player-volume-change` | `{ player, volume: number }` | Volume level changed |
| `player-seek` | `{ player, time: number }` | Seeked to a new position |
| `player-time-update` | `{ player, currentTime: number, duration: number }` | Playback time updated |
| `player-error` | `{ player, error: Error }` | An error occurred |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | Outer player container |
| `controls` | `<div>` | Playback controls, progress bar, and volume section |
| `playlist` | `<div>` | Playlist section with track listing |

```css
snice-music-player::part(base) {
  border-radius: 12px;
  background: #0f172a;
  color: white;
}

snice-music-player::part(playlist) {
  max-height: 300px;
  overflow-y: auto;
}
```

## Basic Usage

```typescript
import 'snice/components/music-player/snice-music-player';
```

```html
<snice-music-player id="player"></snice-music-player>
```

```typescript
const player = document.getElementById('player');
player.tracks = [
  { id: '1', title: 'Summer Breeze', artist: 'The Collective', src: '/audio/track1.mp3' }
];
```

## Examples

### Full Player with Playlist

```typescript
player.tracks = [
  {
    id: '1',
    title: 'Summer Breeze',
    artist: 'The Acoustic Collective',
    album: 'Peaceful Moments',
    artwork: '/images/album1.jpg',
    src: '/audio/track1.mp3',
    duration: 360
  },
  {
    id: '2',
    title: 'Midnight Jazz',
    artist: 'Smooth Notes Ensemble',
    album: 'Late Night Sessions',
    artwork: '/images/album2.jpg',
    src: '/audio/track2.mp3',
    duration: 420
  }
];
```

### Compact Player

Set the `compact` attribute and hide the playlist for a minimal layout.

```html
<snice-music-player compact show-playlist="false"></snice-music-player>
```

### Minimal Player

Hide individual sections using the `show-*` attributes.

```html
<snice-music-player
  show-playlist="false"
  show-artwork="false"
  show-track-info="false">
</snice-music-player>
```

### Autoplay

Set the `autoplay` attribute to start playback automatically (browser policies may block this).

```html
<snice-music-player autoplay></snice-music-player>
```

### Shuffle and Repeat

```html
<snice-music-player shuffle></snice-music-player>
```

```typescript
player.toggleShuffle();
player.setRepeat('all');  // 'off' | 'all' | 'one'
```

### Programmatic Control

```typescript
await player.play();
player.pause();
player.stop();
player.next();
player.previous();
player.seek(30);           // Jump to 30 seconds
player.setVolume(0.5);     // 50% volume
await player.loadTrack(2); // Load third track

const track = player.getCurrentTrack();
console.log(track.title);
```

### Event Handling

```typescript
player.addEventListener('player-play', (e) => {
  console.log('Playing:', e.detail.track.title);
});

player.addEventListener('player-track-change', (e) => {
  console.log('Track changed:', e.detail.track.title);
});

player.addEventListener('player-error', (e) => {
  console.error('Error:', e.detail.error);
});
```
