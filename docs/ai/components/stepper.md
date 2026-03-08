# snice-stepper

Step indicator for multi-step processes with pending/active/completed/error states.

## Properties

```typescript
steps: Step[] = [];
currentStep: number = 0;          // attr: current-step
orientation: 'horizontal'|'vertical' = 'horizontal';
clickable: boolean = false;

// Step object:
interface Step {
  label: string;
  description?: string;
  status?: 'pending'|'active'|'completed'|'error'; // auto-computed if not set
}
```

## Slots

- `(default)` - `<snice-stepper-panel>` elements (auto show/hide based on currentStep)

## Events

- `step-change` → `{ previousStep, currentStep, step }` - Cancelable via preventDefault()

## Methods

- Navigate via `currentStep` property (increment/decrement/set)

## CSS Parts

- `container` - Main container
- `step` - Individual step
- `step-indicator` - Circular indicator
- `step-content` - Label + description wrapper
- `step-label` - Step label text
- `step-description` - Description text
- `step-connector` - Line between steps
- `panels` - Panels container (wraps slotted content)

## Usage

```html
<!-- Basic -->
<snice-stepper></snice-stepper>
```

```typescript
stepper.steps = [
  { label: 'Account' },
  { label: 'Profile' },
  { label: 'Complete' }
];
stepper.currentStep = 1;
```

```html
<!-- With panels (auto show/hide based on currentStep) -->
<snice-stepper id="wizard" clickable></snice-stepper>
<snice-stepper-panel>Step 1 content</snice-stepper-panel>
<snice-stepper-panel>Step 2 content</snice-stepper-panel>
<snice-stepper-panel>Step 3 content</snice-stepper-panel>

<!-- Vertical with descriptions -->
<snice-stepper orientation="vertical"></snice-stepper>

<!-- Error state -->
```

```typescript
stepper.steps = [
  { label: 'Upload', status: 'completed' },
  { label: 'Validate', status: 'error' },
  { label: 'Process', status: 'pending' }
];
```
