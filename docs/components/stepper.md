<!-- AI: For a low-token version of this doc, use docs/ai/components/stepper.md instead -->

# Stepper
`<snice-stepper>`

A step indicator for visualizing multi-step processes, wizards, and workflows.

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/stepper/snice-stepper';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-stepper.min.js"></script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `steps` | `Step[]` | `[]` | Array of step objects |
| `currentStep` (attr: `current-step`) | `number` | `0` | Index of the active step |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout direction |
| `clickable` | `boolean` | `false` | Allow clicking steps for navigation |

### Step Object

```typescript
interface Step {
  label: string;
  description?: string;
  status?: 'pending' | 'active' | 'completed' | 'error';
}
```

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `step-change` | `{ previousStep: number, currentStep: number, step: Step }` | A step was clicked (clickable mode only) |

## Slots

| Name | Description |
|------|-------------|
| (default) | `<snice-stepper-panel>` elements for step content |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `container` | `<div>` | Main stepper container |
| `step` | `<div>` | Individual step wrapper |
| `step-indicator` | `<div>` | Circular step number/checkmark |
| `step-content` | `<div>` | Label + description wrapper |
| `step-label` | `<div>` | Step label text |
| `step-description` | `<div>` | Step description text |
| `step-connector` | `<div>` | Line connecting steps |
| `panels` | `<div>` | Container wrapping slotted panel content |

```css
snice-stepper::part(step-indicator) {
  width: 40px;
  height: 40px;
}

snice-stepper::part(step-connector) {
  background: #3b82f6;
}
```

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

Use the `orientation` attribute for a vertical layout.

```html
<snice-stepper id="onboarding" orientation="vertical"></snice-stepper>

<script>
  document.getElementById('onboarding').steps = [
    { label: 'Create Account' },
    { label: 'Profile Setup' },
    { label: 'Preferences' },
    { label: 'Complete' }
  ];
  document.getElementById('onboarding').currentStep = 2;
</script>
```

### With Descriptions

Add optional `description` text to each step.

```html
<snice-stepper id="detailed"></snice-stepper>

<script>
  document.getElementById('detailed').steps = [
    { label: 'Order Details', description: 'Review your items' },
    { label: 'Shipping', description: 'Enter delivery address' },
    { label: 'Payment', description: 'Secure checkout' }
  ];
</script>
```

### Interactive Navigation

Set the `clickable` attribute to allow clicking between steps.

```html
<snice-stepper id="wizard" clickable></snice-stepper>

<script>
  const wizard = document.getElementById('wizard');
  wizard.steps = [
    { label: 'Account' },
    { label: 'Profile' },
    { label: 'Complete' }
  ];

  wizard.addEventListener('step-change', (e) => {
    console.log('Moved to step:', e.detail.currentStep);
  });
</script>
```

### Error State

Set `status: 'error'` on a step to highlight failures.

```html
<snice-stepper id="validation"></snice-stepper>

<script>
  document.getElementById('validation').steps = [
    { label: 'Upload', status: 'completed' },
    { label: 'Validate', status: 'error' },
    { label: 'Process', status: 'pending' }
  ];
  document.getElementById('validation').currentStep = 1;
</script>
```

### With Panels

Use `<snice-stepper-panel>` children for content that auto-shows based on the active step.

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
