/**
 * snice-notification-center matrix — the INTERACTION cross.
 *
 * Three documented methods and three documented events, and a specific
 * relationship between them:
 *
 *   markAsRead(id)   — mark a single notification read
 *   markAllAsRead()  — mark all read, and emit notification-read-all
 *   dismiss(id)      — remove it from the list, and emit notification-dismiss
 *   notification-click -> { notification }  when an item is clicked
 *
 * plus the two things the docs say about the trigger and the header: the bell
 * opens and closes the panel, and the header carries a "Mark all as read"
 * action.
 *
 * The cross is over WHICH item is acted on (first / middle / last / an
 * already-read one / an id that does not exist) times WHICH action is taken,
 * because that product is where an off-by-one or an identity mix-up shows up.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { expectClean, removeComponent, wait } from '../matrix-common';
import {
  checkCenter, click, dismissButtons, itemNodes, itemsOf, markAllButton,
  mountCenter, recordEvents, trigger,
  type NotificationCombo,
} from './notification-center-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const TARGETS = [
  { name: 'first', index: 0 },
  { name: 'middle', index: 2 },
  { name: 'last', index: 4 },
];

describe('notification-center matrix: dismiss x which item', () => {
  for (const target of TARGETS) {
    it(`dismiss the ${target.name} item`, async () => {
      const items = itemsOf(5);
      const combo: NotificationCombo = { notifications: items, open: true };
      el = await mountCenter(combo);
      const events = recordEvents(el);

      (el as any).dismiss(items[target.index].id);
      await wait(30);

      const remaining = items.filter((_, i) => i !== target.index);
      expect((el as any).notifications.map((n: any) => n.id))
        .toEqual(remaining.map(n => n.id));
      expect(events.of('notification-dismiss'))
        .toEqual([{ id: items[target.index].id }]);
      expectClean(
        checkCenter(el, { ...combo, notifications: remaining }),
        `after dismissing the ${target.name} item`,
      );
    });
  }

  it('clicking a dismiss button removes that item and nothing else', async () => {
    const items = itemsOf(3);
    const combo: NotificationCombo = { notifications: items, open: true };
    el = await mountCenter(combo);
    const events = recordEvents(el);

    click(dismissButtons(el)[1]);
    await wait(30);

    expect((el as any).notifications.map((n: any) => n.id)).toEqual(['n0', 'n2']);
    expect(events.of('notification-dismiss')).toEqual([{ id: 'n1' }]);
    // Dismissing is not the same as opening the item.
    expect(events.of('notification-click'),
      'dismissing an item also announced a click on it').toEqual([]);
  });

  it('dismissing an unknown id changes nothing but still announces', async () => {
    const items = itemsOf(3);
    const combo: NotificationCombo = { notifications: items, open: true };
    el = await mountCenter(combo);
    const events = recordEvents(el);

    (el as any).dismiss('does-not-exist');
    await wait(30);

    expect((el as any).notifications).toHaveLength(3);
    expect(events.of('notification-dismiss')).toEqual([{ id: 'does-not-exist' }]);
  });

  it('dismissing the last item leaves the empty state', async () => {
    const combo: NotificationCombo = { notifications: itemsOf(1), open: true };
    el = await mountCenter(combo);
    (el as any).dismiss('n0');
    await wait(30);
    expectClean(checkCenter(el, { ...combo, notifications: [] }), 'emptied by dismiss');
  });
});

describe('notification-center matrix: markAsRead x which item', () => {
  for (const target of TARGETS) {
    it(`markAsRead the ${target.name} item`, async () => {
      const items = itemsOf(5);
      const combo: NotificationCombo = { notifications: items, open: true };
      el = await mountCenter(combo);

      (el as any).markAsRead(items[target.index].id);
      await wait(30);

      const expected = items.map((n, i) => (i === target.index ? { ...n, read: true } : n));
      expect((el as any).notifications.map((n: any) => !!n.read))
        .toEqual(expected.map(n => !!n.read));
      expectClean(
        checkCenter(el, { ...combo, notifications: expected }),
        `after marking the ${target.name} item read`,
      );
    });
  }

  it('marking an already-read item read is a no-op', async () => {
    const items = itemsOf(3, { read: true });
    const combo: NotificationCombo = { notifications: items, open: true };
    el = await mountCenter(combo);
    const events = recordEvents(el);

    (el as any).markAsRead('n1');
    await wait(30);

    expect((el as any).notifications.every((n: any) => n.read)).toBe(true);
    expectClean(checkCenter(el, combo), 'already read');
    expect(events.seen, 'markAsRead announced an event the docs do not list').toEqual([]);
  });

  it('markAsRead does not mutate the array the caller handed in', async () => {
    const items = itemsOf(3);
    el = await mountCenter({ notifications: items, open: true });
    (el as any).markAsRead('n1');
    await wait(30);
    expect(items.map(n => !!n.read),
      'the caller\'s notifications array was mutated in place').toEqual([false, false, false]);
  });
});

describe('notification-center matrix: markAllAsRead', () => {
  for (const list of [
    { name: 'all unread', items: itemsOf(4) },
    { name: 'mixed', items: itemsOf(4, { read: 'alternate' }) },
    { name: 'all read', items: itemsOf(4, { read: true }) },
    { name: 'empty', items: itemsOf(0) },
  ]) {
    it(`markAllAsRead over a ${list.name} list`, async () => {
      const combo: NotificationCombo = { notifications: list.items, open: true };
      el = await mountCenter(combo);
      const events = recordEvents(el);

      (el as any).markAllAsRead();
      await wait(30);

      const expected = list.items.map(n => ({ ...n, read: true }));
      expect((el as any).notifications.every((n: any) => n.read)).toBe(true);
      expect(events.of('notification-read-all'), 'no notification-read-all')
        .toHaveLength(1);
      expectClean(
        checkCenter(el, { ...combo, notifications: expected }),
        `markAllAsRead over ${list.name}`,
      );
    });
  }

  it('the panel header action is the same path as the method', async () => {
    const combo: NotificationCombo = { notifications: itemsOf(3), open: true };
    el = await mountCenter(combo);
    const events = recordEvents(el);

    click(markAllButton(el));
    await wait(30);

    expect((el as any).notifications.every((n: any) => n.read)).toBe(true);
    expect(events.of('notification-read-all')).toHaveLength(1);
  });
});

describe('notification-center matrix: clicking an item', () => {
  it('an unread item is marked read and announced', async () => {
    const items = itemsOf(3);
    const combo: NotificationCombo = { notifications: items, open: true };
    el = await mountCenter(combo);
    const events = recordEvents(el);

    click(itemNodes(el)[1]);
    await wait(30);

    expect(events.of('notification-click')).toHaveLength(1);
    expect(events.of('notification-click')[0].notification).toMatchObject({ id: 'n1' });
    expect((el as any).notifications.map((n: any) => !!n.read)).toEqual([false, true, false]);
  });

  it('a read item is announced without being re-marked', async () => {
    const items = itemsOf(3, { read: true });
    el = await mountCenter({ notifications: items, open: true });
    const events = recordEvents(el);

    click(itemNodes(el)[0]);
    await wait(30);

    expect(events.of('notification-click')).toHaveLength(1);
    expect((el as any).notifications.every((n: any) => n.read)).toBe(true);
  });

  it('the announced notification is the whole documented item', async () => {
    const items = itemsOf(1, { type: 'success', icon: '🎉' });
    el = await mountCenter({ notifications: items, open: true });
    const events = recordEvents(el);

    click(itemNodes(el)[0]);
    await wait(30);

    expect(events.of('notification-click')[0].notification).toMatchObject({
      id: 'n0', title: 'Title 0', message: 'Message 0',
      timestamp: '1 min ago', type: 'success', icon: '🎉',
    });
  });
});

describe('notification-center matrix: the bell toggles the panel', () => {
  it('clicking the trigger opens a closed panel', async () => {
    const combo: NotificationCombo = { notifications: itemsOf(2), open: false };
    el = await mountCenter(combo);
    expectClean(checkCenter(el, combo), 'closed');

    click(trigger(el));
    await wait(30);
    expect((el as any).open).toBe(true);
    expectClean(checkCenter(el, { ...combo, open: true }), 'opened by the bell');
  });

  it('clicking it again closes the panel', async () => {
    const combo: NotificationCombo = { notifications: itemsOf(2), open: true };
    el = await mountCenter(combo);

    click(trigger(el));
    await wait(30);
    expect((el as any).open).toBe(false);
    expectClean(checkCenter(el, { ...combo, open: false }), 'closed by the bell');
  });

  it('the unread badge follows the list as it changes', async () => {
    const combo: NotificationCombo = { notifications: itemsOf(4), open: true };
    el = await mountCenter(combo);
    expectClean(checkCenter(el, combo), '4 unread');

    (el as any).markAsRead('n0');
    await wait(30);
    expectClean(
      checkCenter(el, {
        ...combo,
        notifications: (el as any).notifications,
      }),
      '3 unread',
    );

    (el as any).markAllAsRead();
    await wait(30);
    expectClean(
      checkCenter(el, { ...combo, notifications: (el as any).notifications }),
      '0 unread',
    );
  });
});
