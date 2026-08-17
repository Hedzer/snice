/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-approval-flow matrix — the three documented events
 * ════════════════════════════════════════════════════════════════════════════
 *
 * docs/ai/components/approval-flow.md:
 *
 *   step-approve -> { step }           "Approve button clicked on current step"
 *   step-reject  -> { step }           "Reject button clicked on current step"
 *   step-comment -> { step, comment }  "Comment added to step"
 *
 * The first two are crossed over every position in the chain (is the acting
 * step first, middle or last?) and over every status the current step can be
 * in, because "on current step" is the whole gate.
 *
 * ── MATRIX-approval-flow-1 ──────────────────────────────────────────────────
 *
 * The third event has no producer. The current step's `actions` row contains
 * exactly two buttons — Approve and Reject — and nothing anywhere in the
 * shadow tree accepts text: no input, no textarea, no contenteditable, no
 * further button. A consumer who follows the docs and listens for
 * `step-comment` has added a listener that cannot fire. The assertion below
 * states the documented capability and is declared `it.fails`.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { mount, cross, Problems, expectClean, captureEvents, click, removeComponent, wait }
  from '../matrix-kit';
import { exactPart as part, exactParts as parts, exactPartsIn } from '../part-exact';
import { STATUSES, ORIENTATIONS, chain } from './approval-flow-support';

const TAG = 'snice-approval-flow';
await import('../../../packages/components/src/approval-flow/snice-approval-flow');

afterEach(() => { document.body.innerHTML = ''; });

/** The two buttons of the action row, in the documented order. */
function actionButtons(el: HTMLElement): HTMLButtonElement[] {
  const actions = part(el, 'actions');
  return actions ? [...actions.querySelectorAll('button')] : [];
}

describe('approval-flow matrix: step-approve and step-reject', () => {
  const combos = cross({
    position: [0, 1, 2] as const,
    action: ['approve', 'reject'] as const,
    orientation: ORIENTATIONS,
  });

  for (const combo of combos) {
    it(combo.id, async () => {
      const steps = chain().map(step => ({ ...step, status: 'pending' as const }));
      const currentStep = steps[combo.position].id;
      const el = await mount<HTMLElement>(TAG, { orientation: combo.orientation },
        { currentStep, steps });

      const approvals = captureEvents<any>(el, 'step-approve');
      const rejections = captureEvents<any>(el, 'step-reject');
      const buttons = actionButtons(el);

      const problems = new Problems();
      problems.equal(buttons.length, 2, 'buttons in the action row');
      problems.equal(buttons.map(b => b.textContent!.trim()), ['Approve', 'Reject'],
        'action labels');

      click(buttons[combo.action === 'approve' ? 0 : 1]);
      await wait(30);

      const fired = combo.action === 'approve' ? approvals : rejections;
      const quiet = combo.action === 'approve' ? rejections : approvals;
      problems.equal(fired.length, 1, `${combo.action} event count`);
      problems.equal(fired[0]?.step?.id, currentStep, 'detail.step.id');
      problems.equal(fired[0]?.step?.approver, steps[combo.position].approver,
        'detail.step.approver');
      problems.equal(quiet.length, 0, 'the other event also fired');
      expectClean(problems, combo.id);
      removeComponent(el);
    });
  }
});

describe('approval-flow matrix: only a pending current step can act', () => {
  const combos = cross({ status: STATUSES, current: [true, false] });

  for (const combo of combos) {
    it(combo.id, async () => {
      const steps = [
        { id: 'a', approver: 'Alice Smith', status: combo.status },
        { id: 'b', approver: 'Bob Jones', status: 'skipped' as const },
      ];
      const el = await mount<HTMLElement>(TAG, {},
        { currentStep: combo.current ? 'a' : 'b', steps });

      const expected = combo.current && combo.status === 'pending';
      const problems = new Problems();
      problems.check(!!part(el, 'actions') === expected,
        `part="actions" ${part(el, 'actions') ? 'present' : 'absent'} for`
          + ` status=${combo.status} current=${combo.current}`);
      problems.equal(parts(el, 'actions').length, expected ? 1 : 0, 'action rows');
      expectClean(problems, combo.id);
      removeComponent(el);
    });
  }

  it('no current step means nothing can be acted on', async () => {
    const el = await mount<HTMLElement>(TAG, {}, { steps: chain() });
    expect(parts(el, 'actions').length, 'action rows with no current-step').toBe(0);
  });

  it('a current-step naming nobody leaves the chain inert', async () => {
    const el = await mount<HTMLElement>(TAG, {},
      { currentStep: 'nobody', steps: chain() });
    expect(parts(el, 'actions').length, 'action rows for an unknown current-step').toBe(0);
  });
});

describe('approval-flow matrix: step-comment', () => {
  it.fails('the current step can take a comment [MATRIX-approval-flow-1]', async () => {
    const el = await mount<HTMLElement>(TAG, {}, { currentStep: '2', steps: chain() });
    const current = parts(el, 'step')[1];
    const affordance = current.querySelector('input, textarea, [contenteditable="true"]');
    const buttons = [...(exactPartsIn(current, 'actions')[0]?.querySelectorAll('button') ?? [])];
    expect(
      !!affordance || buttons.some(b => /comment/i.test(b.textContent ?? '')),
      'the current step offers no way to add the comment `step-comment` documents'
        + ` (buttons: ${buttons.map(b => b.textContent!.trim()).join(', ') || 'none'})`,
    ).toBe(true);
  });

  it('a comment supplied in the data is still displayed', async () => {
    // Scoping MATRIX-approval-flow-1: DISPLAYING a comment works; it is only
    // the documented way to ADD one that does not exist.
    const el = await mount<HTMLElement>(TAG, {}, { steps: chain() });
    expect(part(el, 'comment')?.textContent?.replace(/\s+/g, ' ').trim(),
      'the first step\'s comment').toBe('"Looks good"');
  });
});
