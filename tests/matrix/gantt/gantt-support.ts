/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Oracle for the snice-gantt feature matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Every expectation below is transcribed from `docs/ai/components/gantt.md`
 * and `packages/components/src/gantt/snice-gantt.types.ts`. Nothing here was
 * read off the rendered output — where the doc is silent (cell pixel widths,
 * timeline padding, header label formatting) this oracle stays silent too, and
 * those claims are left to the visual tier.
 *
 * The documented surface, in the doc's own order:
 *
 *   Properties   tasks: GanttTask[] = []   (JS only, attribute: false)
 *                zoom: 'day'|'week'|'month' = 'week'
 *                showDependencies: boolean = true   (attr show-dependencies)
 *   Methods      scrollToDate(date), scrollToTask(id)
 *   Events       task-click  { task }
 *                task-resize { task, start, end }
 *                task-move   { task, start, end }
 *                task-link   { source, target }
 *   Parts        base, header, controls, body, task-list, timeline
 *   A11y         "Bars draggable (move) and resizable (left/right handles)"
 *                "Today line as red vertical indicator"
 *                "Zoom toggle buttons in header (Day/Week/Month)"
 *                "role/aria not explicitly set on task bars"   ← a documented
 *                ABSENCE, and therefore just as assertable as a presence.
 *
 * Findings raised against this component (each pinned with `it.fails` in the
 * slice named beside it):
 *
 *   MATRIX-gantt-1  dependencies.test.ts — `showDependencies` (documented, and
 *                   defaulting to true) draws nothing. `GanttTask.dependencies`
 *                   is accepted and ignored.
 *   MATRIX-gantt-2  dependencies.test.ts — `task-link` is documented as
 *                   "Dependency link created" but no interaction can produce it.
 */
import { expect } from 'vitest';
import {
  mount, sr, all, wait, removeComponent, SETTLE, Problems, expectClean, label,
} from '../matrix-kit';
import { exactPart, exactParts } from '../part-exact';
import '../../../packages/components/src/gantt/snice-gantt';
import type { GanttTask, GanttZoom } from '../../../packages/components/src/gantt/snice-gantt.types';

export { wait, removeComponent, expectClean, Problems, SETTLE };

// ── Documented dimensions ───────────────────────────────────────────────────

/** `zoom: GanttZoom = 'week'` — the three documented levels. */
export const ZOOMS: readonly GanttZoom[] = ['day', 'week', 'month'];

/** `showDependencies: boolean = true`. */
export const DEPENDENCY_FLAGS: readonly boolean[] = [true, false];

const DAY_MS = 86400000;

/** Local-calendar ISO day, `offset` days from today — for the today-line claim. */
export function isoFromToday(offset: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return new Date(d.getTime() + offset * DAY_MS).toISOString().slice(0, 10);
}

/**
 * Datasets. Each is a FACTORY: the drag handlers documented under `task-move` /
 * `task-resize` mutate the task objects they were handed, so a shared frozen
 * array would leak one combo's drag into the next.
 */
