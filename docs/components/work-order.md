# Work Order
`<snice-work-order>`

A service work order component with task checklists, parts/materials tracking, time/labor calculations, and customer sign-off. Perfect for field service, maintenance, and repair workflows.

## Basic Usage

```html
<snice-work-order
  wo-number="WO-2026-0184"
  date="Feb 27, 2026"
  priority="high"
  status="in-progress"
  labor-rate="85"
  description="HVAC system inspection and filter replacement.">
</snice-work-order>

<script>
  const wo = document.querySelector('snice-work-order');
  wo.customer = { name: 'Office Park LLC', phone: '(555) 123-4567' };
  wo.tasks = [
    { description: 'Inspect units', assignee: 'Mike', hours: 2, completed: true },
    { description: 'Replace filters', assignee: 'Mike', hours: 3 }
  ];
  wo.parts = [
    { name: 'HVAC Filter 20x25', partNumber: 'HF-2025', quantity: 8, unitCost: 24.99 }
  ];
</script>
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

### Basic Work Order

```html
<snice-work-order
  id="basic-wo"
  wo-number="WO-001"
  date="2026-03-01"
  priority="medium"
  status="open"
  description="Routine maintenance check.">
</snice-work-order>

<script>
  const wo = document.getElementById('basic-wo');
  wo.customer = { name: 'ABC Company' };
  wo.tasks = [
    { description: 'Check system status', completed: false }
  ];
</script>
```

### With Asset Information

```html
<snice-work-order
  id="asset-wo"
  wo-number="WO-002"
  date="2026-03-01"
  description="Repair malfunctioning equipment.">
</snice-work-order>

<script>
  const wo = document.getElementById('asset-wo');
  wo.customer = { name: 'Manufacturing Plant' };
  wo.asset = {
    id: 'EQ-12345',
    name: 'CNC Machine Alpha',
    location: 'Building B, Floor 2',
    serial: 'SN789456123',
    lastService: '2025-12-15'
  };
  wo.tasks = [
    { description: 'Diagnose issue', completed: true },
    { description: 'Replace worn parts', completed: false }
  ];
</script>
```

### Task Checklist with Hours

```html
<snice-work-order
  id="task-wo"
  wo-number="WO-003"
  labor-rate="75"
  description="Server room maintenance.">
</snice-work-order>

<script>
  const wo = document.getElementById('task-wo');
  wo.customer = { name: 'Tech Corp' };
  wo.tasks = [
    { description: 'Clean server racks', assignee: 'John D.', hours: 2, completed: true },
    { description: 'Replace failed drives', assignee: 'John D.', hours: 1.5, completed: true },
    { description: 'Update firmware', assignee: 'Sarah M.', hours: 1, completed: false },
    { description: 'Run diagnostics', assignee: 'Sarah M.', hours: 0.5, completed: false }
  ];
</script>
```

### Parts and Materials

```html
<snice-work-order
  id="parts-wo"
  wo-number="WO-004"
  labor-rate="90">
</snice-work-order>

<script>
  const wo = document.getElementById('parts-wo');
  wo.customer = { name: 'Property Management' };
  wo.parts = [
    { name: 'Air Filter 16x25x1', partNumber: 'AF-1625', quantity: 12, unitCost: 8.99 },
    { name: 'Thermostat', partNumber: 'TH-WIFI', quantity: 3, unitCost: 149.99 },
    { name: 'Duct Tape', partNumber: 'DT-HEAVY', quantity: 5, unitCost: 12.50 }
  ];
</script>
```

### Different Priorities and Statuses

```html
<!-- Low priority, open -->
<snice-work-order wo-number="WO-L1" priority="low" status="open"></snice-work-order>

<!-- Medium priority, in-progress -->
<snice-work-order wo-number="WO-M1" priority="medium" status="in-progress"></snice-work-order>

