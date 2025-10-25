# snice-stepper

Step indicator for multi-step processes, wizards, workflows. Shows progress with pending/active/completed/error states.

## Properties

```typescript
steps: Step[] = []                          // Array of step objects
currentStep: number = 0                     // Current active step index
orientation: StepperOrientation = 'horizontal' // 'horizontal' | 'vertical'
clickable: boolean = false                  // Enable click navigation

// Step object:
{
  label: string;           // Step label (required)
  description?: string;    // Optional description
  status?: StepStatus;     // Override auto status: 'pending' | 'active' | 'completed' | 'error'
}
```

## Usage

```html
<!-- Basic horizontal -->
<snice-stepper id="basic"></snice-stepper>
<script>
  document.getElementById('basic').steps = [
    { label: 'Step 1' },
    { label: 'Step 2' },
    { label: 'Step 3' }
  ];
  document.getElementById('basic').currentStep = 1;
</script>

<!-- With panels (auto show/hide) -->
<snice-stepper id="wizard" clickable></snice-stepper>
<snice-stepper-panel>Step 1 content</snice-stepper-panel>
<snice-stepper-panel>Step 2 content</snice-stepper-panel>
<snice-stepper-panel>Step 3 content</snice-stepper-panel>
<script>
  document.getElementById('wizard').steps = [
    { label: 'Account' },
    { label: 'Profile' },
    { label: 'Complete' }
  ];
</script>

<!-- Vertical with descriptions -->
<snice-stepper id="vertical" orientation="vertical"></snice-stepper>
<script>
  document.getElementById('vertical').steps = [
    { label: 'Account', description: 'Create your account' },
    { label: 'Profile', description: 'Personal info' },
    { label: 'Complete', description: 'Finish setup' }
  ];
</script>

<!-- Clickable navigation -->
<snice-stepper id="wizard" clickable></snice-stepper>
<script>
  const wizard = document.getElementById('wizard');
  wizard.steps = [
    { label: 'Cart' },
    { label: 'Delivery' },
    { label: 'Payment' },
    { label: 'Confirm' }
  ];

  wizard.addEventListener('step-change', (e) => {
    console.log(e.detail.previousStep); // Previous step index
    console.log(e.detail.currentStep);  // New step index
    console.log(e.detail.step);         // Step object
    // e.preventDefault(); to cancel navigation
  });
</script>

<!-- Error state -->
<snice-stepper id="validation"></snice-stepper>
<script>
  document.getElementById('validation').steps = [
    { label: 'Upload', status: 'completed' },
    { label: 'Validate', status: 'error' },
    { label: 'Process', status: 'pending' }
  ];
</script>

<!-- Programmatic navigation -->
<script>
  const stepper = document.getElementById('my-stepper');
  stepper.currentStep++; // Next
  stepper.currentStep--; // Previous
  stepper.currentStep = 2; // Go to step 3
</script>
```

## Events

```javascript
// step-change (only in clickable mode)
stepper.addEventListener('step-change', (e) => {
  const { previousStep, currentStep, step } = e.detail;
  e.preventDefault(); // Cancel navigation if needed
});
```

## CSS Parts

```css
::part(container)       /* Main container */
::part(step)            /* Individual step */
::part(step-indicator)  /* Circular indicator */
::part(step-content)    /* Label + description wrapper */
::part(step-label)      /* Step label text */
::part(step-description) /* Description text */
::part(step-connector)  /* Line between steps */
```

## Styling

```css
--snice-color-primary       /* Active state */
--snice-color-success       /* Completed state */
--snice-color-danger        /* Error state */
--snice-color-text
--snice-color-text-secondary /* Pending state */
--snice-color-text-inverse  /* Indicator text */
--snice-color-background
--snice-color-border
--snice-spacing-xs
--snice-spacing-sm
--snice-spacing-md
--snice-spacing-lg
--snice-font-size-xs
--snice-font-size-sm
--snice-font-weight-medium
--snice-font-weight-semibold
--snice-transition-fast
```

## Common Patterns

```html
<!-- Checkout flow -->
<snice-stepper id="checkout" clickable></snice-stepper>
<button onclick="document.getElementById('checkout').currentStep--">Back</button>
<button onclick="document.getElementById('checkout').currentStep++">Next</button>
<script>
  document.getElementById('checkout').steps = [
    { label: 'Cart', description: 'Review items' },
    { label: 'Delivery', description: 'Shipping address' },
    { label: 'Payment', description: 'Billing info' },
    { label: 'Confirm', description: 'Place order' }
  ];
</script>

<!-- Onboarding wizard (vertical) -->
<snice-stepper id="onboarding" orientation="vertical" clickable></snice-stepper>
<script>
  document.getElementById('onboarding').steps = [
    { label: 'Welcome' },
    { label: 'Profile Setup' },
    { label: 'Preferences' },
    { label: 'Get Started' }
  ];
</script>

<!-- Form validation -->
<snice-stepper id="form"></snice-stepper>
<script>
  document.getElementById('form').steps = [
    { label: 'Personal Info', status: 'completed' },
    { label: 'Address', status: 'error' },  // Has validation error
    { label: 'Review', status: 'pending' }
  ];
</script>

<!-- Progress tracker -->
<snice-stepper id="upload"></snice-stepper>
<script>
  const upload = document.getElementById('upload');
  upload.steps = [
    { label: 'Upload', status: 'completed' },
    { label: 'Process', status: 'active' },
    { label: 'Complete', status: 'pending' }
  ];
  upload.currentStep = 1;
</script>
```

## Stepper Panels

```html
<!-- Panels auto show/hide based on currentStep -->
<snice-stepper id="wizard"></snice-stepper>
<snice-stepper-panel>Content for step 0</snice-stepper-panel>
<snice-stepper-panel>Content for step 1</snice-stepper-panel>
<snice-stepper-panel>Content for step 2</snice-stepper-panel>
```

- Panels must be direct children of stepper
- Panel index matches order (first panel = step 0, etc.)
- Automatically activated when stepper.currentStep changes
- Only active panel is visible (display: block), others hidden

## Notes

- Status auto-computed from currentStep if not explicitly set:
  - Steps before currentStep: 'completed' (shows ✓)
  - Step at currentStep: 'active'
  - Steps after currentStep: 'pending'
- Completed steps show checkmark (✓) instead of number
- Connector lines auto-hidden on last step
- Click events only work when clickable=true
- step-change event is cancelable via preventDefault()
- Orientation affects layout but not behavior
- Panels sync automatically via @watch decorator on currentStep
