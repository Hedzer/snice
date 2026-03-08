<!-- AI: For a low-token version of this doc, use docs/ai/components/checkbox.md instead -->

# Checkbox Component

The checkbox component provides a checkbox input with support for checked, indeterminate, and invalid states, multiple sizes, and full keyboard accessibility.

## Table of Contents
- [Properties](#properties)
- [Methods](#methods)
- [Events](#events)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Form Integration](#form-integration)
- [Accessibility](#accessibility)
- [Browser Support](#browser-support)
- [Common Patterns](#common-patterns)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `checked` | `boolean` | `false` | Whether the checkbox is checked |
| `indeterminate` | `boolean` | `false` | Show indeterminate (partial) state |
| `disabled` | `boolean` | `false` | Disable the checkbox |
| `required` | `boolean` | `false` | Mark as required field |
| `invalid` | `boolean` | `false` | Show invalid state styling |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Checkbox size |
| `name` | `string` | `''` | Form field name |
| `value` | `string` | `'on'` | Form field value when checked |
| `label` | `string` | `''` | Label text |
| `loading` | `boolean` | `false` | Show loading spinner |

## Methods

#### `focus(): void`
Focus the checkbox programmatically.

```typescript
checkbox.focus();
```

#### `blur(): void`
Remove focus from the checkbox.

```typescript
checkbox.blur();
```

#### `click(): void`
Programmatically click the checkbox.

```typescript
checkbox.click();
```

#### `toggle(): void`
Toggle the checked state.

```typescript
checkbox.toggle();
```

#### `setIndeterminate(): void`
Set the checkbox to indeterminate state.

```typescript
checkbox.setIndeterminate();
```

## Events

#### `checkbox-change`
Fired when the checkbox state changes.

**Event Detail:**
```typescript
{
  checked: boolean;
  indeterminate: boolean;
  checkbox: SniceCheckboxElement;
}
```

**Usage:**
```typescript
checkbox.addEventListener('change', (e) => {
  console.log('Checked:', e.detail.checked);
  console.log('Indeterminate:', e.detail.indeterminate);
});
```

## CSS Parts

| Part | Description |
|------|-------------|
| `input` | Hidden checkbox input |
| `checkbox` | Custom checkbox element |
| `spinner` | Loading spinner |
| `label` | Label text |

## Basic Usage

```html
<snice-checkbox label="Accept terms and conditions"></snice-checkbox>
```

```typescript
import 'snice/components/checkbox/snice-checkbox';
```

## Examples

### Basic Checkbox

```html
<!-- Unchecked checkbox -->
<snice-checkbox label="Subscribe to newsletter"></snice-checkbox>

<!-- Checked checkbox -->
<snice-checkbox label="I agree to the terms" checked></snice-checkbox>

<!-- Checkbox without label -->
<snice-checkbox></snice-checkbox>
```

### Checkbox Sizes

```html
<snice-checkbox label="Small checkbox" size="small"></snice-checkbox>
<snice-checkbox label="Medium checkbox" size="medium"></snice-checkbox>
<snice-checkbox label="Large checkbox" size="large"></snice-checkbox>
```

### Checkbox States

```html
<!-- Checked -->
<snice-checkbox label="Checked" checked></snice-checkbox>

<!-- Indeterminate (partial selection) -->
<snice-checkbox label="Indeterminate" indeterminate></snice-checkbox>

<!-- Disabled -->
<snice-checkbox label="Disabled" disabled></snice-checkbox>

<!-- Disabled and checked -->
<snice-checkbox label="Disabled checked" checked disabled></snice-checkbox>

<!-- Required -->
<snice-checkbox label="Required field" required></snice-checkbox>

<!-- Invalid -->
<snice-checkbox label="Invalid" invalid></snice-checkbox>
```

### Form Integration

```html
<form id="signup-form">
  <snice-checkbox
    name="terms"
    value="accepted"
    label="I accept the terms and conditions"
    required>
  </snice-checkbox>

  <snice-checkbox
    name="newsletter"
    value="yes"
    label="Subscribe to newsletter">
  </snice-checkbox>

  <snice-checkbox
    name="marketing"
    value="yes"
    label="Receive marketing emails">
  </snice-checkbox>

  <button type="submit">Sign Up</button>
</form>

```

```typescript
import 'snice/components/checkbox/snice-checkbox';

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(form);

  console.log('Terms accepted:', formData.get('terms'));
  console.log('Newsletter:', formData.get('newsletter'));
  console.log('Marketing:', formData.get('marketing'));
});
```

### Select All Pattern

```html
<snice-checkbox id="select-all" label="Select all items"></snice-checkbox>

<div style="margin-left: 2rem;">
  <snice-checkbox class="item-checkbox" label="Item 1" value="item1"></snice-checkbox>
  <snice-checkbox class="item-checkbox" label="Item 2" value="item2"></snice-checkbox>
  <snice-checkbox class="item-checkbox" label="Item 3" value="item3"></snice-checkbox>
  <snice-checkbox class="item-checkbox" label="Item 4" value="item4"></snice-checkbox>
</div>

```

```typescript
// Handle select all change
selectAll.addEventListener('change', (e) => {
    items.forEach(item => {
      item.checked = e.detail.checked;
    });
  });

  // Handle individual item change
  items.forEach(item => {
    item.addEventListener('change', () => {
      updateSelectAllState();
    });
  });

  function updateSelectAllState() {
    const checkedCount = items.filter(item => item.checked).length;

    if (checkedCount === 0) {
      selectAll.checked = false;
      selectAll.indeterminate = false;
    } else if (checkedCount === items.length) {
      selectAll.checked = true;
      selectAll.indeterminate = false;
    } else {
      selectAll.checked = false;
      selectAll.indeterminate = true;
    }
  }

  // Initialize state
  updateSelectAllState();
```

### Checkbox Group

```html
<fieldset>
  <legend>Select your interests</legend>

  <div style="display: flex; flex-direction: column; gap: 0.5rem;">
    <snice-checkbox name="interests" value="technology" label="Technology"></snice-checkbox>
    <snice-checkbox name="interests" value="design" label="Design"></snice-checkbox>
    <snice-checkbox name="interests" value="business" label="Business"></snice-checkbox>
    <snice-checkbox name="interests" value="marketing" label="Marketing"></snice-checkbox>
    <snice-checkbox name="interests" value="finance" label="Finance"></snice-checkbox>
  </div>
</fieldset>
```

### Agreement Checkboxes

```html
<form id="agreement-form">
  <div style="display: flex; flex-direction: column; gap: 1rem;">
    <snice-checkbox
      id="terms-cb"
      name="terms"
      label="I have read and agree to the Terms of Service"
      required>
    </snice-checkbox>

    <snice-checkbox
      id="privacy-cb"
      name="privacy"
      label="I have read and agree to the Privacy Policy"
      required>
    </snice-checkbox>

    <snice-checkbox
      id="age-cb"
      name="age"
      label="I confirm that I am at least 18 years old"
      required>
    </snice-checkbox>

    <snice-checkbox
      name="updates"
      label="I want to receive product updates and news (optional)">
    </snice-checkbox>
  </div>

  <button type="submit" style="margin-top: 1rem;">Continue</button>
</form>

```

```typescript
form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Validate required checkboxes
    let allValid = true;
    requiredCheckboxes.forEach(cb => {
      if (!cb.checked) {
        cb.invalid = true;
        allValid = false;
      } else {
        cb.invalid = false;
      }
    });

    if (allValid) {
      console.log('All agreements accepted');
      // Submit form
    } else {
      alert('Please accept all required agreements');
    }
  });

  // Clear invalid state when checked
  requiredCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) {
        cb.invalid = false;
      }
    });
  });
```

### Settings Checkboxes

```html
<style>
  .settings-section {
    margin-bottom: 2rem;
  }

  .settings-section h3 {
    margin-bottom: 1rem;
    font-size: 1.125rem;
    font-weight: 600;
  }

  .checkbox-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
</style>

<div class="settings-section">
  <h3>Notification Settings</h3>
  <div class="checkbox-list">
    <snice-checkbox
      name="email-notifications"
      label="Email notifications"
      checked>
    </snice-checkbox>
    <snice-checkbox
      name="push-notifications"
      label="Push notifications"
      checked>
    </snice-checkbox>
    <snice-checkbox
      name="sms-notifications"
      label="SMS notifications">
    </snice-checkbox>
  </div>
</div>

<div class="settings-section">
  <h3>Privacy Settings</h3>
  <div class="checkbox-list">
    <snice-checkbox
      name="profile-public"
      label="Make my profile public">
    </snice-checkbox>
    <snice-checkbox
      name="show-email"
      label="Show my email address">
    </snice-checkbox>
    <snice-checkbox
      name="show-activity"
      label="Show my activity status"
      checked>
    </snice-checkbox>
  </div>
</div>
```

### Checkbox with Description

```html
<style>
  .checkbox-with-description {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .checkbox-item {
    display: flex;
    align-items: start;
    gap: 0.75rem;
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
  }

  .checkbox-item:hover {
    background: #f9fafb;
  }

  .checkbox-content {
    flex: 1;
  }

  .checkbox-content h4 {
    margin: 0 0 0.25rem;
    font-weight: 600;
  }

  .checkbox-content p {
    margin: 0;
    color: #6b7280;
    font-size: 0.875rem;
  }
</style>

<div class="checkbox-with-description">
  <div class="checkbox-item">
    <snice-checkbox name="feature1" value="analytics"></snice-checkbox>
    <div class="checkbox-content">
      <h4>Advanced Analytics</h4>
      <p>Get detailed insights into your data with customizable dashboards and reports.</p>
    </div>
  </div>

  <div class="checkbox-item">
    <snice-checkbox name="feature2" value="api"></snice-checkbox>
    <div class="checkbox-content">
      <h4>API Access</h4>
      <p>Integrate with your applications using our comprehensive REST API.</p>
    </div>
  </div>

  <div class="checkbox-item">
    <snice-checkbox name="feature3" value="support"></snice-checkbox>
    <div class="checkbox-content">
      <h4>Priority Support</h4>
      <p>Get help when you need it with 24/7 priority email and chat support.</p>
    </div>
  </div>
</div>
```

### Task List

```html
<style>
  .task-list {
    max-width: 500px;
  }

  .task-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .task-item.completed {
    opacity: 0.6;
  }

  .task-item.completed .task-text {
    text-decoration: line-through;
  }

  .task-text {
    flex: 1;
  }
</style>

<div class="task-list">
  <h3>Today's Tasks</h3>

  <div class="task-item">
    <snice-checkbox class="task-cb" data-task="1"></snice-checkbox>
    <span class="task-text">Review pull requests</span>
  </div>

  <div class="task-item">
    <snice-checkbox class="task-cb" data-task="2"></snice-checkbox>
    <span class="task-text">Update documentation</span>
  </div>

  <div class="task-item completed">
    <snice-checkbox class="task-cb" data-task="3" checked></snice-checkbox>
    <span class="task-text">Fix bug in authentication</span>
  </div>

  <div class="task-item">
    <snice-checkbox class="task-cb" data-task="4"></snice-checkbox>
    <span class="task-text">Deploy to production</span>
  </div>
</div>

```

```typescript
taskCheckboxes.forEach(cb => {
  cb.addEventListener('change', (e) => {
    const taskItem = cb.closest('.task-item');
    if (e.detail.checked) {
      taskItem?.classList.add('completed');
    } else {
      taskItem?.classList.remove('completed');
    }
  });
});
```

### Filter Checkboxes

```html
<style>
  .filter-panel {
    max-width: 250px;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 0.5rem;
  }

  .filter-section {
    margin-bottom: 1.5rem;
  }

  .filter-section:last-child {
    margin-bottom: 0;
  }

  .filter-title {
    font-weight: 600;
    margin-bottom: 0.75rem;
  }

  .filter-options {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
</style>

<div class="filter-panel">
  <div class="filter-section">
    <div class="filter-title">Category</div>
    <div class="filter-options">
      <snice-checkbox name="category" value="electronics" label="Electronics" size="small"></snice-checkbox>
      <snice-checkbox name="category" value="clothing" label="Clothing" size="small"></snice-checkbox>
      <snice-checkbox name="category" value="books" label="Books" size="small"></snice-checkbox>
      <snice-checkbox name="category" value="home" label="Home & Garden" size="small"></snice-checkbox>
    </div>
  </div>

  <div class="filter-section">
    <div class="filter-title">Price Range</div>
    <div class="filter-options">
      <snice-checkbox name="price" value="under-25" label="Under $25" size="small"></snice-checkbox>
      <snice-checkbox name="price" value="25-50" label="$25 - $50" size="small"></snice-checkbox>
      <snice-checkbox name="price" value="50-100" label="$50 - $100" size="small"></snice-checkbox>
      <snice-checkbox name="price" value="over-100" label="Over $100" size="small"></snice-checkbox>
    </div>
  </div>

  <div class="filter-section">
    <div class="filter-title">Features</div>
    <div class="filter-options">
      <snice-checkbox name="features" value="free-shipping" label="Free Shipping" size="small"></snice-checkbox>
      <snice-checkbox name="features" value="on-sale" label="On Sale" size="small"></snice-checkbox>
      <snice-checkbox name="features" value="new" label="New Arrivals" size="small"></snice-checkbox>
    </div>
  </div>
</div>
```

### Dynamic Checkbox Creation

```html
<div id="permissions-container"></div>

```

```typescript
import 'snice/components/checkbox/snice-checkbox';

const permissions = [
  { name: 'read', label: 'Read', checked: true },
  { name: 'write', label: 'Write', checked: true },
  { name: 'delete', label: 'Delete', checked: false },
  { name: 'admin', label: 'Administrator', checked: false }
];

permissions.forEach(perm => {
  const checkbox = document.createElement('snice-checkbox');
  checkbox.name = 'permissions';
  checkbox.value = perm.name;
  checkbox.label = perm.label;
  checkbox.checked = perm.checked;

  checkbox.addEventListener('change', (e) => {
    console.log(`${perm.label} permission:`, e.detail.checked);
  });

  container.appendChild(checkbox);
});
```

### Validation Example

```html
<form id="validation-form">
  <snice-checkbox
    id="consent-cb"
    name="consent"
    label="I consent to data processing"
    required>
  </snice-checkbox>

  <div id="error-message" style="color: #ef4444; font-size: 0.875rem; margin-top: 0.5rem; display: none;">
    You must consent to continue
  </div>

  <button type="submit" style="margin-top: 1rem;">Submit</button>
</form>

```

```typescript
form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!checkbox.checked) {
      checkbox.invalid = true;
      errorMessage.style.display = 'block';
    } else {
      checkbox.invalid = false;
      errorMessage.style.display = 'none';
      console.log('Form submitted');
    }
  });

  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      checkbox.invalid = false;
      errorMessage.style.display = 'none';
    }
  });
```

## Form Integration

The checkbox component is not form-associated (no `ElementInternals`). Use a hidden input or listen for `checkbox-change` events to integrate with forms:

```html
<form>
  <snice-checkbox name="newsletter" value="yes"></snice-checkbox>
  <!-- FormData will include: newsletter=yes when checked -->
</form>
```

## Accessibility

- **Form-associated**: Full form integration as native element
- **Keyboard support**: Space to toggle, Tab to navigate
- **ARIA attributes**: Proper `aria-checked` (including "mixed" for indeterminate)
- **Screen reader friendly**: Label association and state announcements
- **Focus indicators**: Clear focus states for keyboard navigation
- **Invalid state**: `aria-invalid` for validation errors

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires Custom Elements v1, Shadow DOM, and Form-Associated Custom Elements support

## Common Patterns

### Single Checkbox
```html
<snice-checkbox label="I agree to the terms" required></snice-checkbox>
```

### Checkbox Group
```html
<snice-checkbox name="option" value="1" label="Option 1"></snice-checkbox>
<snice-checkbox name="option" value="2" label="Option 2"></snice-checkbox>
```

### Select All
```html
<snice-checkbox id="select-all" label="Select all" indeterminate></snice-checkbox>
```

### Required Field
```html
<snice-checkbox label="Required" required invalid></snice-checkbox>
```
