/**
 * Smoke slice of the snice-gantt matrix — the everyday-loop tier.
 *
 * `tests/matrix/**` is excluded from the default Vitest include except each
 * directory's `smoke.test.ts` (vitest.config.ts), so this file is the one
 * gantt matrix file the everyday `vitest run` still collects. The full 273-combo
 * matrix runs only via `npm run test:matrix`.
 *
 * One combo per feature family, chosen so a family that breaks cannot hide:
 *   · structure  — the doc's own Basic Usage array renders the whole shell;
 *   · zoom       — a toggle click really selects its level and leaves data alone;
 *   · grouping   — grouped and ungrouped tasks lay out together;
 *   · bars       — progress, colour override and the today line;
 *   · events     — task-click from both documented sources, and all three drags;
 *   · findings   — the two marquee regressions, pinned here as well as in the
 *                  matrix tier so a FIX surfaces in the everyday loop at once.
 *
 * Every assertion routes through the matrix's own oracle (gantt-support.ts), so
 * this file cannot drift into asserting something weaker than the suite it
 * stands in for.
 *
 * BUDGET: under 1s. Add combos to the matrix, not here.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  combo, comboId, tasksOf, makeGantt, readFacts,
  structureProblems, barProblems, barAriaProblems, dependencyProblems, dragDetailProblems,
  collectEvents, barAt, taskNameAt, clickNode, drag, zoomButtonFor,
  expectClean, removeComponent, wait, SETTLE,
} from './gantt-support';

describe('gantt matrix smoke', () => {
  let el: any;
  afterEach(() => { if (el) { removeComponent(el); el = null; } });

  it('structure: the documented Basic Usage array renders the whole shell', async () => {
    const c = combo();
    const tasks = tasksOf(c);
    el = await makeGantt(c, tasks);
    expectClean(structureProblems(el, c, tasks), comboId(c));

    const facts = readFacts(el);
    expect(facts.zoomButtons).toEqual(['Day', 'Week', 'Month']);
    expect(facts.pressedZoom).toBe('Week');
    expect(facts.bars.map(bar => bar.label)).toEqual(['Design', 'Develop', 'Test']);
    expect(facts.groupHeaders).toEqual(['Phase 1']);
    expect(facts.taskNames).toEqual(['Design', 'Develop', 'Test']);
  });

  it('zoom: clicking Month selects month and leaves the task data alone', async () => {
    const c = combo();
    el = await makeGantt(c);
    const before = JSON.stringify(el.tasks);

    expect(clickNode(zoomButtonFor(el, 'month'))).toBe(true);
    await wait(SETTLE);

    expect(el.zoom).toBe('month');
    expect(readFacts(el).pressedZoom).toBe('Month');
    expect(JSON.stringify(el.tasks)).toBe(before);
  });

  it('bars: progress, colour override, today line and the documented aria absence', async () => {
    const c = combo({ dataset: 'today' });
    const tasks = tasksOf(c);
    el = await makeGantt(c, tasks);
    expectClean(barProblems(el, c, tasks), comboId(c));
    expectClean(barAriaProblems(el, tasks), comboId(c));
    expect(readFacts(el).todayLine).toBe(true);

    removeComponent(el);
    const styled = combo({ dataset: 'styled' });
    const styledTasks = tasksOf(styled);
    el = await makeGantt(styled, styledTasks);
    expectClean(barProblems(el, styled, styledTasks), comboId(styled));
    const bars = readFacts(el).bars;
    expect(bars[0].progressWidth).toBeNull();          // progress: 0 → nothing to show
    expect(bars[1].progressWidth).toContain('50%');
    expect(bars[1].style).toContain('rgb(16 185 129)');
  });

  it('grouping: grouped and ungrouped tasks share one sidebar', async () => {
    const c = combo({ dataset: 'mixed' });
    const tasks = tasksOf(c);
    el = await makeGantt(c, tasks);
    expectClean(structureProblems(el, c, tasks), comboId(c));

    const facts = readFacts(el);
    expect(facts.groupHeaders).toEqual(['Alpha']);
    expect(facts.taskNames).toEqual(['Spec', 'Build', 'Loose', 'Also loose']);
  });

  it('events: task-click fires from the bar and from the sidebar name', async () => {
    const c = combo({ dataset: 'flat' });
    const tasks = tasksOf(c);
    el = await makeGantt(c, tasks);
    const seen = collectEvents(el);

    expect(clickNode(barAt(el, 1))).toBe(true);
    expect(clickNode(taskNameAt(el, 2))).toBe(true);
    await wait(SETTLE);

    const clicks = seen.filter(event => event.type === 'task-click');
    expect(clicks).toHaveLength(2);
    expect(clicks[0].detail.task).toBe(tasks[1]);
    expect(clicks[1].detail.task).toBe(tasks[2]);
  });

  it('events: move, resize-left and resize-right each emit their documented detail', async () => {
    for (const [kind, type, dx] of [
      ['move', 'task-move', 600],
      ['resize-left', 'task-resize', -600],
      ['resize-right', 'task-resize', 600],
    ] as const) {
      const c = combo({ dataset: 'single' });
      const tasks = tasksOf(c);
      const before = { ...tasks[0] };
      el = await makeGantt(c, tasks);
      const seen = collectEvents(el);

      expect(await drag(el, 0, kind, dx)).toBe(true);
      expectClean(dragDetailProblems(seen, type, before, kind, dx), `smoke/${kind}`);

      removeComponent(el);
      el = null;
    }
  });

  // The two marquee regressions, kept at full strength. See
  // matrix/gantt/dependencies.test.ts.
  it.fails('MATRIX-gantt-1 show-dependencies draws one link per declared dependency', async () => {
    const c = combo({ dataset: 'chained' });
    const tasks = tasksOf(c);
    el = await makeGantt(c, tasks);
    expectClean(dependencyProblems(el, c, tasks), comboId(c));
  });

  it.fails('MATRIX-gantt-2 task-link is reachable through a documented gesture', async () => {
    const c = combo({ dataset: 'chained' });
    el = await makeGantt(c);
    const seen = collectEvents(el);

    await drag(el, 0, 'resize-right', 400);
    clickNode(barAt(el, 0));
    clickNode(barAt(el, 1));
    await wait(SETTLE);

    expect(seen.filter(event => event.type === 'task-link')).toHaveLength(1);
  });
});
