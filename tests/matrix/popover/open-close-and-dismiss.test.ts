/**
 * snice-popover matrix — every way the panel opens and closes.
 *
 * Documented surface:
 *   · `show()` / `hide()` / `toggle()`, the `open` property and attribute;
 *   · the trigger — "The element that toggles the panel", reachable by pointer
 *     and by keyboard (`role="button"`);
 *   · `popover-open` / `popover-close` → `{ popover }`;
 *   · "Outside-click and Escape close by default; opt out with
 *     `no-outside-dismiss` / `no-escape-dismiss`";
 *   · "Focus is restored to the trigger when the panel closes via Escape."
 *
 * 38 combos.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { unmountAll } from '../matrix-utils';
import {
  checkPopover, click, clickOutside, combo, comboName, expectNoProblems,
  makePopover, panel, press, record, trigger, wait,
} from './popover-support';

type Entry = 'show' | 'hide' | 'toggle' | 'property' | 'attribute' | 'trigger-click'
  | 'trigger-enter' | 'trigger-space';

async function apply(el: any, entry: Entry, target: boolean): Promise<void> {
  switch (entry) {
    case 'show': el.show(); break;
    case 'hide': el.hide(); break;
    case 'toggle': el.toggle(); break;
    case 'property': el.open = target; break;
    case 'attribute':
      if (target) el.setAttribute('open', ''); else el.removeAttribute('open');
      break;
    case 'trigger-click': click(trigger(el)); break;
    case 'trigger-enter': press(trigger(el)!, 'Enter'); break;
    case 'trigger-space': press(trigger(el)!, ' '); break;
  }
  await wait(30);
}

describe('popover matrix — open/close entry points', () => {
  afterEach(() => unmountAll());

  const ENTRIES: Entry[] = [
    'show', 'hide', 'toggle', 'property', 'attribute',
    'trigger-click', 'trigger-enter', 'trigger-space',
  ];

  for (const from of [false, true]) {
    for (const entry of ENTRIES) {
      const target = entry === 'show' ? true : entry === 'hide' ? false : !from;
      const c = combo({ open: from });

      it(`${from ? 'open' : 'closed'} + ${entry} -> ${target}`, async () => {
        const el = await makePopover(c);
        const events = record(el);
        await apply(el, entry, target);

        expect((el as any).open, `${entry} left open=${(el as any).open}`).toBe(target);
        const wanted = target === from ? [] : [target ? 'popover-open' : 'popover-close'];
        expect(events.map(event => event.type), 'events emitted').toEqual(wanted);
        for (const event of events) {
          expect(event.detail.popover, 'event detail.popover').toBe(el);
        }
        expectNoProblems(checkPopover(el, combo({ open: target })), `${entry} -> ${target}`);
      });
    }
  }

  it('toggle() alternates and reports each transition', async () => {
    const el = await makePopover(combo());
    const events = record(el);
    (el as any).toggle();
    await wait(20);
    (el as any).toggle();
    await wait(20);
    expect(events.map(event => event.type)).toEqual(['popover-open', 'popover-close']);
  });

  it('repeated show() reports a single open', async () => {
    const el = await makePopover(combo());
    const events = record(el);
    (el as any).show();
    (el as any).show();
    await wait(20);
    expect(events.map(event => event.type)).toEqual(['popover-open']);
  });

  it('an authored open attribute opens the panel on upgrade', async () => {
    const el = await makePopover(combo({ open: true }));
    expect((el as any).open).toBe(true);
    expect(panel(el)!.getAttribute('class')).toContain('popover__panel--open');
    expect(trigger(el)!.getAttribute('aria-expanded')).toBe('true');
  });
});

describe('popover matrix — outside dismissal', () => {
  afterEach(() => unmountAll());

  for (const noOutsideDismiss of [false, true]) {
    for (const open of [false, true]) {
      const c = combo({ noOutsideDismiss, open });
      it(`${comboName(c)} — a press elsewhere on the page`, async () => {
        const el = await makePopover(c);
        const events = record(el);
        clickOutside();
        await wait(30);

        const stillOpen = open && noOutsideDismiss;
        expect((el as any).open, 'open after an outside press').toBe(stillOpen);
        expect(events.map(event => event.type))
          .toEqual(open && !noOutsideDismiss ? ['popover-close'] : []);
      });
    }
  }

  it('a press inside the panel keeps it open', async () => {
    const el = await makePopover(combo({ open: true }));
    click(el.querySelector('#field'));
    await wait(30);
    expect((el as any).open, 'interacting with the panel closed it').toBe(true);
  });

  it('a press on the trigger toggles rather than dismissing twice', async () => {
    const el = await makePopover(combo({ open: true }));
    const events = record(el);
    click(trigger(el));
    await wait(30);
    expect((el as any).open).toBe(false);
    expect(events.map(event => event.type)).toEqual(['popover-close']);
  });
});

describe('popover matrix — Escape dismissal', () => {
  afterEach(() => unmountAll());

  for (const noEscapeDismiss of [false, true]) {
    for (const open of [false, true]) {
      const c = combo({ noEscapeDismiss, open });
      it(`${comboName(c)} — Escape`, async () => {
        const el = await makePopover(c);
        const events = record(el);
        press(document, 'Escape');
        await wait(30);

        const stillOpen = open && noEscapeDismiss;
        expect((el as any).open, 'open after Escape').toBe(stillOpen);
        expect(events.map(event => event.type))
          .toEqual(open && !noEscapeDismiss ? ['popover-close'] : []);
      });
    }
  }

  it('Escape restores focus to the trigger', async () => {
    const el = await makePopover(combo({ open: true }));
    el.querySelector<HTMLElement>('#field')!.focus();
    press(document, 'Escape');
    await wait(30);
    expect((el as any).open).toBe(false);
    expect(document.activeElement === el || el.shadowRoot!.activeElement === trigger(el),
      'focus was not restored to the trigger').toBe(true);
  });

  it('a key other than Escape leaves the panel open', async () => {
    const el = await makePopover(combo({ open: true }));
    for (const key of ['Enter', 'Tab', 'a', 'ArrowDown']) {
      press(document, key);
      await wait(10);
      expect((el as any).open, `"${key}" closed the panel`).toBe(true);
    }
  });

  it('the document listeners are released when the popover leaves the page', async () => {
    const el = await makePopover(combo({ open: true }));
    el.remove();
    await wait(30);
    const events = record(el);
    press(document, 'Escape');
    clickOutside();
    await wait(30);
    expect(events, 'a detached popover still answered document events').toEqual([]);
  });
});
