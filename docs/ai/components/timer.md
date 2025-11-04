# Timer

```html
<snice-timer mode="stopwatch"></snice-timer>
<snice-timer mode="timer" initial-time="60"></snice-timer>
```

## Properties
- `mode`: 'stopwatch' | 'timer' (default: 'stopwatch')
- `initial-time`: number (default: 0) - Starting time in seconds for timer mode
- `running`: boolean (read-only)

## Methods
- `start()`: Start timer
- `stop()`: Stop/pause timer
- `reset()`: Reset to initial state
- `getTime()`: Get current time in seconds

## Events
- `timer-start`: { timer, time }
- `timer-stop`: { timer, time }
- `timer-reset`: { timer, time }
- `timer-complete`: { timer } - Countdown reached 0

## Implementation
- Uses requestAnimationFrame for smooth updates
- Direct DOM manipulation for display to avoid re-renders
- Stopwatch: counts up from 0
- Timer: counts down from initial-time
- Auto-stops at 0 in timer mode

## Display Format
- Under 1 hour: `M:SS.D` (e.g., "2:05.3")
- Over 1 hour: `H:MM:SS` (e.g., "1:05:30")

## Theme Integration
Uses standard theme tokens:
- Background: `--snice-color-background-element`
- Borders: `--snice-color-border`
- Text: `--snice-color-text`
- Start button: `--snice-color-success`
- Pause button: `--snice-color-warning`
- Reset button: `--snice-color-neutral`
