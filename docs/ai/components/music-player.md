# snice-music-player

Full-featured audio player with playlist, shuffle, repeat, and volume control.

## Properties

```typescript
tracks: Track[] = [];
currentTrackIndex: number = 0;
currentTrack: string = '';            // reflected attribute, track ID
currentTime: number = 0;             // read-only, use seek()
duration: number = 0;
volume: number = 1;
muted: boolean = false;
shuffle: boolean = false;
repeat: 'off'|'all'|'one' = 'off';
state: 'playing'|'paused'|'stopped'|'loading'|'error' = 'stopped';
autoplay: boolean = false;
showPlaylist: boolean = true;         // attr: show-playlist
showControls: boolean = true;         // attr: show-controls
showVolume: boolean = true;           // attr: show-volume
showArtwork: boolean = true;          // attr: show-artwork
showTrackInfo: boolean = true;        // attr: show-track-info
compact: boolean = false;
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

## Methods

- `play()` - Start/resume playback (async)
- `pause()` - Pause playback
- `stop()` - Stop and reset position
- `next()` - Skip to next track
- `previous()` - Skip to previous track
- `seek(time: number)` - Seek to time in seconds
- `setVolume(volume: number)` - Set volume (0-1)
- `toggleShuffle()` - Toggle shuffle mode
- `setRepeat(mode: 'off'|'all'|'one')` - Set repeat mode
- `loadTrack(index: number)` - Load track by index (async)
- `getCurrentTrack()` - Returns current Track or null

## Events

- `player-play` → `{ track }`
- `player-pause` → `{ track }`
- `player-stop` → `{ player }`
- `player-track-change` → `{ track }`
- `player-track-ended` → `{ track }`
- `player-shuffle-change` → `{ shuffle }`
- `player-repeat-change` → `{ repeat }`
- `player-volume-change` → `{ volume }`
- `player-seek` → `{ time }`
- `player-time-update` → `{ currentTime, duration }`
- `player-error` → `{ error }`

## Usage

```html
<snice-music-player id="player" autoplay shuffle compact show-playlist="false"></snice-music-player>
```

```typescript
player.tracks = [
  { id: '1', title: 'Song', artist: 'Artist', src: '/audio/track.mp3', duration: 180 }
];
await player.play();
player.seek(30);
player.setVolume(0.5);
player.setRepeat('all');
```
