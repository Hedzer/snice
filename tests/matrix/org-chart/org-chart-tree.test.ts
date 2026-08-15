/**
 * snice-org-chart matrix — the TREE slice.
 *
 * Ten hierarchy shapes x `direction` x `compact` = 40 combos. Each walks the
 * data and the rendered shadow tree in lockstep through `chartProblems`: same
 * nodes, same order, same nesting, and at every node the documented card —
 * name, optional title, avatar or initials, a toggle exactly when there are
 * children — plus the tree/treeitem/group ARIA that makes it navigable.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  FIXTURES, FIXTURE, DIRECTIONS, combo, mountChart, chartProblems, readTree,
  removeComponent, type ChartCombo,
} from './org-chart-support';

function treeCombos(): ChartCombo[] {
  const combos: ChartCombo[] = [];
  for (const fixture of FIXTURES) {
    for (const direction of DIRECTIONS) {
      for (const compact of [false, true]) {
        combos.push(combo(`${fixture.id}/${direction}/compact:${compact}`, fixture, {
          direction, compact,
        }));
      }
    }
  }
  return combos;
}

let chart: any;
afterEach(() => { if (chart) { removeComponent(chart); chart = null; } });

describe('org-chart matrix: hierarchies x direction x compact', () => {
  const combos = treeCombos();

  it('enumerates the full cross', () => {
    expect(combos).toHaveLength(FIXTURES.length * DIRECTIONS.length * 2);
    expect(new Set(combos.map(c => c.id)).size).toBe(combos.length);
  });

  for (const c of combos) {
    it(c.id, async () => {
      chart = await mountChart(c);
      expect(chartProblems(chart, c), `combo ${c.id} — ${c.fixture.why}`).toEqual([]);
    });
  }
});

describe('org-chart matrix: collapsed branches', () => {
  // Every collapsible node of the docs' own example, collapsed one at a time
  // and then in combination, crossed against both directions. A collapsed
  // branch must vanish COMPLETELY — a hidden-but-present subtree is still in
  // the accessibility tree.
  const COLLAPSES: string[][] = [
    [], ['ceo'], ['cto'], ['ceo', 'cto'], ['cto', 'ceo'],
    ['dev1'], ['cfo'], ['nobody'],
  ];

  for (const collapsed of COLLAPSES) {
    for (const direction of DIRECTIONS) {
      const c = combo(
        `collapsed:[${collapsed.join(',') || 'none'}]/${direction}`,
        FIXTURE['doc-example'], { collapsed, direction },
      );
      it(c.id, async () => {
        chart = await mountChart(c);
        expect(chartProblems(chart, c), `combo ${c.id}`).toEqual([]);
      });
    }
  }

  it('collapsing the root hides every descendant', async () => {
    const c = combo('collapse root', FIXTURE['deep-chain'], { collapsed: ['l0'] });
    chart = await mountChart(c);
    expect(chartProblems(chart, c)).toEqual([]);
    expect(readTree(chart)[0].childGroup, 'a collapsed root still has children on screen')
      .toBeNull();
  });
});

describe('org-chart matrix: the properties are live', () => {
  it('re-renders for every hierarchy it is handed', async () => {
    const base = combo('data-walk', FIXTURES[0]);
    chart = await mountChart(base);

    const problems: string[] = [];
    for (const fixture of FIXTURES) {
      chart.data = fixture.data;
      await new Promise(resolve => setTimeout(resolve, 30));
      const next = { ...base, fixture, id: `data-walk -> ${fixture.id}` };
      problems.push(...chartProblems(chart, next).map(p => `${next.id}: ${p}`));
    }
    expect(problems).toEqual([]);
  });

  it('switches layout direction in place', async () => {
    const base = combo('direction-walk', FIXTURE['doc-example']);
    chart = await mountChart(base);

    const problems: string[] = [];
    for (const direction of ['left-right', 'top-down', 'left-right'] as const) {
      chart.direction = direction;
      await new Promise(resolve => setTimeout(resolve, 30));
      const next = { ...base, direction, id: `direction-walk -> ${direction}` };
      problems.push(...chartProblems(chart, next).map(p => `${next.id}: ${p}`));
    }
    expect(problems).toEqual([]);
  });

  it('switches compact mode in place', async () => {
    const base = combo('compact-walk', FIXTURE['mixed-avatars']);
    chart = await mountChart(base);

    const problems: string[] = [];
    for (const compact of [true, false, true]) {
      chart.compact = compact;
      await new Promise(resolve => setTimeout(resolve, 30));
      const next = { ...base, compact, id: `compact-walk -> ${compact}` };
      problems.push(...chartProblems(chart, next).map(p => `${next.id}: ${p}`));
    }
    expect(problems).toEqual([]);
  });

  it('renders names and titles as text, never as markup', async () => {
    const c = combo('escaping', FIXTURE['markup-in-text']);
    chart = await mountChart(c);
    expect(chartProblems(chart, c)).toEqual([]);
    // The oracle already compared the text; this pins the reason it matters.
    expect(chart.shadowRoot.querySelector('[part="tree"]').querySelector('b'),
      'a name containing <b> was parsed as markup').toBeNull();
    expect(chart.shadowRoot.querySelector('[part="tree"]').querySelector('script'),
      'a name containing <script> was parsed as markup').toBeNull();
  });
});
