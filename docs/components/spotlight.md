<!-- AI: For a low-token version of this doc, use docs/ai/components/spotlight.md instead -->

# Spotlight Component

The spotlight component provides a guided tour and onboarding experience by highlighting elements on the page with a cutout overlay and step-by-step popover instructions. It supports step navigation, customizable positioning, and smooth transitions between steps.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [CSS Custom Properties](#css-custom-properties)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)
- [Browser Support](#browser-support)

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
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';  // Popover position relative to target
}
```

## Methods

#### `start(): void`
Begin the spotlight tour from step 0.

```typescript
spotlight.start();
```

#### `next(): void`
Advance to the next step. Ends the tour if on the last step.

```typescript
spotlight.next();
```

#### `prev(): void`
Go back to the previous step.

```typescript
spotlight.prev();
```

#### `goToStep(index: number): void`
Jump to a specific step by index.

```typescript
spotlight.goToStep(2);
```

#### `end(): void`
End the tour immediately.

```typescript
spotlight.end();
```

## Events

### `spotlight-start`
Fired when the tour begins.

**Event Detail:** `void`

### `spotlight-step`
Fired when navigating to a new step.

**Event Detail:**
```typescript
{
  index: number;
  step: SpotlightStep;
}
```

### `spotlight-end`
Fired when the tour ends (either completed or ended programmatically).

**Event Detail:** `void`

### `spotlight-skip`
Fired when the user skips the tour.

**Event Detail:**
```typescript
{
  index: number;  // The step index where the tour was skipped
}
```

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

```html
<snice-spotlight></snice-spotlight>
```

```typescript
import 'snice/components/spotlight/snice-spotlight';
```

## Examples

### Basic Tour

Set up a simple guided tour with three steps targeting elements on the page.

```html
<div id="search-bar">Search...</div>
<div id="nav-menu">Navigation</div>
<div id="profile-icon">Profile</div>

<snice-spotlight id="tour"></snice-spotlight>

<script type="module">
  import 'snice/components/spotlight/snice-spotlight';

  const spotlight = document.getElementById('tour');
  spotlight.steps = [
    { target: '#search-bar', title: 'Search', description: 'Use the search bar to find content.', position: 'bottom' },
    { target: '#nav-menu', title: 'Navigation', description: 'Browse sections from the navigation menu.', position: 'right' },
    { target: '#profile-icon', title: 'Profile', description: 'View and edit your profile settings here.', position: 'left' }
  ];
  spotlight.start();
</script>
```

### Listening for Tour Events

React to tour lifecycle events to track progress or trigger side effects.

```html
<snice-spotlight id="onboarding"></snice-spotlight>

<script type="module">
  import type { SniceSpotlightElement } from 'snice/components/spotlight/snice-spotlight.types';

  const spotlight = document.getElementById('onboarding') as SniceSpotlightElement;

  spotlight.steps = [
    { target: '#feature-a', title: 'Feature A', description: 'This is feature A.' },
    { target: '#feature-b', title: 'Feature B', description: 'This is feature B.' },
    { target: '#feature-c', title: 'Feature C', description: 'This is feature C.' }
  ];

  spotlight.addEventListener('spotlight-step', (e) => {
    console.log(`Now on step ${e.detail.index}: ${e.detail.step.title}`);
  });

  spotlight.addEventListener('spotlight-end', () => {
    console.log('Tour completed');
    localStorage.setItem('onboarding-done', 'true');
  });

  spotlight.addEventListener('spotlight-skip', (e) => {
    console.log(`Tour skipped at step ${e.detail.index}`);
  });

  // Only show tour for new users
  if (!localStorage.getItem('onboarding-done')) {
    spotlight.start();
  }
</script>
```

### Auto-Positioned Steps

Use `position: 'auto'` or omit the position to let the component automatically determine the best popover placement.

```html
<snice-spotlight id="auto-tour"></snice-spotlight>

<script type="module">
  const spotlight = document.getElementById('auto-tour');
  spotlight.steps = [
    { target: '.sidebar', title: 'Sidebar', description: 'Access tools and settings here.' },
    { target: '.main-content', title: 'Content Area', description: 'Your main workspace.', position: 'auto' },
    { target: '.footer-help', title: 'Help', description: 'Need assistance? Click here.', position: 'top' }
  ];
  spotlight.start();
</script>
```

### Programmatic Step Navigation

Control the tour programmatically using methods, useful for custom navigation UI.

```html
<snice-spotlight id="controlled-tour"></snice-spotlight>

<button onclick="document.getElementById('controlled-tour').prev()">Previous</button>
<button onclick="document.getElementById('controlled-tour').next()">Next</button>
<button onclick="document.getElementById('controlled-tour').goToStep(0)">Restart</button>
<button onclick="document.getElementById('controlled-tour').end()">End Tour</button>
```

## Accessibility

- **Keyboard support**: The popover navigation buttons (Next, Previous, Skip) are fully keyboard accessible
- **Focus management**: Focus is moved to the popover when each step is shown
- **ARIA attributes**: The overlay and popover use appropriate ARIA roles for screen reader support
- **Escape key**: Pressing Escape ends the tour
- **Reduced motion**: Transitions respect `prefers-reduced-motion` for users sensitive to animations

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1 and Shadow DOM support