export const DATASETS = {
  /** No tasks at all — the parts contract still has to hold. */
  empty: (): GanttTask[] => [],

  /** One task, no optional fields: the minimum GanttTask the doc defines. */
  single: (): GanttTask[] => [
    { id: 'only', name: 'Solo', start: isoFromToday(0), end: isoFromToday(4) },
  ],

  /** The doc's own Basic Usage array, verbatim. */
  basic: (): GanttTask[] => [
    { id: '1', name: 'Design', start: '2026-03-01', end: '2026-03-07', progress: 80, group: 'Phase 1' },
    { id: '2', name: 'Develop', start: '2026-03-05', end: '2026-03-15', dependencies: ['1'], group: 'Phase 1' },
    { id: '3', name: 'Test', start: '2026-03-12', end: '2026-03-20', color: 'rgb(234 88 12)' },
  ],

  /** Every task carries a `group` — two groups, no ungrouped remainder. */
  grouped: (): GanttTask[] => [
    { id: 'a', name: 'Survey', start: '2026-04-01', end: '2026-04-05', group: 'Discovery' },
    { id: 'b', name: 'Interview', start: '2026-04-03', end: '2026-04-09', group: 'Discovery' },
    { id: 'c', name: 'Wireframe', start: '2026-04-06', end: '2026-04-12', group: 'Delivery' },
    { id: 'd', name: 'Handoff', start: '2026-04-12', end: '2026-04-14', group: 'Delivery' },
  ],

  /** No task carries a group — the flat list. */
  flat: (): GanttTask[] => [
    { id: 'p', name: 'Plan', start: '2026-05-01', end: '2026-05-04' },
    { id: 'q', name: 'Do', start: '2026-05-04', end: '2026-05-11' },
    { id: 'r', name: 'Review', start: '2026-05-11', end: '2026-05-13' },
  ],

  /** Grouped and ungrouped tasks side by side. */
  mixed: (): GanttTask[] => [
    { id: 'g1', name: 'Spec', start: '2026-06-01', end: '2026-06-04', group: 'Alpha' },
    { id: 'u1', name: 'Loose', start: '2026-06-02', end: '2026-06-08' },
    { id: 'g2', name: 'Build', start: '2026-06-04', end: '2026-06-12', group: 'Alpha' },
    { id: 'u2', name: 'Also loose', start: '2026-06-10', end: '2026-06-15' },
  ],

  /** A dependency chain, so `showDependencies` has something to draw. */
  chained: (): GanttTask[] => [
    { id: 'n1', name: 'First', start: '2026-07-01', end: '2026-07-05' },
    { id: 'n2', name: 'Second', start: '2026-07-05', end: '2026-07-10', dependencies: ['n1'] },
    { id: 'n3', name: 'Third', start: '2026-07-10', end: '2026-07-16', dependencies: ['n2'] },
    { id: 'n4', name: 'Fan-in', start: '2026-07-16', end: '2026-07-20', dependencies: ['n1', 'n3'] },
  ],

  /** The optional presentation fields at their documented edges. */
  styled: (): GanttTask[] => [
    { id: 's0', name: 'Zero progress', start: '2026-08-01', end: '2026-08-04', progress: 0 },
    { id: 's50', name: 'Half', start: '2026-08-02', end: '2026-08-09', progress: 50, color: 'rgb(16 185 129)' },
    { id: 's100', name: 'Complete', start: '2026-08-05', end: '2026-08-12', progress: 100, color: '#a21caf' },
  ],

  /** A single-day task, and one spanning months — the width extremes. */
  spans: (): GanttTask[] => [
    { id: 'tiny', name: 'One day', start: '2026-09-10', end: '2026-09-10' },
    { id: 'huge', name: 'Two months', start: '2026-09-01', end: '2026-11-01' },
  ],

  /** A finished project years in the past — today is nowhere near this timeline. */
  archive: (): GanttTask[] => [
    { id: 'ar1', name: 'Kickoff', start: '2019-02-04', end: '2019-02-15', group: 'Legacy' },
    { id: 'ar2', name: 'Closeout', start: '2019-03-01', end: '2019-03-22', group: 'Legacy', progress: 100 },
  ],

  /** Tasks straddling today, so the today line falls inside the timeline. */
  today: (): GanttTask[] => [
    { id: 'past', name: 'Behind', start: isoFromToday(-6), end: isoFromToday(-1) },
    { id: 'now', name: 'Current', start: isoFromToday(-2), end: isoFromToday(3), progress: 40 },
    { id: 'next', name: 'Ahead', start: isoFromToday(4), end: isoFromToday(9) },
  ],
} satisfies Record<string, () => GanttTask[]>;

export type DatasetName = keyof typeof DATASETS;
export const DATASET_NAMES = Object.keys(DATASETS) as DatasetName[];

// ── Combos ──────────────────────────────────────────────────────────────────

export interface GanttCombo {
  dataset: DatasetName;
  zoom: GanttZoom;
  showDependencies: boolean;
}

export function combo(overrides: Partial<GanttCombo> = {}): GanttCombo {
  return { dataset: 'basic', zoom: 'week', showDependencies: true, ...overrides };
}

export function comboId(c: GanttCombo): string {
  return `dataset=${c.dataset}/zoom=${label(c.zoom)}/show-dependencies=${c.showDependencies}`;
}

/** The task array a combo is mounted with — a fresh copy every call. */
export function tasksOf(c: GanttCombo): GanttTask[] {
  return DATASETS[c.dataset]();
}

