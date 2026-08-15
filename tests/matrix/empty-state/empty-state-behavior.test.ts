/**
 * snice-empty-state matrix — the EVENT and the transitions.
 *
 * The generated cross builds each combo once and reads the tree. This file
 * crosses the documented interaction (`empty-state-action`) against both action
 * shapes and every size, and then crosses the property changes an empty state
 * undergoes at runtime — an action appearing, a description arriving, an icon
 * switching source — asserting the element that comes out is indistinguishable
 * from one built that way in the first place.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  DEFAULTS, SIZES, makeEmptyState, emptyStateProblems, partsNamed, wait,
  CUSTOM_EMOJI, ICON_URL, type EmptyStateCombo,
} from './empty-state-matrix-utils';

let el: any;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const combo = (over: Partial<EmptyStateCombo> = {}): EmptyStateCombo => ({
  id: 'behaviour',
  size: DEFAULTS.size,
  action: 'none',
  iconMode: 'default',
  title: DEFAULTS.title,
  description: '',
  actionText: '',
  actionHref: '',
  extra: '',
  ...over,
} as EmptyStateCombo);

interface Captured { type: string; detail: any; defaultPrevented: boolean }

function record(el: HTMLElement): Captured[] {
  const events: Captured[] = [];
  el.addEventListener('empty-state-action', (event: Event) => {
    events.push({
      type: event.type,
      detail: (event as CustomEvent).detail,
      defaultPrevented: false,
    });
  });
  return events;
}

function clickAction(el: any): boolean {
  const action = partsNamed(el, 'action')[0];
  if (!action) return false;
  return action.dispatchEvent(new MouseEvent('click', {
    bubbles: true, composed: true, cancelable: true,
  }));
}

describe('empty-state matrix: the documented action event', () => {
  for (const size of SIZES) {
    for (const shape of ['button', 'link'] as const) {
      it(`${size}/${shape}: clicking the action fires empty-state-action with { emptyState }`,
        async () => {
          const c = combo({
            size, action: shape, actionText: 'Do it',
            actionHref: shape === 'link' ? '/home' : '',
          });
          el = await makeEmptyState(c);
          expect(emptyStateProblems(el, c)).toEqual([]);
          const events = record(el);
          const notCancelled = clickAction(el);
          expect(events.map(e => e.type)).toEqual(['empty-state-action']);
          // "→ { emptyState: SniceEmptyStateElement }" — the element itself.
          expect(events[0].detail?.emptyState).toBe(el);
          // A BUTTON action has nowhere to navigate, so the component cancels
          // the click; a LINK is documented as a link and must be allowed to
          // follow its href.
          expect(notCancelled, shape === 'link'
            ? 'a link action must not have its click cancelled'
            : 'a button action must cancel its click').toBe(shape === 'link');
        });
    }
  }

  it('an empty state with no action has nothing to fire', async () => {
    const c = combo();
    el = await makeEmptyState(c);
    const events = record(el);
    expect(clickAction(el)).toBe(false);
    expect(events).toEqual([]);
  });

  it('the event bubbles and crosses the shadow boundary', async () => {
    // `@dispatch('empty-state-action', { bubbles: true, composed: true })` is
    // what makes `document.addEventListener` in the documented example work.
    const c = combo({ action: 'button', actionText: 'Clear Search' });
    el = await makeEmptyState(c);
    const seen: string[] = [];
    const handler = () => seen.push('document');
    document.addEventListener('empty-state-action', handler);
    clickAction(el);
    document.removeEventListener('empty-state-action', handler);
    expect(seen).toEqual(['document']);
  });

  it('every click fires again — the action is not one-shot', async () => {
    const c = combo({ action: 'button', actionText: 'Retry' });
    el = await makeEmptyState(c);
    const events = record(el);
    clickAction(el);
    clickAction(el);
    clickAction(el);
    expect(events.length).toBe(3);
  });
});

describe('empty-state matrix: transitions', () => {
  it('an action appearing after mount renders as a button, then as a link', async () => {
    el = await makeEmptyState(combo());
    expect(emptyStateProblems(el, combo())).toEqual([]);

    el.actionText = 'Clear Search';
    await wait(20);
    expect(emptyStateProblems(el, combo({ action: 'button', actionText: 'Clear Search' })))
      .toEqual([]);

    el.actionHref = '/home';
    await wait(20);
    expect(emptyStateProblems(el,
      combo({ action: 'link', actionText: 'Clear Search', actionHref: '/home' }))).toEqual([]);

    // Removing the href must take the link back to a button, not leave an <a>
    // with no destination.
    el.actionHref = '';
    await wait(20);
    expect(emptyStateProblems(el, combo({ action: 'button', actionText: 'Clear Search' })))
      .toEqual([]);

    el.actionText = '';
    await wait(20);
    expect(emptyStateProblems(el, combo())).toEqual([]);
  });

  it('a description arriving and leaving adds and removes part="description"', async () => {
    el = await makeEmptyState(combo());
    el.description = 'Try adjusting your search';
    await wait(20);
    expect(emptyStateProblems(el, combo({ description: 'Try adjusting your search' })))
      .toEqual([]);
    el.description = '';
    await wait(20);
    expect(emptyStateProblems(el, combo())).toEqual([]);
  });

  it('an icon switching from emoji to image swaps the glyph for an <img>', async () => {
    el = await makeEmptyState(combo({ iconMode: 'emoji' }));
    expect(emptyStateProblems(el, combo({ iconMode: 'emoji' }))).toEqual([]);
    el.icon = ICON_URL;
    await wait(20);
    expect(emptyStateProblems(el, combo({ iconMode: 'image' }))).toEqual([]);
    el.icon = CUSTOM_EMOJI;
    await wait(20);
    expect(emptyStateProblems(el, combo({ iconMode: 'emoji' }))).toEqual([]);
  });

  it('the size class follows the size property through every documented value', async () => {
    el = await makeEmptyState(combo());
    for (const size of ['small', 'large', 'medium', 'small'] as const) {
      el.size = size;
      await wait(20);
      expect(emptyStateProblems(el, combo({ size })), size).toEqual([]);
    }
  });

  it('a slotted icon keeps overriding the property after the property changes', async () => {
    // "icon — Custom icon content (overrides the `icon` property)". The
    // override is a property of the SLOT being filled, so it cannot expire the
    // first time the property it overrides is reassigned.
    el = await makeEmptyState(combo({ iconMode: 'slot' }));
    expect(emptyStateProblems(el, combo({ iconMode: 'slot' }))).toEqual([]);
    el.icon = CUSTOM_EMOJI;
    await wait(20);
    expect(emptyStateProblems(el, combo({ iconMode: 'slot' }))).toEqual([]);
  });
});
