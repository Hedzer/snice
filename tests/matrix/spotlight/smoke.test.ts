/**
 * Smoke slice of the snice-spotlight matrix — the everyday-loop tier.
 *
 * The full cross lives in `tests/matrix/spotlight/`, excluded from
 * the default Vitest include. This file stays collected and buys the marquee:
 *
 *   · `start()` — the overlay portal appears with every documented part;
 *   · the three interior positions of a tour, where the action set changes
 *     (first step has no Back, last step finishes instead of continuing);
 *   · `next()` past the end, the one navigation call that ends the tour;
 *   · `skip()` from the Skip button, the only event carrying an index;
 *   · a missing target, the documented "route change" case.
 *
 * Structural assertions route through the matrix's own `spotlightProblems`
 * oracle. BUDGET: well under 1s.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mount, captureEvents, click } from '../matrix-utils';
import {
  EVENTS, PARTS, tourSteps, mountTargets, cleanupSpotlight, read, actionNamed,
  spotlightProblems, expectedActions, type SpotlightStep,
} from './spotlight-support';

async function mountTour(steps: SpotlightStep[], targets = steps.length) {
  mountTargets(targets);
  return mount<HTMLElement>('snice-spotlight', {}, '', { steps });
}

describe('spotlight matrix smoke', () => {
  afterEach(() => cleanupSpotlight());

  it('start() opens an overlay with every documented part', async () => {
    const steps = tourSteps(3);
    const el = await mountTour(steps);
    const recorder = captureEvents(el, [...EVENTS]);

    (el as any).start();

    expect(recorder.types()).toContain('spotlight-start');
    expect(read().parts).toEqual([...PARTS]);
    expect(spotlightProblems(steps, 0)).toEqual([]);
  });

  it('the action set changes across first, middle, and last step', async () => {
    const steps = tourSteps(3);
    const el = await mountTour(steps);
    (el as any).start();

    for (const index of [0, 1, 2]) {
      (el as any).goToStep(index);
      expect(read().actions, `step ${index}`).toEqual(expectedActions(index, 3));
      expect(spotlightProblems(steps, index), `step ${index}`).toEqual([]);
    }
  });

  it('next() past the last step ends the tour and removes the overlay', async () => {
    const steps = tourSteps(2);
    const el = await mountTour(steps);
    (el as any).start();
    (el as any).next();
    const recorder = captureEvents(el, [...EVENTS]);

    (el as any).next();

    expect(recorder.types()).toEqual(['spotlight-end']);
    expect(read().present).toBe(false);
  });

  it('Skip reports the index it was pressed at, then ends', async () => {
    const steps = tourSteps(3);
    const el = await mountTour(steps);
    (el as any).start();
    (el as any).goToStep(1);
    const recorder = captureEvents(el, [...EVENTS]);

    click(actionNamed('Skip'));

    expect(recorder.types()).toEqual(['spotlight-skip', 'spotlight-end']);
    expect(recorder.events[0].detail).toEqual({ index: 1 });
  });

  it('a missing target is announced and the tour keeps running', async () => {
    const steps: SpotlightStep[] = [
      { target: '#target-0', title: 'Here', description: 'Present' },
      { target: '#gone', title: 'Lost', description: 'Absent' },
    ];
    const el = await mountTour(steps, 1);
    (el as any).start();
    const recorder = captureEvents(el, [...EVENTS]);

    (el as any).next();

    expect(recorder.types()).toContain('spotlight-target-missing');
    expect(recorder.types()).not.toContain('spotlight-end');
    expect(spotlightProblems(steps, 1)).toEqual([]);
  });
});
