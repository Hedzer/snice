import type { Meta, StoryObj } from '@storybook/html-vite';
import './snice-notification-center';
import type { NotificationItem } from './snice-notification-center.types';

type Args = {
  open?: boolean;
  placement?: 'start' | 'end';
  icon?: string;
};

function makeNotif(overrides: Partial<NotificationItem> = {}): NotificationItem {
  return {
    id: Math.random().toString(36).slice(2),
    title: 'Notification',
    message: 'Something happened.',
    timestamp: '1 min ago',
    ...overrides,
  };
}

const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  { id: '1', title: 'New comment', message: 'Alice commented on your pull request', timestamp: '2 min ago', type: 'info' },
  { id: '2', title: 'Deploy succeeded', message: 'Production build v2.4.1 is live', timestamp: '15 min ago', type: 'success', read: true },
  { id: '3', title: 'Disk space warning', message: 'Server storage is at 92% capacity', timestamp: '1 hour ago', type: 'warning' },
  { id: '4', title: 'Build failed', message: 'CI pipeline failed on branch feature/auth', timestamp: '3 hours ago', type: 'error' },
];

function makeCenter(notifications: NotificationItem[], attrs: Record<string, string | boolean> = {}) {
  const el = document.createElement('snice-notification-center');
  for (const [k, v] of Object.entries(attrs)) {
    if (typeof v === 'boolean') { if (v) el.toggleAttribute(k, true); }
    else el.setAttribute(k, v);
  }
  (el as any).notifications = notifications;
  return el;
}

function wrap(el: HTMLElement, align: 'start' | 'end' = 'end') {
  const w = document.createElement('div');
  const bar = document.createElement('div');
  const justify = align === 'start' ? 'flex-start' : 'flex-end';
  bar.style.cssText = `display:flex;justify-content:${justify};align-items:center;padding:0.75rem 1rem;border-bottom:1px solid rgba(128,128,128,0.2);`;
  bar.appendChild(el);
  w.appendChild(bar);
  const spacer = document.createElement('div');
  spacer.style.cssText = 'min-height:28rem;';
  w.appendChild(spacer);
  return w;
}

const meta: Meta<Args> = {
  title: 'NotificationCenter',
  component: 'snice-notification-center',
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    placement: { control: 'select', options: ['start', 'end'] },
    icon: { control: 'text' },
  },
  render: (args) => {
    const el = document.createElement('snice-notification-center');
    if (args.open) el.toggleAttribute('open', true);
    if (args.placement) el.setAttribute('placement', args.placement);
    if (args.icon) el.setAttribute('icon', args.icon);
    (el as any).notifications = SAMPLE_NOTIFICATIONS;
    return wrap(el);
  },
};
export default meta;

type Story = StoryObj<Args>;

export const Default: Story = {
  args: { open: true },
};

// h2: Default (with notifications)
export const DefaultWithNotifications: Story = {
  render: () => wrap(makeCenter(SAMPLE_NOTIFICATIONS, { open: 'true' })),
};

// h2: Empty (no notifications)
export const Empty: Story = {
  render: () => wrap(makeCenter([], { open: 'true' })),
};

// h2: Open: true (pre-opened)
export const OpenPreOpened: Story = {
  render: () => wrap(makeCenter(SAMPLE_NOTIFICATIONS, { open: 'true' })),
};

// h2: All unread
export const AllUnread: Story = {
  render: () => wrap(makeCenter([
    makeNotif({ id: '1', title: 'Alert 1', message: 'Unread notification', timestamp: '1m ago', type: 'info' }),
    makeNotif({ id: '2', title: 'Alert 2', message: 'Another unread', timestamp: '5m ago', type: 'warning' }),
    makeNotif({ id: '3', title: 'Alert 3', message: 'Third unread', timestamp: '10m ago', type: 'success' }),
  ], { open: 'true' })),
};

// h2: All read (no badge)
export const AllRead: Story = {
  render: () => wrap(makeCenter([
    makeNotif({ id: '1', title: 'Read 1', message: 'Already read', timestamp: '2m ago', read: true }),
    makeNotif({ id: '2', title: 'Read 2', message: 'Also read', timestamp: '1h ago', read: true }),
  ], { open: 'true' })),
};

