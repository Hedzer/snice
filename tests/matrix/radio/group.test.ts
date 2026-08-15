/**
 * snice-radio matrix — group identity, exclusivity, tab stop and keyboard.
 *
 * SIZING. This slice is where the radio earns a bigger matrix than the rest of
 * this batch: its documented subject is a SET. "Named radios coordinate only
 * when all are equal: non-empty `name`, form owner, document or shadow root"
 * is a three-condition identity, and every condition needs its own negative
 * case; the roving tab stop and the arrow-key walk are then properties OF a
 * group, crossed against which members are disabled.
 */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { unmountAll, product, comboId, wait } from '../matrix-utils';
import { installInternalsMock, restoreInternalsMock } from '../internals-mock';
import {
  GATES, mountGroup, activate, arrow, selection, tabStops, expectedTabStops,
  recordGroup, type Gate,
} from './radio-support';

beforeEach(installInternalsMock);
afterEach(() => { restoreInternalsMock(); unmountAll(); });

const PLANS = [{ value: 'basic' }, { value: 'pro' }, { value: 'team' }];

describe('radio matrix: exclusivity within a group', () => {
  for (const combo of product({ target: [0, 1, 2], entry: ['input', 'click()'] as const })) {
    const label = comboId(combo);
    it(label, async () => {
      const group = await mountGroup(PLANS);
      await activate(group[combo.target], combo.entry);

      // DOCUMENTED ("Activation and Events"): "Only the newly selected radio
      // emits. The old member is silently unchecked."
      expect(selection(group), label)
        .toEqual([0, 1, 2].map(i => i === combo.target));
    });
  }

  it('re-selecting the same member emits nothing the second time', async () => {
    const group = await mountGroup(PLANS);
    await activate(group[1], 'input');
    const recorders = recordGroup(group);

    await activate(group[1], 'input');

    // DOCUMENTED: "An already selected radio emits no state-change events."
    //
    // The recorder's `input` entry comes from the NATIVE input element, not the
    // component: happy-dom dispatches `input` for a click on an already-checked
    // radio, which a real browser does not. That is an environment artifact, so
    // it is excluded here and the same claim is asserted whole — all three
    // events — against a real engine in tests/live/matrix/radio.
    expect(recorders.map(r => r.seen.filter(type => type !== 'input')))
      .toEqual([[], [], []]);
    expect(selection(group)).toEqual([false, true, false]);
  });

  it('only the newly selected member emits, and the old one is silent', async () => {
    const group = await mountGroup(PLANS);
    await activate(group[0], 'input');
    const recorders = recordGroup(group);

    await activate(group[2], 'input');

    expect(recorders[0].seen, 'the deselected member emitted').toEqual([]);
    expect(recorders[1].seen).toEqual([]);
    expect(recorders[2].seen).toEqual(['input', 'change', 'radio-change']);
  });
});

describe('radio matrix: group identity', () => {
  // DOCUMENTED ("Group Identity"): coordination requires ALL THREE of a
  // non-empty name, the same form owner, and the same root. Each case below
  // breaks exactly one of them and asserts INDEPENDENCE.

  it('empty-name radios are independent', async () => {
    const group = await mountGroup([{ name: '' }, { name: '' }]);
    await activate(group[0], 'input');
    await activate(group[1], 'input');
    expect(selection(group)).toEqual([true, true]);
  });

  it('different names are independent', async () => {
    const group = await mountGroup([{ name: 'plan' }, { name: 'tier' }]);
    await activate(group[0], 'input');
    await activate(group[1], 'input');
    expect(selection(group)).toEqual([true, true]);
  });

  it('same-name radios in different forms are independent', async () => {
    const [a] = await mountGroup([{ name: 'plan', value: 'a' }]);
    const [b] = await mountGroup([{ name: 'plan', value: 'b' }]);
    await activate(a, 'input');
    await activate(b, 'input');
    expect([a.checked, b.checked], 'two forms, two independent groups').toEqual([true, true]);
  });

  it('same-name radios in different roots are independent', async () => {
    // A shadow root is the other tree root the docs name.
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = host.attachShadow({ mode: 'open' });
    const [inShadow] = await mountGroup([{ name: 'plan', value: 'shadow' }], {
      container: 'div', host: root,
    });
    const [inDocument] = await mountGroup([{ name: 'plan', value: 'doc' }], { container: 'div' });

    await activate(inShadow, 'input');
    await activate(inDocument, 'input');

    expect([inShadow.checked, inDocument.checked]).toEqual([true, true]);
  });

  it('same-name radios sharing a root and no form DO coordinate', async () => {
    const group = await mountGroup(PLANS, { container: 'div' });
    await activate(group[0], 'input');
    await activate(group[2], 'input');
    expect(selection(group)).toEqual([false, false, true]);
  });

  it('a dynamic name change recomputes the group', async () => {
    // DOCUMENTED: "dynamic `name` … recompute[s] selection, group validity, and
    // the roving tab stop."
    const group = await mountGroup(PLANS);
    await activate(group[0], 'input');

    group[1].name = 'other';
    await wait(20);
    await activate(group[1], 'input');

    // The member that left the group cannot deselect it any more.
    expect(selection(group)).toEqual([true, true, false]);
  });

  it('removing the checked member leaves the group with no selection', async () => {
    // DOCUMENTED: "Checked insertion/reconnection, removal … recompute
    // selection, group validity, and the roving tab stop."
    const group = await mountGroup(PLANS);
    await activate(group[1], 'input');
    group[1].remove();
    await wait(20);

    expect([group[0].checked, group[2].checked]).toEqual([false, false]);
    expect(tabStops([group[0], group[2]]), 'the tab stop moved to the first enabled member')
      .toEqual([0, -1]);
  });
});