<!-- High priority -->
<snice-work-order wo-number="WO-H1" priority="high" status="open"></snice-work-order>

<!-- Urgent priority -->
<snice-work-order wo-number="WO-U1" priority="urgent" status="in-progress"></snice-work-order>

<!-- Completed status -->
<snice-work-order wo-number="WO-C1" priority="medium" status="completed"></snice-work-order>

<!-- Cancelled -->
<snice-work-order wo-number="WO-X1" priority="low" status="cancelled"></snice-work-order>
```

### Field Service Variant

```html
<snice-work-order
  variant="field-service"
  wo-number="WO-FS-001"
  priority="high"
  show-qr
  qr-position="header">
</snice-work-order>
```

### Listening for Events

```html
<snice-work-order id="event-wo" wo-number="WO-EVT-001"></snice-work-order>

<script>
  const wo = document.getElementById('event-wo');
  
  wo.addEventListener('task-toggle', (e) => {
    console.log('Task toggled:', e.detail.index, 'Completed:', e.detail.completed);
  });
  
  wo.addEventListener('status-change', (e) => {
    console.log('Status changed from', e.detail.previousStatus, 'to', e.detail.status);
  });
  
  wo.addEventListener('wo-sign', (e) => {
    console.log('Work order signed at', e.detail.timestamp);
  });
</script>
```

### Cost Calculation

```html
<snice-work-order
  id="cost-wo"
  wo-number="WO-COST-001"
  labor-rate="100">
</snice-work-order>

<script>
  const wo = document.getElementById('cost-wo');
  wo.tasks = [
    { description: 'Labor 1', hours: 2, completed: true },
    { description: 'Labor 2', hours: 3, completed: false }
  ];
  wo.parts = [
    { name: 'Part A', quantity: 2, unitCost: 50 },
    { name: 'Part B', quantity: 1, unitCost: 150 }
  ];
  
  // Access calculated totals
  console.log('Parts cost:', wo.getTotalPartsCost());
  console.log('Labor hours:', wo.getTotalLaborHours());
  console.log('Labor cost:', wo.getTotalLaborCost());
  console.log('Total cost:', wo.getTotalCost());
</script>
```

### Print Work Order

```html
<snice-work-order id="print-wo" wo-number="WO-PRINT-001"></snice-work-order>
<button onclick="document.getElementById('print-wo').print()">
  Print Work Order
</button>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `woNumber` | `string` | `''` | Work order identifier |
| `date` | `string` | `''` | Work order date |
| `dueDate` | `string` | `''` | Due/completion date |
| `priority` | `'low' \| 'medium' \| 'high' \| 'urgent'` | `'medium'` | Priority level with visual badge |
| `status` | `'open' \| 'in-progress' \| 'completed' \| 'cancelled'` | `'open'` | Status with visual badge |
| `customer` | `WorkOrderCustomer \| null` | `null` | Customer information |
| `description` | `string` | `''` | Scope of work description |
| `tasks` | `WorkOrderTask[]` | `[]` | Task checklist |
| `parts` | `WorkOrderPart[]` | `[]` | Parts/materials list |
| `asset` | `WorkOrderAsset \| null` | `null` | Equipment/asset information |
| `laborRate` | `number` | `0` | Hourly labor rate for calculations |
| `notes` | `string` | `''` | Additional notes |
| `variant` | `'standard' \| 'compact' \| 'field-service' \| 'maintenance' \| 'detailed'` | `'standard'` | Visual style variant |
| `showQr` | `boolean` | `false` | Show QR code placeholder |
| `qrData` | `string` | `''` | QR code data |
| `qrPosition` | `'top-right' \| 'header' \| 'footer'` | `'top-right'` | QR code placement |

### WorkOrderCustomer Interface

```typescript
interface WorkOrderCustomer {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}
```

### WorkOrderTask Interface

```typescript
interface WorkOrderTask {
  description: string;
  assignee?: string;
  completed?: boolean;
  hours?: number;
}
```

