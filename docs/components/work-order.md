[//]: # (AI: For a low-token version of this doc, use docs/ai/components/work-order.md instead)

# Work Order
`<snice-work-order>`

A professional work order component for tracking jobs, tasks, parts, labor, equipment, and sign-off. Supports five layout variants, optional QR codes, and print-optimized output.

## Features

- **Header with WO#, dates, priority, status**: Clear identification at a glance
- **Customer information**: Name, address, phone, and email display
- **Asset/equipment tracking**: ID, name, location, serial, last service date
- **Scope of work**: Description text for the job
- **Task checklist**: Interactive checkable items with assignee and hours tracking
- **Parts & materials table**: Itemized list with part numbers, quantities, and costs
- **Labor tracking**: Hours, rate, and cost calculations
- **Signature area**: Lines for signature + date, custom slot, and digital sign button
- **Cost summary**: Auto-computed parts + labor totals with grand total
- **5 variants**: Standard, compact, field-service, maintenance, detailed
- **QR code support**: Configurable position with slot for any QR library
- **Print-friendly**: B&W badges, clear checkboxes, signature lines, page break management

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

Set up a full work order with customer, asset, tasks, parts, and labor tracking.

```html
<snice-work-order
  wo-number="WO-2024-001"
  date="2024-03-15"
  due-date="2024-03-20"
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

  wo.asset = {
    id: 'HVAC-301',
    name: 'Rooftop HVAC Unit',
    location: '3rd Floor',
    serial: 'SN-2019-4521',
    lastService: '2024-01-15'
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

### Variants

Use the `variant` attribute to change the work order's layout and visual style.

#### Standard
Clean, structured service work order. The default variant.

```html
<snice-work-order variant="standard" wo-number="WO-001"></snice-work-order>
```

#### Compact
Dense layout with reduced spacing for quick reference.

```html
<snice-work-order variant="compact" wo-number="WO-001"></snice-work-order>
```

#### Field Service
Optimized for technicians with big checkboxes, bordered task cards, and a prominent signature area.

```html
<snice-work-order variant="field-service" wo-number="WO-001"></snice-work-order>
```

#### Maintenance
Equipment-focused layout with a highlighted asset section. Ideal for maintenance management.

```html
<snice-work-order variant="maintenance" wo-number="WO-001"></snice-work-order>
```

#### Detailed
Full accounting view with monospace part numbers, wider cost summary, and emphasized labor breakdown.

```html
<snice-work-order variant="detailed" wo-number="WO-001"></snice-work-order>
```

### QR Code

Add a QR code by setting `show-qr` and providing content via the `qr` slot.

```html
<snice-work-order
  wo-number="WO-2024-001"
  show-qr
  qr-data="https://app.example.com/wo/2024-001"
  qr-position="top-right">
  <img slot="qr" src="qr-code.png" width="80" height="80" alt="QR Code" />
</snice-work-order>
```

QR positions: `top-right` (overlaid on header), `header` (inline in header), `footer` (in footer area).

### Asset/Equipment Tracking

Use the `asset` property for equipment-focused work orders.

```html
<script>
  const wo = document.querySelector('snice-work-order');
  wo.asset = {
    id: 'HVAC-301',
    name: 'Rooftop HVAC Unit',
    location: '3rd Floor, Building A',
    serial: 'SN-2019-4521',
    lastService: '2024-01-15'
  };
</script>
```

### Handling Events

Listen for task toggles, status changes, and sign-off events.

```html
<script>
  const wo = document.querySelector('snice-work-order');

  wo.addEventListener('task-toggle', (e) => {
    console.log(`Task ${e.detail.index}: ${e.detail.completed ? 'completed' : 'reopened'}`);
  });

  wo.addEventListener('status-change', (e) => {
    console.log(`Status: ${e.detail.previousStatus} -> ${e.detail.status}`);
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
| `dueDate` (attr: `due-date`) | `string` | `''` | Due date |
| `priority` | `'low' \| 'medium' \| 'high' \| 'urgent'` | `'medium'` | Priority level |
| `status` | `'open' \| 'in-progress' \| 'completed' \| 'cancelled'` | `'open'` | Current status |
| `customer` | `WorkOrderCustomer \| null` | `null` | Customer info object |
| `description` | `string` | `''` | Scope of work text |
| `tasks` | `WorkOrderTask[]` | `[]` | Task checklist items |
| `parts` | `WorkOrderPart[]` | `[]` | Parts and materials list |
| `asset` | `WorkOrderAsset \| null` | `null` | Equipment/asset info |
| `laborRate` (attr: `labor-rate`) | `number` | `0` | Hourly labor rate |
| `notes` | `string` | `''` | Additional notes |
| `variant` | `'standard' \| 'compact' \| 'field-service' \| 'maintenance' \| 'detailed'` | `'standard'` | Layout variant |
| `showQr` (attr: `show-qr`) | `boolean` | `false` | Show QR code area |
| `qrData` (attr: `qr-data`) | `string` | `''` | QR code data string |
| `qrPosition` (attr: `qr-position`) | `'top-right' \| 'header' \| 'footer'` | `'top-right'` | QR code placement |

## Slots

| Name | Description |
|------|-------------|
| (default) | Additional content after main sections |
| `signature` | Custom signature content (canvas, image, etc.) |
| `qr` | QR code content (rendered at configured position) |
| `footer` | Custom footer content |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `task-toggle` | `{ index, task, completed }` | Fired when a task checkbox is toggled |
| `status-change` | `{ previousStatus, status }` | Fired when the work order status changes |
| `wo-sign` | `{ woNumber, timestamp }` | Fired when the sign button is clicked |

## Methods

| Method | Arguments | Description |
|--------|-----------|-------------|
| `getTotalPartsCost()` | -- | Returns sum of part quantities * unit costs |
| `getTotalLaborHours()` | -- | Returns sum of task hours |
| `getTotalLaborCost()` | -- | Returns hours * labor rate |
| `getTotalCost()` | -- | Returns parts + labor totals |
| `print()` | -- | Triggers the browser print dialog |
| `toJSON()` | -- | Returns a full JSON representation including computed totals |

## CSS Custom Properties

| Property | Description | Default |
|----------|-------------|---------|
| `--wo-max-width` | Max container width | `50rem` |
| `--wo-bg` | Background color | theme bg |
| `--wo-bg-element` | Element background | theme bg-element |
| `--wo-text` | Primary text color | theme text |
| `--wo-text-secondary` | Secondary text color | theme text-secondary |
| `--wo-text-tertiary` | Tertiary text color | theme text-tertiary |
| `--wo-border` | Border color | theme border |
| `--wo-accent` | Accent/primary color | theme primary |
| `--wo-success` | Success color | theme success |
| `--wo-danger` | Danger color | theme danger |
| `--wo-priority-low-bg` | Low priority badge background | blue/10% |
| `--wo-priority-low-text` | Low priority badge text | blue |
| `--wo-priority-medium-bg` | Medium priority badge background | amber/10% |
| `--wo-priority-medium-text` | Medium priority badge text | amber |
| `--wo-priority-high-bg` | High priority badge background | orange/10% |
| `--wo-priority-high-text` | High priority badge text | orange |
| `--wo-priority-urgent-bg` | Urgent priority badge background | red/10% |
| `--wo-priority-urgent-text` | Urgent priority badge text | red |
| `--wo-status-open-bg` | Open status badge background | blue/10% |
| `--wo-status-open-text` | Open status badge text | blue |
| `--wo-status-in-progress-bg` | In-progress status background | amber/10% |
| `--wo-status-in-progress-text` | In-progress status text | amber |
| `--wo-status-completed-bg` | Completed status background | green/10% |
| `--wo-status-completed-text` | Completed status text | green |
| `--wo-status-cancelled-bg` | Cancelled status background | gray/10% |
| `--wo-status-cancelled-text` | Cancelled status text | gray |
| `--wo-task-checkbox-size` | Task checkbox dimensions | `1.25rem` |
| `--wo-task-completed-text` | Completed task text color | tertiary text |
| `--wo-signature-line-color` | Signature line color | border color |
| `--wo-qr-size` | QR code container size | `5rem` |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Main container |
| `header` | Header section |
| `title` | "Work Order" label text |
| `wo-number` | Work order number heading |
| `date` | Date value |
| `due-date` | Due date value |
| `priority` | Priority badge |
| `status` | Status badge |
| `customer` | Customer info section |
| `customer-name` | Customer name value |
| `customer-address` | Customer address value |
| `customer-contact` | Customer phone value |
| `asset` | Asset/equipment section |
| `asset-id` | Asset ID value |
| `asset-name` | Asset name value |
| `description` | Description section |
| `description-label` | Description heading |
| `description-content` | Description text |
| `tasks` | Tasks section |
| `task` | Individual task row |
| `task-checkbox` | Task checkbox button |
| `task-description` | Task description text |
| `task-assignee` | Task assignee name |
| `parts` | Parts section |
| `parts-table` | Parts table |
| `parts-row` | Parts table row |
| `part-name` | Part name cell |
| `part-number` | Part number cell |
| `part-qty` | Part quantity cell |
| `part-cost` | Part unit cost cell |
| `parts-total` | Parts subtotal |
| `labor` | Labor section |
| `labor-hours` | Total labor hours |
| `labor-rate` | Labor rate display |
| `labor-total` | Labor cost total |
| `notes` | Notes section |
| `notes-label` | Notes heading |
| `notes-content` | Notes text |
| `costs` | Cost summary section |
| `grand-total` | Grand total amount |
| `signature` | Signature section |
| `signature-line` | Signature line |
| `signature-date` | Signature date line |
| `sign-button` | Sign work order button |
| `qr-container` | QR code container |
| `footer` | Footer section |

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

interface WorkOrderAsset {
  id: string;
  name: string;
  location?: string;
  serial?: string;
  lastService?: string;
}
```

## Best Practices

1. **Use meaningful WO numbers**: Follow a consistent numbering scheme (e.g., WO-YYYY-NNN)
2. **Choose the right variant**: `field-service` for technicians on-site, `maintenance` for equipment-focused tracking, `detailed` for accounting, `compact` for dense dashboards
3. **Include asset data for maintenance**: The `maintenance` variant highlights asset info with a bordered card
4. **Track hours per task**: Enables accurate labor cost computation in the summary
5. **Include part numbers**: Makes reordering and inventory management easier
6. **Use QR codes**: Link to digital systems with `show-qr` and the `qr` slot
7. **Use the signature slot**: Integrate with a canvas component for digital signatures

## Accessibility

- Task checkboxes are keyboard-accessible buttons with aria-labels
- Priority and status badges use color + text for identification
- Proper heading hierarchy with section titles
- Focus-visible outlines on interactive elements
- Print styles preserve visual state with high contrast
