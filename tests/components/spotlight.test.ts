import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '../../components/spotlight/snice-spotlight';
import type { SniceSpotlight } from '../../components/spotlight/snice-spotlight';

// JSDOM doesn't implement scrollIntoView
Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || function () {};

describe('SniceSpotlight', () => {
  let spotlight: SniceSpotlight;
  let target1: HTMLElement;
  let target2: HTMLElement;

  beforeEach(() => {
    // Create target elements for the spotlight to highlight
    target1 = document.createElement('div');
    target1.id = 'target1';
    target1.textContent = 'Target 1';
    document.body.appendChild(target1);

    target2 = document.createElement('div');
    target2.id = 'target2';
    target2.textContent = 'Target 2';
    document.body.appendChild(target2);

    spotlight = document.createElement('snice-spotlight') as SniceSpotlight;
    document.body.appendChild(spotlight);
  });

  afterEach(() => {
    spotlight.remove();
    target1.remove();
    target2.remove();
    // Clean up any leftover portals
    document.querySelectorAll('[data-snice-spotlight-portal]').forEach(el => el.remove());
  });

  describe('Properties', () => {
    it('should have empty steps by default', () => {
      expect(spotlight.steps).toEqual([]);
    });

    it('should accept steps array', () => {
      const steps = [
        { target: '#target1', title: 'Step 1', description: 'First step' },
        { target: '#target2', title: 'Step 2', description: 'Second step' },
      ];
      spotlight.steps = steps;
      expect(spotlight.steps).toBe(steps);
    });
  });

  describe('Lifecycle', () => {
    it('should not start with empty steps', () => {
      spotlight.start();
      const portal = document.querySelector('[data-snice-spotlight-portal]');
      expect(portal).toBeNull();
    });

    it('should create portal on start', () => {
      spotlight.steps = [
        { target: '#target1', title: 'Step 1', description: 'First' },
      ];
      spotlight.start();
      const portal = document.querySelector('[data-snice-spotlight-portal]');
      expect(portal).toBeTruthy();
    });

    it('should remove portal on end', () => {
      spotlight.steps = [
        { target: '#target1', title: 'Step 1', description: 'First' },
      ];
      spotlight.start();
      spotlight.end();
      const portal = document.querySelector('[data-snice-spotlight-portal]');
      expect(portal).toBeNull();
    });

    it('should remove portal on dispose (element removal)', () => {
      spotlight.steps = [
        { target: '#target1', title: 'Step 1', description: 'First' },
      ];
      spotlight.start();
      spotlight.remove();
      const portal = document.querySelector('[data-snice-spotlight-portal]');
      expect(portal).toBeNull();
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      spotlight.steps = [
        { target: '#target1', title: 'Step 1', description: 'First step' },
        { target: '#target2', title: 'Step 2', description: 'Second step' },
      ];
    });

    it('should start at step 0', () => {
      const stepSpy = vi.fn();
      spotlight.addEventListener('spotlight-start', stepSpy);
      spotlight.start();
      expect(stepSpy).toHaveBeenCalled();
    });

    it('should advance to next step', () => {
      const stepSpy = vi.fn();
      spotlight.addEventListener('spotlight-step', stepSpy);
      spotlight.start();
      spotlight.next();
      expect(stepSpy).toHaveBeenCalled();
      const detail = stepSpy.mock.calls[0][0].detail;
      expect(detail.index).toBe(1);
      expect(detail.step.title).toBe('Step 2');
    });

    it('should go back to previous step', () => {
      const stepSpy = vi.fn();
      spotlight.addEventListener('spotlight-step', stepSpy);
      spotlight.start();
      spotlight.next();
      spotlight.prev();
      expect(stepSpy).toHaveBeenCalledTimes(2);
      const detail = stepSpy.mock.calls[1][0].detail;
      expect(detail.index).toBe(0);
    });

    it('should end when calling next on last step', () => {
      const endSpy = vi.fn();
      spotlight.addEventListener('spotlight-end', endSpy);
      spotlight.start();
      spotlight.next(); // step 1
      spotlight.next(); // should end
      expect(endSpy).toHaveBeenCalled();
    });

    it('should not go before step 0', () => {
      const stepSpy = vi.fn();
      spotlight.addEventListener('spotlight-step', stepSpy);
      spotlight.start();
      spotlight.prev();
      expect(stepSpy).not.toHaveBeenCalled();
    });

    it('should jump to a specific step with goToStep', () => {
      const stepSpy = vi.fn();
      spotlight.addEventListener('spotlight-step', stepSpy);
      spotlight.start();
      spotlight.goToStep(1);
      expect(stepSpy).toHaveBeenCalled();
      const detail = stepSpy.mock.calls[0][0].detail;
      expect(detail.index).toBe(1);
    });

    it('should ignore invalid goToStep index', () => {
      const stepSpy = vi.fn();
      spotlight.addEventListener('spotlight-step', stepSpy);
      spotlight.start();
      spotlight.goToStep(5);
      spotlight.goToStep(-1);
      expect(stepSpy).not.toHaveBeenCalled();
    });
  });

  describe('Events', () => {
    beforeEach(() => {
      spotlight.steps = [
        { target: '#target1', title: 'Step 1', description: 'First step' },
        { target: '#target2', title: 'Step 2', description: 'Second step' },
      ];
    });

    it('should emit spotlight-start on start', () => {
      const spy = vi.fn();
      spotlight.addEventListener('spotlight-start', spy);
      spotlight.start();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should emit spotlight-end on end', () => {
      const spy = vi.fn();
      spotlight.addEventListener('spotlight-end', spy);
      spotlight.start();
      spotlight.end();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should emit spotlight-skip on skip (via backdrop click)', () => {
      const spy = vi.fn();
      spotlight.addEventListener('spotlight-skip', spy);
      spotlight.start();

      const backdrop = document.querySelector('[data-snice-spotlight-portal] .backdrop') as HTMLElement;
      backdrop?.click();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should emit spotlight-step with detail on navigation', () => {
      const spy = vi.fn();
      spotlight.addEventListener('spotlight-step', spy);
      spotlight.start();
      spotlight.next();

      const detail = spy.mock.calls[0][0].detail;
      expect(detail).toHaveProperty('index', 1);
      expect(detail).toHaveProperty('step');
      expect(detail.step.target).toBe('#target2');
    });
  });

  describe('Positioning (no rAF needed)', () => {
    it('should position cutout synchronously after scrollIntoView instant', () => {
      spotlight.steps = [
        { target: '#target1', title: 'Step 1', description: 'First' },
      ];
      spotlight.start();

      const cutout = document.querySelector('[data-snice-spotlight-portal] .cutout') as HTMLElement;
      // Cutout should have position styles set synchronously (no rAF)
      expect(cutout).toBeTruthy();
      expect(cutout.style.top).toBeTruthy();
      expect(cutout.style.left).toBeTruthy();
      expect(cutout.style.width).toBeTruthy();
      expect(cutout.style.height).toBeTruthy();
    });

    it('should update position synchronously when navigating steps', () => {
      spotlight.steps = [
        { target: '#target1', title: 'Step 1', description: 'First' },
        { target: '#target2', title: 'Step 2', description: 'Second' },
      ];
      spotlight.start();
      spotlight.next();

      const cutout = document.querySelector('[data-snice-spotlight-portal] .cutout') as HTMLElement;
      expect(cutout).toBeTruthy();
      // Position should be set synchronously after next()
      expect(cutout.style.top).toBeTruthy();
      expect(cutout.style.width).toBeTruthy();
    });
  });

  describe('Portal content', () => {
    it('should show step title and description', () => {
      spotlight.steps = [
        { target: '#target1', title: 'Welcome', description: 'This is step one' },
      ];
      spotlight.start();

      const title = document.querySelector('[data-snice-spotlight-portal] .popover-title');
      const desc = document.querySelector('[data-snice-spotlight-portal] .popover-description');
      expect(title?.textContent).toBe('Welcome');
      expect(desc?.textContent).toBe('This is step one');
    });

    it('should show step indicator', () => {
      spotlight.steps = [
        { target: '#target1', title: 'A', description: 'a' },
        { target: '#target2', title: 'B', description: 'b' },
      ];
      spotlight.start();

      const indicator = document.querySelector('[data-snice-spotlight-portal] .step-indicator');
      expect(indicator?.textContent).toBe('1 / 2');
    });

    it('should show Done button on last step', () => {
      spotlight.steps = [
        { target: '#target1', title: 'Only', description: 'one' },
      ];
      spotlight.start();

      const nextBtn = document.querySelector('[data-snice-spotlight-portal] .btn-primary');
      expect(nextBtn?.textContent).toBe('Done');
    });

    it('should show Next button on non-last step', () => {
      spotlight.steps = [
        { target: '#target1', title: 'A', description: 'a' },
        { target: '#target2', title: 'B', description: 'b' },
      ];
      spotlight.start();

      const nextBtn = document.querySelector('[data-snice-spotlight-portal] .btn-primary');
      expect(nextBtn?.textContent).toBe('Next');
    });

    it('should not show Back button on first step', () => {
      spotlight.steps = [
        { target: '#target1', title: 'A', description: 'a' },
        { target: '#target2', title: 'B', description: 'b' },
      ];
      spotlight.start();

      const actions = document.querySelector('[data-snice-spotlight-portal] .popover-actions');
      const allButtons = Array.from(actions?.querySelectorAll('button') ?? []);
      const backBtn = allButtons.find(b => b.textContent === 'Back');
      expect(backBtn).toBeUndefined();
    });

    it('should show Back button on second step', () => {
      spotlight.steps = [
        { target: '#target1', title: 'A', description: 'a' },
        { target: '#target2', title: 'B', description: 'b' },
      ];
      spotlight.start();
      spotlight.next();

      const actions = document.querySelector('[data-snice-spotlight-portal] .popover-actions');
      const backBtn = actions?.querySelector('.btn:not(.btn-skip):not(.btn-primary)');
      expect(backBtn?.textContent).toBe('Back');
    });
  });

  describe('goToStep without prior start', () => {
    it('should activate and create portal when goToStep is called without start', () => {
      spotlight.steps = [
        { target: '#target1', title: 'A', description: 'a' },
        { target: '#target2', title: 'B', description: 'b' },
      ];
      spotlight.goToStep(1);

      const portal = document.querySelector('[data-snice-spotlight-portal]');
      expect(portal).toBeTruthy();

      const title = document.querySelector('[data-snice-spotlight-portal] .popover-title');
      expect(title?.textContent).toBe('B');
    });
  });
});
