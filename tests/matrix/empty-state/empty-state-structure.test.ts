/**
 * snice-empty-state matrix — the generated cross.
 *
 * size x action-shape x icon-source (36 combos), with description, a custom
 * title and default-slot content rotated across them. Every combo is judged by
 * the shared oracle in empty-state-matrix-utils.ts, which encodes
 * docs/ai/components/empty-state.md — never observed output.
 */
import { describe, it, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  generateCombos, makeEmptyState, expectEmptyState, emptyStateProblems,
  SIZES, ACTIONS, ICON_MODES, DEFAULTS,
} from './empty-state-matrix-utils';

let el: any;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const combos = generateCombos();

describe('empty-state matrix: generated cross', () => {
  for (const combo of combos) {
    it(combo.id, async () => {
      el = await makeEmptyState(combo);
      expectEmptyState(el, combo);
    });
  }
});

describe('empty-state matrix: the cross is what it claims to be', () => {
  it('covers every size against every action shape and icon source', () => {
    const seen = new Set(combos.map(c => `${c.size}/${c.action}/${c.iconMode}`));
    const want = SIZES.length * ACTIONS.length * ICON_MODES.length;
    if (combos.length !== want || seen.size !== want) {
      throw new Error(`generator produced ${combos.length} combos, ${seen.size} distinct,`
        + ` expected ${want}`);
    }
  });

  it('rotates description, a custom title and default-slot content in', () => {
    if (!combos.some(c => c.description)) throw new Error('description is never set');
    if (!combos.some(c => !c.description)) throw new Error('description is never absent');
    if (!combos.some(c => c.title !== DEFAULTS.title)) {
      throw new Error('the title is never customised');
    }
    if (!combos.some(c => c.extra)) throw new Error('the default slot is never filled');
  });
});

describe('empty-state matrix: the documented defaults', () => {
  it('an empty state authored with nothing at all still renders its documented defaults', async () => {
    // "icon: string = '📭'", "title: string = 'No data'" — the component is
    // documented as usable with no properties whatsoever.
    el = await makeEmptyState({ iconMode: 'default' });
    expectEmptyState(el, {
      id: 'defaults',
      size: DEFAULTS.size,
      action: 'none',
      iconMode: 'default',
      title: DEFAULTS.title,
      description: '',
      actionText: '',
      actionHref: '',
      extra: '',
    });
  });
});

describe('empty-state matrix: the oracle is not vacuous', () => {
  it('rejects an empty state whose documented action is missing', async () => {
    el = await makeEmptyState({ iconMode: 'default' });
    const problems = emptyStateProblems(el, {
      id: 'probe', size: 'medium', action: 'button', iconMode: 'default',
      title: DEFAULTS.title, description: '', actionText: 'Clear Search',
      actionHref: '', extra: '',
    });
    if (problems.length === 0) {
      throw new Error('oracle accepted an empty state with no action where one was documented');
    }
  });

  it('rejects a button where the docs promised a link', async () => {
    el = await makeEmptyState({
      iconMode: 'default', actionText: 'Go Home', action: 'button',
    });
    const problems = emptyStateProblems(el, {
      id: 'probe', size: 'medium', action: 'link', iconMode: 'default',
      title: DEFAULTS.title, description: '', actionText: 'Go Home',
      actionHref: '/', extra: '',
    });
    if (problems.length === 0) {
      throw new Error('oracle accepted a <button> where action-href documents a link');
    }
  });
});
