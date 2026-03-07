<!-- AI: For a low-token version of this doc, use docs/ai/components/approval-flow.md instead -->

# Approval Flow
`<snice-approval-flow>`

A visual approval chain showing a sequence of approver nodes with avatar, name, role, and status.

## Basic Usage

```typescript
import 'snice/components/approval-flow/snice-approval-flow';
```

```html
<snice-approval-flow id="approval"></snice-approval-flow>

<script>
  const flow = document.getElementById('approval');
  flow.steps = [
    { id: '1', approver: 'Alice Smith', role: 'Manager', status: 'approved' },
    { id: '2', approver: 'Bob Jones', role: 'Director', status: 'pending' },
    { id: '3', approver: 'Carol White', role: 'VP', status: 'pending' }
  ];
  flow.currentStep = '2';
</script>
```

## Importing

**ESM (bundler)**
```typescript
import 'snice/components/approval-flow/snice-approval-flow';
```

**CDN**
```html
<script src="snice-runtime.min.js"></script>
<script src="snice-approval-flow.min.js"></script>
```

## Examples

### Vertical Orientation

Use the `orientation` attribute for a vertical layout.

```html
<snice-approval-flow id="flow" orientation="vertical" current-step="2"></snice-approval-flow>

<script>
  document.getElementById('flow').steps = [
    { id: '1', approver: 'Alice Smith', role: 'Manager', status: 'approved', timestamp: 'Jan 15' },
    { id: '2', approver: 'Bob Jones', role: 'Director', status: 'pending' },
    { id: '3', approver: 'Carol White', role: 'VP', status: 'pending' }
  ];
</script>
```

### With Comments

Add optional `comment` text to show feedback from approvers.

```html
<snice-approval-flow id="commented"></snice-approval-flow>

<script>
  document.getElementById('commented').steps = [
    { id: '1', approver: 'Alice Smith', role: 'Manager', status: 'approved', comment: 'Budget looks reasonable', timestamp: 'Jan 15, 10:30 AM' },
    { id: '2', approver: 'Bob Jones', role: 'Director', status: 'rejected', comment: 'Needs revised timeline', timestamp: 'Jan 16, 2:15 PM' },
    { id: '3', approver: 'Carol White', role: 'VP', status: 'skipped' }
  ];
</script>
```

### With Avatars

Provide `avatar` URLs for profile images instead of initials.

```html
<snice-approval-flow id="avatars"></snice-approval-flow>

<script>
  document.getElementById('avatars').steps = [
    { id: '1', approver: 'Alice Smith', avatar: '/avatars/alice.jpg', status: 'approved' },
    { id: '2', approver: 'Bob Jones', avatar: '/avatars/bob.jpg', status: 'pending' }
  ];
</script>
```

### Interactive Approval

Set `current-step` to enable approve/reject action buttons on the active step.

```html
<snice-approval-flow id="interactive" current-step="2"></snice-approval-flow>

<script>
  const flow = document.getElementById('interactive');
  flow.steps = [
    { id: '1', approver: 'Alice Smith', status: 'approved' },
    { id: '2', approver: 'Bob Jones', status: 'pending' },
    { id: '3', approver: 'Carol White', status: 'pending' }
  ];

  flow.addEventListener('step-approve', (e) => {
    console.log('Approved:', e.detail.step.approver);
  });

  flow.addEventListener('step-reject', (e) => {
    console.log('Rejected:', e.detail.step.approver);
  });
</script>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `steps` | `ApprovalStep[]` | `[]` | Array of approver step objects |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout direction |
| `currentStep` (attr: `current-step`) | `string` | `''` | ID of the active step |

### ApprovalStep Object

```typescript
interface ApprovalStep {
  id: string;
  approver: string;
  role?: string;
  avatar?: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  comment?: string;
  timestamp?: string;
}
```

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `step-approve` | `{ step: ApprovalStep }` | Approve button clicked on current step |
| `step-reject` | `{ step: ApprovalStep }` | Reject button clicked on current step |
| `step-comment` | `{ step: ApprovalStep, comment: string }` | Comment added to a step |

## CSS Parts

| Part | Description |
|------|-------------|
| `container` | Main flow container |
| `step` | Individual step node |
| `avatar` | Approver avatar circle |
| `content` | Name/role/status wrapper |
| `name` | Approver name text |
| `role` | Approver role text |
| `status` | Status badge |
| `comment` | Comment text |
| `timestamp` | Timestamp text |
| `actions` | Approve/reject button row |
| `connector` | Line between steps |
