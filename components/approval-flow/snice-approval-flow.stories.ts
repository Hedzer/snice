import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-approval-flow';

const BASIC = [
  { id: 'step-1', approver: 'Alice Chen', status: 'approved' },
  { id: 'step-2', approver: 'Bob Smith', status: 'pending' },
  { id: 'step-3', approver: 'Carol Davis', status: 'pending' },
];

type Args = {
  orientation?: string;
  currentStep?: string;
};

const meta: Meta<Args> = {
  title: 'Commerce/ApprovalFlow',
  component: 'snice-approval-flow',
  tags: ['autodocs'],
  argTypes: {
    orientation: { control: 'select', options: ['horizontal', 'vertical'] },
    currentStep: { control: 'text' },
  },
  render: (args) => {
    const el = document.createElement('snice-approval-flow');
    if (args.orientation) el.setAttribute('orientation', args.orientation);
    if (args.currentStep) el.setAttribute('current-step', args.currentStep);
    (el as any).steps = BASIC;
    return el;
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { orientation: 'horizontal' },
};

// h2: Orientation: horizontal (default)
export const OrientationHorizontal: Story = {
  render: () => {
    const el = document.createElement('snice-approval-flow');
    (el as any).steps = BASIC;
    return el;
  },
};

// h2: Orientation: vertical
export const OrientationVertical: Story = {
  render: () => {
    const el = document.createElement('snice-approval-flow');
    el.setAttribute('orientation', 'vertical');
    (el as any).steps = BASIC;
    return el;
  },
};

// h2: All statuses: pending, approved, rejected, skipped
export const AllStatusesPendingApprovedRejectedSkipped: Story = {
  render: () => {
    const el = document.createElement('snice-approval-flow');
    (el as any).steps = [
      { id: 's1', approver: 'Pending User', status: 'pending' },
      { id: 's2', approver: 'Approved User', status: 'approved' },
      { id: 's3', approver: 'Rejected User', status: 'rejected' },
      { id: 's4', approver: 'Skipped User', status: 'skipped' },
    ];
    return el;
  },
};

// h2: With current-step (shows approve/reject buttons on pending step)
export const WithCurrentStep: Story = {
  render: () => {
    const el = document.createElement('snice-approval-flow');
    el.setAttribute('current-step', 'step-2');
    (el as any).steps = [
      { id: 'step-1', approver: 'Alice', status: 'approved' },
      { id: 'step-2', approver: 'Bob', status: 'pending' },
      { id: 'step-3', approver: 'Carol', status: 'pending' },
    ];
    return el;
  },
};

// h2: With roles
export const WithRoles: Story = {
  render: () => {
    const el = document.createElement('snice-approval-flow');
    (el as any).steps = [
      { id: 'r1', approver: 'Alice Chen', role: 'Manager', status: 'approved' },
      { id: 'r2', approver: 'Bob Smith', role: 'Director', status: 'pending' },
      { id: 'r3', approver: 'Carol Davis', role: 'VP Finance', status: 'pending' },
    ];
    return el;
  },
};

// h2: With comments
export const WithComments: Story = {
  render: () => {
    const el = document.createElement('snice-approval-flow');
    (el as any).steps = [
      { id: 'c1', approver: 'Alice', status: 'approved', comment: 'Looks good to me!' },
      { id: 'c2', approver: 'Bob', status: 'rejected', comment: 'Budget exceeds limit, please revise.' },
      { id: 'c3', approver: 'Carol', status: 'skipped', comment: 'Skipped per policy.' },
    ];
    return el;
  },
};

// h2: With timestamps
export const WithTimestamps: Story = {
  render: () => {
    const el = document.createElement('snice-approval-flow');
    (el as any).steps = [
      { id: 't1', approver: 'Alice', status: 'approved', timestamp: '2024-01-15 09:30 AM' },
      { id: 't2', approver: 'Bob', status: 'approved', timestamp: '2024-01-15 02:15 PM' },
      { id: 't3', approver: 'Carol', status: 'pending' },
    ];
    return el;
  },
};

// h2: With avatars
export const WithAvatars: Story = {
  render: () => {
    const el = document.createElement('snice-approval-flow');
    (el as any).steps = [
      { id: 'a1', approver: 'Alice Chen', avatar: 'https://i.pravatar.cc/40?img=1', status: 'approved' },
      { id: 'a2', approver: 'Bob Smith', avatar: 'https://i.pravatar.cc/40?img=2', status: 'pending' },
      { id: 'a3', approver: 'Carol Davis', avatar: 'https://i.pravatar.cc/40?img=3', status: 'pending' },
    ];
    return el;
  },
};

// h2: Single step
export const SingleStep: Story = {
  render: () => {
    const el = document.createElement('snice-approval-flow');
    (el as any).steps = [{ id: 'solo', approver: 'Sole Approver', status: 'pending' }];
    return el;
  },
};

// h2: Many steps (6)
export const ManySteps6: Story = {
  render: () => {
    const el = document.createElement('snice-approval-flow');
    (el as any).steps = [
      { id: 'm1', approver: 'Step 1', status: 'approved' },
      { id: 'm2', approver: 'Step 2', status: 'approved' },
      { id: 'm3', approver: 'Step 3', status: 'approved' },
      { id: 'm4', approver: 'Step 4', status: 'rejected' },
      { id: 'm5', approver: 'Step 5', status: 'pending' },
      { id: 'm6', approver: 'Step 6', status: 'pending' },
    ];
    return el;
  },
};

// h2: All approved
export const AllApproved: Story = {
  render: () => {
    const el = document.createElement('snice-approval-flow');
    (el as any).steps = [
      { id: 'aa1', approver: 'Alice', status: 'approved' },
      { id: 'aa2', approver: 'Bob', status: 'approved' },
      { id: 'aa3', approver: 'Carol', status: 'approved' },
    ];
    return el;
  },
};

// h2: All rejected
export const AllRejected: Story = {
  render: () => {
    const el = document.createElement('snice-approval-flow');
    (el as any).steps = [
      { id: 'ar1', approver: 'Alice', status: 'rejected' },
      { id: 'ar2', approver: 'Bob', status: 'rejected' },
      { id: 'ar3', approver: 'Carol', status: 'rejected' },
    ];
    return el;
  },
};

// h2: All pending
export const AllPending: Story = {
  render: () => {
    const el = document.createElement('snice-approval-flow');
    (el as any).steps = [
      { id: 'ap1', approver: 'Alice', status: 'pending' },
      { id: 'ap2', approver: 'Bob', status: 'pending' },
      { id: 'ap3', approver: 'Carol', status: 'pending' },
    ];
    return el;
  },
};

// h2: Side by side: horizontal vs vertical
export const SideBySideHorizontalVsVertical: Story = {
  render: () => {
    const cmpSteps = [
      { id: 'x1', approver: 'Alice', status: 'approved', role: 'Manager' },
      { id: 'x2', approver: 'Bob', status: 'pending', role: 'Director' },
      { id: 'x3', approver: 'Carol', status: 'pending', role: 'VP' },
    ];
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;';
    const h = document.createElement('snice-approval-flow');
    (h as any).steps = cmpSteps;
    const v = document.createElement('snice-approval-flow');
    v.setAttribute('orientation', 'vertical');
    (v as any).steps = cmpSteps;
    wrap.appendChild(h);
    wrap.appendChild(v);
    return wrap;
  },
};

// h2: Edge case: very long approver name and role
export const EdgeCaseVeryLongApproverNameAndRole: Story = {
  render: () => {
    const el = document.createElement('snice-approval-flow');
    (el as any).steps = [
      { id: 'l1', approver: 'Bartholomew Christopherson-Williamson III', role: 'Senior Vice President of International Operations and Strategic Development', status: 'approved', comment: 'Approved after thorough review of all documentation and compliance requirements.' },
    ];
    return el;
  },
};

// h2: Full details: avatar + role + comment + timestamp
export const FullDetailsAvatarRoleCommentTimestamp: Story = {
  render: () => {
    const el = document.createElement('snice-approval-flow');
    el.setAttribute('orientation', 'vertical');
    (el as any).steps = [
      { id: 'f1', approver: 'Alice Chen', role: 'Manager', avatar: 'https://i.pravatar.cc/40?img=1', status: 'approved', comment: 'LGTM', timestamp: 'Jan 15, 9:30 AM' },
      { id: 'f2', approver: 'Bob Smith', role: 'Director', avatar: 'https://i.pravatar.cc/40?img=2', status: 'approved', comment: 'Approved with minor notes.', timestamp: 'Jan 15, 2:15 PM' },
      { id: 'f3', approver: 'Carol Davis', role: 'VP Finance', avatar: 'https://i.pravatar.cc/40?img=3', status: 'pending' },
      { id: 'f4', approver: 'David Lee', role: 'CFO', avatar: 'https://i.pravatar.cc/40?img=4', status: 'pending' },
    ];
    return el;
  },
};
