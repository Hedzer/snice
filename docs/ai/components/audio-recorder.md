# snice-audio-recorder

Audio recording with visualization and playback.

## Properties

```typescript
autoStart: boolean = false;
format: 'audio/webm'|'audio/ogg'|'audio/mp4'|'audio/wav' = 'audio/webm';
bitrate: number = 128000;
showControls: boolean = true;
showVisualizer: boolean = true;
maxDuration: number = 0;
showTimer: boolean = true;
```

## Methods

```typescript
start(): Promise<void>
stop(): Promise<AudioRecording>
pause(): void
resume(): void
cancel(): void
getState(): 'inactive'|'recording'|'paused'
getDuration(): number
isRecording(): boolean
download(filename?: string): void
```

## AudioRecording

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

- `@snice/recorder-start` - Recording started
- `@snice/recorder-stop` - Recording stopped
- `@snice/recorder-pause` - Paused
- `@snice/recorder-resume` - Resumed
- `@snice/recorder-cancel` - Cancelled
- `@snice/recorder-error` - Error

## Usage

```javascript
// Start
await recorder.start();

// Stop and get recording
const recording = await recorder.stop();
// { blob, url, duration, size, format, timestamp }

// Pause/resume
recorder.pause();
recorder.resume();

// Cancel
recorder.cancel();

// Download
recorder.download('recording.webm');

// Upload
const formData = new FormData();
formData.append('audio', recording.blob);
await fetch('/upload', { method: 'POST', body: formData });
```

```html
<snice-audio-recorder
  auto-start
  format="audio/mp4"
  bitrate="256000"
  max-duration="60">
</snice-audio-recorder>
```

## Features

- MediaRecorder API
- Real-time visualizer
- Pause/resume
- Timer
- Multiple formats
- Playback
- Download
- Requires HTTPS
