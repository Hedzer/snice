/**
 * Matrix slice SPLIT-BUTTON / MENU — the two documented events and the
 * documented ways the menu closes.
 *
 * Contract (docs/ai/components/split-button.md § Events, § Accessibility):
 *   · `primary-click` -> `{ button }`
 *   · `action-click` -> `{ value, action, button }`
 *   · "Menu closes on action click, outside click, or Escape key"
 *
 * Dimensions: close path (3 documented + toggle re-click) x action index (3,
 * including the disabled one) x disabled/loading state, plus the variant sweep
 * to prove the affordance is not a property of one variant.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mount, unmountAll, product, captureEvents, click, key } from '../matrix-utils';
import {
  VARIANTS, ACTIONS, EVENTS, splitButton, attrsOf, propsOf, splitButtonProblems,
  read, actionByValue, type SplitButtonCombo,
} from './split-button-support';

const mountButton = (c: SplitButtonCombo, html = '') =>
  mount<HTMLElement>('snice-split-button', attrsOf(c), html, propsOf(c));

/** Open the menu the way a user does, and prove it opened. */
async function openMenu(el: HTMLElement) {
  click(read(el).toggle);
  await (el as any).rendered;
  expect(read(el).open, 'the toggle did not open the menu').toBe(true);
  expect(read(el).expanded).toBe('true');
}

