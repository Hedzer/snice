/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-spotlight matrix — fixtures and the documented-behaviour oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Read off `docs/ai/components/spotlight.md` and
 * `packages/components/src/spotlight/snice-spotlight.types.ts`:
 *
 *   · `steps: SpotlightStep[]`, each `{ target, title, description, position? }`
 *     where `target` is a CSS selector for the element to highlight.
 *   · Methods: `start()` ("Begin tour from step 0"), `next()` ("Advance to next
 *     step (ends tour if on last step)"), `prev()` ("Go back to previous
 *     step"), `goToStep(index)` ("Jump to specific step"), `end()`.
 *   · Events: `spotlight-start` (void), `spotlight-step` -> `{ index, step }`,
 *     `spotlight-end` (void), `spotlight-skip` -> `{ index }`, and
 *     `spotlight-target-missing` -> `{ index, step }` — "step target gone (e.g.
 *     route change); popover stops instead of pointing at nothing".
 *   · Parts: `base`, `backdrop`, `cutout`, `popover`, `title`, `description`,
 *     `actions`, `step-indicator`.
 *   · Accessibility: "Keyboard-accessible navigation buttons", "Focus moves to
 *     popover on each step", "Escape key ends tour", "Respects
 *     `prefers-reduced-motion`".
 *
 * ── Where the overlay lives ─────────────────────────────────────────────────
 *
 * The component itself renders nothing; the overlay is a PORTAL appended to
 * `document.body` so `position: fixed` survives ancestor transforms. The
 * documented parts are therefore looked up in that portal, not in a shadow
 * root — which is also why this component needs its own reader rather than the
 * shared `part()` helper.
 */
import { text } from '../matrix-utils';
import '../../../packages/components/src/spotlight/snice-spotlight';
import type {
  SpotlightStep, SpotlightPosition,
} from '../../../packages/components/src/spotlight/snice-spotlight.types';

export type { SpotlightStep, SpotlightPosition };

// ── Documented value sets ───────────────────────────────────────────────────

export const POSITIONS: readonly SpotlightPosition[] = ['top', 'bottom', 'left', 'right', 'auto'];

export const EVENTS = [
  'spotlight-start', 'spotlight-step', 'spotlight-end', 'spotlight-skip',
  'spotlight-target-missing',
] as const;

/** Every documented part of the overlay. */
export const PARTS = [
  'base', 'backdrop', 'cutout', 'popover', 'title', 'description',
  'actions', 'step-indicator',
] as const;

// ── Fixtures ────────────────────────────────────────────────────────────────

/** `count` steps, each pointing at `#target-<i>`, which `mountTargets` creates. */
export function tourSteps(count: number, position?: SpotlightPosition): SpotlightStep[] {
  return Array.from({ length: count }, (_, i) => ({
    target: `#target-${i}`,
    title: `Step ${i + 1}`,
    description: `Description for step ${i + 1}`,
    ...(position ? { position } : {}),
  }));
}

/** Create the light-DOM elements the tour's selectors point at. */
export function mountTargets(count: number): HTMLElement[] {
  const nodes: HTMLElement[] = [];
  for (let i = 0; i < count; i++) {
    const node = document.createElement('div');
    node.id = `target-${i}`;
    node.textContent = `Target ${i}`;
    document.body.appendChild(node);
    nodes.push(node);
  }
  return nodes;
}

/** Tear down the portal AND the targets — the portal outlives the element. */
export function cleanupSpotlight(): void {
  for (const portal of document.querySelectorAll('[data-snice-spotlight-portal]')) portal.remove();
  document.body.innerHTML = '';
}

// ── Reading the portal ──────────────────────────────────────────────────────

export const portalOf = (): HTMLElement | null =>
  document.querySelector<HTMLElement>('[data-snice-spotlight-portal]');

