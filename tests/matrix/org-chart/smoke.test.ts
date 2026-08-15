/**
 * Smoke slice of the snice-org-chart matrix — the everyday-loop tier.
 *
 * `tests/matrix` is excluded from the default Vitest include
 * (vitest.config.ts); the full cross (40 tree combos plus the collapse and
 * interaction slices) runs only via `npm run test:matrix`. This file lives
 * at `smoke.test.ts` so it stays collected, and pays for the marquee combos
 * only:
 *
 *   · the docs' own three-level example — the whole recursive card renderer in
 *     one assertion, including avatar/initials and the tree ARIA;
 *   · no data — the documented `null` default;
 *   · compact and left-right — the two presentation switches;
 *   · one collapsed branch — the fold that must remove a subtree completely;
 *   · one card activation and one toggle click — the two events a page listens
 *     for.
 *
 * Every structural assertion routes through the matrix's own oracle
 * (`chartProblems`), so this file cannot drift into asserting something weaker
 * than the suite it stands in for. BUDGET: well under 1s.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  FIXTURE, combo, mountChart, chartProblems, cardFor, toggleFor, captureEvents,
  flatten, removeComponent, wait, sr,
} from './org-chart-support';

const DOC = FIXTURE['doc-example'];
const ceo = () => flatten(DOC.data).find(node => node.id === 'ceo')!;

const MARQUEE = [
  combo('doc example', DOC),
  combo('no data', FIXTURE['null']),
  combo('compact', DOC, { compact: true }),
  combo('left-right', DOC, { direction: 'left-right' }),
  combo('mixed avatars', FIXTURE['mixed-avatars']),
  combo('one branch collapsed', DOC, { collapsed: ['cto'] }),
  combo('names are text, not markup', FIXTURE['markup-in-text']),
];

let chart: any;
afterEach(() => { if (chart) { removeComponent(chart); chart = null; } });

describe('org-chart matrix smoke', () => {
  for (const c of MARQUEE) {
    it(c.id, async () => {
      chart = await mountChart(c);
      expect(chartProblems(chart, c), `combo ${c.id}`).toEqual([]);
    });
  }

  it('activating a card reports node-click', async () => {
    const c = combo('click', DOC);
    chart = await mountChart(c);
    const events = captureEvents(chart, ['node-click']);

    cardFor(chart, ceo())!.dispatchEvent(new MouseEvent('click', {
      bubbles: true, composed: true, cancelable: true,
    }));
    await wait(20);

    expect(events).toHaveLength(1);
    expect(events[0].detail.node).toEqual(ceo());
  });

  it('the toggle collapses and expands a branch', async () => {
    const c = combo('toggle', DOC);
    chart = await mountChart(c);
    const events = captureEvents(chart, ['node-collapse', 'node-expand']);

    toggleFor(chart, ceo())!.dispatchEvent(new MouseEvent('click', {
      bubbles: true, composed: true, cancelable: true,
    }));
    await wait(20);
    expect(sr(chart).querySelectorAll('.org-node')).toHaveLength(1);
    expect(chartProblems(chart, { ...c, collapsed: ['ceo'] })).toEqual([]);

    toggleFor(chart, ceo())!.dispatchEvent(new MouseEvent('click', {
      bubbles: true, composed: true, cancelable: true,
    }));
    await wait(20);
    expect(events.map(e => e.type)).toEqual(['node-collapse', 'node-expand']);
    expect(chartProblems(chart, c)).toEqual([]);
  });

  it('collapseAll leaves the root and expandAll restores the tree', async () => {
    const c = combo('bulk', DOC);
    chart = await mountChart(c);

    chart.collapseAll();
    await wait(20);
    expect(sr(chart).querySelectorAll('.org-node')).toHaveLength(1);

    chart.expandAll();
    await wait(20);
    expect(chartProblems(chart, c)).toEqual([]);
    expect(sr(chart).querySelectorAll('.org-node')).toHaveLength(flatten(DOC.data).length);
  });
});
