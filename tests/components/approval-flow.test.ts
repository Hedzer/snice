import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, wait } from './test-utils';
import '../../components/approval-flow/snice-approval-flow';
import type { SniceApprovalFlowElement, ApprovalStep } from '../../components/approval-flow/snice-approval-flow.types';

describe('snice-approval-flow', () => {
  let flow: SniceApprovalFlowElement;

  afterEach(() => {
    if (flow) {
      removeComponent(flow as HTMLElement);
    }
  });

  const sampleSteps: ApprovalStep[] = [
    { id: '1', approver: 'Alice Smith', role: 'Manager', status: 'approved', comment: 'Looks good', timestamp: 'Jan 15' },
    { id: '2', approver: 'Bob Jones', role: 'Director', status: 'pending' },
    { id: '3', approver: 'Carol White', role: 'VP', status: 'pending' }
  ];

  describe('basic functionality', () => {
    it('should render approval flow element', async () => {
      flow = await createComponent<SniceApprovalFlowElement>('snice-approval-flow');
      expect(flow).toBeTruthy();
      expect(flow.tagName.toLowerCase()).toBe('snice-approval-flow');
    });

    it('should have default properties', async () => {
      flow = await createComponent<SniceApprovalFlowElement>('snice-approval-flow');
      expect(flow.steps).toEqual([]);
      expect(flow.orientation).toBe('horizontal');
      expect(flow.currentStep).toBe('');
    });

    it('should render container', async () => {
      flow = await createComponent<SniceApprovalFlowElement>('snice-approval-flow');
      const container = queryShadow(flow, '.flow');
      expect(container).toBeTruthy();
    });
  });

  describe('steps rendering', () => {
    it('should render multiple steps', async () => {
      flow = await createComponent<SniceApprovalFlowElement>('snice-approval-flow');
      flow.steps = sampleSteps;
      await wait(10);
      const stepElements = queryShadowAll(flow, '.step');
      expect(stepElements.length).toBe(3);
    });

    it('should render approver names', async () => {
      flow = await createComponent<SniceApprovalFlowElement>('snice-approval-flow');
      flow.steps = sampleSteps;
      await wait(10);
      const names = queryShadowAll(flow, '.step__name');
      expect(names[0]?.textContent).toBe('Alice Smith');
      expect(names[1]?.textContent).toBe('Bob Jones');
    });

    it('should render roles when provided', async () => {
      flow = await createComponent<SniceApprovalFlowElement>('snice-approval-flow');
      flow.steps = sampleSteps;
      await wait(10);
      const roles = queryShadowAll(flow, '.step__role');
      expect(roles[0]?.textContent).toBe('Manager');
    });

    it('should render initials when no avatar', async () => {
      flow = await createComponent<SniceApprovalFlowElement>('snice-approval-flow');
      flow.steps = [{ id: '1', approver: 'Alice Smith', status: 'pending' }];
      await wait(10);
      const avatar = queryShadow(flow, '.step__avatar');
      expect(avatar?.textContent?.trim()).toBe('AS');
    });

    it('should render avatar image when provided', async () => {
      flow = await createComponent<SniceApprovalFlowElement>('snice-approval-flow');
      flow.steps = [{ id: '1', approver: 'Alice', avatar: 'https://example.com/alice.jpg', status: 'pending' }];
      await wait(10);
      const img = queryShadow(flow, '.step__avatar img');
      expect(img).toBeTruthy();
    });

    it('should render comments when provided', async () => {
      flow = await createComponent<SniceApprovalFlowElement>('snice-approval-flow');
      flow.steps = sampleSteps;
      await wait(10);
      const comment = queryShadow(flow, '.step__comment');
      expect(comment).toBeTruthy();
      expect(comment?.textContent).toContain('Looks good');
    });

    it('should render timestamps when provided', async () => {
      flow = await createComponent<SniceApprovalFlowElement>('snice-approval-flow');
      flow.steps = sampleSteps;
      await wait(10);
      const timestamp = queryShadow(flow, '.step__timestamp');
      expect(timestamp?.textContent).toBe('Jan 15');
    });
  });

  describe('step status', () => {
    it('should apply approved status class', async () => {
      flow = await createComponent<SniceApprovalFlowElement>('snice-approval-flow');
      flow.steps = sampleSteps;
      await wait(10);
      const approved = queryShadow(flow, '.step--approved');
      expect(approved).toBeTruthy();
    });

    it('should apply pending status class', async () => {
      flow = await createComponent<SniceApprovalFlowElement>('snice-approval-flow');
      flow.steps = sampleSteps;
      await wait(10);
      const pending = queryShadowAll(flow, '.step--pending');
      expect(pending.length).toBe(2);
    });

    it('should apply rejected status class', async () => {
      flow = await createComponent<SniceApprovalFlowElement>('snice-approval-flow');
      flow.steps = [{ id: '1', approver: 'Alice', status: 'rejected' }];
      await wait(10);
      const rejected = queryShadow(flow, '.step--rejected');
      expect(rejected).toBeTruthy();
    });

    it('should apply skipped status class', async () => {
      flow = await createComponent<SniceApprovalFlowElement>('snice-approval-flow');
      flow.steps = [{ id: '1', approver: 'Alice', status: 'skipped' }];
      await wait(10);
      const skipped = queryShadow(flow, '.step--skipped');
      expect(skipped).toBeTruthy();
    });
  });

  describe('current step', () => {
    it('should highlight current step', async () => {
      flow = await createComponent<SniceApprovalFlowElement>('snice-approval-flow');
      flow.steps = sampleSteps;
      flow.currentStep = '2';
      await wait(10);
      const current = queryShadow(flow, '.step--current');
      expect(current).toBeTruthy();
    });

    it('should show action buttons for current pending step', async () => {
      flow = await createComponent<SniceApprovalFlowElement>('snice-approval-flow');
      flow.steps = sampleSteps;
      flow.currentStep = '2';
      await wait(10);
      const approveBtn = queryShadow(flow, '.step__btn--approve');
      const rejectBtn = queryShadow(flow, '.step__btn--reject');
      expect(approveBtn).toBeTruthy();
      expect(rejectBtn).toBeTruthy();
    });
  });

  describe('orientation', () => {
    it('should apply horizontal orientation by default', async () => {
      flow = await createComponent<SniceApprovalFlowElement>('snice-approval-flow');
      const container = queryShadow(flow, '.flow--horizontal');
      expect(container).toBeTruthy();
    });

    it('should apply vertical orientation', async () => {
      flow = await createComponent<SniceApprovalFlowElement>('snice-approval-flow', {
        orientation: 'vertical'
      });
      const container = queryShadow(flow, '.flow--vertical');
      expect(container).toBeTruthy();
    });
  });

  describe('events', () => {
    it('should emit step-approve when approve button clicked', async () => {
      flow = await createComponent<SniceApprovalFlowElement>('snice-approval-flow');
      flow.steps = sampleSteps;
      flow.currentStep = '2';
      await wait(10);

      const eventSpy = vi.fn();
      flow.addEventListener('step-approve', eventSpy);

      const approveBtn = queryShadow(flow, '.step__btn--approve') as HTMLElement;
      approveBtn.click();
      await wait(10);

      expect(eventSpy).toHaveBeenCalled();
    });

    it('should emit step-reject when reject button clicked', async () => {
      flow = await createComponent<SniceApprovalFlowElement>('snice-approval-flow');
      flow.steps = sampleSteps;
      flow.currentStep = '2';
      await wait(10);

      const eventSpy = vi.fn();
      flow.addEventListener('step-reject', eventSpy);

      const rejectBtn = queryShadow(flow, '.step__btn--reject') as HTMLElement;
      rejectBtn.click();
      await wait(10);

      expect(eventSpy).toHaveBeenCalled();
    });

    it('should include step data in approve event', async () => {
      flow = await createComponent<SniceApprovalFlowElement>('snice-approval-flow');
      flow.steps = sampleSteps;
      flow.currentStep = '2';
      await wait(10);

      const eventSpy = vi.fn();
      flow.addEventListener('step-approve', (e: any) => eventSpy(e.detail));

      const approveBtn = queryShadow(flow, '.step__btn--approve') as HTMLElement;
      approveBtn.click();
      await wait(10);

      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        step: expect.objectContaining({ id: '2', approver: 'Bob Jones' })
      }));
    });
  });

  describe('connectors', () => {
    it('should render connectors between steps', async () => {
      flow = await createComponent<SniceApprovalFlowElement>('snice-approval-flow');
      flow.steps = sampleSteps;
      await wait(10);
      const connectors = queryShadowAll(flow, '.step__connector');
      expect(connectors.length).toBe(3);
    });

    it('should color connector green after approved step', async () => {
      flow = await createComponent<SniceApprovalFlowElement>('snice-approval-flow');
      flow.steps = sampleSteps;
      await wait(10);
      const approvedStep = queryShadow(flow, '.step--approved .step__connector');
      expect(approvedStep).toBeTruthy();
    });
  });
});
