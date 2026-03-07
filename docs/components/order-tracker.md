<!-- AI: For a low-token version of this doc, use docs/ai/components/order-tracker.md instead -->

# Order Tracker Component

The order tracker component displays an order status timeline with step indicators, tracking information, timestamps, and descriptions. Supports horizontal and vertical layouts.

## Table of Contents
- [Importing](#importing)
- [Properties](#properties)
- [Events](#events)
- [CSS Parts](#css-parts)
- [Basic Usage](#basic-usage)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/order-tracker/snice-order-tracker';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-order-tracker.min.js"></script>
```

## Properties

| Property | Attribute | Type | Default | Description |
|----------|-----------|------|---------|-------------|
| `steps` | — | `OrderStep[]` | `[]` | Timeline steps |
| `trackingNumber` | `tracking-number` | `string` | `''` | Tracking number |
| `carrier` | `carrier` | `string` | `''` | Carrier name (e.g. UPS, FedEx) |
| `variant` | `variant` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout orientation |

### OrderStep Interface

```typescript
interface OrderStep {
  label: string;                                     // Step label
  status: 'pending' | 'active' | 'completed';       // Step status
  timestamp?: string;                                // When the step occurred
  description?: string;                              // Additional details
  icon?: string;                                     // Custom icon (reserved for future use)
}
```

## Events

#### `step-click`
Fired when a step is clicked.

**Event Detail:**
```typescript
{
  step: OrderStep;   // The clicked step
  index: number;     // Step index (0-based)
}
```

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | The outer tracker container |
| `info` | Tracking info section |
| `steps` | Steps container |
| `step` | Individual step |
| `step-indicator` | Step circle indicator |
| `step-content` | Step label and details |

## Basic Usage

```html
<snice-order-tracker></snice-order-tracker>
```

```typescript
import 'snice/components/order-tracker/snice-order-tracker';
```

## Examples

### Order In Transit

A typical order tracking timeline with the shipment in transit.

```html
<snice-order-tracker
  id="tracker"
  tracking-number="1Z999AA10123456784"
  carrier="UPS">
</snice-order-tracker>

<script type="module">
  import 'snice/components/order-tracker/snice-order-tracker';

  const tracker = document.getElementById('tracker');
  tracker.steps = [
    { label: 'Ordered', status: 'completed', timestamp: 'Feb 20, 2026 9:15 AM', description: 'Order placed successfully' },
    { label: 'Confirmed', status: 'completed', timestamp: 'Feb 20, 2026 9:30 AM' },
    { label: 'Shipped', status: 'active', timestamp: 'Feb 22, 2026 2:00 PM', description: 'Package left the warehouse' },
    { label: 'Out for Delivery', status: 'pending' },
    { label: 'Delivered', status: 'pending' }
  ];
</script>
```

### Delivered Order

All steps completed indicates the order has been delivered.

```html
<snice-order-tracker id="delivered-tracker"></snice-order-tracker>

<script type="module">
  const tracker = document.getElementById('delivered-tracker');
  tracker.steps = [
    { label: 'Ordered', status: 'completed', timestamp: 'Feb 15, 2026' },
    { label: 'Confirmed', status: 'completed', timestamp: 'Feb 15, 2026' },
    { label: 'Shipped', status: 'completed', timestamp: 'Feb 17, 2026' },
    { label: 'Out for Delivery', status: 'completed', timestamp: 'Feb 19, 2026' },
    { label: 'Delivered', status: 'completed', timestamp: 'Feb 19, 2026', description: 'Left at front door' }
  ];
</script>
```

### Vertical Layout

Use `variant="vertical"` for a top-to-bottom timeline, ideal for sidebars or detailed tracking.

```html
<snice-order-tracker id="vertical-tracker" variant="vertical"></snice-order-tracker>

<script type="module">
  const tracker = document.getElementById('vertical-tracker');
  tracker.steps = [
    { label: 'Order Placed', status: 'completed', timestamp: 'Feb 24, 2026 10:00 AM', description: 'Your order has been received' },
    { label: 'Payment Confirmed', status: 'completed', timestamp: 'Feb 24, 2026 10:05 AM', description: 'Payment processed successfully' },
    { label: 'Preparing Order', status: 'active', timestamp: 'Feb 24, 2026 11:30 AM', description: 'Your items are being packed' },
    { label: 'Ready for Pickup', status: 'pending' },
    { label: 'Picked Up', status: 'pending' }
  ];
</script>
```

### Step Click Handling

```html
<snice-order-tracker id="clickable-tracker"></snice-order-tracker>

<script type="module">
  const tracker = document.getElementById('clickable-tracker');
  tracker.steps = [
    { label: 'Ordered', status: 'completed', timestamp: 'Feb 20, 2026' },
    { label: 'Shipped', status: 'active', timestamp: 'Feb 22, 2026' },
    { label: 'Delivered', status: 'pending' }
  ];

  tracker.addEventListener('step-click', (e) => {
    const { step, index } = e.detail;
    console.log(`Clicked step ${index}: ${step.label} (${step.status})`);
  });
</script>
```

## Accessibility

- **Semantic structure**: Steps are rendered as a list with `role="list"` and `role="listitem"`
- **Keyboard navigation**: Each step is focusable and activatable with Enter or Space
- **Visual indicators**: Completed steps show a checkmark, active steps are highlighted with a ring, pending steps show their number
- **Status communication**: Step status is conveyed through color and iconography, not color alone
