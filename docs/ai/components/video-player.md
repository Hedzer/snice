# snice-video-player

Full-featured video player with custom controls, keyboard shortcuts, PiP, and fullscreen.

## Properties

```ts
src: string = ''
poster: string = ''
autoplay: boolean = false
muted: boolean = false
loop: boolean = false
controls: boolean = true
playbackRate: number = 1       // attribute: playback-rate
currentTime: number = 0        // attribute: current-time
volume: number = 1             // 0-1
variant: 'default' | 'minimal' | 'cinema' = 'default'
readonly duration: number      // read-only, set from video metadata
```

## Methods

- `play()` - Start playback (async)
- `pause()` - Pause playback
- `toggle()` - Toggle play/pause
- `seekTo(time: number)` - Seek to time in seconds
- `requestFullscreen()` - Enter fullscreen (async)
- `exitFullscreen()` - Exit fullscreen (async)
- `requestPictureInPicture()` - Toggle picture-in-picture (async)
- `setPlaybackRate(rate: number)` - Set playback speed

## Slots

- `default` - `<source>` elements for multiple formats

## Events

- `video-play` -> `{ player: SniceVideoPlayerElement }`
- `video-pause` -> `{ player: SniceVideoPlayerElement }`
- `video-ended` -> `{ player: SniceVideoPlayerElement }`
- `video-time-update` -> `{ player: SniceVideoPlayerElement; currentTime: number; duration: number }`
- `video-fullscreen-change` -> `{ player: SniceVideoPlayerElement; fullscreen: boolean }`
- `video-volume-change` -> `{ player: SniceVideoPlayerElement; volume: number; muted: boolean }`

## Keyboard Shortcuts

- Space/K: Toggle play/pause
- F: Toggle fullscreen
- M: Toggle mute
- ArrowRight/ArrowLeft: Seek forward/backward 5s
- ArrowUp/ArrowDown: Volume up/down 10%

## Variants

- `default` - Full controls, progress bar, PiP, rate selector
- `minimal` - Simplified controls, no rate/PiP buttons
- `cinema` - Larger controls, no border radius, box shadow

## CSS Custom Properties

- `--snice-video-overlay-bg` - Video background color (default: `rgb(0 0 0)`)
- `--snice-video-overlay-alpha` - Overlay with alpha (default: `rgb(0 0 0 / 0.5)`)
- `--snice-video-controls-color` - Controls text/icon color (default: `rgb(255 255 255)`)
- `--snice-video-controls-hover-bg` - Button hover background (default: `rgb(255 255 255 / 0.15)`)
- `--snice-video-controls-active-bg` - Button active background (default: `rgb(255 255 255 / 0.25)`)
- `--snice-video-progress-track` - Progress track background (default: `rgb(255 255 255 / 0.3)`)
- `--snice-video-progress-buffered` - Buffered progress color (default: `rgb(255 255 255 / 0.4)`)
- `--snice-video-poster-play-bg` - Poster play button background (default: `rgb(0 0 0 / 0.6)`)
- `--snice-video-poster-play-hover-bg` - Poster play button hover (default: `rgb(0 0 0 / 0.8)`)
- `--snice-video-controls-gradient` - Controls gradient overlay (default: `rgb(0 0 0 / 0.7)`)
- `--snice-video-spinner-track` - Loading spinner track (default: `rgb(255 255 255 / 0.3)`)
- `--snice-color-primary` - Progress bar fill (default: `rgb(37 99 235)`)
- `--snice-border-radius-lg` - Container border radius (default: `0.5rem`)
- `--snice-transition-fast` - Control transitions (default: `150ms`)
- `--snice-transition-medium` - Controls fade (default: `250ms`)
- `--snice-shadow-lg` - Cinema variant shadow
- `--snice-focus-ring-width` - Button focus ring width
- `--snice-focus-ring-color` - Button focus ring color

**CSS Parts:**
- `base` - Outer container element
- `video` - The `<video>` element
- `controls` - Control bar container
- `progress` - Progress track element

## Usage

```html
<snice-video-player
  src="video.mp4"
  poster="poster.jpg"
  controls
></snice-video-player>

<!-- Multiple sources -->
<snice-video-player poster="poster.jpg">
  <source src="video.webm" type="video/webm">
  <source src="video.mp4" type="video/mp4">
</snice-video-player>
```

```typescript
player.addEventListener('video-ended', () => {
  console.log('Video finished');
});
player.play();
```
