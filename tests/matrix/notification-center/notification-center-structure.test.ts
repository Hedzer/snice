/**
 * snice-notification-center matrix — the STRUCTURE cross.
 *
 * The four documented properties, crossed in full:
 *
 *   · `open` (2) — the panel's visibility, and the `aria-expanded` the trigger
 *     must publish alongside it;
 *   · `placement` (2) — 'start'/'end', a documented alignment claim that has
 *     to reach the panel or its stylesheet never applies;
 *   · the notification list (6 shapes) — empty, one unread, one read, a mixed
 *     list, an all-read list, and the doc's own two-item example;
 *   · `icon` (3) — unset (the built-in bell), an emoji, and a URL, the shapes
 *     the documented icon resolution distinguishes.
 *
 * 2 x 2 x 6 x 3 = 72 combos, each judged by the shared oracle — which also
 * re-checks the accessibility list the docs publish (a labelled button, the
 * unread badge, a dismiss control per item, the mark-all action).
 */
import { describe, it, afterEach } from 'vitest';
import { expectClean, removeComponent } from '../matrix-common';
import {
  DOC_ITEMS, PLACEMENTS, checkCenter, comboId, itemsOf, mountCenter,
  type NotificationCombo, type NotificationItem, type Placement,
} from './notification-center-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const LISTS: Array<{ name: string; items: NotificationItem[] }> = [
  { name: 'empty', items: [] },
  { name: 'one-unread', items: itemsOf(1) },
  { name: 'one-read', items: itemsOf(1, { read: true }) },
  { name: 'mixed', items: itemsOf(4, { read: 'alternate' }) },
  { name: 'all-read', items: itemsOf(3, { read: true }) },
  { name: 'doc-example', items: DOC_ITEMS },
];

const ICONS = [
  { name: 'default', value: undefined },
  { name: 'emoji', value: '🔔' },
  { name: 'url', value: '/icons/bell.svg' },
];

describe('notification-center matrix: open x placement x list x icon', () => {
  for (const open of [false, true]) {
    for (const placement of PLACEMENTS as readonly Placement[]) {
      for (const list of LISTS) {
        for (const icon of ICONS) {
          const combo: NotificationCombo = {
            notifications: list.items, open, placement, icon: icon.value,
          };
          const id = `${comboId(combo)}/list=${list.name}/icon=${icon.name}`;
          it(id, async () => {
            el = await mountCenter(combo);
            expectClean(checkCenter(el, combo), id);
          });
        }
      }
    }
  }
});

describe('notification-center matrix: item types', () => {
  // `type` is documented per item and decides the icon tint, so each of the
  // four values gets its own combo in both panel states.
  for (const type of ['info', 'success', 'warning', 'error'] as const) {
    for (const open of [false, true]) {
      const combo: NotificationCombo = { notifications: itemsOf(2, { type }), open };
      it(`type=${type}/${open ? 'open' : 'closed'}`, async () => {
        el = await mountCenter(combo);
        expectClean(checkCenter(el, combo), `type=${type}/${open ? 'open' : 'closed'}`);
      });
    }
  }

  it('an item with no type is treated as info', async () => {
    const combo: NotificationCombo = { notifications: itemsOf(1), open: true };
    el = await mountCenter(combo);
    expectClean(checkCenter(el, combo), 'type=omitted');
  });

  it('a per-item icon overrides the type default', async () => {
    const combo: NotificationCombo = {
      notifications: itemsOf(2, { type: 'error', icon: '🚨' }), open: true,
    };
    el = await mountCenter(combo);
    expectClean(checkCenter(el, combo), 'per-item icon');
  });
});
