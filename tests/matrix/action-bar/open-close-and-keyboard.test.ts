/**
 * snice-action-bar matrix — open/close entry points, events, and the documented
 * keyboard model.
 *
 * Documented surface:
 *   · `show()` / `hide()` / `toggle()`, and the `open` property/attribute;
 *   · `action-bar-open` / `action-bar-close` → `{ actionBar }`;
 *   · "Arrow keys navigate focusable children (roving tabindex)";
 *   · "`Home`/`End` jump to first/last";
 *   · "`Escape` closes unless `no-escape-dismiss`".
 *
 * 44 combos.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { unmountAll } from '../matrix-utils';
import {
  CONTENT,
  activeId, checkBar, combo, comboName, expectNoProblems, expectedFocusables,
  focusChild, makeActionBar, press, record, rovingStops, wait,
} from './action-bar-support';

type Entry = 'show' | 'hide' | 'toggle' | 'property' | 'attribute';

function apply(el: any, entry: Entry, target: boolean): void {
  switch (entry) {
    case 'show': el.show(); break;
    case 'hide': el.hide(); break;
    case 'toggle': el.toggle(); break;
    case 'property': el.open = target; break;
    case 'attribute':
      if (target) el.setAttribute('open', ''); else el.removeAttribute('open');
      break;
  }
}

describe('action-bar matrix — open/close entry points', () => {
  afterEach(() => unmountAll());

  for (const from of [false, true]) {
    for (const entry of ['show', 'hide', 'toggle', 'property', 'attribute'] as Entry[]) {
      for (const noAnimation of [false, true]) {
        const target = entry === 'show' ? true
          : entry === 'hide' ? false
          : entry === 'toggle' ? !from
          : !from;
        const c = combo({ open: from, noAnimation });

        it(`${comboName(c)} — ${entry}() -> ${target}`, async () => {
          const el = await makeActionBar(c);
          const events = record(el);
          apply(el, entry, target);
          await wait(20);

          expect((el as any).open, 'open property').toBe(target);
          expect(el.hasAttribute('open'), 'host [open] attribute — the CSS hook')
            .toBe(target);

          const wanted = target === from ? [] : [target ? 'action-bar-open' : 'action-bar-close'];
          expect(events.map(event => event.type), 'events emitted').toEqual(wanted);
          for (const event of events) {
            expect(event.detail.actionBar, 'event detail.actionBar').toBe(el);
          }

          expectNoProblems(checkBar(el, combo({ open: target, noAnimation })), `${entry} -> ${target}`);
        });
      }
    }
  }

  it('repeated show() calls report a single open', async () => {
    const el = await makeActionBar(combo({ open: false }));
    const events = record(el);
    (el as any).show();
    (el as any).show();
    (el as any).show();
    await wait(20);
    expect(events.map(event => event.type)).toEqual(['action-bar-open']);
  });

  it('toggle() alternates and reports each transition', async () => {
    const el = await makeActionBar(combo({ open: false }));
    const events = record(el);
    (el as any).toggle();
    await wait(10);
    (el as any).toggle();
    await wait(10);
    expect(events.map(event => event.type)).toEqual(['action-bar-open', 'action-bar-close']);
  });
});

describe('action-bar matrix — roving keyboard navigation', () => {
  afterEach(() => unmountAll());

  const NAV: Array<{ key: string; from: number; expect: (n: number) => number }> = [
    { key: 'ArrowRight', from: 0, expect: n => Math.min(1, n - 1) },
    { key: 'ArrowDown', from: 0, expect: n => Math.min(1, n - 1) },
    { key: 'ArrowLeft', from: 1, expect: () => 0 },
    { key: 'ArrowUp', from: 1, expect: () => 0 },
    { key: 'Home', from: 2, expect: () => 0 },
    { key: 'End', from: 0, expect: n => n - 1 },
  ];

  for (const content of ['three', 'mixed', 'withDisabled'] as Array<keyof typeof CONTENT>) {
    const focusables = expectedFocusables(content);
    for (const step of NAV) {
      const c = combo({ content, open: true });
      it(`${content}/${step.key}`, async () => {
        const el = await makeActionBar(c);
        const start = Math.min(step.from, focusables.length - 1);
        focusChild(el, focusables[start]);
        press(el, step.key);
        await wait(10);

        const want = focusables[step.expect(focusables.length)];
        expect(activeId(), `${step.key} moved focus to the wrong child`).toBe(want);
        // Roving tabindex: the focused child is the ONLY tab stop.
        expect(rovingStops(el), `${step.key} left more than one tab stop`).toEqual([want]);
      });
    }
  }

  it('arrow keys are ignored when there is nothing focusable', async () => {
    const el = await makeActionBar(combo({ content: 'none', open: true }));
    press(el, 'ArrowRight');
    await wait(10);
    expect(rovingStops(el)).toEqual([]);
  });

  it('a single action stays put under every navigation key', async () => {
    const el = await makeActionBar(combo({ content: 'one', open: true }));
    for (const key of ['ArrowRight', 'ArrowLeft', 'Home', 'End']) {
      press(el, key);
      await wait(5);
      expect(activeId(), key).toBe('a');
      expect(rovingStops(el)).toEqual(['a']);
    }
  });
});

describe('action-bar matrix — Escape dismiss', () => {
  afterEach(() => unmountAll());

  for (const noEscapeDismiss of [false, true]) {
    for (const open of [false, true]) {
      const c = combo({ open, noEscapeDismiss });
      it(`${comboName(c)} — Escape`, async () => {
        const el = await makeActionBar(c);
        const events = record(el);
        press(el, 'Escape');
        await wait(20);

        const stillOpen = noEscapeDismiss ? open : false;
        expect((el as any).open, 'open after Escape').toBe(stillOpen);
        expect(events.map(event => event.type))
          .toEqual(open && !noEscapeDismiss ? ['action-bar-close'] : []);
      });
    }
  }

  it('Escape does not disturb the roving tabindex when dismissal is off', async () => {
    const el = await makeActionBar(combo({ open: true, noEscapeDismiss: true, content: 'three' }));
    focusChild(el, 'b');
    press(el, 'ArrowRight');
    await wait(10);
    press(el, 'Escape');
    await wait(10);
    expect((el as any).open).toBe(true);
    expect(rovingStops(el)).toEqual(['c']);
  });
});
