# snice-music-player

Full-featured audio player with playlist, shuffle, repeat, and volume control.

## Properties

```ts
tracks: Track[] = [];                              // JS only
currentTrackIndex: number = 0;                     // attr: current-track-index
currentTrack: string = '';                         // attr: current-track, track ID
volume: number = 1;
muted: boolean = false;
shuffle: boolean = false;
repeat: 'off'|'all'|'one' = 'off';
state: 'playing'|'paused'|'stopped'|'loading'|'error' = 'stopped';
autoplay: boolean = false;
showPlaylist: boolean = true;                      // attr: show-playlist
showControls: boolean = true;                      // attr: show-controls
showVolume: boolean = true;                        // attr: show-volume
showArtwork: boolean = true;                       // attr: show-artwork
showTrackInfo: boolean = true;                     // attr: show-track-info
compact: boolean = false;
```

> `currentTime` and `duration` are plain class fields, not `@property`. Use `seek()` to set position.

## Types

```ts
interface Track {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  artwork?: string;
  src: string;
  duration?: number;
}

type RepeatMode = 'off' | 'all' | 'one';
type PlayerState = 'playing' | 'paused' | 'stopped' | 'loading' | 'error';
```

## Methods

- `play()` → Start/resume (async)
- `pause()` → Pause
- `stop()` → Stop and reset position
- `next()` → Next track
- `previous()` → Previous track (restarts if >3s in)
- `seek(time)` → Seek to seconds
- `setVolume(volume)` → Set volume (0-1)
- `toggleShuffle()` → Toggle shuffle
- `setRepeat(mode)` → Set repeat mode
- `loadTrack(index)` → Load track by index (async)
- `getCurrentTrack()` → Current Track or null

## Events

- `player-play` → `{ player, track }`
- `player-pause` → `{ player, track }`
- `player-stop` → `{ player }`
- `player-track-change` → `{ player, track }`
- `player-track-ended` → `{ player, track }`
- `player-shuffle-change` → `{ player, shuffle }`
- `player-repeat-change` → `{ player, repeat }`
- `player-volume-change` → `{ player, volume }`
- `player-seek` → `{ player, time }`
- `player-time-update` → `{ player, currentTime, duration }`
- `player-error` → `{ player, error }`

## CSS Parts

- `base` - Outer player container
- `controls` - Playback controls and progress bar
- `playlist` - Playlist section

## Basic Usage

```typescript
import 'snice/components/music-player/snice-music-player';
```

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
