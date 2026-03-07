<!-- AI: For a low-token version of this doc, use docs/ai/components/audio-recorder.md instead -->

# Audio Recorder Component

Record audio with visualization, pause/resume, and playback.

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `autoStart` | `boolean` | `false` | Auto-start recording |
| `format` | `AudioFormat` | `'audio/webm'` | Output format |
| `bitrate` | `number` | `128000` | Audio bitrate (bps) |
| `showControls` | `boolean` | `true` | Show control buttons |
| `showVisualizer` | `boolean` | `true` | Show frequency visualizer |
| `maxDuration` | `number` | `0` | Max duration (seconds, 0=unlimited) |
| `showTimer` | `boolean` | `true` | Show recording timer |
| `showPlayback` | `boolean` | `true` | Show playback controls after recording |

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
Get current state ('inactive', 'recording', 'paused').

### `getDuration(): number`
Get recording duration in seconds.

### `isRecording(): boolean`
Check if currently recording.

### `download(filename?): void`
Download recorded audio.

### `reset(): void`
Reset recorder state and discard playback.

## Events

- `recorder-start` - Recording started
- `recorder-stop` - Recording stopped
- `recorder-pause` - Recording paused
- `recorder-resume` - Recording resumed
- `recorder-cancel` - Recording cancelled
- `recorder-error` - Error occurred

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

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

```html
<snice-audio-recorder id="recorder"></snice-audio-recorder>

<script>
  const recorder = document.getElementById('recorder');

  // Listen for stop event
  recorder.addEventListener('recorder-stop', async () => {
    // Recording complete
  });
</script>
```

## Audio Formats

- `'audio/webm'` - WebM (default)
- `'audio/ogg'` - Ogg Vorbis
- `'audio/mp4'` - MP4/AAC
- `'audio/wav'` - WAV (uncompressed)

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

## AudioRecording Interface

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

## Security

- Requires HTTPS (or localhost)
- Requires user permission
- Permission prompts are browser-controlled

## Browser Support

- Modern browsers with MediaRecorder API
- Requires microphone hardware
