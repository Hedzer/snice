/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-approval-flow matrix — the chain as it is rendered
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Two crosses:
 *
 *   status (4) x current (2) x orientation (2)     = 16 combos
 *       the step node itself: its label, its classes, and whether it offers
 *       the Approve/Reject row the docs give to the current step.
 *
 *   the optional fields (role, avatar, comment, timestamp) as all 16 boolean
 *   vectors = 16 combos
 *       each of those four is documented `?optional`, and each one adds a part
 *       that must be absent — not empty — when its data is.
 *
 * A component this small gets tens of combos, not hundreds: the doc's own
 * sizing rule.
 *
 * ── Why `currentStep` is set as a property here ─────────────────────────────
 *
 * The docs give `currentStep` the attribute `current-step`. MATRIX-
 * approval-flow-2 (that attribute was inert in a real browser) is fixed, but
 * this tier still uses the property channel on purpose: happy-dom hands
 * `attributeChangedCallback` every attribute change whether or not the element
 * observed it, so this tier could never have told the truth about the
 * attribute channel. It tests what a current step DOES; how you name one is
 * the browser tier's question (tests/live/matrix/approval-flow/).
 *
 * it.fails policy: nothing here is relaxed.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { mount, cross, flagVectors, flagId, Problems, expectClean, removeComponent }
  from '../matrix-kit';
import { exactPart as part, exactParts as parts } from '../part-exact';
import {
  STATUSES, ORIENTATIONS, STATUS_LABELS, chain, checkChain, expectedShape, readShape,
  expectedInitials, checkNoUndocumentedParts,
} from './approval-flow-support';

const TAG = 'snice-approval-flow';
await import('../../../packages/components/src/approval-flow/snice-approval-flow');

afterEach(() => { document.body.innerHTML = ''; });

describe('approval-flow matrix: status x current x orientation', () => {
  const combos = cross({
    status: STATUSES, current: [true, false], orientation: ORIENTATIONS,
  });

  for (const combo of combos) {
    it(combo.id, async () => {
      const steps = [
        { id: 'a', approver: 'Alice Smith', role: 'Manager', status: combo.status },
        { id: 'b', approver: 'Bob Jones', role: 'Director', status: 'pending' as const },
      ];
      const currentStep = combo.current ? 'a' : 'b';
      const el = await mount<HTMLElement>(TAG, {
        orientation: combo.orientation,
      }, { currentStep, steps });

      const problems = new Problems();
      checkChain(el, steps, currentStep, problems);
      // The orientation is carried on the container, which is how the docs'
      // `orientation` property becomes a layout.
      problems.check(
        (part(el, 'container')?.getAttribute('class') ?? '')
          .includes(`flow--${combo.orientation}`),
        `container carries no flow--${combo.orientation} class`);
      checkNoUndocumentedParts(el, problems);
      expectClean(problems, combo.id);
      removeComponent(el);
    });
  }
});

describe('approval-flow matrix: the optional fields', () => {
  const FLAGS = ['role', 'avatar', 'comment', 'timestamp'] as const;

  for (const vector of flagVectors(FLAGS)) {
    it(flagId(vector), async () => {
      const step = {
        id: 'a', approver: 'Alice Smith', status: 'pending' as const,
        ...(vector.role ? { role: 'Manager' } : {}),
        ...(vector.avatar ? { avatar: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=' } : {}),
        ...(vector.comment ? { comment: 'Looks good' } : {}),
        ...(vector.timestamp ? { timestamp: 'Jan 15' } : {}),
      };
      const el = await mount<HTMLElement>(TAG, {}, { currentStep: 'a', steps: [step] });

      const problems = new Problems();
      const node = parts(el, 'step')[0];
      problems.check(!!node, 'no step rendered');
      if (node) {
        problems.equal(readShape(node), expectedShape(step, 'a'), flagId(vector));
        // An absent optional field means an ABSENT part, not an empty one.
        for (const [flag, name] of
          [['role', 'role'], ['comment', 'comment'], ['timestamp', 'timestamp']] as const) {
          problems.check(!!part(el, name) === vector[flag],
            `part="${name}" ${part(el, name) ? 'present' : 'absent'} for ${flag}=${vector[flag]}`);
        }
      }
      expectClean(problems, flagId(vector));
      removeComponent(el);
    });
  }

  it('initials fall back from the approver name', async () => {
    const cases: Array<[string, string]> = [
      ['Alice Smith', 'AS'],
      ['Bob', 'B'],
      ['Mary Jane Watson', 'MJ'],
    ];
    for (const [approver, initials] of cases) {
      expect(expectedInitials(approver), `initials for ${approver}`).toBe(initials);
      const el = await mount<HTMLElement>(TAG, {}, {
        steps: [{ id: 'a', approver, status: 'pending' }],
      });
      expect(readShape(parts(el, 'step')[0]).avatar, `rendered avatar for ${approver}`)
        .toBe(initials);
      document.body.innerHTML = '';
    }
  });
});

describe('approval-flow matrix: the chain from the docs', () => {
  for (const orientation of ORIENTATIONS) {
    it(`orientation=${orientation}`, async () => {
      const steps = chain();
      const el = await mount<HTMLElement>(TAG, { orientation },
        { currentStep: '2', steps });
      const problems = new Problems();
      checkChain(el, steps, '2', problems);
      // "connector - Line between steps": one per step node, and the last
      // one's absence is a painted fact the visual tier owns.
      problems.equal(parts(el, 'connector').length, steps.length, 'connector nodes');
      problems.equal(parts(el, 'actions').length, 1, 'only the current step acts');
      expectClean(problems, orientation);
      removeComponent(el);
    });
  }

  it('an empty chain renders an empty container', async () => {
    const el = await mount<HTMLElement>(TAG, {}, { steps: [] });
    expect(part(el, 'container'), 'part="container"').not.toBeNull();
    expect(parts(el, 'step').length, 'steps').toBe(0);
  });

  it('every documented status has its own label', async () => {
    const steps = STATUSES.map((status, i) => ({
      id: String(i), approver: `Approver ${i}`, status,
    }));
    const el = await mount<HTMLElement>(TAG, {}, { steps });
    expect(parts(el, 'status').map(node => node.textContent!.replace(/\s+/g, ' ').trim()),
      'status labels').toEqual(STATUSES.map(status => STATUS_LABELS[status]));
  });
});
