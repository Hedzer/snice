<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/audio-recorder.md -->

# Audio Recorder
`<snice-audio-recorder>`

Record audio with visualization, pause/resume, and playback.

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
| `autoStart` (attr: `auto-start`) | `boolean` | `false` | Auto-start recording |
| `format` | `AudioFormat` | `'audio/webm'` | Output format (`'audio/webm'`, `'audio/ogg'`, `'audio/mp4'`, `'audio/wav'`) |
| `bitrate` | `number` | `128000` | Audio bitrate (bps) |
| `showControls` (attr: `show-controls`) | `boolean` | `true` | Show control buttons |
| `showVisualizer` (attr: `show-visualizer`) | `boolean` | `true` | Show frequency visualizer |
| `maxDuration` (attr: `max-duration`) | `number` | `0` | Max duration (seconds, 0=unlimited) |
| `showTimer` (attr: `show-timer`) | `boolean` | `true` | Show recording timer |
| `showPlayback` (attr: `show-playback`) | `boolean` | `true` | Show playback controls after recording |
| `recordedUrl` | `string` | `''` | URL of recorded audio (set automatically after stop) |

## Methods

### `start(): Promise<void>`
Start recording.

### `stop(): Promise<AudioRecording>`
Stop and return recording.

### `pause(): void`
Pause recording.

### `resume(): void`
Resume paused recording.

### `cancel(): void`
Cancel and discard recording.

### `getState(): RecorderState`
Get current state (`'inactive'`, `'recording'`, `'paused'`).

### `getDuration(): number`
Get recording duration in seconds.

### `isRecording(): boolean`
Check if currently recording.

### `download(filename?: string): void`
Download recorded audio.

### `reset(): void`
Reset recorder state and discard playback.

### AudioRecording Interface

```typescript
interface AudioRecording {
  blob: Blob;
  url: string;
  duration: number;
  size: number;
  format: string;
  timestamp: number;
}
```

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `recorder-start` | `{ recorder }` | Recording started |
| `recorder-stop` | `{ recorder }` | Recording stopped |
| `recorder-pause` | `{ recorder }` | Recording paused |
| `recorder-resume` | `{ recorder }` | Recording resumed |
| `recorder-cancel` | `{ recorder }` | Recording cancelled |
| `recorder-error` | `{ recorder, error }` | Error occurred |

## CSS Parts

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | Outer recorder container |
| `controls` | `<div>` | Recording and playback control buttons |
| `visualizer` | `<div>` | Audio frequency visualizer bar container |
| `progress` | `<div>` | Playback progress bar (visible after recording) |

```css
snice-audio-recorder::part(base) {
  border-radius: 12px;
  background: #1e293b;
  color: white;
}

snice-audio-recorder::part(visualizer) {
  height: 80px;
}
```

## Basic Usage

```typescript
import 'snice/components/audio-recorder/snice-audio-recorder';
```

```html
<snice-audio-recorder id="recorder"></snice-audio-recorder>

<script>
  const recorder = document.getElementById('recorder');

  recorder.addEventListener('recorder-stop', async () => {
    // Recording complete
  });
</script>
```

## Examples

### Basic Recording

```javascript
const recorder = document.querySelector('snice-audio-recorder');

// Start
await recorder.start();

// Stop and get recording
const recording = await recorder.stop();
console.log(recording.url, recording.duration, recording.size);
```

### Auto-start

```html
<snice-audio-recorder auto-start></snice-audio-recorder>
```

### Custom Format

```html
<snice-audio-recorder
  format="audio/mp4"
  bitrate="256000">
</snice-audio-recorder>
```

### Max Duration

```html
<snice-audio-recorder max-duration="60"></snice-audio-recorder>
```

### Download Recording

```javascript
const recording = await recorder.stop();
recorder.download('my-recording.webm');
```

### Upload to Server

```javascript
const recording = await recorder.stop();

const formData = new FormData();
formData.append('audio', recording.blob, 'recording.webm');
await fetch('/upload', { method: 'POST', body: formData });
```
