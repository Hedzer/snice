<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/stepper.md -->

# Stepper

A step indicator for visualizing multi-step processes, wizards, and workflows. Supports horizontal and vertical layouts, clickable navigation, step descriptions, and error states.

## Table of Contents

- [Properties](#properties)
- [Events](#events)
- [Slots](#slots)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `steps` | `Step[]` | `[]` | Array of step objects |
| `currentStep` (attr: `current-step`) | `number` | `0` | Index of the active step |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout direction |
| `clickable` | `boolean` | `false` | Allow clicking steps for navigation |

### Step

```typescript
interface Step {
  label: string;
  description?: string;
  status?: 'pending' | 'active' | 'completed' | 'error';  // auto-computed if not set
}
```

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `step-change` | `{ previousStep: number, currentStep: number, step: Step }` | A step was clicked (clickable mode only). Cancelable via `preventDefault()`. |

## Slots

| Name | Description |
|------|-------------|
| (default) | `<snice-stepper-panel>` elements for step content (auto show/hide based on `currentStep`) |

## CSS Parts

| Part | Description |
|------|-------------|
| `container` | Main stepper container |
| `step` | Individual step wrapper |
| `step-indicator` | Circular step number/checkmark |
| `step-content` | Label and description wrapper |
| `step-label` | Step label text |
| `step-description` | Step description text |
| `step-connector` | Line connecting steps |
| `panels` | Container wrapping slotted panel content |

## Basic Usage

```typescript
import 'snice/components/stepper/snice-stepper';
```

```html
<snice-stepper id="checkout"></snice-stepper>

<script>
  const stepper = document.getElementById('checkout');
  stepper.steps = [
    { label: 'Cart' },
    { label: 'Delivery' },
    { label: 'Payment' },
    { label: 'Confirm' }
  ];
  stepper.currentStep = 1;
</script>
```

## Examples

### Vertical

Use `orientation="vertical"` for a vertical layout.

```html
<snice-stepper orientation="vertical"></snice-stepper>
```

### With Descriptions

Add optional `description` text to each step.

```typescript
stepper.steps = [
  { label: 'Order Details', description: 'Review your items' },
  { label: 'Shipping', description: 'Enter delivery address' },
  { label: 'Payment', description: 'Secure checkout' }
];
```

### Interactive Navigation

Set `clickable` to allow clicking between steps. Use `preventDefault()` to block navigation.

```html
<snice-stepper clickable></snice-stepper>
```

```typescript
stepper.addEventListener('step-change', (e) => {
  console.log(`Moving from step ${e.detail.previousStep} to ${e.detail.currentStep}`);
  // e.preventDefault(); // block navigation if needed
});
```

### Error State

Set `status: 'error'` on a step to highlight failures.

```typescript
stepper.steps = [
  { label: 'Upload', status: 'completed' },
  { label: 'Validate', status: 'error' },
  { label: 'Process', status: 'pending' }
];
stepper.currentStep = 1;
```

### With Panels

Use `<snice-stepper-panel>` children for content that auto-shows/hides based on the active step.

```html
<snice-stepper id="signup" clickable></snice-stepper>

<snice-stepper-panel>
  <h3>Create Account</h3>
  <input type="email" placeholder="Email">
</snice-stepper-panel>

<snice-stepper-panel>
  <h3>Personal Info</h3>
  <input type="text" placeholder="Full Name">
</snice-stepper-panel>

<snice-stepper-panel>
  <h3>Complete</h3>
  <p>You're all set!</p>
</snice-stepper-panel>

<script>
  document.getElementById('signup').steps = [
    { label: 'Account' },
    { label: 'Profile' },
    { label: 'Complete' }
  ];
</script>
```

## Accessibility

- Steps with `clickable` are keyboard accessible (Enter/Space to activate)
- Completed steps show a checkmark indicator
- Error steps use semantic color coding
- Navigate via `currentStep` property (increment/decrement/set)
