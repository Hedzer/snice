/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-approval-flow matrix — the documented oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Transcribed from `docs/ai/components/approval-flow.md` and
 * `snice-approval-flow.types.ts`. The component is small — a list of approver
 * nodes — so the whole contract fits in one shape per step:
 *
 *   avatar     the approver's picture, or their initials
 *   name       ApprovalStep.approver
 *   role       ApprovalStep.role, when there is one
 *   status     the step's status, as a label
 *   comment    ApprovalStep.comment, when there is one
 *   timestamp  ApprovalStep.timestamp, when there is one
 *   actions    approve/reject, on the CURRENT step
 *
 * `currentStep` is documented as "ID of active step", and `step-approve` /
 * `step-reject` are documented as firing from "the current step" — so the
 * action row is a function of (step.id === currentStep) AND the step's status,
 * which is the one real interaction in the component and the axis this
 * matrix's cross is built around.
 *
 * ── Findings pinned by this suite ───────────────────────────────────────────
 *
 *   MATRIX-approval-flow-1  The docs list a third event, `step-comment` ->
 *                           `{ step, comment }`, "Comment added to step".
 *                           Nothing in the component can produce it: the
 *                           current step's `actions` row holds an Approve and
 *                           a Reject button and nothing else, and no part of
 *                           the shadow tree accepts text. A consumer following
 *                           the docs adds a listener that can never run.
 */
import { Problems, text } from '../matrix-kit';
import { exactPart as part, exactParts as parts, exactPartsIn, partTokens } from '../part-exact';
import type { ApprovalStep } from
  '../../../packages/components/src/approval-flow/snice-approval-flow.types';

export const STATUSES = ['pending', 'approved', 'rejected', 'skipped'] as const;
export const ORIENTATIONS = ['horizontal', 'vertical'] as const;

/** The doc's own label for each status. */
export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  skipped: 'Skipped',
};

// ── Fixtures ────────────────────────────────────────────────────────────────

/** The chain from the doc's own example. */
export function chain(): ApprovalStep[] {
  return [
    {
      id: '1', approver: 'Alice Smith', role: 'Manager', status: 'approved',
      comment: 'Looks good', timestamp: 'Jan 15',
    },
    { id: '2', approver: 'Bob Jones', role: 'Director', status: 'pending' },
    { id: '3', approver: 'Carol White', role: 'VP', status: 'pending' },
  ];
}

/** One step carrying exactly the optional fields named. */
export function step(
  overrides: Partial<ApprovalStep> & Pick<ApprovalStep, 'id' | 'approver' | 'status'>,
): ApprovalStep {
  return { ...overrides };
}

// ── The documented oracle ───────────────────────────────────────────────────

/** "Approver avatar circle" — an image when `avatar` is set, initials otherwise. */
export function expectedInitials(approver: string): string {
  return approver.split(' ').map(word => word[0]).join('').slice(0, 2);
}

/** A step's action row exists on the CURRENT step while it is still pending. */
export function expectsActions(step_: ApprovalStep, currentStep: string): boolean {
  return step_.id === currentStep && step_.status === 'pending';
}

/** The whole documented shape of one rendered step. */
export interface StepShape {
  name: string;
  role: string | null;
  status: string;
  comment: string | null;
  timestamp: string | null;
  avatar: string;
  actions: boolean;
}

export function expectedShape(step_: ApprovalStep, currentStep: string): StepShape {
  return {
    name: step_.approver,
    role: step_.role ?? null,
    status: STATUS_LABELS[step_.status] ?? step_.status,
    // The docs render a comment as a quotation.
    comment: step_.comment ? `"${step_.comment}"` : null,
    timestamp: step_.timestamp ?? null,
    avatar: step_.avatar ? 'image' : expectedInitials(step_.approver),
    actions: expectsActions(step_, currentStep),
  };
}

export function readShape(node: HTMLElement): StepShape {
  const avatarNode = exactPartsIn(node, 'avatar')[0] ?? null;
  const image = avatarNode?.querySelector('img');
  const roleNode = exactPartsIn(node, 'role')[0] ?? null;
  const commentNode = exactPartsIn(node, 'comment')[0] ?? null;
  const stampNode = exactPartsIn(node, 'timestamp')[0] ?? null;
  return {
    name: text(exactPartsIn(node, 'name')[0]),
    role: roleNode ? text(roleNode) : null,
    status: text(exactPartsIn(node, 'status')[0]),
    comment: commentNode ? text(commentNode) : null,
    timestamp: stampNode ? text(stampNode) : null,
    avatar: image ? 'image' : text(avatarNode),
    actions: !!(exactPartsIn(node, 'actions')[0]),
  };
}

/** Every documented claim about a rendered chain, at once. */
export function checkChain(
  el: HTMLElement, steps: ApprovalStep[], currentStep: string, problems: Problems,
): void {
  const nodes = parts(el, 'step');
  problems.equal(nodes.length, steps.length, 'step nodes');

  steps.forEach((step_, i) => {
    const node = nodes[i];
    if (!node) return;
    problems.equal(readShape(node), expectedShape(step_, currentStep), `step ${i}`);
    // The status is also carried as a class, which is how a consumer styles it.
    const classes = node.getAttribute('class') ?? '';
    problems.check(classes.includes(`step--${step_.status}`),
      `step ${i} carries no step--${step_.status} class (${classes})`);
    problems.check(classes.includes('step--current') === (step_.id === currentStep),
      `step ${i}: step--current for id=${step_.id} currentStep=${currentStep}`);
  });

  // "container - Main flow container", with the orientation on it.
  const container = part(el, 'container');
  problems.check(!!container, 'part="container" is missing');
  problems.equal(container?.getAttribute('role'), 'list', 'container role');
  problems.equal(nodes.filter(node => node.getAttribute('role') === 'listitem').length,
    steps.length, 'steps declared as listitems');
}

const DOCUMENTED_PARTS = new Set([
  'container', 'step', 'avatar', 'content', 'name', 'role', 'status', 'comment',
  'timestamp', 'actions', 'connector',
]);

export function checkNoUndocumentedParts(el: HTMLElement, problems: Problems): void {
  for (const node of [...(el.shadowRoot?.querySelectorAll('[part]') ?? [])]) {
    for (const name of partTokens(node)) {
      problems.check(DOCUMENTED_PARTS.has(name), `undocumented part="${name}"`);
    }
  }
}