export interface Reading {
  /** A portal exists in the document at all. */
  present: boolean;
  /** Which documented parts are rendered. */
  parts: string[];
  title: string;
  description: string;
  indicator: string;
  /** Action button labels, in document order. */
  actions: string[];
  actionNodes: HTMLElement[];
  backdrop: HTMLElement | null;
  popover: HTMLElement | null;
  cutout: HTMLElement | null;
}

const partNode = (root: ParentNode, name: string): HTMLElement | null =>
  root.querySelector<HTMLElement>(`[part~="${name}"]`);

export function read(): Reading {
  const portal = portalOf();
  if (!portal) {
    return {
      present: false, parts: [], title: '', description: '', indicator: '',
      actions: [], actionNodes: [], backdrop: null, popover: null, cutout: null,
    };
  }
  const actions = partNode(portal, 'actions');
  const actionNodes = actions ? [...actions.querySelectorAll<HTMLElement>('button')] : [];
  return {
    present: true,
    parts: PARTS.filter(name => !!partNode(portal, name)),
    title: text(partNode(portal, 'title')),
    description: text(partNode(portal, 'description')),
    indicator: text(partNode(portal, 'step-indicator')),
    actions: actionNodes.map(node => text(node)),
    actionNodes,
    backdrop: partNode(portal, 'backdrop'),
    popover: partNode(portal, 'popover'),
    cutout: partNode(portal, 'cutout'),
  };
}

/** The action button whose label matches, or null. */
export const actionNamed = (label: string): HTMLElement | null =>
  read().actionNodes.find(node => text(node).toLowerCase() === label.toLowerCase()) ?? null;

// ── Oracle ──────────────────────────────────────────────────────────────────

/**
 * The set of navigation buttons a step at `index` of `total` documents.
 *
 * `prev()` is "Go back to previous step", which step 0 has none of, so the Back
 * affordance belongs to every step but the first. `next()` "ends tour if on
 * last step", so the forward affordance is present throughout but reads as the
 * finishing action on the last step. Skip is always available — `spotlight-skip`
 * carries the index it was pressed at, so it must be reachable from any of them.
 */
export function expectedActions(index: number, total: number): string[] {
  const actions = ['Skip'];
  if (index > 0) actions.push('Back');
  actions.push(index === total - 1 ? 'Done' : 'Next');
  return actions;
}

/** The documented step indicator: this step of that many, one-based. */
export const expectedIndicator = (index: number, total: number): string => `${index + 1} / ${total}`;

/**
 * Every documented consequence of the tour being at `index` of `steps`, as a
 * problem list. `index === -1` means "no tour running".
 */
export function spotlightProblems(steps: SpotlightStep[], index: number): string[] {
  const problems: string[] = [];
  const say = (message: string) => problems.push(message);
  const r = read();

  if (index < 0) {
    if (r.present) say('no tour is running but the overlay portal is still in the document');
    return problems;
  }

  if (!r.present) { say(`tour is at step ${index} but no overlay portal exists`); return problems; }

  const missing = PARTS.filter(name => !r.parts.includes(name));
  if (missing.length) say(`overlay is missing documented parts: ${missing.join(', ')}`);

  const step = steps[index];
  if (r.title !== step.title) say(`popover title "${r.title}" != "${step.title}"`);
  if (r.description !== step.description) say(`popover description "${r.description}" != "${step.description}"`);

  const indicator = expectedIndicator(index, steps.length);
  if (r.indicator !== indicator) say(`step indicator "${r.indicator}" != "${indicator}"`);

  const actions = expectedActions(index, steps.length);
  if (JSON.stringify(r.actions) !== JSON.stringify(actions)) {
    say(`actions ${JSON.stringify(r.actions)} != expected ${JSON.stringify(actions)}`);
  }

  // "Keyboard-accessible navigation buttons": real buttons, which are focusable
  // and Enter/Space-activatable by the platform.
  for (const node of r.actionNodes) {
    if (node.tagName !== 'BUTTON') say(`navigation control <${node.tagName.toLowerCase()}> is not a button`);
  }

  return problems;
}
