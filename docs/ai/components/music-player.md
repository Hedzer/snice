# snice-music-player

Full-featured audio player with playlist, shuffle, repeat, and volume control.

## Properties

```typescript
tracks: Track[] = [];
currentTrackIndex: number = 0;
currentTrack: string = ''; // reflected attribute
currentTime: number = 0; // read-only, use seek()
duration: number = 0;
volume: number = 1;
muted: boolean = false;
shuffle: boolean = false;
repeat: 'off'|'all'|'one' = 'off';
state: 'playing'|'paused'|'stopped'|'loading'|'error' = 'stopped';
autoplay: boolean = false;
showPlaylist: boolean = true;
showControls: boolean = true;
showVolume: boolean = true;
showArtwork: boolean = true;
showTrackInfo: boolean = true;
compact: boolean = false;
```

## Methods

```typescript
play(): Promise<void>
pause(): void
stop(): void
next(): void
previous(): void
seek(time: number): void
setVolume(volume: number): void
toggleShuffle(): void
setRepeat(mode: 'off'|'all'|'one'): void
loadTrack(index: number): Promise<void>
getCurrentTrack(): Track | null
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

## Events

- `player-play` - Playback started
- `player-pause` - Playback paused
- `player-stop` - Playback stopped
- `player-track-change` - Track changed
- `player-track-ended` - Track ended
- `player-shuffle-change` - Shuffle changed
- `player-repeat-change` - Repeat mode changed
- `player-volume-change` - Volume changed
- `@snice/player-time-update` - Time updated
- `player-error` - Error occurred

## Usage

```javascript
// Set tracks
player.tracks = [
  {
    id: '1',
    title: 'Song Title',
    artist: 'Artist Name',
    album: 'Album Name',
    artwork: 'https://example.com/art.jpg',
    src: 'https://example.com/audio.mp3',
    duration: 180
  }
];

// Controls
await player.play();
player.pause();
player.stop();
player.next();
player.previous();
player.seek(30);

// Volume
player.setVolume(0.5);

// Shuffle & repeat
player.toggleShuffle();
player.setRepeat('all');

// Load track
await player.loadTrack(2);

// Get current
const track = player.getCurrentTrack();

// Get/set via currentTrack attribute
console.log(player.currentTrack); // track ID
player.currentTrack = 'track-2'; // loads track by ID
```

```html
<snice-music-player
  autoplay
  shuffle
  compact
  show-playlist="false">
</snice-music-player>
```

## Features

- HTML5 Audio API
- Playlist support
- Play/pause/stop/next/previous
- Shuffle with randomization
- Repeat modes: off, all, one
- Volume control (vertical slider)
- Progress bar with seek
- Real-time updates
- Track artwork & metadata
- Compact mode
- Event-driven
- Clickable playlist
