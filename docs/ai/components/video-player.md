# snice-video-player

Full-featured video player with custom controls, keyboard shortcuts, PiP, and fullscreen.

## Properties

```typescript
src: string = '';
poster: string = '';
autoplay: boolean = false;
muted: boolean = false;
loop: boolean = false;
controls: boolean = true;
playbackRate: number = 1;       // attr: playback-rate
currentTime: number = 0;        // attr: current-time
volume: number = 1;             // 0-1
variant: 'default'|'minimal'|'cinema' = 'default';
duration: number;               // read-only
```

## Methods

- `play()` - Start playback (async)
- `pause()` - Pause playback
- `toggle()` - Toggle play/pause
- `seekTo(time)` - Seek to time in seconds
- `requestFullscreen()` - Enter fullscreen (async)
- `exitFullscreen()` - Exit fullscreen (async)
- `requestPictureInPicture()` - Toggle picture-in-picture (async)
- `setPlaybackRate(rate)` - Set playback speed

## Events

- `video-play` -> `{ player }`
- `video-pause` -> `{ player }`
- `video-ended` -> `{ player }`
- `video-time-update` -> `{ player, currentTime, duration }`
- `video-fullscreen-change` -> `{ player, fullscreen }`
- `video-volume-change` -> `{ player, volume, muted }`

## Slots

- `(default)` - `<source>` elements for multiple formats

## CSS Custom Properties

- `--snice-video-overlay-bg` - Video background (default: `rgb(0 0 0)`)
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

## CSS Parts

- `base` - Outer container element
- `video` - The `<video>` element
- `controls` - Control bar container
- `progress` - Progress track element
- `base-paused` - Added to `base` while the video is paused
- `base-controls-visible` - Added to `base` while the control bar is visible
- `poster` - Poster overlay shown before playback
- `poster-play` - Play badge inside the poster overlay
- `poster-play-icon` - Added to `icon` on the poster play glyph
- `loading` - Buffering overlay
- `spinner` - Buffering spinner
- `center-play` - Centered play overlay shown while paused
- `center-play-icon` - Added to `icon` on the centered play glyph
- `progress-container` - Hit area wrapping the progress track
- `buffered` - Buffered portion of the progress track
- `played` - Played portion of the progress track
- `controls-row` - Row below the progress track
- `controls-left` - Left control group
- `controls-right` - Right control group
- `button` - Any control-bar button
- `play-button` - Added to `button` on the play/pause control
- `volume-button` - Added to `button` on the mute control
- `rate-button` - Added to `button` on the playback-rate control
- `pip-button` - Added to `button` on the picture-in-picture control
- `fullscreen-button` - Added to `button` on the fullscreen control
- `icon` - Any SVG glyph inside a control
- `play-icon` - Added to `icon` on the play glyph
- `pause-icon` - Added to `icon` on the pause glyph
- `volume-icon` - Added to `icon` on the volume glyph
- `pip-icon` - Added to `icon` on the picture-in-picture glyph
- `fullscreen-icon` - Added to `icon` on the fullscreen glyph
- `volume` - Volume control group
- `input` - Any range input in the control bar
- `volume-slider` - Added to `input` on the volume slider
- `time` - Current time / duration text

## Keyboard Navigation

- Space/K: Toggle play/pause
- F: Toggle fullscreen
- M: Toggle mute
- ArrowRight/ArrowLeft: Seek forward/backward 5s
- ArrowUp/ArrowDown: Volume up/down 10%

## Accessibility

- Controls carry ARIA labels; current time, duration, and playback state are exposed to AT
- Transitions respect `prefers-reduced-motion`

## Basic Usage

```html
<snice-video-player src="video.mp4" poster="poster.jpg"></snice-video-player>

<snice-video-player poster="poster.jpg">
  <source src="video.webm" type="video/webm">
  <source src="video.mp4" type="video/mp4">
</snice-video-player>
```
