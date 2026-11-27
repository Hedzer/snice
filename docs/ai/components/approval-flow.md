# snice-approval-flow

Visual approval chain with approver nodes showing avatar, name, role, and status.

## Properties

```typescript
steps: ApprovalStep[] = [];
orientation: 'horizontal'|'vertical' = 'horizontal';
currentStep: string = '';              // attr: current-step, ID of active step

interface ApprovalStep {
  id: string;
  approver: string;
  role?: string;
  avatar?: string;
  status: 'pending'|'approved'|'rejected'|'skipped';
  comment?: string;
  timestamp?: string;
}
```

## Events

- `step-approve` → `{ step: ApprovalStep }` - Approve button clicked on current step
- `step-reject` → `{ step: ApprovalStep }` - Reject button clicked on current step
- `step-comment` → `{ step: ApprovalStep, comment: string }` - Comment added to step

## CSS Parts

- `base` / `container` - Main flow container
- `step` - Individual step node
- `step-current` - Added to `step` when it is the current step
- `avatar` - Approver avatar circle
- `avatar-current` - Added to `avatar` when it is the current step
- `avatar-image` - Approver avatar image
- `content` - Name/role/status wrapper
- `name` - Approver name text
- `name-current` / `name-skipped` - Current or skipped modifier token on `name`
- `role` - Approver role text
- `status` - Status badge
- `status-icon` - Status glyph inside the badge
- `status-label` - Status text inside the badge
- `comment` - Comment text
- `timestamp` - Timestamp text
- `actions` - Approve/reject button row
- `button` - Any action button
- `button-approve` - Added to `button` on the approve button
- `button-reject` - Added to `button` on the reject button
- `input` - Comment input
- `connector` - Line between steps

`step`, `avatar`, `status`, and `connector` also carry a `<part>-<status>` token (`*-pending`, `*-approved`, `*-rejected`, `*-skipped`).

## Basic Usage

```html
<snice-approval-flow current-step="2" orientation="vertical"></snice-approval-flow>
```

```typescript
flow.steps = [
  { id: '1', approver: 'Alice Smith', role: 'Manager', status: 'approved', comment: 'Looks good', timestamp: 'Jan 15' },
  { id: '2', approver: 'Bob Jones', role: 'Director', status: 'pending' },
  { id: '3', approver: 'Carol White', role: 'VP', status: 'pending' }
];
flow.addEventListener('step-approve', e => {
  console.log('Approved by:', e.detail.step.approver);
});
```
