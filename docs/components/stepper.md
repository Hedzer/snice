# Stepper Component

A step indicator component for visualizing multi-step processes, wizards, and workflows. Shows progress through a sequence of steps with clear visual states.

## Features

- **Multiple Orientations**: Horizontal and vertical layouts
- **Status Indicators**: Pending, active, completed, and error states
- **Interactive Mode**: Optional clickable navigation
- **Step Descriptions**: Optional descriptive text for each step
- **Custom Events**: Step change events for navigation integration
- **Connector Lines**: Visual flow between steps
- **Flexible Status**: Auto-computed or manually specified step status

## Basic Usage

```html
<snice-stepper id="basic"></snice-stepper>

<script>
  const stepper = document.getElementById('basic');
  stepper.steps = [
    { label: 'Step 1' },
    { label: 'Step 2' },
    { label: 'Step 3' }
  ];
  stepper.currentStep = 0;
</script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `steps` | `Step[]` | `[]` | Array of step objects |
| `current-step` | `number` | `0` | Index of the currently active step |
| `orientation` | `StepperOrientation` | `'horizontal'` | Layout direction ('horizontal' or 'vertical') |
| `clickable` | `boolean` | `false` | Whether steps can be clicked for navigation |

### Step Object

```typescript
{
  label: string;          // Step label (required)
  description?: string;   // Optional description text
  status?: StepStatus;    // Override auto-computed status
}
```

### Step Status

- `'pending'` - Not yet reached
- `'active'` - Current step
- `'completed'` - Already completed
- `'error'` - Failed or requires attention

## Horizontal Stepper

```html
<snice-stepper id="checkout"></snice-stepper>

<script>
  document.getElementById('checkout').steps = [
    { label: 'Cart' },
    { label: 'Delivery' },
    { label: 'Payment' },
    { label: 'Confirm' }
  ];
  document.getElementById('checkout').currentStep = 1;
</script>
```

## Vertical Stepper

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

## With Descriptions

```html
<snice-stepper id="detailed"></snice-stepper>

<script>
  document.getElementById('detailed').steps = [
    { label: 'Order Details', description: 'Review your items' },
    { label: 'Shipping', description: 'Enter delivery address' },
    { label: 'Payment', description: 'Secure checkout' },
    { label: 'Confirmation', description: 'Order summary' }
  ];
  document.getElementById('detailed').currentStep = 1;
</script>
```

## Interactive Navigation

```html
<snice-stepper id="wizard" clickable></snice-stepper>

<script>
  const wizard = document.getElementById('wizard');
  wizard.steps = [
    { label: 'Step 1' },
    { label: 'Step 2' },
    { label: 'Step 3' }
  ];

  wizard.addEventListener('step-change', (e) => {
    console.log('Previous:', e.detail.previousStep);
    console.log('Current:', e.detail.currentStep);
    console.log('Step:', e.detail.step);

    // Prevent navigation if needed
    // e.preventDefault();
  });
</script>
```

## Error State

```html
<snice-stepper id="validation"></snice-stepper>

<script>
  document.getElementById('validation').steps = [
    { label: 'Upload', status: 'completed' },
    { label: 'Validate', status: 'error' },
    { label: 'Process', status: 'pending' },
    { label: 'Complete', status: 'pending' }
  ];
  document.getElementById('validation').currentStep = 1;
</script>
```

## Events

### step-change

Emitted when a step is clicked (only in clickable mode).

```javascript
stepper.addEventListener('step-change', (event) => {
  const { previousStep, currentStep, step } = event.detail;

  // Validate before allowing change
  if (!isStepValid(previousStep)) {
    event.preventDefault();
    return;
  }

  // Handle navigation
  loadStepContent(currentStep);
});
```

## Stepper Panels

Use `<snice-stepper-panel>` to create content that automatically shows/hides based on the active step:

```html
<snice-stepper id="wizard" clickable></snice-stepper>

<snice-stepper-panel>
  <h3>Step 1 Content</h3>
  <p>This shows when step 0 is active</p>
</snice-stepper-panel>

<snice-stepper-panel>
  <h3>Step 2 Content</h3>
  <p>This shows when step 1 is active</p>
</snice-stepper-panel>

<snice-stepper-panel>
  <h3>Step 3 Content</h3>
  <p>This shows when step 2 is active</p>
</snice-stepper-panel>

<script>
  document.getElementById('wizard').steps = [
    { label: 'Account' },
    { label: 'Profile' },
    { label: 'Complete' }
  ];
</script>
```

Panels automatically sync with the stepper's `currentStep`. They must be direct children of the stepper element.

## Programmatic Navigation

```javascript
const stepper = document.getElementById('my-stepper');

// Go to next step
if (stepper.currentStep < stepper.steps.length - 1) {
  stepper.currentStep++;
}

