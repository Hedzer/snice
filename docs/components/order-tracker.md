<!-- AI: For the AI-optimized version of this doc, see docs/ai/components/order-tracker.md -->

# Order Tracker
`<snice-order-tracker>`

An order status timeline with step indicators, tracking info, timestamps, and descriptions.

## Table of Contents
- [Properties](#properties)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)
- [Data Types](#data-types)

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `steps` | `OrderStep[]` | `[]` | Timeline steps (set via JS) |
| `trackingNumber` (attr: `tracking-number`) | `string` | `''` | Tracking number |
| `carrier` | `string` | `''` | Carrier name (e.g. UPS, FedEx) |
| `variant` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout orientation |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `step-click` | `{ step: OrderStep, index: number }` | Fired when a step is clicked |

## CSS Parts

Style internal elements from outside the shadow DOM using `::part()`.

| Part | Element | Description |
|------|---------|-------------|
| `base` | `<div>` | The outer tracker container |
| `info` | `<div>` | Tracking info section (carrier, tracking number) |
| `steps` | `<div>` | The steps container |
| `step` | `<div>` | An individual step |
| `step-indicator` | `<div>` | Step number or check icon |
| `step-content` | `<div>` | Step label, timestamp, and description |

## Basic Usage

```typescript
import 'snice/components/order-tracker/snice-order-tracker';
```

```html
<snice-order-tracker id="tracker" tracking-number="1Z999AA10123456784" carrier="UPS"></snice-order-tracker>

<script type="module">
  const tracker = document.getElementById('tracker');
  tracker.steps = [
    { label: 'Ordered', status: 'completed', timestamp: 'Feb 20, 2026' },
    { label: 'Confirmed', status: 'completed', timestamp: 'Feb 20, 2026' },
    { label: 'Shipped', status: 'active', timestamp: 'Feb 22, 2026', description: 'Package left the warehouse' },
    { label: 'Out for Delivery', status: 'pending' },
    { label: 'Delivered', status: 'pending' }
  ];
</script>
```

## Examples

### Vertical Layout

Use `variant="vertical"` for a top-to-bottom timeline.

```html
<snice-order-tracker id="tracker" variant="vertical"></snice-order-tracker>

<script type="module">
  const tracker = document.getElementById('tracker');
  tracker.steps = [
    { label: 'Order Placed', status: 'completed', timestamp: 'Feb 24, 2026', description: 'Your order has been received' },
    { label: 'Payment Confirmed', status: 'completed', timestamp: 'Feb 24, 2026' },
    { label: 'Preparing Order', status: 'active', timestamp: 'Feb 24, 2026', description: 'Your items are being packed' },
    { label: 'Ready for Pickup', status: 'pending' }
  ];
</script>
```

### Delivered Order

All steps completed indicates the order has been delivered.

```typescript
tracker.steps = [
  { label: 'Ordered', status: 'completed', timestamp: 'Feb 15, 2026' },
  { label: 'Shipped', status: 'completed', timestamp: 'Feb 17, 2026' },
  { label: 'Delivered', status: 'completed', timestamp: 'Feb 19, 2026', description: 'Left at front door' }
];
```

### Event Handling

Listen for `step-click` to handle step interactions.

```typescript
tracker.addEventListener('step-click', (e) => {
  const { step, index } = e.detail;
  console.log(`Clicked step ${index}: ${step.label} (${step.status})`);
});
```

## Accessibility

- Steps are rendered as a list with `role="list"` and `role="listitem"`
- Each step is focusable with `tabindex="0"` and activatable with Enter or Space
- Completed steps show a checkmark icon
- Active steps are highlighted with a ring indicator
- Status is conveyed through color and iconography

## Data Types

```typescript
type OrderStepStatus = 'pending' | 'active' | 'completed';

interface OrderStep {
  label: string;                    // Step label text
  status: OrderStepStatus;         // Current step status
  timestamp?: string;              // Display timestamp
  description?: string;            // Additional description text
  icon?: string;                   // Custom icon
}
```