/**
 * Mount one combo. `zoom` and `show-dependencies` cross the ATTRIBUTE channel
 * (the doc writes both as attributes on `<snice-gantt>`); `tasks` is documented
 * `attribute: false`, so it can only cross the property channel.
 */
export async function makeGantt(c: GanttCombo, tasks = tasksOf(c)): Promise<HTMLElement> {
  const attrs: Record<string, string | boolean> = { zoom: c.zoom };
  attrs['show-dependencies'] = c.showDependencies;
  const el = await mount<HTMLElement>('snice-gantt', attrs, { tasks });
  await wait(SETTLE);
  return el;
}

// ── Reading the render ──────────────────────────────────────────────────────

/** The six documented CSS parts. */
export const DOCUMENTED_PARTS = ['base', 'header', 'controls', 'body', 'task-list', 'timeline'] as const;

export interface GanttFacts {
  /** Which documented parts rendered. */
  presentParts: string[];
  /** Zoom toggle button labels, in header order. */
  zoomButtons: string[];
  /** The label of whichever zoom button reads as the pressed/current one. */
  pressedZoom: string | null;
  /** Task-name entries in the left sidebar, in render order. */
  taskNames: string[];
  /** Group headers in the left sidebar, in render order. */
  groupHeaders: string[];
  /** One entry per rendered bar. */
  bars: Array<{
    label: string;
    style: string;
    /** Progress sub-element width as authored, or null when absent. */
    progressWidth: string | null;
    handles: number;
    role: string | null;
    ariaLabel: string | null;
    tabIndex: string | null;
  }>;
  /** Elements the stylesheet reserves for dependency links. */
  dependencyEdges: number;
  /** Whether the red today indicator rendered. */
  todayLine: boolean;
}

const CLASS = {
  zoomButton: '.gantt-zoom-btn',
  taskName: '.gantt-task-name',
  groupHeader: '.gantt-group-header',
  bar: '.gantt-bar',
  barLabel: '.gantt-bar-label',
  barProgress: '.gantt-bar-progress',
  barHandle: '.gantt-bar-handle',
  todayLine: '.gantt-today-line',
  // The stylesheet ships `.gantt-dependencies`, `.gantt-dependency-arrow` and
  // `.gantt-dependency-arrowhead`; an SVG line/path layer would also satisfy
  // "dependencies drawn", so the oracle accepts any of them.
  dependency: '.gantt-dependencies, .gantt-dependency-arrow, .gantt-dependency-arrowhead, [part~="dependencies"]',
};

export function readFacts(el: HTMLElement): GanttFacts {
  const root = sr(el);
  const bars = all<HTMLElement>(el, CLASS.bar).map(bar => {
    const progress = bar.querySelector<HTMLElement>(CLASS.barProgress);
    return {
      label: (bar.querySelector(CLASS.barLabel)?.textContent ?? '').trim(),
      style: bar.getAttribute('style') ?? '',
      progressWidth: progress ? (progress.getAttribute('style') ?? '') : null,
      handles: bar.querySelectorAll(CLASS.barHandle).length,
      role: bar.getAttribute('role'),
      ariaLabel: bar.getAttribute('aria-label'),
      tabIndex: bar.getAttribute('tabindex'),
    };
  });

  const zoomButtons = all<HTMLElement>(el, CLASS.zoomButton);
  const pressed = zoomButtons.find(button =>
    button.getAttribute('aria-pressed') === 'true' || button.classList.contains('active'));

  return {
    presentParts: DOCUMENTED_PARTS.filter(name => exactPart(el, name) !== null),
    zoomButtons: zoomButtons.map(button => (button.textContent ?? '').trim()),
    pressedZoom: pressed ? (pressed.textContent ?? '').trim() : null,
    taskNames: all<HTMLElement>(el, CLASS.taskName).map(node => (node.textContent ?? '').trim()),
    groupHeaders: all<HTMLElement>(el, CLASS.groupHeader).map(node => (node.textContent ?? '').trim()),
    bars,
    dependencyEdges: root.querySelectorAll(CLASS.dependency).length,
    todayLine: root.querySelector(CLASS.todayLine) !== null,
  };
}

// ── Documented expectations ─────────────────────────────────────────────────