// h2: Mixed read/unread
export const MixedReadUnread: Story = {
  render: () => wrap(makeCenter(SAMPLE_NOTIFICATIONS, { open: 'true' })),
};

// h2: Notification type: info
export const NotificationTypeInfo: Story = {
  render: () => wrap(makeCenter([
    makeNotif({ id: '1', title: 'Info', message: 'This is an info notification.', timestamp: 'just now', type: 'info' }),
  ], { open: 'true' })),
};

// h2: Notification type: success
export const NotificationTypeSuccess: Story = {
  render: () => wrap(makeCenter([
    makeNotif({ id: '1', title: 'Success', message: 'Operation completed successfully.', timestamp: '1m ago', type: 'success' }),
  ], { open: 'true' })),
};

// h2: Notification type: warning
export const NotificationTypeWarning: Story = {
  render: () => wrap(makeCenter([
    makeNotif({ id: '1', title: 'Warning', message: 'This action may have side effects.', timestamp: '5m ago', type: 'warning' }),
  ], { open: 'true' })),
};

// h2: Notification type: error
export const NotificationTypeError: Story = {
  render: () => wrap(makeCenter([
    makeNotif({ id: '1', title: 'Error', message: 'Something went wrong.', timestamp: '2m ago', type: 'error' }),
  ], { open: 'true' })),
};

// h2: All types combined
export const AllTypesCombined: Story = {
  render: () => wrap(makeCenter([
    makeNotif({ id: '1', title: 'Info',    message: 'Informational update.',      timestamp: 'just now', type: 'info' }),
    makeNotif({ id: '2', title: 'Success', message: 'Deploy completed.',          timestamp: '5m ago',   type: 'success', read: true }),
    makeNotif({ id: '3', title: 'Warning', message: 'Storage at 90%.',            timestamp: '1h ago',   type: 'warning' }),
    makeNotif({ id: '4', title: 'Error',   message: 'Build pipeline failed.',     timestamp: '2h ago',   type: 'error' }),
  ], { open: 'true' })),
};

// h2: Custom icons on notifications
export const CustomIconsOnNotifications: Story = {
  render: () => wrap(makeCenter([
    makeNotif({ id: '1', title: 'Comment',  message: 'Alice replied.', timestamp: '2m ago', icon: 'chat-bubble' }),
    makeNotif({ id: '2', title: 'Deployed', message: 'Build is live.', timestamp: '10m ago', icon: 'check-circle', read: true }),
    makeNotif({ id: '3', title: 'Warning',  message: 'High CPU usage.', timestamp: '1h ago', icon: 'exclamation-triangle' }),
  ], { open: 'true' })),
};

// h2: Custom bell icon (icon property)
export const CustomBellIcon: Story = {
  render: () => wrap(makeCenter(SAMPLE_NOTIFICATIONS, { icon: 'bell', open: 'true' })),
};

// h2: Icon slot (custom bell)
export const IconSlotCustomBell: Story = {
  render: () => {
    const el = document.createElement('snice-notification-center');
    el.toggleAttribute('open', true);
    (el as any).notifications = SAMPLE_NOTIFICATIONS;
    const span = document.createElement('span');
    span.slot = 'icon';
    span.textContent = '📬';
    el.appendChild(span);
    return wrap(el);
  },
};

// h2: Single notification
export const SingleNotification: Story = {
  render: () => wrap(makeCenter([
    makeNotif({ id: '1', title: 'Single item', message: 'Only one notification here.', timestamp: 'just now', type: 'info' }),
  ], { open: 'true' })),
};

// h2: Many notifications
export const ManyNotifications: Story = {
  render: () => {
    const items: NotificationItem[] = Array.from({ length: 8 }, (_, i) => makeNotif({
      id: String(i + 1),
      title: `Notification ${i + 1}`,
      message: `This is notification number ${i + 1}.`,
      timestamp: `${i + 1}m ago`,
      type: (['info', 'success', 'warning', 'error'] as const)[i % 4],
      read: i % 3 === 0,
    }));
    return wrap(makeCenter(items, { open: 'true' }));
  },
};