describe('split-button matrix: menu and events', () => {
  afterEach(() => unmountAll());

  // ── primary-click ────────────────────────────────────────────────────────

  for (const variant of VARIANTS) {
    it(`${variant}: the primary button emits primary-click`, async () => {
      const c = splitButton({ label: 'Save', variant, actions: ACTIONS });
      const el = await mountButton(c);
      const recorder = captureEvents(el, [...EVENTS]);

      click(read(el).primary);

      expect(recorder.types(), variant).toEqual(['primary-click']);
      expect(recorder.events[0].detail, variant).toEqual({ button: el });
    });
  }

  it('a disabled split button emits nothing from either half', async () => {
    const c = splitButton({ label: 'Save', disabled: true, actions: ACTIONS });
    const el = await mountButton(c);
    const recorder = captureEvents(el, [...EVENTS]);

    click(read(el).primary);
    click(read(el).toggle);

    expect(recorder.types()).toEqual([]);
    expect(read(el).open, 'a disabled toggle opened the menu').toBe(false);
  });

  it('primary-click bubbles and crosses the shadow boundary', async () => {
    const c = splitButton({ label: 'Save', actions: ACTIONS });
    const el = await mountButton(c);
    const seen: string[] = [];
    document.addEventListener('primary-click', () => seen.push('document'), { once: true });

    click(read(el).primary);

    expect(seen).toEqual(['document']);
  });

  // ── Opening and action-click ─────────────────────────────────────────────

  for (const point of product({
    variant: VARIANTS,
    value: ['save-draft', 'save-template'],
  })) {
    const id = `${point.variant}: choosing "${point.value}" emits action-click`;

    it(id, async () => {
      const c = splitButton({ label: 'Save', variant: point.variant, actions: ACTIONS });
      const el = await mountButton(c);
      await openMenu(el);
      const recorder = captureEvents(el, [...EVENTS]);

      click(actionByValue(el, point.value)!.node);
      await (el as any).rendered;

      expect(recorder.types(), id).toEqual(['action-click']);
      expect(recorder.events[0].detail, id).toEqual({
        value: point.value,
        action: ACTIONS.find(a => a.value === point.value),
        button: el,
      });
      expect(read(el).open, 'the menu did not close on action click').toBe(false);
      expect(read(el).expanded).toBe('false');
    });
  }

  it('a disabled action emits nothing and leaves the menu open', async () => {
    const c = splitButton({ label: 'Save', actions: ACTIONS });
    const el = await mountButton(c);
    await openMenu(el);
    const recorder = captureEvents(el, [...EVENTS]);

    click(actionByValue(el, 'discard')!.node);
    await (el as any).rendered;

    expect(recorder.types(), 'a disabled action was chosen').toEqual([]);
    expect(read(el).open, 'a disabled action closed the menu').toBe(true);
  });

  it('clicking the menu container but not an action does nothing', async () => {
    const c = splitButton({ label: 'Save', actions: ACTIONS });
    const el = await mountButton(c);
    await openMenu(el);
    const recorder = captureEvents(el, [...EVENTS]);

    click(read(el).menu);
    await (el as any).rendered;

    expect(recorder.types()).toEqual([]);
    expect(read(el).open).toBe(true);
  });

  // ── The three documented ways the menu closes ────────────────────────────

  const closers: Array<[string, (el: HTMLElement) => void]> = [
    ['action click', el => click(actionByValue(el, 'save-draft')!.node)],
    ['outside click', () => click(document.body)],
    ['Escape key', () => key(document, 'Escape')],
  ];

  for (const [id, close] of closers) {
    it(`the menu closes on ${id}`, async () => {
      const c = splitButton({ label: 'Save', actions: ACTIONS });
      const el = await mountButton(c);
      await openMenu(el);

      close(el);
      await (el as any).rendered;

      expect(read(el).open, `the menu survived ${id}`).toBe(false);
      expect(read(el).expanded, `aria-expanded survived ${id}`).toBe('false');
      expect(splitButtonProblems(el, c), id).toEqual([]);
    });
  }

  it('the toggle closes a menu it opened', async () => {
    const c = splitButton({ label: 'Save', actions: ACTIONS });
    const el = await mountButton(c);
    await openMenu(el);

    click(read(el).toggle);
    await (el as any).rendered;

    expect(read(el).open).toBe(false);
    expect(read(el).expanded).toBe('false');
  });

  it('clicking inside the component is not an outside click', async () => {
    const c = splitButton({ label: 'Save', actions: ACTIONS });
    const el = await mountButton(c);
    await openMenu(el);

    click(read(el).menu);
    await (el as any).rendered;

    expect(read(el).open, 'a click inside the component closed the menu').toBe(true);
  });

  it('a key that is not Escape leaves the menu open', async () => {
    const c = splitButton({ label: 'Save', actions: ACTIONS });
    const el = await mountButton(c);
    await openMenu(el);

    for (const k of ['Enter', ' ', 'Tab', 'ArrowDown']) key(document, k);
    await (el as any).rendered;

    expect(read(el).open).toBe(true);
  });

  it('the primary button closes an open menu before acting', async () => {
    const c = splitButton({ label: 'Save', actions: ACTIONS });
    const el = await mountButton(c);
    await openMenu(el);
    const recorder = captureEvents(el, [...EVENTS]);

    click(read(el).primary);
    await (el as any).rendered;

    expect(recorder.types()).toEqual(['primary-click']);
    expect(read(el).open).toBe(false);
  });

  it('disabling the component while the menu is open closes it', async () => {
    const c = splitButton({ label: 'Save', actions: ACTIONS });
    const el = await mountButton(c);
    await openMenu(el);

    (el as any).disabled = true;
    await (el as any).rendered;

    expect(read(el).open, 'a disabled split button left its menu open').toBe(false);
  });

  it('a split button with no actions still opens an empty menu without error', async () => {
    const c = splitButton({ label: 'Save', actions: [] });
    const el = await mountButton(c);
    await openMenu(el);

    expect(read(el).actions).toEqual([]);
    expect(splitButtonProblems(el, c)).toEqual([]);
  });

  it('an Escape with no menu open changes nothing', async () => {
    const c = splitButton({ label: 'Save', actions: ACTIONS });
    const el = await mountButton(c);
    const recorder = captureEvents(el, [...EVENTS]);

    key(document, 'Escape');
    await (el as any).rendered;

    expect(recorder.types()).toEqual([]);
    expect(read(el).open).toBe(false);
    expect(splitButtonProblems(el, c)).toEqual([]);
  });
});