/** Sidebar order: each group's header then its tasks, then every ungrouped task. */
export function expectedSidebar(tasks: GanttTask[]): { names: string[]; groups: string[] } {
  const groups = new Map<string, GanttTask[]>();
  const ungrouped: GanttTask[] = [];
  for (const task of tasks) {
    if (task.group) {
      if (!groups.has(task.group)) groups.set(task.group, []);
      groups.get(task.group)!.push(task);
    } else {
      ungrouped.push(task);
    }
  }
  const names: string[] = [];
  for (const [, members] of groups) names.push(...members.map(task => task.name));
  names.push(...ungrouped.map(task => task.name));
  return { names, groups: [...groups.keys()] };
}

/** `zoom` value → the toggle button label the doc names for it. */
export const ZOOM_BUTTON_LABEL: Record<GanttZoom, string> = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
};

/** Days between today and the nearest task edge; 0 when today is inside the span. */
export function todayDistanceDays(tasks: GanttTask[]): number | null {
  if (tasks.length === 0) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const stamps = tasks.flatMap(task => [new Date(task.start).getTime(), new Date(task.end).getTime()]);
  const min = Math.min(...stamps);
  const max = Math.max(...stamps);
  const now = today.getTime();
  if (now >= min && now <= max) return 0;
  return Math.round((now < min ? min - now : now - max) / DAY_MS);
}

/** Does today fall inside the span the tasks cover? */
export function todayInsideTasks(tasks: GanttTask[]): boolean {
  return todayDistanceDays(tasks) === 0;
}

/**
 * The doc says only "Today line as red vertical indicator" — it fixes neither
 * the timeline padding either side of the task span nor, therefore, the exact
 * date at which the indicator leaves the viewport. So the oracle claims the two
 * things the doc unambiguously implies and nothing in between:
 *
 *   'required'  today is inside the task span, so it is on the timeline;
 *   'forbidden' today is more than a year outside it — no reading of "padding"
 *               puts a 2020 chart's timeline under a 2026 today;
 *   'either'    the undocumented padding band, where both renders are defensible.
 */
export function todayLineExpectation(tasks: GanttTask[]): 'required' | 'forbidden' | 'either' {
  const distance = todayDistanceDays(tasks);
  if (distance === null) return 'either';
  if (distance === 0) return 'required';
  return distance > 365 ? 'forbidden' : 'either';
}

// ── Oracles ─────────────────────────────────────────────────────────────────

/**
 * Structure: the parts contract, the zoom toggle, one bar per task, and the
 * sidebar the grouping rules imply. Holds for every dataset including `empty`.
 */
export function structureProblems(el: HTMLElement, c: GanttCombo, tasks: GanttTask[]): Problems {
  const problems = new Problems();
  const facts = readFacts(el);

  // "CSS Parts: base, header, controls, body, task-list, timeline"
  for (const name of DOCUMENTED_PARTS) {
    problems.check(facts.presentParts.includes(name), `documented part "${name}" is missing`);
  }

  // "Zoom toggle buttons in header (Day/Week/Month)"
  problems.equal(facts.zoomButtons, ['Day', 'Week', 'Month'], 'zoom toggle buttons');
  problems.equal(facts.pressedZoom, ZOOM_BUTTON_LABEL[c.zoom], `zoom="${c.zoom}" marks its own button`);

  // Every zoom button must live inside the `controls` part, which lives inside
  // `header` — the doc places the toggle group there.
  const controls = exactPart(el, 'controls');
  const header = exactPart(el, 'header');
  if (controls && header) {
    problems.check(header.contains(controls), '`controls` is not inside `header`');
    problems.equal(
      controls.querySelectorAll(CLASS.zoomButton).length, 3,
      'zoom buttons inside the `controls` part',
    );
  }

  // "task-list — Left sidebar with task names" / "timeline — Right scrollable
  // timeline area", both inside "body — Main content area".
  const body = exactPart(el, 'body');
  const taskList = exactPart(el, 'task-list');
  const timeline = exactPart(el, 'timeline');
  if (body && taskList) problems.check(body.contains(taskList), '`task-list` is not inside `body`');
  if (body && timeline) problems.check(body.contains(timeline), '`timeline` is not inside `body`');

  // One bar per task, each labelled with `GanttTask.name`.
  problems.equal(facts.bars.length, tasks.length, 'one bar per task');
  problems.equal(facts.bars.map(bar => bar.label), tasks.map(task => task.name), 'bar labels are task names');

  // The sidebar lists every task name, under its group header when grouped.
  const sidebar = expectedSidebar(tasks);
  problems.equal(facts.taskNames, sidebar.names, 'sidebar task names');
  problems.equal(facts.groupHeaders, sidebar.groups, 'sidebar group headers');

  // "Bars draggable (move) and resizable (left/right handles)" — two handles.
  for (const [index, bar] of facts.bars.entries()) {
    problems.check(bar.handles === 2, `bar ${index} exposes ${bar.handles} resize handles, not left+right`);
  }

  return problems;
}