describe('radio matrix: the roving tab stop', () => {
  /** Gate vectors that move the documented tab stop somewhere different. */
  const LAYOUTS: Array<{ id: string; gates: Gate[]; checkedIndex?: number }> = [
    { id: 'all enabled, none checked', gates: ['none', 'none', 'none'] },
    { id: 'all enabled, second checked', gates: ['none', 'none', 'none'], checkedIndex: 1 },
    { id: 'first disabled', gates: ['disabled', 'none', 'none'] },
    { id: 'first loading', gates: ['loading', 'none', 'none'] },
    { id: 'first fieldset-disabled', gates: ['fieldset', 'none', 'none'] },
    { id: 'checked member disabled', gates: ['disabled', 'none', 'none'], checkedIndex: 0 },
  ];

  for (const layout of LAYOUTS) {
    it(layout.id, async () => {
      const group = await mountGroup(layout.gates.map((gate, i) => ({
        gate, value: `v${i}`, defaultChecked: i === layout.checkedIndex,
      })));

      // DOCUMENTED ("Keyboard"): "Checked enabled member is the tab stop;
      // otherwise first enabled member." Exactly one 0 in the group.
      expect(tabStops(group), layout.id).toEqual(expectedTabStops(
        layout.gates.map((gate, i) => ({ gate, checked: i === layout.checkedIndex })),
      ));
    });
  }

  it('selecting a member moves the tab stop to it', async () => {
    const group = await mountGroup(PLANS);
    expect(tabStops(group)).toEqual([0, -1, -1]);
    await activate(group[2], 'input');
    expect(tabStops(group), 'the tab stop follows the selection').toEqual([-1, -1, 0]);
  });
});

describe('radio matrix: arrow-key navigation', () => {
  const FORWARD = ['ArrowDown', 'ArrowRight'];
  const BACKWARD = ['ArrowUp', 'ArrowLeft'];

  for (const combo of product({ key: [...FORWARD, ...BACKWARD], from: [0, 2] })) {
    const label = `${combo.key} from ${combo.from}`;
    it(label, async () => {
      const group = await mountGroup(PLANS);
      await activate(group[combo.from], 'input');

      await arrow(group[combo.from], combo.key);

      // DOCUMENTED ("Keyboard"): Right/Down select the next enabled member,
      // Left/Up the previous, and "Navigation wraps".
      const forward = FORWARD.includes(combo.key);
      const expectedIndex = forward
        ? (combo.from + 1) % 3
        : (combo.from + 2) % 3;
      expect(selection(group), label)
        .toEqual([0, 1, 2].map(i => i === expectedIndex));
    });
  }

  for (const gate of ['disabled', 'loading', 'fieldset'] as Gate[]) {
    it(`navigation skips a ${gate} member`, async () => {
      // DOCUMENTED: "Navigation wraps and skips disabled/loading radios."
      const group = await mountGroup([
        { value: 'a' }, { value: 'b', gate }, { value: 'c' },
      ]);
      await activate(group[0], 'input');

      await arrow(group[0], 'ArrowDown');

      expect(selection(group), `${gate} member was selected by an arrow key`)
        .toEqual([false, false, true]);
    });
  }

  it('a gated member does not respond to arrows at all', async () => {
    for (const gate of GATES.filter(g => g !== 'none')) {
      const group = await mountGroup([
        { value: 'a', gate }, { value: 'b' }, { value: 'c' },
      ]);
      await arrow(group[0], 'ArrowDown');
      expect(selection(group), `${gate} member moved the selection`)
        .toEqual([false, false, false]);
    }
  });
});
