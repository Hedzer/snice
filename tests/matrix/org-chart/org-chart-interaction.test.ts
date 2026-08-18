/**
 * snice-org-chart matrix — the INTERACTION slice.
 *
 * The four documented methods and the three documented events:
 *
 *   collapseNode(id) / expandNode(id) / expandAll() / collapseAll()
 *   node-click / node-expand / node-collapse -> { node }
 *
 * plus the two documented activation paths for a node card ("Nodes are
 * clickable", and a card that is keyboard reachable must be keyboard
 * activatable) and the toggle button that sits inside it.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  FIXTURE, DIRECTIONS, combo, mountChart, chartProblems, cardFor, toggleFor,
  captureEvents, flatten, hasChildren, expectedInitials, readTree,
  removeComponent, wait, sr, type OrgChartNode,
} from './org-chart-support';

const DOC = FIXTURE['doc-example'];
const nodeById = (id: string): OrgChartNode =>
  flatten(DOC.data).find(node => node.id === id)!;

function click(node: Element | null): void {
  node?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
}

function press(node: Element | null, key: string): void {
  node?.dispatchEvent(new KeyboardEvent('keydown', {
    key, bubbles: true, composed: true, cancelable: true,
  }));
}

let chart: any;
afterEach(() => { if (chart) { removeComponent(chart); chart = null; } });

// ── node-click ──────────────────────────────────────────────────────────────

describe('org-chart matrix: activating a node card', () => {
  const ACTIVATIONS: Array<{ id: string; how: (card: Element | null) => void }> = [
    { id: 'click', how: card => click(card) },
    { id: 'Enter', how: card => press(card, 'Enter') },
    { id: 'Space', how: card => press(card, ' ') },
  ];

  for (const activation of ACTIVATIONS) {
    for (const target of ['ceo', 'cto', 'dev1', 'cfo']) {
      for (const compact of [false, true]) {
        const c = combo(`${activation.id} on ${target} (compact:${compact})`, DOC, { compact });
        it(c.id, async () => {
          chart = await mountChart(c);
          const events = captureEvents(chart, ['node-click', 'node-expand', 'node-collapse']);

          activation.how(cardFor(chart, nodeById(target)));
          await wait(20);

          expect(events.map(e => e.type), 'activating a card reports node-click only')
            .toEqual(['node-click']);
          expect(events[0].detail.node, 'node-click carries the node that was activated')
            .toEqual(nodeById(target));
          // Activation must not fold the tree: the picture is unchanged.
          expect(chartProblems(chart, c), 'the tree after activating a card').toEqual([]);
        });
      }
    }
  }

  it('does not fire node-click for a key that is not an activation key', async () => {
    const c = combo('other keys', DOC);
    chart = await mountChart(c);
    const events = captureEvents(chart, ['node-click']);

    for (const key of ['a', 'Tab', 'ArrowDown', 'Escape', 'Shift']) {
      press(cardFor(chart, nodeById('ceo')), key);
    }
    await wait(20);

    expect(events).toEqual([]);
  });
});

// ── The toggle button ───────────────────────────────────────────────────────

describe('org-chart matrix: the expand/collapse toggle', () => {
  for (const target of ['ceo', 'cto']) {
    for (const direction of DIRECTIONS) {
      it(`toggling ${target} (${direction})`, async () => {
        const c = combo(`toggle ${target} ${direction}`, DOC, { direction });
        chart = await mountChart(c);
        const events = captureEvents(chart, ['node-click', 'node-expand', 'node-collapse']);

        click(toggleFor(chart, nodeById(target)));
        await wait(20);

        expect(events.map(e => e.type), 'the first toggle collapses')
          .toEqual(['node-collapse']);
        expect(events[0].detail.node).toEqual(nodeById(target));
        expect(chartProblems(chart, { ...c, collapsed: [target] }),
          `the tree with ${target} collapsed`).toEqual([]);

        click(toggleFor(chart, nodeById(target)));
        await wait(20);

        expect(events.map(e => e.type), 'the second toggle expands again')
          .toEqual(['node-collapse', 'node-expand']);
        expect(chartProblems(chart, c), 'the tree after expanding again').toEqual([]);
      });
    }
  }

  it('a toggle click does not also activate the card it sits in', async () => {
    // The toggle lives INSIDE the clickable card; a click that both toggles and
    // selects would make the chart unusable.
    const c = combo('toggle does not select', DOC);
    chart = await mountChart(c);
    const events = captureEvents(chart, ['node-click', 'node-collapse', 'node-expand']);

    click(toggleFor(chart, nodeById('ceo')));
    await wait(20);

    expect(events.map(e => e.type)).toEqual(['node-collapse']);
  });

  it('only nodes with children have a toggle', async () => {
    const c = combo('leaf toggles', DOC);
    chart = await mountChart(c);
    for (const node of flatten(DOC.data)) {
      const toggle = toggleFor(chart, node);
      expect(!!toggle, `node "${node.id}" ${hasChildren(node) ? 'needs' : 'must not have'}`
        + ' a toggle button').toBe(hasChildren(node));
    }
  });
});

// ── The documented methods ──────────────────────────────────────────────────

describe('org-chart matrix: collapseNode / expandNode', () => {
  for (const target of ['ceo', 'cto', 'cfo', 'dev1']) {
    it(`collapseNode("${target}") then expandNode("${target}")`, async () => {
      const c = combo(`method ${target}`, DOC);
      chart = await mountChart(c);
      const events = captureEvents(chart, ['node-collapse', 'node-expand']);

      chart.collapseNode(target);
      await wait(20);
      expect(events.map(e => e.type)).toEqual(['node-collapse']);
      expect(events[0].detail.node).toEqual(nodeById(target));
      expect(chartProblems(chart, { ...c, collapsed: [target] })).toEqual([]);

      chart.expandNode(target);
      await wait(20);
      expect(events.map(e => e.type)).toEqual(['node-collapse', 'node-expand']);
      expect(chartProblems(chart, c)).toEqual([]);
    });
  }

  it('ignores an id that is not in the tree', async () => {
    const c = combo('unknown id', DOC);
    chart = await mountChart(c);
    const events = captureEvents(chart, ['node-collapse', 'node-expand']);

    chart.collapseNode('nobody');
    chart.expandNode('nobody');
    await wait(20);

    expect(events, 'an unknown id must not report anything').toEqual([]);
    expect(chartProblems(chart, c), 'an unknown id must not change the tree').toEqual([]);
  });

  it('survives being called before any data is set', async () => {
    const c = combo('no data', FIXTURE['null']);
    chart = await mountChart(c);
    chart.collapseNode('ceo');
    chart.expandNode('ceo');
    chart.collapseAll();
    chart.expandAll();
    await wait(20);
    expect(chartProblems(chart, c)).toEqual([]);
  });
});

describe('org-chart matrix: expandAll / collapseAll', () => {
  it('collapseAll folds every branch, expandAll opens them again', async () => {
    const c = combo('bulk', DOC);
    chart = await mountChart(c);

    chart.collapseAll();
    await wait(20);
    // Documented: "Collapse all nodes". Every node that HAS children is folded,
    // so only the root card remains on screen.
    expect(sr(chart).querySelectorAll('.org-node')).toHaveLength(1);
    expect(chartProblems(chart, { ...c, collapsed: ['ceo', 'cto'] })).toEqual([]);

    chart.expandAll();
    await wait(20);
    expect(chartProblems(chart, c), 'expandAll must restore the whole tree').toEqual([]);
    expect(sr(chart).querySelectorAll('.org-node'))
      .toHaveLength(flatten(DOC.data).length);
  });

  it('expandAll clears branches collapsed one at a time', async () => {
    const c = combo('bulk after singles', DOC);
    chart = await mountChart(c);
    chart.collapseNode('cto');
    await wait(20);
    chart.expandAll();
    await wait(20);
    expect(chartProblems(chart, c)).toEqual([]);
  });

  it('collapseAll on a chain leaves only the root', async () => {
    const c = combo('bulk chain', FIXTURE['deep-chain']);
    chart = await mountChart(c);
    chart.collapseAll();
    await wait(20);
    expect(sr(chart).querySelectorAll('.org-node')).toHaveLength(1);
    expect(readTree(chart)[0].expanded).toBe('false');
  });

  it('collapseAll is a no-op on a tree with no branches', async () => {
    const c = combo('bulk leaf', FIXTURE['lone-root']);
    chart = await mountChart(c);
    chart.collapseAll();
    await wait(20);
    expect(chartProblems(chart, c)).toEqual([]);
  });
});

// ── FINDINGS ────────────────────────────────────────────────────────────────

describe('org-chart matrix: findings', () => {
  it(
    'MATRIX-org-chart-1 (fixed): an avatar placeholder shows the name initials',
    async () => {
      // docs/components/org-chart.md: "Avatar placeholders display name initials
      // when no image is provided" — initials, plural. The component used to
      // take `name.charAt(0)`, so "Carol White" rendered as "C" rather than
      // "CW"; it now renders every word's first letter, and the assertion runs
      // unpinned as a regression guard.
      const c = combo('initials', FIXTURE['doc-example']);
      chart = await mountChart(c);

      const placeholders = [...sr(chart).querySelectorAll('.org-avatar-placeholder')]
        .map(node => (node.textContent ?? '').trim());
      const wanted = flatten(FIXTURE['doc-example'].data)
        .filter(node => !node.avatar)
        .map(node => expectedInitials(node.name));

      expect(placeholders).toEqual(wanted);
    },
  );

  it('colleagues who share a first initial get distinct placeholders', async () => {
    // The consequence MATRIX-org-chart-1 used to cost, on the record the other
    // way: with one-letter placeholders, "Sam Adams" and "Sam Baker" were both
    // "S". Initials keep them distinguishable.
    const c = combo('ambiguous initials', {
      id: 'same-initial', why: 'two names, one first letter',
      data: {
        id: 'root', name: 'Root',
        children: [
          { id: 'a', name: 'Sam Adams' },
          { id: 'b', name: 'Sam Baker' },
        ],
      },
    });
    chart = await mountChart(c);
    const placeholders = [...sr(chart).querySelectorAll('.org-avatar-placeholder')]
      .map(node => (node.textContent ?? '').trim());
    expect(placeholders.slice(1)).toEqual(['SA', 'SB']);
  });
});
