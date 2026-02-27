[//]: # (AI: For a low-token version of this doc, use docs/ai/components/music-player.md instead)

# Music Player
`<snice-music-player>`

A full-featured audio player with playlist support, shuffle, repeat modes, and volume control.

## Basic Usage

```typescript
import 'snice/components/music-player/snice-music-player';
```

```html
<snice-music-player id="player"></snice-music-player>

<script type="module">
  document.getElementById('player').tracks = [
    { id: '1', title: 'Summer Breeze', artist: 'The Collective', src: '/audio/track1.mp3' }
  ];
</script>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/music-player/snice-music-player';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-music-player.min.js"></script>
```

## Examples

### Full Player with Playlist

```html
<snice-music-player id="player"></snice-music-player>

<script type="module">
  document.getElementById('player').tracks = [
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
</script>
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
const player = document.querySelector('snice-music-player');
player.toggleShuffle();
player.setRepeat('all');  // 'off' | 'all' | 'one'
```

### Programmatic Control

```typescript
const player = document.querySelector('snice-music-player');

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
const player = document.querySelector('snice-music-player');

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

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `tracks` | `Track[]` | `[]` | Array of track objects |
| `currentTrackIndex` | `number` | `0` | Index of the current track |
| `currentTrack` | `string` | `''` | Current track ID (reflected attribute) |
| `currentTime` | `number` | `0` | Playback position in seconds (read-only) |
| `duration` | `number` | `0` | Track duration in seconds |
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

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `player-play` | `{ track: Track }` | Playback started |
| `player-pause` | `{ track: Track }` | Playback paused |
| `player-stop` | `{ player: SniceMusicPlayerElement }` | Playback stopped |
| `player-track-change` | `{ track: Track }` | Track changed |
| `player-track-ended` | `{ track: Track }` | Track finished playing |
| `player-shuffle-change` | `{ shuffle: boolean }` | Shuffle mode toggled |
| `player-repeat-change` | `{ repeat: string }` | Repeat mode changed |
| `player-volume-change` | `{ volume: number }` | Volume level changed |
| `player-seek` | `{ time: number }` | Seeked to a new position |
| `player-time-update` | `{ currentTime: number, duration: number }` | Playback time updated |
| `player-error` | `{ error: any }` | An error occurred |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `play()` | -- | Start or resume playback (async) |
| `pause()` | -- | Pause playback |
| `stop()` | -- | Stop playback and reset position |
| `next()` | -- | Skip to next track |
| `previous()` | -- | Skip to previous track |
| `seek()` | `time: number` | Seek to time in seconds |
| `setVolume()` | `volume: number` | Set volume (0-1) |
| `toggleShuffle()` | -- | Toggle shuffle mode |
| `setRepeat()` | `mode: 'off' \| 'all' \| 'one'` | Set repeat mode |
| `loadTrack()` | `index: number` | Load track by index (async) |
| `getCurrentTrack()` | -- | Returns the current Track or null |
