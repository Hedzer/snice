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

// CSS Parts: container, step, connector, avatar, name, role, status, timestamp, comment,
//            content, actions
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-demo { display: flex; gap: 2rem; flex-direction: column; }
      .parts-demo .label { font: 700 11px/1 sans-serif; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }

      /* Modern SaaS approval theme */
      .parts-demo .styled::part(container) { background: #1e1e2e; border: 1px solid #313244; border-radius: 16px; padding: 1.5rem; }
      .parts-demo .styled::part(step) { background: #181825; border: 1px solid #313244; border-radius: 12px; padding: 1rem 1.25rem; }
      .parts-demo .styled::part(connector) { background: linear-gradient(to bottom, #7c3aed, #4f46e5); width: 3px; border-radius: 2px; }
      .parts-demo .styled::part(avatar) { border: 3px solid #7c3aed; border-radius: 50%; }
      .parts-demo .styled::part(name) { color: #cdd6f4; font-weight: 700; font-size: 0.95rem; }
      .parts-demo .styled::part(role) { color: #7c3aed; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
      .parts-demo .styled::part(status) { border-radius: 20px; padding: 2px 10px; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.5px; }
      .parts-demo .styled::part(timestamp) { color: #6c7086; font-size: 0.78rem; }
      .parts-demo .styled::part(comment) { background: #313244; color: #bac2de; border-left: 3px solid #7c3aed; padding: 0.5rem 0.75rem; border-radius: 0 6px 6px 0; font-size: 0.85rem; font-style: italic; margin-top: 0.5rem; }
      .parts-demo .styled::part(content) { padding: 0; }
      .parts-demo .styled::part(actions) { margin-top: 0.75rem; display: flex; gap: 0.5rem; }
    `;

    const STEPS = [
      { id: 's1', approver: 'Alex Rivera', role: 'Team Lead', avatar: 'https://i.pravatar.cc/48?img=1', status: 'approved', comment: 'Looks good to me.', timestamp: '2026-04-07 10:15 AM' },
      { id: 's2', approver: 'Maya Patel', role: 'Engineering Manager', avatar: 'https://i.pravatar.cc/48?img=2', status: 'approved', comment: 'Approved — confirmed with QA.', timestamp: '2026-04-08 02:30 PM' },
      { id: 's3', approver: 'Jordan Kim', role: 'Director of Product', avatar: 'https://i.pravatar.cc/48?img=3', status: 'pending' },
      { id: 's4', approver: 'Sam Chen', role: 'VP Engineering', avatar: 'https://i.pravatar.cc/48?img=4', status: 'pending' },
    ];

    const makeFlow = (cls: string) => {
      const el = document.createElement('snice-approval-flow');
      if (cls) el.classList.add(cls);
      (el as any).steps = STEPS;
      el.setAttribute('current-step', 's3');
      el.style.cssText = 'display:block;max-width:480px;';
      return el;
    };

    const wrap = document.createElement('div');
    wrap.appendChild(style);
    wrap.classList.add('parts-demo');

    const col1 = document.createElement('div');
    const lbl1 = document.createElement('div'); lbl1.className = 'label'; lbl1.textContent = 'Default';
    col1.appendChild(lbl1); col1.appendChild(makeFlow(''));

    const col2 = document.createElement('div');
    const lbl2 = document.createElement('div'); lbl2.className = 'label'; lbl2.textContent = 'SaaS Theme via ::part()';
    col2.appendChild(lbl2); col2.appendChild(makeFlow('styled'));

    wrap.appendChild(col1);
    wrap.appendChild(col2);
    return wrap;
  },
};

export const CSSPartsAdvanced: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      .parts-adv { display: flex; gap: 2rem; flex-wrap: wrap; align-items: flex-start; }
      .parts-adv snice-approval-flow { max-width: 480px; display: block; }

      /* Compact horizontal banking theme */
      .parts-adv .banking::part(container) { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 1.25rem; }
      .parts-adv .banking::part(step) { background: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 0.75rem 1rem; }
      .parts-adv .banking::part(connector) { background: #0052cc; height: 2px; border-radius: 1px; }
      .parts-adv .banking::part(avatar) { border: 2px solid #0052cc; border-radius: 4px; }
      .parts-adv .banking::part(name) { color: #1a1a2e; font-weight: 600; font-size: 0.875rem; }
      .parts-adv .banking::part(role) { color: #0052cc; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
      .parts-adv .banking::part(status) { border-radius: 3px; padding: 1px 8px; font-size: 0.7rem; font-weight: 700; }
      .parts-adv .banking::part(timestamp) { color: #6c757d; font-size: 0.75rem; }
      .parts-adv .banking::part(comment) { background: #e9ecef; color: #495057; border-left: 2px solid #0052cc; padding: 0.375rem 0.625rem; border-radius: 0 4px 4px 0; font-size: 0.8rem; }
      .parts-adv .banking::part(actions) { margin-top: 0.5rem; gap: 0.375rem; }
    `;

    const STEPS = [
      { id: 'b1', approver: 'Compliance Officer', role: 'Compliance', avatar: 'https://i.pravatar.cc/48?img=5', status: 'approved', comment: 'KYC verified.', timestamp: '2026-04-08 09:00' },
      { id: 'b2', approver: 'Risk Analyst', role: 'Risk Management', avatar: 'https://i.pravatar.cc/48?img=6', status: 'approved', comment: 'Risk score: Low (38/100).', timestamp: '2026-04-08 11:22' },
      { id: 'b3', approver: 'Branch Manager', role: 'Operations', avatar: 'https://i.pravatar.cc/48?img=7', status: 'rejected', comment: 'Flagged — requires additional documentation.', timestamp: '2026-04-09 08:45' },
      { id: 'b4', approver: 'Regional Director', role: 'Executive', avatar: 'https://i.pravatar.cc/48?img=8', status: 'pending' },
    ];

    const el = document.createElement('snice-approval-flow');
    el.classList.add('banking');
    (el as any).steps = STEPS;
    el.setAttribute('current-step', 'b4');
    el.setAttribute('orientation', 'vertical');
    el.style.cssText = 'display:block;max-width:480px;';

    const wrap = document.createElement('div');
    wrap.appendChild(style);
    wrap.classList.add('parts-adv');

    const col = document.createElement('div');
    const lbl = document.createElement('div');
    lbl.style.cssText = 'font:700 11px/1 sans-serif;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;';
    lbl.textContent = 'Banking Compliance Theme via ::part()';
    col.appendChild(lbl);
    col.appendChild(el);
    wrap.appendChild(col);
    return wrap;
  },
};
