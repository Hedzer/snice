# snice-spotlight

Guided tour / onboarding spotlight that highlights elements with step-by-step popover instructions.

## Properties

```ts
steps: SpotlightStep[] = []

interface SpotlightStep {
  target: string              // CSS selector for target element
  title: string
  description: string
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
}
```

## Methods

- `start()` - Begin the spotlight tour from step 0
- `next()` - Advance to next step (ends tour if on last step)
- `prev()` - Go back to previous step
- `goToStep(index: number)` - Jump to specific step
- `end()` - End the tour

## Events

- `spotlight-start` -> `void`
- `spotlight-step` -> `{ index: number; step: SpotlightStep }`
- `spotlight-end` -> `void`
- `spotlight-skip` -> `{ index: number }`

## CSS Custom Properties

- `--snice-transition-medium` - Cutout transition speed (default: `250ms`)
- `--snice-color-background` - Popover background (default: `rgb(255 255 255)`)
- `--snice-color-border` - Popover border (default: `rgb(226 226 226)`)
- `--snice-color-text` - Popover text color (default: `rgb(23 23 23)`)
- `--snice-color-primary` - Primary button color (default: `rgb(37 99 235)`)
- `--snice-shadow-lg` - Popover shadow
- `--snice-border-radius-lg` - Popover border radius (default: `0.5rem`)

## Usage

```html
<snice-spotlight></snice-spotlight>
```

```js
const spotlight = document.querySelector('snice-spotlight');
spotlight.steps = [
  { target: '#step1', title: 'Welcome', description: 'This is the first step', position: 'bottom' },
  { target: '#step2', title: 'Next', description: 'Click here to continue', position: 'right' },
  { target: '#step3', title: 'Done', description: 'All set!', position: 'top' }
];
spotlight.start();

spotlight.addEventListener('spotlight-end', () => {
  console.log('Tour completed');
});
```