/**
 * Bar presentation: the optional `progress` and `color` fields, and the
 * documented today indicator.
 */
export function barProblems(el: HTMLElement, c: GanttCombo, tasks: GanttTask[]): Problems {
  const problems = new Problems();
  const facts = readFacts(el);
  if (facts.bars.length !== tasks.length) {
    problems.say(`bar count ${facts.bars.length} != task count ${tasks.length}; presentation unreadable`);
    return problems;
  }

  for (const [index, task] of tasks.entries()) {
    const bar = facts.bars[index];

    // "progress?: number  // 0-100" rendered as a progress indicator.
    const progress = task.progress ?? 0;
    if (progress > 0) {
      if (problems.check(bar.progressWidth !== null,
        `task "${task.name}" has progress ${progress} but the bar shows no progress indicator`)) {
        problems.check(
          bar.progressWidth!.includes(`${progress}%`),
          `task "${task.name}" progress indicator is not ${progress}%: "${bar.progressWidth}"`,
        );
      }
    }

    // "color?: string  // bar color override"
    if (task.color) {
      problems.check(
        bar.style.includes(task.color),
        `task "${task.name}" color override "${task.color}" is absent from the bar style "${bar.style}"`,
      );
    }
  }

  // "Today line as red vertical indicator"
  const expectation = todayLineExpectation(tasks);
  if (expectation === 'required') {
    problems.check(facts.todayLine, `dataset ${c.dataset} straddles today but draws no today line`);
  } else if (expectation === 'forbidden') {
    problems.check(!facts.todayLine, `dataset ${c.dataset} is over a year from today yet draws a today line`);
  }

  return problems;
}

/**
 * The documented ABSENCE: "role/aria not explicitly set on task bars". A future
 * a11y pass that adds roles must come with a doc change, and this catches it.
 */
export function barAriaProblems(el: HTMLElement, tasks: GanttTask[]): Problems {
  const problems = new Problems();
  for (const [index, bar] of readFacts(el).bars.entries()) {
    const name = tasks[index]?.name ?? `#${index}`;
    problems.equal(bar.role, null, `bar "${name}" role (doc: not explicitly set)`);
    problems.equal(bar.ariaLabel, null, `bar "${name}" aria-label (doc: not explicitly set)`);
  }
  return problems;
}

/**
 * MATRIX-gantt-1. `showDependencies` defaults to true and `GanttTask.dependencies`
 * is a documented field, so a dataset with dependencies must draw one link per
 * declared edge when the switch is on, and none when it is off.
 */
export function dependencyProblems(el: HTMLElement, c: GanttCombo, tasks: GanttTask[]): Problems {
  const problems = new Problems();
  const edges = tasks.reduce((sum, task) => sum + (task.dependencies?.length ?? 0), 0);
  const expected = c.showDependencies ? edges : 0;
  problems.equal(
    readFacts(el).dependencyEdges, expected,
    `show-dependencies=${c.showDependencies} with ${edges} declared dependencies`,
  );
  return problems;
}

// ── Interaction ─────────────────────────────────────────────────────────────

export interface SeenEvent { type: string; detail: any }

