<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/spotlight.md -->

# Spotlight

A guided tour and onboarding component that highlights elements on the page with a cutout overlay and step-by-step popover instructions. Supports customizable positioning and smooth transitions between steps.

## Table of Contents

- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Custom Properties](#css-custom-properties)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `steps` | `SpotlightStep[]` | `[]` | Array of step definitions for the tour |

### SpotlightStep

```typescript
interface SpotlightStep {
  target: string;              // CSS selector for the element to highlight
  title: string;               // Step title displayed in the popover
  description: string;         // Step description text
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';  // Popover position
}
```

## Methods

| Method | Arguments | Returns | Description |
|--------|-----------|---------|-------------|
| `start()` | -- | `void` | Begin the tour from step 0 |
| `next()` | -- | `void` | Advance to the next step (ends tour if on last step) |
| `prev()` | -- | `void` | Go back to the previous step |
| `goToStep()` | `index: number` | `void` | Jump to a specific step by index |
| `end()` | -- | `void` | End the tour immediately |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `spotlight-start` | `void` | Tour has begun |
| `spotlight-step` | `{ index: number, step: SpotlightStep }` | Navigated to a new step |
| `spotlight-end` | `void` | Tour ended (completed or ended programmatically) |
| `spotlight-skip` | `{ index: number }` | User skipped the tour at the given step |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--snice-transition-medium` | Cutout transition speed | `250ms` |
| `--snice-color-background` | Popover background color | `rgb(255 255 255)` |
| `--snice-color-border` | Popover border color | `rgb(226 226 226)` |
| `--snice-color-text` | Popover text color | `rgb(23 23 23)` |
| `--snice-color-primary` | Primary button color | `rgb(37 99 235)` |
| `--snice-shadow-lg` | Popover box shadow | _(theme default)_ |
| `--snice-border-radius-lg` | Popover border radius | `0.5rem` |

## Basic Usage

```typescript
import 'snice/components/spotlight/snice-spotlight';
```

```html
<snice-spotlight id="tour"></snice-spotlight>

<script>
  const spotlight = document.getElementById('tour');
  spotlight.steps = [
    { target: '#search-bar', title: 'Search', description: 'Find content here.', position: 'bottom' },
    { target: '#nav-menu', title: 'Navigation', description: 'Browse sections.', position: 'right' },
    { target: '#profile', title: 'Profile', description: 'Your settings.', position: 'left' }
  ];
  spotlight.start();
</script>
```

## Examples

### Auto-Positioned Steps

Omit `position` or set it to `'auto'` for automatic popover placement.

```typescript
spotlight.steps = [
  { target: '.sidebar', title: 'Sidebar', description: 'Access tools here.' },
  { target: '.main', title: 'Content', description: 'Your workspace.', position: 'auto' },
];
spotlight.start();
```

### Event Handling

Track tour lifecycle events for analytics or conditional behavior.

```typescript
spotlight.addEventListener('spotlight-step', (e) => {
  console.log(`Step ${e.detail.index}: ${e.detail.step.title}`);
});

spotlight.addEventListener('spotlight-end', () => {
  localStorage.setItem('onboarding-done', 'true');
});

spotlight.addEventListener('spotlight-skip', (e) => {
  console.log(`Skipped at step ${e.detail.index}`);
});

if (!localStorage.getItem('onboarding-done')) {
  spotlight.start();
}
```

### Programmatic Navigation

Control the tour with methods for custom navigation UI.

```html
<snice-spotlight id="controlled-tour"></snice-spotlight>

<button onclick="document.getElementById('controlled-tour').prev()">Previous</button>
<button onclick="document.getElementById('controlled-tour').next()">Next</button>
<button onclick="document.getElementById('controlled-tour').goToStep(0)">Restart</button>
<button onclick="document.getElementById('controlled-tour').end()">End Tour</button>
```

## Accessibility

- Navigation buttons (Next, Previous, Skip) are keyboard accessible
- Focus moves to the popover when each step is shown
- Overlay and popover use appropriate ARIA roles
- Escape key ends the tour
- Transitions respect `prefers-reduced-motion`