### WorkOrderPart Interface

```typescript
interface WorkOrderPart {
  name: string;
  partNumber?: string;
  quantity: number;
  unitCost: number;
}
```

### WorkOrderAsset Interface

```typescript
interface WorkOrderAsset {
  id: string;
  name: string;
  location?: string;
  serial?: string;
  lastService?: string;
}
```

## Slots

| Slot Name | Description |
|-----------|-------------|
| `qr` | QR code content |
| `signature` | Signature capture area |
| `footer` | Additional footer content |
| (default) | Default slot for extra content |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `task-toggle` | `{ index, task, completed }` | Fired when a task checkbox is toggled |
| `status-change` | `{ previousStatus, status }` | Fired when status property changes |
| `wo-sign` | `{ woNumber, timestamp }` | Fired when sign-off button is clicked |

## Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getTotalPartsCost()` | `number` | Calculate total cost of all parts |
| `getTotalLaborHours()` | `number` | Sum of all task hours |
| `getTotalLaborCost()` | `number` | Labor hours × labor rate |
| `getTotalCost()` | `number` | Parts cost + labor cost |
| `print()` | `void` | Print the work order |
| `toJSON()` | `WorkOrderJSON` | Export all data including calculated totals |

## CSS Parts

| Part | Description |
|------|-------------|
| `base` | Root container |
| `header` | Work order header |
| `title` | "Work Order" title |
| `wo-number` | Work order number |
| `date` | Date field |
| `due-date` | Due date field |
| `priority` | Priority badge |
| `status` | Status badge |
| `qr-container` | QR code container |
| `customer` | Customer section |
| `customer-name` | Customer name |
| `customer-address` | Customer address |
| `customer-contact` | Customer phone/email |
| `asset` | Asset section |
| `asset-id` | Asset ID |
| `asset-name` | Asset name |
| `description` | Scope of work section |
| `description-label` | "Scope of Work" label |
| `description-content` | Description text |
| `tasks` | Tasks section |
| `task` | Individual task row |
| `task-checkbox` | Task completion checkbox |
| `task-description` | Task description |
| `task-assignee` | Task assignee |
| `parts` | Parts section |
| `parts-table` | Parts table |
| `parts-row` | Parts table row |
| `part-name` | Part name |
| `part-number` | Part number |
| `part-qty` | Part quantity |
| `part-cost` | Part unit cost |
| `parts-total` | Parts total |
| `labor` | Labor section |
| `labor-hours` | Total hours |
| `labor-rate` | Hourly rate |
| `labor-total` | Labor cost total |
| `costs` | Cost summary section |
| `grand-total` | Grand total |
| `notes` | Notes section |
| `notes-label` | "Notes" heading |
| `notes-content` | Notes text |
| `signature` | Sign-off section |
| `signature-line` | Signature line |
| `sign-button` | Sign-off button |
| `footer` | Footer area |

## CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--wo-max-width` | `50rem` | Maximum width |
| `--wo-bg` | `white` | Background color |
| `--wo-bg-element` | `rgb(252 251 249)` | Element background |
| `--wo-text` | `rgb(23 23 23)` | Text color |
| `--wo-text-secondary` | `rgb(82 82 82)` | Secondary text |
| `--wo-border` | `rgb(226 226 226)` | Border color |
| `--wo-accent` | `rgb(37 99 235)` | Accent color |
| `--wo-priority-low-bg/text` | various | Low priority badge colors |
| `--wo-priority-medium-bg/text` | various | Medium priority badge colors |
| `--wo-priority-high-bg/text` | various | High priority badge colors |
| `--wo-priority-urgent-bg/text` | various | Urgent priority badge colors |
| `--wo-task-checkbox-size` | `1.25rem` | Checkbox size |
| `--wo-signature-line-color` | border color | Signature line color |
| `--wo-qr-size` | `5rem` | QR code size |
