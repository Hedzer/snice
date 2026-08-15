/**
 * Matrix slice SPOTLIGHT / TARGETS + ACCESSIBILITY.
 *
 * Two documented contracts that the tour slice does not reach:
 *
 *   · `spotlight-target-missing` -> `{ index, step }` — "step target gone (e.g.
 *     route change); popover stops instead of pointing at nothing".
 *   · § Accessibility: "Keyboard-accessible navigation buttons", "Focus moves
 *     to popover on each step", "Escape key ends tour", "Respects
 *     `prefers-reduced-motion`".
 *
 * Dimensions: target presence (present / never existed / removed mid-tour) x
 * entry point (start / next / prev / goToStep), plus one case per documented
 * accessibility promise.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mount, captureEvents, key, product } from '../matrix-utils';
import {
  EVENTS, tourSteps, mountTargets, cleanupSpotlight, read, spotlightProblems,
  type SpotlightStep,
} from './spotlight-support';

async function mountTour(steps: SpotlightStep[], targets = steps.length) {
  mountTargets(targets);
  return mount<HTMLElement>('snice-spotlight', {}, '', { steps });
}

describe('spotlight matrix: missing targets', () => {
  afterEach(() => cleanupSpotlight());

  it('a target that never existed is reported on start()', async () => {
    const steps: SpotlightStep[] = [
      { target: '#nowhere', title: 'Lost', description: 'This target does not exist' },
    ];
    const el = await mountTour(steps, 0);
    const recorder = captureEvents(el, [...EVENTS]);

    (el as any).start();

    expect(recorder.types(), 'a missing target must be announced')
      .toContain('spotlight-target-missing');
    const missing = recorder.events.find(e => e.type === 'spotlight-target-missing')!;
    expect(missing.detail).toEqual({ index: 0, step: steps[0] });
  });

  for (const point of product({ via: ['next', 'goToStep'] as const })) {
    it(`a target missing at the step reached by ${point.via} is reported`, async () => {
      const steps: SpotlightStep[] = [
        { target: '#target-0', title: 'Here', description: 'Present' },
        { target: '#gone', title: 'Lost', description: 'Absent' },
      ];
      const el = await mountTour(steps, 1);
      (el as any).start();
      const recorder = captureEvents(el, [...EVENTS]);

      if (point.via === 'next') (el as any).next();
      else (el as any).goToStep(1);

      expect(recorder.types(), point.via).toContain('spotlight-target-missing');
      expect(recorder.events.find(e => e.type === 'spotlight-target-missing')!.detail)
        .toEqual({ index: 1, step: steps[1] });
    });
  }

  it('a target removed mid-tour is reported when the tour reaches it', async () => {
    const steps = tourSteps(2);
    const el = await mountTour(steps);
    (el as any).start();

    document.querySelector('#target-1')!.remove();
    const recorder = captureEvents(el, [...EVENTS]);

    (el as any).next();

    expect(recorder.types()).toContain('spotlight-target-missing');
    expect(recorder.events.find(e => e.type === 'spotlight-target-missing')!.detail)
      .toEqual({ index: 1, step: steps[1] });
  });

  it('a missing target stops the popover instead of ending the tour', async () => {
    // "popover stops instead of pointing at nothing" — the tour is still
    // running and still showing the step it moved to.
    const steps: SpotlightStep[] = [
      { target: '#target-0', title: 'Here', description: 'Present' },
      { target: '#gone', title: 'Lost', description: 'Absent' },
    ];
    const el = await mountTour(steps, 1);
    (el as any).start();
    const recorder = captureEvents(el, [...EVENTS]);

    (el as any).next();

    expect(recorder.types(), 'a missing target ended the tour').not.toContain('spotlight-end');
    expect(read().present, 'the overlay was torn down by a missing target').toBe(true);
    expect(spotlightProblems(steps, 1)).toEqual([]);
  });

  it('a present target is never reported missing', async () => {
    const steps = tourSteps(3);
    const el = await mountTour(steps);
    const recorder = captureEvents(el, [...EVENTS]);

    (el as any).start();
    (el as any).next();
    (el as any).prev();
    (el as any).goToStep(2);

    expect(recorder.types()).not.toContain('spotlight-target-missing');
  });
});

describe('spotlight matrix: accessibility', () => {
  afterEach(() => cleanupSpotlight());

  it('navigation buttons are real buttons', async () => {
    // "Keyboard-accessible navigation buttons": a <button> is focusable and
    // Enter/Space-activatable without the component doing anything.
    const steps = tourSteps(3);
    const el = await mountTour(steps);
    (el as any).start();
    (el as any).next();

    const nodes = read().actionNodes;
    expect(nodes.length).toBeGreaterThan(0);
    expect(nodes.map(n => n.tagName)).toEqual(nodes.map(() => 'BUTTON'));
  });

  /**
   * MATRIX-spotlight-1
   *
   * Documented: § Accessibility — "Escape key ends tour".
   * Actual: no key handler is installed anywhere; Escape leaves the tour
   * running and the overlay in the document, and emits nothing.
   *
   * The assertion below is the documented one and is NOT weakened. It is
   * marked `it.fails` so the suite goes red the day the behaviour is added and
   * this finding can be closed.
   */
  it.fails('MATRIX-spotlight-1: Escape ends the tour', async () => {
    const steps = tourSteps(3);
    const el = await mountTour(steps);
    (el as any).start();
    const recorder = captureEvents(el, [...EVENTS]);

    key(document.body, 'Escape');
    key(read().popover, 'Escape');
    key(el, 'Escape');

    expect(recorder.types(), 'Escape emitted no end event').toContain('spotlight-end');
    expect(read().present, 'the overlay survived Escape').toBe(false);
  });

  /**
   * MATRIX-spotlight-2
   *
   * Documented: § Accessibility — "Focus moves to popover on each step".
   * Actual: nothing calls `focus()`; the popover is not focusable (it carries
   * no `tabindex`), and `document.activeElement` never becomes the popover or
   * anything inside it, on `start()` or on any subsequent step.
   *
   * The assertion is the documented one, kept intact under `it.fails`.
   */
  it.fails('MATRIX-spotlight-2: focus moves to the popover on each step', async () => {
    const steps = tourSteps(3);
    const el = await mountTour(steps);

    (el as any).start();
    const popover = read().popover!;
    const focused = () => document.activeElement;
    expect(popover.contains(focused()) || focused() === popover,
      `after start() focus is on <${focused()?.tagName.toLowerCase()}>`).toBe(true);

    (el as any).next();
    expect(read().popover!.contains(document.activeElement)
      || document.activeElement === read().popover,
      'after next() focus is not inside the popover').toBe(true);
  });

  it('the popover is announced as a dialog over the page', async () => {
    // The overlay dims the page and takes over interaction, which is what
    // "guided tour … spotlight" describes; the popover therefore has to be
    // reachable as a dialog rather than as anonymous decoration.
    const steps = tourSteps(2);
    const el = await mountTour(steps);
    (el as any).start();

    const popover = read().popover!;
    expect(popover.getAttribute('role')).toBe('dialog');
    expect(popover.getAttribute('aria-labelledby'), 'the dialog has no accessible name').not.toBeNull();
    expect(popover.getAttribute('aria-describedby'), 'the dialog has no description').not.toBeNull();
  });

  it('the dialog name and description resolve to the step title and text', async () => {
    const steps = tourSteps(3);
    const el = await mountTour(steps);
    (el as any).start();
    (el as any).goToStep(2);

    const popover = read().popover!;
    const portal = popover.getRootNode() as ParentNode;
    const name = portal.querySelector(`#${popover.getAttribute('aria-labelledby')}`);
    const description = portal.querySelector(`#${popover.getAttribute('aria-describedby')}`);

    expect(name?.textContent?.trim()).toBe(steps[2].title);
    expect(description?.textContent?.trim()).toBe(steps[2].description);
  });
});
