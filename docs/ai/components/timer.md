# snice-timer

Stopwatch and countdown timer with start/stop/reset controls.

## Properties

```typescript
mode: 'stopwatch'|'timer' = 'stopwatch';
initialTime: number = 0;   // attr: initial-time, seconds (for timer mode)
running: boolean;           // read-only
```

## Methods

- `start()` - Start timer
- `stop()` - Stop/pause timer
- `reset()` - Reset to initial state
- `getTime()` - Get current time in seconds

## Events

- `timer-start` -> `{ timer, time }`
- `timer-stop` -> `{ timer, time }`
- `timer-reset` -> `{ timer, time }`
- `timer-complete` -> `{ timer }` - Countdown reached 0

## CSS Parts

- `base` - The outer timer container
- `display` - The time display element
- `controls` - The start/stop/reset button container
- `button` - Any control button in the controls row
- `start-button` - Added to `button` on the start control
- `pause-button` - Added to `button` on the pause control
- `reset-button` - Added to `button` on the reset control
- `icon` - The SVG glyph inside a control button
- `start-icon` - Added to `icon` on the start control
- `pause-icon` - Added to `icon` on the pause control
- `reset-icon` - Added to `icon` on the reset control

## Basic Usage

```html
<!-- Stopwatch (counts up) -->
<snice-timer mode="stopwatch"></snice-timer>

<!-- Countdown (counts down from 60s) -->
<snice-timer mode="timer" initial-time="60"></snice-timer>
```

```typescript
timer.start();
timer.stop();
timer.reset();
console.log(timer.getTime());

timer.addEventListener('timer-complete', () => {
  console.log('Countdown finished');
});
```
