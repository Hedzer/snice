/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-approval-flow matrix — smoke slice
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The one file of this directory the DEFAULT vitest loop collects. One combo
 * per feature family, plus the marquee regression:
 *
 *   · the doc's own chain renders name, role, status, comment and timestamp;
 *   · only the current PENDING step offers Approve/Reject;
 *   · both action events carry the step they acted on;
 *   · the documented `step-comment` affordance exists on the current step
 *     (MATRIX-approval-flow-1, fixed).
 *
 * The full cross lives in the sibling files and runs via
 * `npx vitest run --config vitest.matrix.config.ts tests/matrix/approval-flow`.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { mount, Problems, expectClean, captureEvents, click, wait } from '../matrix-kit';
import { exactPart as part, exactParts as parts } from '../part-exact';
import { chain, checkChain } from './approval-flow-support';

const TAG = 'snice-approval-flow';
await import('../../../packages/components/src/approval-flow/snice-approval-flow');

afterEach(() => { document.body.innerHTML = ''; });

describe('approval-flow smoke', () => {
  it('renders the documented chain', async () => {
    const steps = chain();
    const el = await mount<HTMLElement>(TAG, { orientation: 'vertical' },
      { currentStep: '2', steps });
    const problems = new Problems();
    checkChain(el, steps, '2', problems);
    expectClean(problems, 'doc chain');
  });

  it('only the current pending step can be acted on', async () => {
    const el = await mount<HTMLElement>(TAG, {}, { currentStep: '2', steps: chain() });
    expect(parts(el, 'actions').length, 'action rows').toBe(1);
    expect(parts(el, 'step')[1].getAttribute('class'), 'the current step')
      .toContain('step--current');
  });

  it('approve and reject carry their step', async () => {
    const el = await mount<HTMLElement>(TAG, {}, { currentStep: '2', steps: chain() });
    const approvals = captureEvents<any>(el, 'step-approve');
    const rejections = captureEvents<any>(el, 'step-reject');
    const buttons = [...part(el, 'actions')!.querySelectorAll('button')];

    click(buttons[0]);
    click(buttons[1]);
    await wait(30);
    expect(approvals.map(d => d.step.approver), 'step-approve').toEqual(['Bob Jones']);
    expect(rejections.map(d => d.step.approver), 'step-reject').toEqual(['Bob Jones']);
  });

  it('the current step can take a comment [MATRIX-approval-flow-1 fixed]', async () => {
    const el = await mount<HTMLElement>(TAG, {}, { currentStep: '2', steps: chain() });
    const current = parts(el, 'step')[1];
    expect(
      !!current.querySelector('input, textarea, [contenteditable="true"]'),
      'the current step offers no way to add the comment `step-comment` documents',
    ).toBe(true);
  });
});
