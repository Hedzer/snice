<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/video-player.md -->

# Video Player
`<snice-video-player>`

A full-featured video player with custom controls, keyboard shortcuts, picture-in-picture support, fullscreen mode, and playback speed selection.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [CSS Custom Properties](#css-custom-properties)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Keyboard Navigation](#keyboard-navigation)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `src` | `string` | `''` | Video source URL |
| `poster` | `string` | `''` | Poster image URL shown before playback |
| `autoplay` | `boolean` | `false` | Automatically start playback |
| `muted` | `boolean` | `false` | Mute the video |
| `loop` | `boolean` | `false` | Loop playback continuously |
| `controls` | `boolean` | `true` | Show the custom control bar |
| `playbackRate` (attr: `playback-rate`) | `number` | `1` | Playback speed multiplier |
| `currentTime` (attr: `current-time`) | `number` | `0` | Current playback position in seconds |
| `volume` | `number` | `1` | Volume level from 0 (silent) to 1 (full) |
| `variant` | `'default' \| 'minimal' \| 'cinema'` | `'default'` | Visual style variant |
| `duration` | `number` | _(read-only)_ | Video duration in seconds |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `play()` | -- | Start video playback (async) |
| `pause()` | -- | Pause video playback |
| `toggle()` | -- | Toggle between play and pause |
| `seekTo()` | `time: number` | Seek to a specific time in seconds |
| `requestFullscreen()` | -- | Enter fullscreen mode (async) |
| `exitFullscreen()` | -- | Exit fullscreen mode (async) |
| `requestPictureInPicture()` | -- | Toggle picture-in-picture mode (async) |
| `setPlaybackRate()` | `rate: number` | Set the playback speed |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `video-play` | `{ player }` | Playback started |
| `video-pause` | `{ player }` | Playback paused |
| `video-ended` | `{ player }` | Video finished playing |
| `video-time-update` | `{ player, currentTime, duration }` | Periodic position update |
| `video-fullscreen-change` | `{ player, fullscreen }` | Fullscreen mode toggled |
| `video-volume-change` | `{ player, volume, muted }` | Volume or mute state changed |

## Slots

| Name | Description |
|------|-------------|
| (default) | `<source>` elements for providing multiple video formats |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--snice-video-overlay-bg` | Video background color | `rgb(0 0 0)` |
| `--snice-video-overlay-alpha` | Overlay with alpha for center play and paused state | `rgb(0 0 0 / 0.5)` |
| `--snice-video-controls-color` | Controls text and icon color | `rgb(255 255 255)` |
| `--snice-video-controls-hover-bg` | Button hover background | `rgb(255 255 255 / 0.15)` |
| `--snice-video-controls-active-bg` | Button active/pressed background | `rgb(255 255 255 / 0.25)` |
| `--snice-video-progress-track` | Progress bar track background | `rgb(255 255 255 / 0.3)` |
| `--snice-video-progress-buffered` | Buffered progress indicator color | `rgb(255 255 255 / 0.4)` |
| `--snice-video-poster-play-bg` | Poster play button background | `rgb(0 0 0 / 0.6)` |
| `--snice-video-poster-play-hover-bg` | Poster play button hover background | `rgb(0 0 0 / 0.8)` |
| `--snice-video-controls-gradient` | Controls bar gradient overlay | `rgb(0 0 0 / 0.7)` |
| `--snice-video-spinner-track` | Loading spinner track color | `rgb(255 255 255 / 0.3)` |
| `--snice-color-primary` | Progress bar fill color | `rgb(37 99 235)` |
| `--snice-border-radius-lg` | Container border radius | `0.5rem` |
| `--snice-transition-fast` | Control button transitions | `150ms` |
| `--snice-transition-medium` | Controls bar fade transition | `250ms` |
| `--snice-shadow-lg` | Cinema variant box shadow | _(theme default)_ |
| `--snice-focus-ring-width` | Focus ring width for control buttons | _(theme default)_ |
| `--snice-focus-ring-color` | Focus ring color for control buttons | _(theme default)_ |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Outer container element |
| `video` | The native video element |
| `controls` | Control bar container |
| `progress` | Progress track element |

## Basic Usage

```typescript
import 'snice/components/video-player/snice-video-player';
```

```html
<snice-video-player src="video.mp4" poster="poster.jpg"></snice-video-player>
```

## Examples

### Multiple Sources

Provide multiple video formats for broader browser compatibility using slotted `<source>` elements.

```html
<snice-video-player poster="poster.jpg">
  <source src="video.webm" type="video/webm">
  <source src="video.mp4" type="video/mp4">
</snice-video-player>
```

### Cinema Variant

Use the `cinema` variant for a theater-like presentation with larger controls and box shadow.

```html
<snice-video-player src="movie.mp4" poster="movie-poster.jpg" variant="cinema"></snice-video-player>
```

### Minimal Variant

Use the `minimal` variant for a cleaner player with simplified controls.

```html
<snice-video-player src="tutorial.mp4" variant="minimal"></snice-video-player>
```

### Autoplay Muted

Autoplay requires the video to be muted in most browsers.

```html
<snice-video-player src="background-loop.mp4" autoplay muted loop></snice-video-player>
```

### Event Handling

Listen for player events to build custom behavior.

```typescript
player.addEventListener('video-play', () => {
  console.log('Playing');
});

player.addEventListener('video-time-update', (e) => {
  const { currentTime, duration } = e.detail;
  const percent = Math.round((currentTime / duration) * 100);
  console.log(`Playing: ${percent}%`);
});
```

### Programmatic Control

```html
<snice-video-player id="controlled-player" src="video.mp4" controls="false"></snice-video-player>

<button onclick="document.getElementById('controlled-player').play()">Play</button>
<button onclick="document.getElementById('controlled-player').pause()">Pause</button>
<button onclick="document.getElementById('controlled-player').seekTo(0)">Restart</button>
<button onclick="document.getElementById('controlled-player').setPlaybackRate(2)">2x Speed</button>
```

## Keyboard Navigation

| Key | Action |
|-----|--------|
| Space / K | Toggle play/pause |
| F | Toggle fullscreen |
| M | Toggle mute |
| ArrowRight | Seek forward 5 seconds |
| ArrowLeft | Seek backward 5 seconds |
| ArrowUp | Volume up 10% |
| ArrowDown | Volume down 10% |

## Accessibility

- Full keyboard control with Space/K for play/pause, F for fullscreen, M for mute, and arrow keys for seeking and volume
- All control buttons have visible focus rings for keyboard navigation
- Control buttons have appropriate ARIA labels describing their actions
- Current time, duration, and playback state are conveyed to assistive technology
- Transitions respect `prefers-reduced-motion`
