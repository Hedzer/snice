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
- `info` - Artwork and track information row
- `artwork` - Artwork frame
- `artwork-image` - Artwork `<img>`
- `artwork-placeholder` - Placeholder shown when a track has no artwork
- `track-info` - Track text block
- `track-title` - Track title
- `track-title-link` - Added to `track-title` when the title is a link
- `track-artist` - Track artist
- `track-artist-link` - Added to `track-artist` when the artist is a link
- `track-album` - Track album
- `controls` - Playback controls and progress bar
- `control-buttons` - Transport button row
- `button` - Shared token on every control button
- `shuffle-button` - Shuffle toggle
- `prev-button` - Previous track button
- `play-button` - Play/pause button
- `next-button` - Next track button
- `repeat-button` - Repeat toggle
- `volume-button` - Volume button
- `icon` - Shared token on every transport/volume `<svg>` icon
- `shuffle-icon` - Shuffle button icon
- `prev-icon` - Previous track button icon
- `play-icon` - Play/pause button icon
- `next-icon` - Next track button icon
- `repeat-icon` - Repeat button icon
- `volume-icon` - Volume button icon
- `progress` - Progress row (times, scrubber, volume)
- `time` - Shared token on both time labels
- `current-time` - Elapsed time label
- `duration-time` - Duration label
- `progress-track` - Seek track
- `progress-fill` - Played portion of the seek track
- `volume` - Volume control group
- `volume-panel` - Volume slider popout
- `volume-slider` - Volume `<input type="range">`
- `playlist` - Playlist section
- `playlist-header` - Playlist heading
- `playlist-items` - Playlist list container
- `playlist-item` - One playlist row
- `playlist-item-number` - Row index
- `playlist-item-artwork` - Row artwork `<img>`
- `playlist-item-info` - Row text block
- `playlist-item-title` - Row title
- `playlist-item-artist` - Row artist
- `playlist-item-duration` - Row duration

State tokens:

- `base-compact` - Added to `base` in compact mode
- `button-active` - Added to `button` on the shuffle/repeat toggles while engaged
- `button-playing` - Added to `button` on the play button while playing
- `playlist-item-active` - Added to `playlist-item` on the current track

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
