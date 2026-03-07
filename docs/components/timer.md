<!-- AI: For a low-token version of this doc, use docs/ai/components/timer.md instead -->

# Timer
`<snice-timer>`

A stopwatch and countdown timer component.

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/timer/snice-timer';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-timer.min.js"></script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `mode` | `'stopwatch' \| 'timer'` | `'stopwatch'` | Timer mode |
| `initialTime` (attr: `initial-time`) | `number` | `0` | Starting time in seconds (timer mode) |
| `running` | `boolean` | `false` | Whether the timer is running (read-only) |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `start()` | -- | Start the timer |
| `stop()` | -- | Stop/pause the timer |
| `reset()` | -- | Reset to initial state |
| `getTime()` | -- | Get current time in seconds, returns `number` |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `timer-start` | `{ timer, time }` | Timer started |
| `timer-stop` | `{ timer, time }` | Timer stopped |
| `timer-reset` | `{ timer, time }` | Timer reset |
| `timer-complete` | `{ timer }` | Countdown completed (timer mode only) |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | The outer timer container |
| `display` | `<div>` | The time display element |
| `controls` | `<div>` | The start/stop/reset button container |

```css
snice-timer::part(display) {
  font-size: 3rem;
  font-family: monospace;
}

snice-timer::part(controls) {
  gap: 1rem;
}
```

## Basic Usage

```typescript
import 'snice/components/timer/snice-timer';
```

```html
<!-- Stopwatch -->
<snice-timer mode="stopwatch"></snice-timer>

<!-- Countdown -->
<snice-timer mode="timer" initial-time="60"></snice-timer>
```

## Examples

### Stopwatch

```html
<snice-timer id="stopwatch" mode="stopwatch"></snice-timer>

<script>
  const stopwatch = document.getElementById('stopwatch');
  stopwatch.start();
  // Later...
  stopwatch.stop();
  console.log('Elapsed:', stopwatch.getTime(), 'seconds');
</script>
```

### Countdown Timer

Set the `initial-time` attribute in seconds for a countdown.

```html
<snice-timer id="countdown" mode="timer" initial-time="300"></snice-timer>

<script>
  const timer = document.getElementById('countdown');
  timer.addEventListener('timer-complete', () => {
    console.log('Time is up!');
  });
  timer.start();
</script>
```

### Programmatic Control

```html
<snice-timer id="my-timer"></snice-timer>

<button onclick="document.getElementById('my-timer').start()">Start</button>
<button onclick="document.getElementById('my-timer').stop()">Stop</button>
<button onclick="document.getElementById('my-timer').reset()">Reset</button>
```