// h2: Long message text
export const LongMessageText: Story = {
  render: () => wrap(makeCenter([
    makeNotif({
      id: '1',
      title: 'Detailed Notification',
      message: 'This notification contains a much longer message that wraps across multiple lines to test how the component handles overflow and text wrapping in the notification panel.',
      timestamp: '1m ago',
      type: 'info',
    }),
  ], { open: 'true' })),
};

// h2: CSS Parts Styling
// Parts: trigger, icon, panel, panel-header
export const CSSPartsStyling: Story = {
  render: () => {
    const style = document.createElement('style');
    style.textContent = `
      /* snice-notification-center exposes the following CSS parts:
         ::part(trigger)      — the bell button that opens the panel
         ::part(icon)         — the bell icon inside the trigger
         ::part(panel)        — the dropdown notification panel
         ::part(panel-header) — the panel header bar */
      .parts-demo .default-nc::part(trigger) { /* no overrides */ }
      .parts-demo .styled-nc::part(trigger) {
        background: linear-gradient(135deg, #7c3aed, #db2777);
        border-radius: 12px;
        padding: 8px 14px;
        border: none;
        box-shadow: 0 2px 12px rgba(124,58,237,.5);
      }
      .parts-demo .styled-nc::part(icon) {
        font-size: 1.5rem;
        filter: drop-shadow(0 0 6px #fff);
      }
      .parts-demo .styled-nc::part(panel) {
        border: 2px solid #7c3aed;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(124,58,237,.3);
      }
      .parts-demo .styled-nc::part(panel-header) {
        background: linear-gradient(90deg, #7c3aed22, #db2777 22);
        font-weight: 700;
        letter-spacing: .06em;
        border-bottom: 1px solid #7c3aed66;
      }
    `;

    const notifs: NotificationItem[] = [
      { id: 'a', title: 'Deploy done', message: 'v3.0 is live', timestamp: '5m ago', type: 'success' },
      { id: 'b', title: 'New follower', message: 'Bob started following you', timestamp: '1h ago', type: 'info' },
    ];

    const demoWrap = document.createElement('div');
    demoWrap.className = 'parts-demo';
    demoWrap.style.cssText = 'display:flex;gap:3rem;align-items:flex-start;flex-wrap:wrap;';

    const col1 = document.createElement('div');
    col1.style.cssText = 'display:flex;flex-direction:column;gap:.5rem;align-items:flex-start;';
    const lbl1 = document.createElement('p');
    lbl1.textContent = 'Default';
    lbl1.style.cssText = 'margin:0;font-size:.75rem;opacity:.6;';
    const defaultNc = document.createElement('snice-notification-center');
    defaultNc.className = 'default-nc';
    (defaultNc as any).notifications = notifs;
    col1.appendChild(lbl1);
    col1.appendChild(defaultNc);

    const col2 = document.createElement('div');
    col2.style.cssText = 'display:flex;flex-direction:column;gap:.5rem;align-items:flex-start;';
    const lbl2 = document.createElement('p');
    lbl2.textContent = 'Styled via ::part(trigger/icon/panel/panel-header)';
    lbl2.style.cssText = 'margin:0;font-size:.75rem;opacity:.6;';
    const styledNc = document.createElement('snice-notification-center');
    styledNc.className = 'styled-nc';
    (styledNc as any).notifications = notifs;
    col2.appendChild(lbl2);
    col2.appendChild(styledNc);

    demoWrap.appendChild(style);
    demoWrap.appendChild(col1);
    demoWrap.appendChild(col2);
    return demoWrap;
  },
};

// Placement: start vs end
export const PlacementStart: Story = {
  render: () => wrap(makeCenter(SAMPLE_NOTIFICATIONS, { open: 'true', placement: 'start' }), 'start'),
};

export const PlacementEnd: Story = {
  render: () => wrap(makeCenter(SAMPLE_NOTIFICATIONS, { open: 'true', placement: 'end' }), 'end'),
};
