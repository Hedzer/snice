# snice-audio-recorder

Audio recording with visualization and playback.

## Properties

```typescript
autoStart: boolean = false;       // attr: auto-start
format: 'audio/webm'|'audio/ogg'|'audio/mp4'|'audio/wav' = 'audio/webm';
bitrate: number = 128000;
showControls: boolean = true;     // attr: show-controls
showVisualizer: boolean = true;   // attr: show-visualizer
maxDuration: number = 0;          // attr: max-duration, 0=unlimited
showTimer: boolean = true;        // attr: show-timer
showPlayback: boolean = true;     // attr: show-playback
recordedUrl: string = '';         // URL of recorded audio (set after stop)
```

## Methods

- `start(): Promise<void>` - Start recording
- `stop(): Promise<AudioRecording>` - Stop and return recording
- `pause()` - Pause recording
- `resume()` - Resume recording
- `cancel()` - Cancel and discard
- `getState(): 'inactive'|'recording'|'paused'`
- `getDuration(): number` - Duration in seconds
- `isRecording(): boolean`
- `download(filename?)` - Download recorded audio
- `reset()` - Reset state and discard playback

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

- `recorder-start` → `{ recorder }` - Recording started
- `recorder-stop` → `{ recorder }` - Recording stopped
- `recorder-pause` → `{ recorder }` - Paused
- `recorder-resume` → `{ recorder }` - Resumed
- `recorder-cancel` → `{ recorder }` - Cancelled
- `recorder-error` → `{ recorder, error }` - Error

## CSS Parts

- `base` - Outer recorder container
- `status` - Status region (role="status")
- `state` - State pill inside the status region
- `state-inactive` - Added to `state` while idle and during playback; `state-recording` and `state-paused` mirror the live state
- `state-icon` - Dot inside the state pill
- `state-label` - Text label inside the state pill
- `timer` - Elapsed/playback time readout
- `visualizer` - Audio frequency visualizer bar container
- `bar` - A single visualizer bar
- `controls` - Recording and playback control buttons
- `button` - Any control button
- `button-record` - Added to `button` on the record/resume button
- `button-pause` - Added to `button` on the pause button
- `button-play` - Added to `button` on the play button
- `button-stop` - Added to `button` on the stop button
- `button-cancel` - Added to `button` on the cancel button
- `icon` - Glyph inside a control button
- `progress` - Playback progress bar
- `fill` - Elapsed portion of the progress bar
- `error-text` - Error message

## Basic Usage

```html
<snice-audio-recorder auto-start format="audio/mp4" bitrate="256000" max-duration="60"></snice-audio-recorder>
```

```javascript
await recorder.start();
const recording = await recorder.stop();
recorder.download('recording.webm');

// Upload
const formData = new FormData();
formData.append('audio', recording.blob);
await fetch('/upload', { method: 'POST', body: formData });
```
