/**
 * Smoke slice of the snice-notification-center matrix — the everyday loop.
 *
 * The full matrix (tests/matrix/notification-center: 82 structure combos plus
 * 22 interaction combos) runs via `npm run test:matrix`. This file stays
 * collected by the default loop and pays for one combo per family:
 *
 *   · the doc's own two-item example, open, with all four parts and the
 *     accessibility list;
 *   · the empty state, the other branch of the panel body;
 *   · the bell toggling the panel and its aria-expanded;
 *   · `dismiss` and its event;
 *   · `markAllAsRead` and its event;
 *   · clicking an unread item — read + announced in one step.
 *
 * Every structural assertion routes through the matrix's own oracle.
 * BUDGET: under ~1s.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { expectClean, removeComponent, wait } from '../matrix-common';
import {
  DOC_ITEMS, checkCenter, click, comboId, itemNodes, itemsOf, markAllButton,
  mountCenter, recordEvents, trigger,
  type NotificationCombo,
} from './notification-center-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

describe('notification-center matrix smoke', () => {
  it('the documented example renders its items, badge and parts', async () => {
    const combo: NotificationCombo = { notifications: DOC_ITEMS, open: true };
    el = await mountCenter(combo);
    expectClean(checkCenter(el, combo), comboId(combo));
    expect(itemNodes(el)).toHaveLength(2);
  });

  it('an empty centre shows the empty state and a zero badge', async () => {
    const combo: NotificationCombo = { notifications: [], open: true };
    el = await mountCenter(combo);
    expectClean(checkCenter(el, combo), comboId(combo));
  });

  it('the bell opens the panel and updates aria-expanded', async () => {
    const combo: NotificationCombo = { notifications: itemsOf(2), open: false };
    el = await mountCenter(combo);
    expectClean(checkCenter(el, combo), 'closed');

    click(trigger(el));
    await wait(30);
    expectClean(checkCenter(el, { ...combo, open: true }), 'opened');
  });

  it('dismiss removes the item and announces its id', async () => {
    const combo: NotificationCombo = { notifications: itemsOf(3), open: true };
    el = await mountCenter(combo);
    const events = recordEvents(el);

    (el as any).dismiss('n1');
    await wait(30);

    expect((el as any).notifications.map((n: any) => n.id)).toEqual(['n0', 'n2']);
    expect(events.of('notification-dismiss')).toEqual([{ id: 'n1' }]);
  });

  it('mark all read empties the badge and announces once', async () => {
    const combo: NotificationCombo = { notifications: itemsOf(3), open: true };
    el = await mountCenter(combo);
    const events = recordEvents(el);

    click(markAllButton(el));
    await wait(30);

    expect(events.of('notification-read-all')).toHaveLength(1);
    expectClean(
      checkCenter(el, { ...combo, notifications: (el as any).notifications }),
      'all read',
    );
  });

  it('clicking an unread item marks it read and announces it', async () => {
    const combo: NotificationCombo = { notifications: itemsOf(2), open: true };
    el = await mountCenter(combo);
    const events = recordEvents(el);

    click(itemNodes(el)[0]);
    await wait(30);

    expect(events.of('notification-click')[0].notification).toMatchObject({ id: 'n0' });
    expect((el as any).notifications[0].read).toBe(true);
  });
});
