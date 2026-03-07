<!-- AI: For a low-token version of this doc, use docs/ai/components/video-player.md instead -->

# Video Player Component

The video player component provides a full-featured video player with custom controls, keyboard shortcuts, picture-in-picture support, fullscreen mode, playback speed selection, and multiple visual variants. It wraps the native HTML video element with a polished, consistent UI.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Slots](#slots)
- [CSS Custom Properties](#css-custom-properties)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Accessibility](#accessibility)
- [Browser Support](#browser-support)

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
| `duration` | `number` | _(read-only)_ | Video duration in seconds, set from video metadata |

### Variants

| Variant | Description |
|---------|-------------|
| `default` | Full controls with progress bar, playback speed selector, and PiP button |
| `minimal` | Simplified controls without rate or PiP buttons |
| `cinema` | Larger controls, no border radius, with box shadow for a theater-like appearance |

## Methods

#### `play(): Promise<void>`
Start video playback.

```typescript
await player.play();
```

#### `pause(): void`
Pause video playback.

```typescript
player.pause();
```

#### `toggle(): void`
Toggle between play and pause.

```typescript
player.toggle();
```

#### `seekTo(time: number): void`
Seek to a specific time in seconds.

```typescript
player.seekTo(30); // Jump to 30 seconds
```

#### `requestFullscreen(): Promise<void>`
Enter fullscreen mode.

```typescript
await player.requestFullscreen();
```

#### `exitFullscreen(): Promise<void>`
Exit fullscreen mode.

```typescript
await player.exitFullscreen();
```

#### `requestPictureInPicture(): Promise<void>`
Toggle picture-in-picture mode.

```typescript
await player.requestPictureInPicture();
```

#### `setPlaybackRate(rate: number): void`
Set the playback speed.

```typescript
player.setPlaybackRate(1.5); // 1.5x speed
```

## Events

### `video-play`
Fired when playback starts.

**Event Detail:**
```typescript
{
  player: SniceVideoPlayerElement;
}
```

### `video-pause`
Fired when playback is paused.

**Event Detail:**
```typescript
{
  player: SniceVideoPlayerElement;
}
```

### `video-ended`
Fired when the video finishes playing.

**Event Detail:**
```typescript
{
  player: SniceVideoPlayerElement;
}
```

### `video-time-update`
Fired periodically during playback with current position.

**Event Detail:**
```typescript
{
  player: SniceVideoPlayerElement;
  currentTime: number;
  duration: number;
}
```

### `video-fullscreen-change`
Fired when fullscreen mode is toggled.

**Event Detail:**
```typescript
{
  player: SniceVideoPlayerElement;
  fullscreen: boolean;
}
```

### `video-volume-change`
Fired when volume or mute state changes.

**Event Detail:**
```typescript
{
  player: SniceVideoPlayerElement;
  volume: number;
  muted: boolean;
}
```

## Slots

| Slot Name | Description |
|-----------|-------------|
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

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | Outer container element |
| `video` | `<video>` | The native video element |
| `controls` | `<div>` | Control bar container |
| `progress` | `<div>` | Progress track element |

```css
snice-video-player::part(base) {
  border-radius: 1rem;
}

snice-video-player::part(controls) {
  background: rgba(0, 0, 0, 0.8);
}

snice-video-player::part(progress) {
  height: 6px;
}
```

## Basic Usage

```html
<snice-video-player src="video.mp4" poster="poster.jpg"></snice-video-player>
```

```typescript
import 'snice/components/video-player/snice-video-player';
```

## Examples

### Basic Video Player

Play a single video file with a poster image.

```html
<snice-video-player
  src="https://example.com/video.mp4"
  poster="https://example.com/poster.jpg"
></snice-video-player>
```

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
<snice-video-player
  src="movie.mp4"
  poster="movie-poster.jpg"
  variant="cinema"
></snice-video-player>
```

### Minimal Variant

Use the `minimal` variant for a cleaner player with simplified controls.

```html
<snice-video-player
  src="tutorial.mp4"
  variant="minimal"
></snice-video-player>
```

### Autoplay Muted

Autoplay requires the video to be muted in most browsers.

```html
<snice-video-player
  src="background-loop.mp4"
  autoplay
  muted
  loop
></snice-video-player>
```

### Event Handling

Listen for player events to build custom behavior.

```html
<snice-video-player id="my-player" src="video.mp4"></snice-video-player>
<p id="status">Ready</p>

<script type="module">
  import type { SniceVideoPlayerElement } from 'snice/components/video-player/snice-video-player.types';

  const player = document.getElementById('my-player') as SniceVideoPlayerElement;
  const status = document.getElementById('status');

  player.addEventListener('video-play', () => {
    status.textContent = 'Playing';
  });

  player.addEventListener('video-pause', () => {
    status.textContent = 'Paused';
  });

  player.addEventListener('video-ended', () => {
    status.textContent = 'Finished';
  });

  player.addEventListener('video-time-update', (e) => {
    const { currentTime, duration } = e.detail;
    const percent = Math.round((currentTime / duration) * 100);
    status.textContent = `Playing: ${percent}%`;
  });
</script>
```

### Programmatic Control

Control the player using JavaScript methods.

```html
<snice-video-player id="controlled-player" src="video.mp4" controls="false"></snice-video-player>

<button onclick="document.getElementById('controlled-player').play()">Play</button>
<button onclick="document.getElementById('controlled-player').pause()">Pause</button>
<button onclick="document.getElementById('controlled-player').seekTo(0)">Restart</button>
<button onclick="document.getElementById('controlled-player').setPlaybackRate(2)">2x Speed</button>
```

## Keyboard Shortcuts

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

- **Keyboard support**: Full keyboard control with Space/K for play/pause, F for fullscreen, M for mute, and arrow keys for seeking and volume
- **Focus indicators**: All control buttons have visible focus rings for keyboard navigation
- **ARIA attributes**: Control buttons have appropriate ARIA labels describing their actions
- **Screen reader support**: Current time, duration, and playback state are conveyed to assistive technology
- **Reduced motion**: Transitions respect `prefers-reduced-motion` for users sensitive to animations

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1 and Shadow DOM support
- Picture-in-Picture requires browser support (Chrome, Edge, Safari; limited in Firefox)
