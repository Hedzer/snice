<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/timer.md -->

# Timer
`<snice-timer>`

A stopwatch and countdown timer component with start/stop/reset controls.

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

| Part | Description |
|------|-------------|
| `base` | The outer timer container |
| `display` | The time display element |
| `controls` | The start/stop/reset button container |

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

Use the default `stopwatch` mode to count up from zero.

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