// Go to previous step
if (stepper.currentStep > 0) {
  stepper.currentStep--;
}

// Go to specific step
stepper.currentStep = 2;

// Reset to first step
stepper.currentStep = 0;
```

## CSS Parts

Use `::part()` to style internal elements:

```css
snice-stepper::part(container) {
  padding: 20px;
}

snice-stepper::part(step) {
  margin: 10px 0;
}

snice-stepper::part(step-indicator) {
  width: 40px;
  height: 40px;
  font-size: 18px;
}

snice-stepper::part(step-label) {
  font-weight: 600;
}

snice-stepper::part(step-description) {
  font-size: 12px;
}

snice-stepper::part(step-connector) {
  background: linear-gradient(to right, #ccc, #999);
}
```

## Theming

The component uses these CSS custom properties:

```css
--snice-color-primary
--snice-color-success
--snice-color-danger
--snice-color-text
--snice-color-text-secondary
--snice-color-text-inverse
--snice-color-background
--snice-color-border
--snice-spacing-*
--snice-font-size-*
--snice-font-weight-*
--snice-transition-fast
```

## Examples

### Checkout Process

```html
<snice-stepper id="checkout-process" clickable></snice-stepper>

<div id="step-content"></div>

<button onclick="prevStep()">Previous</button>
<button onclick="nextStep()">Next</button>

<script>
  const stepper = document.getElementById('checkout-process');
  stepper.steps = [
    { label: 'Cart', description: 'Review items' },
    { label: 'Delivery', description: 'Shipping details' },
    { label: 'Payment', description: 'Billing info' },
    { label: 'Confirm', description: 'Place order' }
  ];

  function nextStep() {
    if (stepper.currentStep < stepper.steps.length - 1) {
      stepper.currentStep++;
    }
  }

  function prevStep() {
    if (stepper.currentStep > 0) {
      stepper.currentStep--;
    }
  }

  stepper.addEventListener('step-change', (e) => {
    document.getElementById('step-content').innerHTML =
      `<h2>${e.detail.step.label}</h2>`;
  });
</script>
```

### Account Setup Wizard with Panels

```html
<snice-stepper id="signup" clickable></snice-stepper>

<snice-stepper-panel>
  <h2>Create Account</h2>
  <input type="email" placeholder="Email">
  <input type="password" placeholder="Password">
</snice-stepper-panel>

<snice-stepper-panel>
  <h2>Personal Information</h2>
  <input type="text" placeholder="Full Name">
  <input type="text" placeholder="Company">
</snice-stepper-panel>

<snice-stepper-panel>
  <h2>Preferences</h2>
  <label><input type="checkbox"> Email notifications</label>
  <label><input type="checkbox"> Weekly digest</label>
</snice-stepper-panel>

<snice-stepper-panel>
  <h2>Complete</h2>
  <p>You're all set! Click finish to start using the app.</p>
  <button>Finish</button>
</snice-stepper-panel>

<script>
  const signup = document.getElementById('signup');
  signup.steps = [
    { label: 'Account' },
    { label: 'Profile' },
    { label: 'Preferences' },
    { label: 'Complete' }
  ];
</script>
```

### Form Validation Flow

```html
<snice-stepper id="form-validation"></snice-stepper>

<script>
  const form = document.getElementById('form-validation');
  const validationStates = {
    0: true,  // Step 1 valid
    1: false, // Step 2 has error
    2: false, // Step 3 pending
  };

  function updateStepStatuses() {
    form.steps = form.steps.map((step, index) => ({
      ...step,
      status: validationStates[index]
        ? (index < form.currentStep ? 'completed' : index === form.currentStep ? 'active' : 'pending')
        : 'error'
    }));
  }

  form.steps = [
    { label: 'Personal Info' },
    { label: 'Contact Details' },
    { label: 'Verification' }
  ];

  updateStepStatuses();
</script>
```

## Best Practices

1. **Clear Labels**: Use concise, action-oriented step names
2. **Logical Flow**: Order steps in natural progression
3. **Visual Feedback**: Show clear status for each step
4. **Error Handling**: Highlight steps that need attention
5. **Save Progress**: Persist current step across sessions
6. **Validation**: Validate before allowing step advancement
7. **Orientation**: Use vertical for complex flows with descriptions
8. **Descriptions**: Add descriptions for clarity in complex workflows

## Accessibility

- Semantic HTML with proper step indicators
- Clear visual state differentiation
- Keyboard navigation in clickable mode
- Screen reader friendly labels and status
- Sufficient color contrast for all states
- Focus indicators on interactive steps

## Performance

- Efficient rendering with minimal DOM
- CSS containment for optimized layout
- Event delegation for click handling
- No external dependencies
- Lightweight status computation
