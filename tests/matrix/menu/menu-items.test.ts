/**
 * snice-menu matrix — MENU ITEMS and selection.
 *
 * `snice-menu-item` documents three properties (`value`, `disabled`,
 * `selected`), three slots (`icon`, default, `shortcut`) and four parts. The
 * full 2^4 cross of {icon, shortcut, disabled, selected} is 16 combos — cheap,
 * and worth taking whole because the item builds ONE class string and ONE
 * aria-disabled from those flags, and because `disabled` is documented as
 * suppressing selection while `selected` is documented as purely presentational.
 * The two must not be confused, and only the cross catches it.
 *
 * The second half is the interaction contract the menu owns rather than the
 * item: `menu-item-select` bubbles from the item to the menu with
 * `{ item, value }`, and `closeOnSelect` (default true) decides whether that
 * selection also closes the panel. `closeOnSelect` x `disabled` is the cross
 * that matters — a disabled item must not close a menu it was never allowed
 * to select from.
 */
import { describe, it, afterEach } from 'vitest';
import {
  type ItemSpec,
  combo, defaultProjection, expect, expectItemMatches, fire, itemsOf, makeMenu, part,
  recordEvents, teardown, wait,
} from './menu-support';

const SETTLE = 20;
const flags = [false, true];

describe('snice-menu matrix — items', () => {
  afterEach(teardown);

  // ── the 2^4 presentation cross ───────────────────────────────────────────
  for (const icon of flags) {
    for (const shortcut of flags) {
      for (const disabled of flags) {
        for (const selected of flags) {
          const spec: ItemSpec = {
            value: 'act', label: 'Act',
            icon: icon ? '★' : undefined,
            shortcut: shortcut ? '⌘K' : undefined,
            disabled, selected,
          };
          const on = [icon && 'icon', shortcut && 'shortcut', disabled && 'disabled',
            selected && 'selected'].filter(Boolean).join('+') || 'plain';
          it(`item renders its documented shape: ${on}`, async () => {
            const el = await makeMenu(combo({ items: [spec], id: `item/${on}` }));
            expectItemMatches(itemsOf(el)[0], spec);
          });
        }
      }
    }
  }

  // ── selection: the documented event and its detail ───────────────────────
  it('clicking an item emits menu-item-select with { item, value }', async () => {
    const el = await makeMenu(combo());
    el.openMenu();
    await wait(SETTLE);

    const target = itemsOf(el)[1];
    const events = recordEvents(el);
    fire(target, 'click');
    await wait(SETTLE);

    const selects = events.log
      .map((type, i) => ({ type, detail: events.details[i] }))
      .filter(entry => entry.type === 'menu-item-select');
    expect(selects.length, 'one menu-item-select').toBe(1);
    expect(selects[0].detail.value, 'detail.value').toBe('save');
    expect(selects[0].detail.item, 'detail.item').toBe(target);
  });

  it('the event bubbles past the menu — it is composed and reaches document', async () => {
    const el = await makeMenu(combo());
    el.openMenu();
    await wait(SETTLE);

    const seen: string[] = [];
    const listener = (event: Event) => seen.push((event as CustomEvent).detail.value);
    document.addEventListener('menu-item-select', listener);
    fire(itemsOf(el)[2], 'click');
    await wait(SETTLE);
    document.removeEventListener('menu-item-select', listener);

    expect(seen).toEqual(['exit']);
  });

  // ── closeOnSelect x disabled ─────────────────────────────────────────────
  for (const closeOnSelect of flags) {
    for (const disabled of flags) {
      it(`close-on-select=${closeOnSelect} + item disabled=${disabled}`, async () => {
        const el = await makeMenu(combo({
          closeOnSelect,
          items: [{ value: 'act', label: 'Act', disabled }],
          id: `select/close=${closeOnSelect}/disabled=${disabled}`,
        }));
        el.openMenu();
        await wait(SETTLE);

        const events = recordEvents(el);
        fire(itemsOf(el)[0], 'click');
        await wait(SETTLE);

        const selected = events.log.includes('menu-item-select');
        // A disabled item is documented as not selectable at all.
        expect(selected, 'menu-item-select emitted').toBe(!disabled);
        // …and only a real selection can trigger the documented auto-close.
        expect(el.open, 'menu still open').toBe(!(closeOnSelect && !disabled));
      });
    }
  }

  it('an empty value is the documented default and still travels in the detail', async () => {
    const el = await makeMenu(combo({ items: [{ value: '', label: 'Blank' }] }));
    const item = itemsOf(el)[0];
    expect(item.value, 'documented default value').toBe('');

    el.openMenu();
    await wait(SETTLE);
    const events = recordEvents(el);
    fire(item, 'click');
    await wait(SETTLE);

    const detail = events.details[events.log.indexOf('menu-item-select')];
    expect(detail.value).toBe('');
    expect(detail.item).toBe(item);
  });

  it('selection state is presentational — it does not gate the event', async () => {
    const el = await makeMenu(combo({
      items: [{ value: 'a', label: 'A', selected: true }],
      closeOnSelect: false,
    }));
    el.openMenu();
    await wait(SETTLE);

    const events = recordEvents(el);
    fire(itemsOf(el)[0], 'click');
    await wait(SETTLE);
    expect(events.log.filter(type => type === 'menu-item-select').length).toBe(1);
    expect(itemsOf(el)[0].selected, 'the menu does not mutate selected').toBe(true);
  });

  it('items and dividers share the one documented default slot', async () => {
    const el = await makeMenu(combo({ divider: true }));
    expect(part(el, 'content')!.querySelector('slot:not([name])'),
      'the default slot lives inside part="content"').not.toBeNull();
    expect(defaultProjection(el))
      .toEqual(['snice-menu-item', 'snice-menu-divider', 'snice-menu-item', 'snice-menu-item']);
  });
});
