/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Oracle for the <snice-notification-center> feature matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Every expectation is read off `docs/ai/components/notification-center.md`
 * and `snice-notification-center.types.ts`, never off rendered output:
 *
 *   notifications: NotificationItem[] = []   attr: none (JS only)
 *   open: boolean = false                    Panel visibility
 *   icon: string = ''                        Custom bell icon (URL, image, emoji)
 *   placement: 'start'|'end' = 'end'         Panel alignment side
 *
 *   NotificationItem { id, title, message, timestamp, read?, icon?,
 *                      type?: 'info'|'success'|'warning'|'error' }
 *
 *   Methods: markAsRead(id), markAllAsRead(), dismiss(id)
 *   Events:  notification-click   -> { notification }
 *            notification-dismiss -> { id }
 *            notification-read-all -> void
 *   Slot:    icon — custom bell icon content (OVERRIDES the `icon` property)
 *   Parts:   trigger, icon, panel, panel-header
 *
 *   Accessibility: "Bell icon is keyboard-focusable", "Unread count via badge
 *   element", "Notification items are clickable with dismiss buttons",
 *   "'Mark all as read' action in panel header".
 */
import { Problems, mount, shadow, textOf, wait } from '../matrix-common';
import { exactPart } from '../part-exact';
import '../../../packages/components/src/notification-center/snice-notification-center';

export const PLACEMENTS = ['start', 'end'] as const;
export const TYPES = ['info', 'success', 'warning', 'error'] as const;

export type Placement = typeof PLACEMENTS[number];
export type NotificationType = typeof TYPES[number];

/** The documented CSS parts, in the order the doc lists them. */
export const PARTS = ['trigger', 'icon', 'panel', 'panel-header'] as const;

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read?: boolean;
  icon?: string;
  type?: NotificationType;
}

/** The doc's own two-item example, kept verbatim. */
export const DOC_ITEMS: NotificationItem[] = [
  { id: '1', title: 'New message', message: 'You have a new message', timestamp: '2 min ago', type: 'info' },
  { id: '2', title: 'Deployed', message: 'Build succeeded', timestamp: '5 min ago', type: 'success', read: true },
];

/** Item sets covering the read/unread and type dimensions. */
export function itemsOf(
  count: number,
  shape: { read?: boolean | 'alternate'; type?: NotificationType; icon?: string } = {},
): NotificationItem[] {
  return Array.from({ length: count }, (_, i) => {
    const item: NotificationItem = {
      id: `n${i}`,
      title: `Title ${i}`,
      message: `Message ${i}`,
      timestamp: `${i + 1} min ago`,
    };
    if (shape.read === 'alternate') item.read = i % 2 === 1;
    else if (shape.read !== undefined) item.read = shape.read;
    if (shape.type) item.type = shape.type;
    if (shape.icon) item.icon = shape.icon;
    return item;
  });
}

export interface NotificationCombo {
  notifications: NotificationItem[];
  open?: boolean;
  placement?: Placement;
  icon?: string;
}

export function comboId(combo: NotificationCombo): string {
  const unread = combo.notifications.filter(n => !n.read).length;
  return [
    `items=${combo.notifications.length}`,
    `unread=${unread}`,
    combo.open ? 'open' : 'closed',
    `placement=${combo.placement ?? 'end'}`,
    combo.icon ? `icon="${combo.icon}"` : 'icon=default',
  ].join('/');
}

export function resolved(combo: NotificationCombo) {
  return {
    notifications: combo.notifications,
    open: combo.open ?? false,
    placement: combo.placement ?? 'end',
    icon: combo.icon ?? '',
  };
}

export async function mountCenter(
  combo: NotificationCombo, options: { html?: string } = {},
): Promise<HTMLElement> {
  const want = resolved(combo);
  const el = await mount<HTMLElement>('snice-notification-center', {
    open: want.open,
    placement: want.placement,
    icon: want.icon,
    notifications: want.notifications,
  }, options);
  await wait(30);
  return el;
}

// ── Accessors ───────────────────────────────────────────────────────────────

export const trigger = (el: HTMLElement) => exactPart<HTMLButtonElement>(el, 'trigger');
export const panel = (el: HTMLElement) => exactPart(el, 'panel');
export const panelHeader = (el: HTMLElement) => exactPart(el, 'panel-header');
export const badge = (el: HTMLElement) =>
  shadow(el).querySelector('snice-badge') as HTMLElement | null;
export const itemNodes = (el: HTMLElement) =>
  [...shadow(el).querySelectorAll('.notification-item')] as HTMLElement[];
export const dismissButtons = (el: HTMLElement) =>
  [...shadow(el).querySelectorAll('.dismiss-btn')] as HTMLButtonElement[];
export const markAllButton = (el: HTMLElement) =>
  shadow(el).querySelector('.mark-all-btn') as HTMLButtonElement | null;
export const emptyState = (el: HTMLElement) =>
  shadow(el).querySelector('snice-empty-state') as HTMLElement | null;

