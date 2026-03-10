# snice-order-tracker

Order status timeline with step indicators, tracking info, timestamps, and descriptions.

## Properties

```typescript
steps: OrderStep[] = [];                              // attr: none (JS only)
trackingNumber: string = '';                           // attr: tracking-number
carrier: string = '';
variant: 'horizontal'|'vertical' = 'horizontal';
```

## Events

- `step-click` → `{ step: OrderStep, index: number }` - Step clicked

## CSS Parts

- `base` - Outer tracker container
- `info` - Tracking info section (carrier, tracking number)
- `steps` - Steps container
- `step` - Individual step
- `step-indicator` - Step number/check icon
- `step-content` - Step label, timestamp, description

## Basic Usage

```html
<snice-order-tracker tracking-number="1Z999AA10123456784" carrier="UPS"></snice-order-tracker>
```

```typescript
import 'snice/components/order-tracker/snice-order-tracker';

tracker.steps = [
  { label: 'Ordered', status: 'completed', timestamp: 'Feb 20, 2026' },
  { label: 'Shipped', status: 'active', timestamp: 'Feb 22, 2026', description: 'Package left warehouse' },
  { label: 'Delivered', status: 'pending' }
];

tracker.addEventListener('step-click', (e) => {
  console.log(e.detail.step.label, e.detail.index);
});
```

## Accessibility

- Steps use `role="list"` / `role="listitem"`
- Steps are keyboard-focusable with Enter/Space activation
- Completed steps show check icons

## Types

```typescript
type OrderStepStatus = 'pending' | 'active' | 'completed';
interface OrderStep {
  label: string;
  status: OrderStepStatus;
  timestamp?: string;
  description?: string;
  icon?: string;
}
```
