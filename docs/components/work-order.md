[//]: # (AI: For a low-token version of this doc, use docs/ai/components/work-order.md instead)

# Work Order
`<snice-work-order>`

A service/maintenance work order component for tracking jobs, tasks, parts, labor, and sign-off. Ideal for field service, maintenance management, and job tracking applications.

## Features

- **Header with WO#, Date, Priority, Status**: Clear identification and status at a glance
- **Customer Information**: Name, address, phone, and email display
- **Scope of Work**: Description text for the job
- **Task Checklist**: Interactive checkable items with assignee and hours tracking
- **Parts & Materials Table**: Itemized list with quantities and costs
- **Time Tracking**: Labor hours and rate calculations
- **Signature Slot**: Custom sign-off area
- **Cost Totals**: Auto-computed parts + labor totals
- **Compact Variant**: Reduced spacing for dense layouts
- **Print-Friendly**: Optimized for printing

## Basic Usage

```html
<snice-work-order
  wo-number="WO-2024-001"
  date="2024-03-15"
  priority="high"
  status="open">
</snice-work-order>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/work-order/snice-work-order';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-work-order.min.js"></script>
```

## Examples

### Complete Work Order

Set up a full work order with customer, tasks, parts, and labor tracking.

```html
<snice-work-order
  wo-number="WO-2024-001"
  date="2024-03-15"
  priority="high"
  status="in-progress">
</snice-work-order>

<script>
  const wo = document.querySelector('snice-work-order');

  wo.customer = {
    name: 'Acme Corp',
    address: '123 Main St, Springfield',
    phone: '555-123-4567',
    email: 'facilities@acme.com'
  };

  wo.description = 'Replace HVAC system on 3rd floor. Remove existing unit and install new energy-efficient model.';

  wo.tasks = [
    { description: 'Disconnect old HVAC unit', assignee: 'John Smith', completed: true, hours: 2 },
    { description: 'Remove old ductwork', assignee: 'John Smith', completed: true, hours: 3 },
    { description: 'Install new compressor unit', assignee: 'Jane Doe', completed: false, hours: 4 },
    { description: 'Connect new ductwork', assignee: 'Jane Doe', completed: false, hours: 3 },
    { description: 'Test system', completed: false, hours: 1 }
  ];

  wo.parts = [
    { name: 'HVAC Compressor Unit', partNumber: 'HV-5000', quantity: 1, unitCost: 2450 },
    { name: 'Air Filter (HEPA)', partNumber: 'AF-100', quantity: 4, unitCost: 35 },
    { name: 'Copper Tubing (10ft)', partNumber: 'CT-010', quantity: 3, unitCost: 28 },
    { name: 'Refrigerant (R-410A)', partNumber: 'RF-410', quantity: 2, unitCost: 85 }
  ];

  wo.laborRate = 75;
  wo.notes = 'Customer prefers morning appointments (before 10am). Building access code: 4521.';
</script>
```

### Priority Levels

Use the `priority` attribute to indicate urgency.

```html
<snice-work-order priority="low" wo-number="WO-001"></snice-work-order>
<snice-work-order priority="medium" wo-number="WO-002"></snice-work-order>
<snice-work-order priority="high" wo-number="WO-003"></snice-work-order>
<snice-work-order priority="urgent" wo-number="WO-004"></snice-work-order>
```

### Status States

Use the `status` attribute to show the work order's progress.

```html
<snice-work-order status="open" wo-number="WO-001"></snice-work-order>
<snice-work-order status="in-progress" wo-number="WO-002"></snice-work-order>
<snice-work-order status="completed" wo-number="WO-003"></snice-work-order>
<snice-work-order status="cancelled" wo-number="WO-004"></snice-work-order>
```

### Compact Variant

Use `variant="compact"` for reduced spacing in dense layouts.

```html
<snice-work-order
  wo-number="WO-2024-001"
  date="2024-03-15"
  priority="medium"
  status="open"
  variant="compact">
</snice-work-order>
```

### Handling Events

Listen for task toggles, status changes, and sign-off events.

```html
<script>
  const wo = document.querySelector('snice-work-order');

  wo.addEventListener('task-toggle', (e) => {
    console.log(`Task ${e.detail.index}: ${e.detail.completed ? 'completed' : 'reopened'}`);
  });

  wo.addEventListener('wo-sign', (e) => {
    console.log(`Work order ${e.detail.woNumber} signed at ${e.detail.timestamp}`);
  });

  // Export work order data
  const data = wo.toJSON();
  console.log('Total cost:', data.totalCost);
</script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `woNumber` (attr: `wo-number`) | `string` | `''` | Work order number |
| `date` | `string` | `''` | Date of the work order |
| `priority` | `'low' \| 'medium' \| 'high' \| 'urgent'` | `'medium'` | Priority level |
| `status` | `'open' \| 'in-progress' \| 'completed' \| 'cancelled'` | `'open'` | Current status |
| `customer` | `WorkOrderCustomer \| null` | `null` | Customer info object |
| `description` | `string` | `''` | Scope of work text |
| `tasks` | `WorkOrderTask[]` | `[]` | Task checklist items |
| `parts` | `WorkOrderPart[]` | `[]` | Parts and materials list |
| `laborRate` (attr: `labor-rate`) | `number` | `0` | Hourly labor rate |
| `notes` | `string` | `''` | Additional notes |
| `variant` | `'standard' \| 'compact'` | `'standard'` | Layout variant |

## Slots

| Name | Description |
|------|-------------|
| `signature` | Custom signature content (canvas, image, etc.) |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `task-toggle` | `{ index, task, completed }` | Fired when a task checkbox is toggled |
| `status-change` | `{ previousStatus, status }` | Fired when the work order status changes |
| `wo-sign` | `{ woNumber, timestamp }` | Fired when the sign button is clicked |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `print()` | -- | Triggers the browser print dialog |
| `toJSON()` | -- | Returns a full JSON representation including computed totals |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Main container |
| `header` | Header section |
| `wo-number` | Work order number heading |
| `date` | Date display |
| `priority` | Priority badge |
| `status` | Status badge |
| `customer-section` | Customer info block |
| `customer` | Customer data grid |
| `description-section` | Description block |
| `description` | Description text |
| `tasks-section` | Tasks block |
| `task` | Individual task row |
| `task-checkbox` | Task checkbox button |
| `parts-section` | Parts block |
| `parts-table` | Parts table |
| `parts-total` | Parts subtotal row |
| `time-section` | Time tracking block |
| `time` | Time tracking data grid |
| `notes-section` | Notes block |
| `notes` | Notes text |
| `signature-section` | Signature block |
| `sign-button` | Sign work order button |
| `footer` | Totals footer |
| `totals` | Cost totals breakdown |

## Type Interfaces

```typescript
interface WorkOrderCustomer {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface WorkOrderTask {
  description: string;
  assignee?: string;
  completed?: boolean;
  hours?: number;
}

interface WorkOrderPart {
  name: string;
  partNumber?: string;
  quantity: number;
  unitCost: number;
}
```

## Best Practices

1. **Use meaningful WO numbers**: Follow a consistent numbering scheme (e.g., WO-YYYY-NNN)
2. **Assign tasks to people**: Include assignees for accountability
3. **Track hours per task**: Enables accurate labor cost computation
4. **Include part numbers**: Makes reordering and inventory management easier
5. **Set labor rate**: Enables automatic total cost calculation
6. **Use the signature slot**: Integrate with a canvas component for digital signatures

## Accessibility

- Task checkboxes are keyboard-accessible buttons with aria-labels
- Priority and status badges use color + text for identification
- Proper heading hierarchy with section titles
- Print styles preserve visual state