/** Record every documented gantt event, in emission order. */
export function collectEvents(el: HTMLElement, types: string[] = [
  'task-click', 'task-resize', 'task-move', 'task-link',
]): SeenEvent[] {
  const seen: SeenEvent[] = [];
  for (const type of types) {
    el.addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return seen;
}

export function barAt(el: HTMLElement, index: number): HTMLElement | null {
  return all<HTMLElement>(el, CLASS.bar)[index] ?? null;
}

export function taskNameAt(el: HTMLElement, index: number): HTMLElement | null {
  return all<HTMLElement>(el, CLASS.taskName)[index] ?? null;
}

export function zoomButtonFor(el: HTMLElement, zoom: GanttZoom): HTMLElement | null {
  return all<HTMLElement>(el, CLASS.zoomButton)
    .find(button => (button.textContent ?? '').trim() === ZOOM_BUTTON_LABEL[zoom]) ?? null;
}

export function clickNode(node: Element | null): boolean {
  if (!node) return false;
  node.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
  return true;
}

export type DragKind = 'move' | 'resize-left' | 'resize-right';

/**
 * Drive one documented drag gesture to completion.
 *
 * `dx` is deliberately far larger than any plausible cell width: the doc fixes
 * neither the pixels-per-day nor the rounding, so the suite asserts the
 * DIRECTION and the shape of the emitted detail, never a pixel-derived day
 * count it would have had to read off the implementation.
 */
export async function drag(el: HTMLElement, index: number, kind: DragKind, dx: number): Promise<boolean> {
  const bar = barAt(el, index);
  if (!bar) return false;
  const target = kind === 'move'
    ? bar
    : bar.querySelectorAll<HTMLElement>(CLASS.barHandle)[kind === 'resize-left' ? 0 : 1];
  if (!target) return false;

  target.dispatchEvent(new MouseEvent('mousedown', {
    bubbles: true, composed: true, cancelable: true, clientX: 0, clientY: 0,
  }));
  document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: dx, clientY: 0 }));
  document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, clientX: dx, clientY: 0 }));
  await wait(SETTLE);
  return true;
}

/** Whole days between two ISO days — the unit every documented drag detail is in. */
export function daysBetween(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / DAY_MS);
}

export const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Assert a `task-move` / `task-resize` detail against the documented shape.
 *
 * `dx` is the gesture's own direction: dragging right advances a date, dragging
 * left retracts it. Which handle may be dragged which way is a real constraint —
 * a task cannot be resized past its own other end — so each caller drags the
 * direction that GROWS or MOVES the bar, and the oracle reads the expected sign
 * straight off `dx` instead of hard-coding one.
 */
export function dragDetailProblems(
  seen: SeenEvent[], type: 'task-move' | 'task-resize',
  before: GanttTask, kind: DragKind, dx: number,
): Problems {
  const problems = new Problems();
  const events = seen.filter(event => event.type === type);
  if (!problems.check(events.length === 1, `${type} fired ${events.length} times, expected exactly 1`)) {
    return problems;
  }
  const { detail } = events[0];

  // "task-resize → { task, start, end }" / "task-move → { task, start, end }"
  problems.check(detail?.task?.id === before.id, `${type} detail.task is not the dragged task`);
  problems.check(ISO_DAY.test(detail?.start ?? ''), `${type} detail.start is not an ISO day: ${detail?.start}`);
  problems.check(ISO_DAY.test(detail?.end ?? ''), `${type} detail.end is not an ISO day: ${detail?.end}`);
  problems.equal(detail?.start, detail?.task?.start, `${type} detail.start mirrors the task`);
  problems.equal(detail?.end, detail?.task?.end, `${type} detail.end mirrors the task`);

  const startShift = daysBetween(before.start, detail?.start ?? before.start);
  const endShift = daysBetween(before.end, detail?.end ?? before.end);

  const towards = dx > 0 ? 'later' : 'earlier';
  const moved = (shift: number) => (dx > 0 ? shift > 0 : shift < 0);

  if (kind === 'move') {
    // "Task moved via drag" — the whole bar travels, so its span is preserved.
    problems.check(moved(startShift), `move drag ${towards} did not move start (shift ${startShift})`);
    problems.equal(endShift, startShift, 'move drag shifts start and end by the same number of days');
  } else if (kind === 'resize-right') {
    // "resized via drag handles": the right handle is the end handle.
    problems.equal(startShift, 0, 'resize-right left the start untouched');
    problems.check(moved(endShift), `resize-right did not move end ${towards} (shift ${endShift})`);
  } else {
    // …and the left handle is the start handle.
    problems.equal(endShift, 0, 'resize-left left the end untouched');
    problems.check(moved(startShift), `resize-left did not move start ${towards} (shift ${startShift})`);
  }

  return problems;
}

export { expect };