export function classesOf(node: Element | null | undefined): string[] {
  return (node?.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
}

// ── The oracle ──────────────────────────────────────────────────────────────

/**
 * Judge one mounted notification centre against the documented contract,
 * collecting EVERY violation so a failing combo tells its whole story.
 */
export function checkCenter(el: HTMLElement, combo: NotificationCombo): Problems {
  const problems = new Problems();
  const want = resolved(combo);
  const root = shadow(el);
  const unread = want.notifications.filter(n => !n.read).length;

  // ── the four documented parts ───────────────────────────────────────────
  for (const name of PARTS) {
    problems.check(!!exactPart(el, name), `no part="${name}"`);
  }

  // ── the trigger: a focusable button announcing the panel ────────────────
  const bell = trigger(el);
  problems.check(!!bell, 'no part="trigger"');
  if (bell) {
    problems.equal(bell.tagName.toLowerCase(), 'button', 'the trigger element');
    problems.equal(bell.getAttribute('aria-haspopup'), 'dialog', 'trigger aria-haspopup');
    problems.equal(
      bell.getAttribute('aria-expanded'), String(want.open),
      'trigger aria-expanded',
    );
    problems.check(!!bell.getAttribute('aria-label'), 'the trigger has no aria-label');
    const controls = bell.getAttribute('aria-controls');
    problems.check(!!controls, 'the trigger does not name the panel it controls');
    if (controls) {
      problems.check(
        !!root.getElementById?.(controls) || !!root.querySelector(`#${controls}`),
        `aria-controls="${controls}" names no element`,
      );
    }
  }

  // ── the unread badge ────────────────────────────────────────────────────
  const count = badge(el);
  problems.check(!!count, 'no badge for the unread count');
  if (count) {
    problems.equal(count.getAttribute('count'), String(unread), 'unread badge count');
  }

  // ── the panel: shown exactly when `open` ────────────────────────────────
  const dropdown = panel(el);
  problems.check(!!dropdown, 'no part="panel"');
  if (dropdown) {
    problems.equal(dropdown.hasAttribute('hidden'), !want.open, 'panel hidden');
    problems.equal(dropdown.getAttribute('role'), 'dialog', 'panel role');
    // `placement` is a documented alignment claim, so it must reach the DOM.
    const classes = classesOf(dropdown);
    problems.check(
      classes.includes(`panel--${want.placement}`),
      `placement="${want.placement}" did not reach the panel (classes: ${classes.join(' ')})`,
    );
    problems.equal(
      PLACEMENTS.filter(p => classes.includes(`panel--${p}`)).length, 1,
      'placement classes on the panel',
    );
  }

  // ── the panel header and its mark-all action ────────────────────────────
  const header = panelHeader(el);
  problems.check(!!header, 'no part="panel-header"');
  const markAll = markAllButton(el);
  problems.check(!!markAll, 'no "mark all as read" action in the panel header');
  if (markAll && header) {
    problems.check(header.contains(markAll), 'the mark-all action is not in the panel header');
  }

  // ── the items ───────────────────────────────────────────────────────────
  const items = itemNodes(el);
  problems.equal(items.length, want.notifications.length, 'rendered item count');

  if (want.notifications.length === 0) {
    problems.check(!!emptyState(el), 'an empty centre rendered no empty state');
  } else {
    problems.check(!emptyState(el), 'a populated centre still rendered the empty state');
  }

  items.forEach((node, index) => {
    const item = want.notifications[index];
    if (!item) return;
    const where = `item[${index}] "${item.title}"`;
    const classes = classesOf(node);

    // "unread" is the documented highlight; a read item must not carry it.
    problems.equal(classes.includes('unread'), !item.read, `${where}: unread class`);

    problems.equal(
      textOf(node.querySelector('.notification-title')), item.title, `${where}: title`,
    );
    problems.equal(
      textOf(node.querySelector('.notification-message')), item.message, `${where}: message`,
    );
    problems.equal(
      textOf(node.querySelector('.notification-time')), item.timestamp, `${where}: timestamp`,
    );

    // The type decides the icon tint, so it has to reach the DOM.
    const iconSpan = node.querySelector('.notification-icon');
    problems.check(!!iconSpan, `${where}: no icon`);
    if (iconSpan) {
      problems.check(
        classesOf(iconSpan).includes(`notification-icon--${item.type ?? 'info'}`),
        `${where}: type "${item.type ?? 'info'}" did not reach the icon`
        + ` (classes: ${classesOf(iconSpan).join(' ')})`,
      );
    }

    // "Notification items are clickable with dismiss buttons."
    const dismiss = node.querySelector('.dismiss-btn') as HTMLButtonElement | null;
    problems.check(!!dismiss, `${where}: no dismiss button`);
    if (dismiss) {
      problems.equal(dismiss.tagName.toLowerCase(), 'button', `${where}: dismiss element`);
      problems.check(!!dismiss.getAttribute('aria-label'), `${where}: dismiss has no label`);
    }
  });

  // ── the icon slot, which the docs say overrides the icon property ───────
  problems.check(!!root.querySelector('slot[name="icon"]'), 'no slot[name="icon"]');

  return problems;
}

// ── Events ──────────────────────────────────────────────────────────────────

export const CENTER_EVENTS = [
  'notification-click', 'notification-dismiss', 'notification-read-all',
] as const;

export interface Recorded { type: string; detail: any }

export function recordEvents(el: HTMLElement): { seen: Recorded[]; of: (t: string) => any[] } {
  const seen: Recorded[] = [];
  for (const type of CENTER_EVENTS) {
    el.addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return { seen, of: (type: string) => seen.filter(e => e.type === type).map(e => e.detail) };
}

export function click(node: Element | null | undefined): void {
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
}

export { Problems, shadow, textOf, wait };
