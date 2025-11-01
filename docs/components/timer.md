# Timer Component

The `<snice-timer>` component provides a stopwatch and countdown timer.

## Basic Usage

```html
<!-- Stopwatch -->
<snice-timer mode="stopwatch"></snice-timer>

<!-- Countdown Timer -->
<snice-timer mode="timer" initial-time="60"></snice-timer>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `mode` | `'stopwatch' \| 'timer'` | `'stopwatch'` | Timer mode |
| `initial-time` | `number` | `0` | Starting time in seconds (for timer mode) |
| `running` | `boolean` | `false` | Timer running state (read-only) |

## Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `start()` | `void` | Start the timer |
| `stop()` | `void` | Stop/pause the timer |
| `reset()` | `void` | Reset to initial state |
| `getTime()` | `number` | Get current time in seconds |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `@snice/timer-start` | `{ timer, time }` | Timer started |
| `@snice/timer-stop` | `{ timer, time }` | Timer stopped |
| `@snice/timer-reset` | `{ timer, time }` | Timer reset |
| `@snice/timer-complete` | `{ timer }` | Countdown completed (timer mode only) |

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

```html
<snice-timer id="timer" mode="timer" initial-time="300"></snice-timer>

<script>
  const timer = document.getElementById('timer');

  timer.addEventListener('@snice/timer-complete', () => {
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

<script>
  const timer = document.getElementById('my-timer');

  timer.addEventListener('@snice/timer-start', (e) => {
    console.log('Timer started at', e.detail.time);
  });

  timer.addEventListener('@snice/timer-stop', (e) => {
    console.log('Timer stopped at', e.detail.time);
  });
</script>
```

### Workout Timer

```html
<snice-timer id="workout" mode="timer" initial-time="45"></snice-timer>

<script>
  const workout = document.getElementById('workout');

  workout.addEventListener('@snice/timer-complete', () => {
    alert('Rest time!');
    // Start rest period
    workout.initialTime = 15;
    workout.reset();
    workout.start();
  });

  workout.start();
</script>
```

## Styling

The timer uses CSS custom properties from the theme system:

```css
snice-timer {
  --snice-color-background-element: rgb(252 251 249);
  --snice-color-border: rgb(226 226 226);
  --snice-color-text: rgb(23 23 23);
  --snice-color-success: rgb(22 163 74);
  --snice-color-warning: rgb(202 138 4);
  --snice-color-neutral: rgb(82 82 82);
}
```

## Accessibility

- Large, readable time display
- Clear button labels and icons
- Keyboard accessible controls
- High contrast buttons

## Best Practices

1. **Choose the right mode**: Use stopwatch for tracking elapsed time, timer for countdowns
2. **Handle timer-complete**: Listen for completion events in timer mode
3. **Provide context**: Add labels or descriptions near the timer
4. **Reset appropriately**: Call `reset()` to return to initial state
