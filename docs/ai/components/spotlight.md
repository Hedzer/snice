# snice-spotlight

Guided tour / onboarding spotlight with cutout overlay and step-by-step popovers.

## Properties

```typescript
steps: SpotlightStep[] = [];

interface SpotlightStep {
  target: string;              // CSS selector for target element
  title: string;
  description: string;
  position?: 'top'|'bottom'|'left'|'right'|'auto';
}
```

## Methods

- `start()` - Begin tour from step 0
- `next()` - Advance to next step (ends tour if on last step)
- `prev()` - Go back to previous step
- `goToStep(index)` - Jump to specific step
- `end()` - End the tour

## Events

- `spotlight-start` → `void`
- `spotlight-step` → `{ index, step }`
- `spotlight-end` → `void`
- `spotlight-skip` → `{ index }`

## CSS Custom Properties

- `--snice-transition-medium` - Cutout transition speed (`250ms`)
- `--snice-color-background` - Popover background (`rgb(255 255 255)`)
- `--snice-color-border` - Popover border (`rgb(226 226 226)`)
- `--snice-color-text` - Popover text (`rgb(23 23 23)`)
- `--snice-color-primary` - Primary button (`rgb(37 99 235)`)
- `--snice-shadow-lg` - Popover shadow
- `--snice-border-radius-lg` - Popover border radius (`0.5rem`)

## Basic Usage

```html
<snice-spotlight></snice-spotlight>
```

```typescript
spotlight.steps = [
  { target: '#step1', title: 'Welcome', description: 'First step', position: 'bottom' },
  { target: '#step2', title: 'Next', description: 'Continue here', position: 'right' },
];
spotlight.start();

spotlight.addEventListener('spotlight-end', () => console.log('Tour completed'));
spotlight.addEventListener('spotlight-skip', (e) => console.log(`Skipped at ${e.detail.index}`));
```

## Accessibility

- Keyboard-accessible navigation buttons
- Focus moves to popover on each step
- Escape key ends tour
- Respects `prefers-reduced-motion`
