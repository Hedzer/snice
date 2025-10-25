import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, wait } from './test-utils';
import '../../components/stepper/snice-stepper';
import type { SniceStepperElement, Step } from '../../components/stepper/snice-stepper.types';

describe('snice-stepper', () => {
  let stepper: SniceStepperElement;

  afterEach(() => {
    if (stepper) {
      removeComponent(stepper as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render stepper element', async () => {
      stepper = await createComponent<SniceStepperElement>('snice-stepper');
      expect(stepper).toBeTruthy();
      expect(stepper.tagName.toLowerCase()).toBe('snice-stepper');
    });

    it('should have default properties', async () => {
      stepper = await createComponent<SniceStepperElement>('snice-stepper');
      expect(stepper.steps).toEqual([]);
      expect(stepper.currentStep).toBe(0);
      expect(stepper.orientation).toBe('horizontal');
      expect(stepper.clickable).toBe(false);
    });

    it('should render container', async () => {
      stepper = await createComponent<SniceStepperElement>('snice-stepper');
      const container = queryShadow(stepper, '.stepper');
      expect(container).toBeTruthy();
    });
  });

  describe('steps rendering', () => {
    it('should render multiple steps', async () => {
      const steps: Step[] = [
        { label: 'Step 1' },
        { label: 'Step 2' },
        { label: 'Step 3' }
      ];
      stepper = await createComponent<SniceStepperElement>('snice-stepper');
      stepper.steps = steps;
      await wait(10);
      const stepElements = queryShadowAll(stepper, '.step');
      expect(stepElements.length).toBe(3);
    });

    it('should render step labels', async () => {
      const steps: Step[] = [
        { label: 'Account Details' },
        { label: 'Payment Info' }
      ];
      stepper = await createComponent<SniceStepperElement>('snice-stepper');
      stepper.steps = steps;
      await wait(10);
      const labels = queryShadowAll(stepper, '.step__label');
      expect(labels[0]?.textContent).toBe('Account Details');
      expect(labels[1]?.textContent).toBe('Payment Info');
    });

    it('should render step descriptions when provided', async () => {
      const steps: Step[] = [
        { label: 'Step 1', description: 'Enter your details' }
      ];
      stepper = await createComponent<SniceStepperElement>('snice-stepper');
      stepper.steps = steps;
      await wait(10);
      const description = queryShadow(stepper, '.step__description');
      expect(description?.textContent).toBe('Enter your details');
    });

    it('should render step numbers', async () => {
      const steps: Step[] = [
        { label: 'Step 1' },
        { label: 'Step 2' }
      ];
      stepper = await createComponent<SniceStepperElement>('snice-stepper');
      stepper.steps = steps;
      await wait(10);
      const indicators = queryShadowAll(stepper, '.step__indicator');
      expect(indicators[0]?.textContent?.trim()).toBe('1');
      expect(indicators[1]?.textContent?.trim()).toBe('2');
    });
  });

  describe('step status', () => {
    it('should apply active status to current step', async () => {
      const steps: Step[] = [
        { label: 'Step 1' },
        { label: 'Step 2' },
        { label: 'Step 3' }
      ];
      stepper = await createComponent<SniceStepperElement>('snice-stepper');
      stepper.steps = steps;
      stepper.currentStep = 1;
      await wait(10);
      const activeStep = queryShadow(stepper, '.step--active');
      expect(activeStep).toBeTruthy();
    });

    it('should apply completed status to previous steps', async () => {
      const steps: Step[] = [
        { label: 'Step 1' },
        { label: 'Step 2' },
        { label: 'Step 3' }
      ];
      stepper = await createComponent<SniceStepperElement>('snice-stepper');
      stepper.steps = steps;
      stepper.currentStep = 2;
      await wait(10);
      const completedSteps = queryShadowAll(stepper, '.step--completed');
      expect(completedSteps.length).toBe(2);
    });

    it('should apply pending status to future steps', async () => {
      const steps: Step[] = [
        { label: 'Step 1' },
        { label: 'Step 2' },
        { label: 'Step 3' }
      ];
      stepper = await createComponent<SniceStepperElement>('snice-stepper');
      stepper.steps = steps;
      stepper.currentStep = 0;
      await wait(10);
      const pendingSteps = queryShadowAll(stepper, '.step--pending');
      expect(pendingSteps.length).toBe(2);
    });

    it('should show checkmark for completed steps', async () => {
      const steps: Step[] = [
        { label: 'Step 1' },
        { label: 'Step 2' }
      ];
      stepper = await createComponent<SniceStepperElement>('snice-stepper');
      stepper.steps = steps;
      stepper.currentStep = 1;
      await wait(10);
      const indicators = queryShadowAll(stepper, '.step__indicator');
      expect(indicators[0]?.textContent?.trim()).toBe('✓');
    });

    it('should use explicit status when provided', async () => {
      const steps: Step[] = [
        { label: 'Step 1', status: 'error' },
        { label: 'Step 2' }
      ];
      stepper = await createComponent<SniceStepperElement>('snice-stepper');
      stepper.steps = steps;
      stepper.currentStep = 1;
      await wait(10);
      const errorStep = queryShadow(stepper, '.step--error');
      expect(errorStep).toBeTruthy();
    });
  });

  describe('orientation', () => {
    it('should apply horizontal orientation class by default', async () => {
      stepper = await createComponent<SniceStepperElement>('snice-stepper');
      const container = queryShadow(stepper, '.stepper--horizontal');
      expect(container).toBeTruthy();
    });

    it('should apply vertical orientation class', async () => {
      stepper = await createComponent<SniceStepperElement>('snice-stepper', {
        orientation: 'vertical'
      });
      const container = queryShadow(stepper, '.stepper--vertical');
      expect(container).toBeTruthy();
    });
  });

  describe('clickable behavior', () => {
    it('should apply clickable class when clickable is true', async () => {
      const steps: Step[] = [
        { label: 'Step 1' },
        { label: 'Step 2' }
      ];
      stepper = await createComponent<SniceStepperElement>('snice-stepper', {
        clickable: true
      });
      stepper.steps = steps;
      await wait(10);
      const clickableSteps = queryShadowAll(stepper, '.step--clickable');
      expect(clickableSteps.length).toBe(2);
    });

    it('should emit step-change event when step is clicked', async () => {
      const steps: Step[] = [
        { label: 'Step 1' },
        { label: 'Step 2' }
      ];
      stepper = await createComponent<SniceStepperElement>('snice-stepper', {
        clickable: true
      });
      stepper.steps = steps;
      await wait(10);

      const eventSpy = vi.fn();
      stepper.addEventListener('step-change', eventSpy);

      const stepElements = queryShadowAll(stepper, '.step');
      (stepElements[1] as HTMLElement).click();
      await wait(10);

      expect(eventSpy).toHaveBeenCalled();
    });

    it('should update currentStep when step is clicked', async () => {
      const steps: Step[] = [
        { label: 'Step 1' },
        { label: 'Step 2' }
      ];
      stepper = await createComponent<SniceStepperElement>('snice-stepper', {
        clickable: true
      });
      stepper.steps = steps;
      await wait(10);

      const stepElements = queryShadowAll(stepper, '.step');
      (stepElements[1] as HTMLElement).click();
      await wait(10);

      expect(stepper.currentStep).toBe(1);
    });

    it('should not change step when clickable is false', async () => {
      const steps: Step[] = [
        { label: 'Step 1' },
        { label: 'Step 2' }
      ];
      stepper = await createComponent<SniceStepperElement>('snice-stepper', {
        clickable: false
      });
      stepper.steps = steps;
      stepper.currentStep = 0;
      await wait(10);

      const stepElements = queryShadowAll(stepper, '.step');
      (stepElements[1] as HTMLElement).click();
      await wait(10);

      expect(stepper.currentStep).toBe(0);
    });

    it('should include step details in event', async () => {
      const steps: Step[] = [
        { label: 'Step 1' },
        { label: 'Step 2' }
      ];
      stepper = await createComponent<SniceStepperElement>('snice-stepper', {
        clickable: true
      });
      stepper.steps = steps;
      await wait(10);

      const eventSpy = vi.fn();
      stepper.addEventListener('step-change', (e: any) => {
        eventSpy(e.detail);
      });

      const stepElements = queryShadowAll(stepper, '.step');
      (stepElements[1] as HTMLElement).click();
      await wait(10);

      expect(eventSpy).toHaveBeenCalledWith({
        previousStep: 0,
        currentStep: 1,
        step: steps[1]
      });
    });

    it('should allow preventing step change', async () => {
      const steps: Step[] = [
        { label: 'Step 1' },
        { label: 'Step 2' }
      ];
      stepper = await createComponent<SniceStepperElement>('snice-stepper', {
        clickable: true
      });
      stepper.steps = steps;
      await wait(10);

      stepper.addEventListener('step-change', (e) => {
        e.preventDefault();
      });

      const stepElements = queryShadowAll(stepper, '.step');
      (stepElements[1] as HTMLElement).click();
      await wait(10);

      expect(stepper.currentStep).toBe(0);
    });
  });

  describe('connector lines', () => {
    it('should render connector for each step except last', async () => {
      const steps: Step[] = [
        { label: 'Step 1' },
        { label: 'Step 2' },
        { label: 'Step 3' }
      ];
      stepper = await createComponent<SniceStepperElement>('snice-stepper');
      stepper.steps = steps;
      await wait(10);
      const connectors = queryShadowAll(stepper, '.step__connector');
      expect(connectors.length).toBe(3);
    });
  });
});
