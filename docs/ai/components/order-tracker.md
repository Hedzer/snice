# snice-order-tracker

Order status timeline with step indicators, tracking info, timestamps, and descriptions.

## Properties

```ts
steps: OrderStep[] = [];                              // Timeline steps
trackingNumber: string = '';                           // Tracking number (attr: tracking-number)
carrier: string = '';                                  // Carrier name
variant: 'horizontal' | 'vertical' = 'horizontal';    // Layout orientation
```

### Types

```ts
interface OrderStep {
  label: string;
  status: 'pending' | 'active' | 'completed';
  timestamp?: string;
  description?: string;
  icon?: string;
}
```

## Events

- `step-click` -> `{ step: OrderStep; index: number }`

## CSS Parts

`base`, `info`, `steps`, `step`, `step-indicator`, `step-content`

## Usage

```html
<snice-order-tracker
  tracking-number="1Z999AA10123456784"
  carrier="UPS">
</snice-order-tracker>
```

```js
const tracker = document.querySelector('snice-order-tracker');
tracker.steps = [
  { label: 'Ordered', status: 'completed', timestamp: 'Feb 20, 2026' },
  { label: 'Confirmed', status: 'completed', timestamp: 'Feb 20, 2026' },
  { label: 'Shipped', status: 'active', timestamp: 'Feb 22, 2026', description: 'Package left the warehouse' },
  { label: 'Out for Delivery', status: 'pending' },
  { label: 'Delivered', status: 'pending' }
];

tracker.addEventListener('step-click', (e) => {
  console.log(e.detail.step.label, e.detail.index);
});
```
