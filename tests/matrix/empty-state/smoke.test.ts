/**
 * Smoke slice of the snice-empty-state matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include
 * (vitest.config.ts); the full 36-combo cross runs via `npm run test:matrix`.
 * This file lives at `smoke.test.ts` so it stays collected.
 *
 * The subset: one combo per feature family — the bare defaults, a described
 * state, the button action, the link action, the icon slot override, and the
 * documented event. Every assertion routes through the matrix's own oracle, so
 * this file cannot drift into something weaker than the suite it stands in for.
 * Budget: well under 1s.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  DEFAULTS, makeEmptyState, emptyStateProblems, partsNamed,
  type EmptyStateCombo,
} from './empty-state-matrix-utils';

let el: any;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const combo = (over: Partial<EmptyStateCombo> = {}): EmptyStateCombo => ({
  id: 'smoke',
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

describe('empty-state matrix smoke', () => {
  it('renders its documented defaults with nothing authored', async () => {
    const c = combo();
    el = await makeEmptyState(c);
    expect(emptyStateProblems(el, c)).toEqual([]);
  });

  it('a description adds part="description"', async () => {
    const c = combo({ size: 'large', description: 'Try adjusting your search' });
    el = await makeEmptyState(c);
    expect(emptyStateProblems(el, c)).toEqual([]);
  });

  it('action-text alone renders a button action', async () => {
    const c = combo({ action: 'button', actionText: 'Clear Search' });
    el = await makeEmptyState(c);
    expect(emptyStateProblems(el, c)).toEqual([]);
  });

  it('action-href turns the action into a link carrying that href', async () => {
    const c = combo({ action: 'link', actionText: 'Go Home', actionHref: '/' });
    el = await makeEmptyState(c);
    expect(emptyStateProblems(el, c)).toEqual([]);
  });

  it('a slotted icon overrides the icon property', async () => {
    const c = combo({ size: 'small', iconMode: 'slot' });
    el = await makeEmptyState(c);
    expect(emptyStateProblems(el, c)).toEqual([]);
  });

  it('an image icon renders an <img>, an emoji renders text', async () => {
    el = await makeEmptyState(combo({ iconMode: 'image' }));
    expect(emptyStateProblems(el, combo({ iconMode: 'image' }))).toEqual([]);
    removeComponent(el);
    el = await makeEmptyState(combo({ iconMode: 'emoji' }));
    expect(emptyStateProblems(el, combo({ iconMode: 'emoji' }))).toEqual([]);
  });

  it('clicking the action fires empty-state-action with { emptyState }', async () => {
    const c = combo({ action: 'button', actionText: 'Clear Search' });
    el = await makeEmptyState(c);
    const seen: any[] = [];
    el.addEventListener('empty-state-action', (e: CustomEvent) => seen.push(e.detail));
    partsNamed(el, 'action')[0].dispatchEvent(new MouseEvent('click', {
      bubbles: true, composed: true, cancelable: true,
    }));
    expect(seen.length).toBe(1);
    expect(seen[0].emptyState).toBe(el);
  });
});
