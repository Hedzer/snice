/**
 * Matrix slice SPOTLIGHT / TOUR — the documented methods and the events they
 * emit, crossed with tour length and position within the tour.
 *
 * Dimensions (docs/ai/components/spotlight.md § Methods, § Events, § CSS Parts):
 *   tour length (1,2,3,5) x step index x navigation method (next / prev /
 *   goToStep / end / skip) — every reachable (length, index) pair is walked and
 *   judged by `spotlightProblems`.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mount, captureEvents, click, product } from '../matrix-utils';
import {
  POSITIONS, EVENTS, PARTS, tourSteps, mountTargets, cleanupSpotlight, read,
  actionNamed, spotlightProblems, expectedActions, expectedIndicator,
  type SpotlightStep,
} from './spotlight-support';

async function mountTour(steps: SpotlightStep[], targets = steps.length) {
  mountTargets(targets);
  return mount<HTMLElement>('snice-spotlight', {}, '', { steps });
}

describe('spotlight matrix: tour', () => {
  afterEach(() => cleanupSpotlight());

  // ── start() ──────────────────────────────────────────────────────────────

  for (const length of [1, 2, 3, 5]) {
    it(`start() opens the overlay at step 0 of ${length}`, async () => {
      const steps = tourSteps(length);
      const el = await mountTour(steps);
      const recorder = captureEvents(el, [...EVENTS]);

      (el as any).start();

      expect(recorder.types(), 'start() must announce itself').toContain('spotlight-start');
      expect(spotlightProblems(steps, 0), `length ${length}`).toEqual([]);
      expect(read().parts).toEqual([...PARTS]);
    });
  }

  it('start() with no steps starts nothing', async () => {
    const el = await mountTour([], 0);
    const recorder = captureEvents(el, [...EVENTS]);

    (el as any).start();

    expect(recorder.types()).toEqual([]);
    expect(read().present, 'an empty tour opened an overlay').toBe(false);
  });

  // ── next() walks the tour and ends it on the last step ───────────────────

  for (const length of [1, 2, 3, 5]) {
    it(`next() walks ${length} steps and then ends the tour`, async () => {
      const steps = tourSteps(length);
      const el = await mountTour(steps);
      (el as any).start();
      const recorder = captureEvents(el, [...EVENTS]);

      for (let index = 1; index < length; index++) {
        (el as any).next();
        expect(spotlightProblems(steps, index), `at step ${index}`).toEqual([]);
        expect(recorder.events.at(-1), `step ${index} event`)
          .toEqual({ type: 'spotlight-step', detail: { index, step: steps[index] } });
      }

      // One more `next()` on the last step: "ends tour if on last step".
      (el as any).next();

      expect(recorder.types().at(-1), 'next() on the last step did not end the tour')
        .toBe('spotlight-end');
      expect(spotlightProblems(steps, -1)).toEqual([]);
    });
  }

  // ── prev() ───────────────────────────────────────────────────────────────

  for (const length of [2, 3, 5]) {
    it(`prev() walks back through ${length} steps and stops at the first`, async () => {
      const steps = tourSteps(length);
      const el = await mountTour(steps);
      (el as any).start();
      for (let i = 1; i < length; i++) (el as any).next();
      expect(spotlightProblems(steps, length - 1)).toEqual([]);

      const recorder = captureEvents(el, [...EVENTS]);
      for (let index = length - 2; index >= 0; index--) {
        (el as any).prev();
        expect(spotlightProblems(steps, index), `back to step ${index}`).toEqual([]);
        expect(recorder.events.at(-1)!.detail).toEqual({ index, step: steps[index] });
      }

      // At step 0 there is no previous step to go back to.
      const before = recorder.events.length;
      (el as any).prev();
      expect(recorder.events.length, 'prev() moved past the first step').toBe(before);
      expect(spotlightProblems(steps, 0)).toEqual([]);
    });
  }

  // ── goToStep() ───────────────────────────────────────────────────────────

  for (const point of product({ length: [3, 5], index: [0, 1, 2] })) {
    const id = `goToStep(${point.index}) in a ${point.length}-step tour`;

    it(id, async () => {
      const steps = tourSteps(point.length);
      const el = await mountTour(steps);
      (el as any).start();
      const recorder = captureEvents(el, [...EVENTS]);

      (el as any).goToStep(point.index);

      expect(recorder.events.at(-1), id)
        .toEqual({ type: 'spotlight-step', detail: { index: point.index, step: steps[point.index] } });
      expect(spotlightProblems(steps, point.index), id).toEqual([]);
    });
  }

  for (const index of [-1, -5, 3, 99]) {
    it(`goToStep(${index}) is out of range and does nothing`, async () => {
      const steps = tourSteps(3);
      const el = await mountTour(steps);
      (el as any).start();
      const recorder = captureEvents(el, [...EVENTS]);

      (el as any).goToStep(index);

      expect(recorder.types(), `goToStep(${index}) moved the tour`).toEqual([]);
      expect(spotlightProblems(steps, 0)).toEqual([]);
    });
  }

  it('goToStep() opens the overlay on a tour that has not started', async () => {
    // "Jump to specific step" is unconditional — the doc does not make it
    // depend on `start()` having run first.
    const steps = tourSteps(3);
    const el = await mountTour(steps);
    const recorder = captureEvents(el, [...EVENTS]);

    (el as any).goToStep(2);

    expect(recorder.events.at(-1)!.detail).toEqual({ index: 2, step: steps[2] });
    expect(spotlightProblems(steps, 2)).toEqual([]);
  });

  // ── end() ────────────────────────────────────────────────────────────────

  for (const length of [1, 3]) {
    it(`end() closes a ${length}-step tour and removes the overlay`, async () => {
      const steps = tourSteps(length);
      const el = await mountTour(steps);
      (el as any).start();
      const recorder = captureEvents(el, [...EVENTS]);

      (el as any).end();

      expect(recorder.types()).toEqual(['spotlight-end']);
      expect(spotlightProblems(steps, -1)).toEqual([]);
      expect(read().present, 'the overlay portal outlived the tour').toBe(false);
    });
  }

  // ── Skipping ─────────────────────────────────────────────────────────────

  for (const index of [0, 1, 2]) {
    it(`the Skip button at step ${index} reports that index and ends the tour`, async () => {
      const steps = tourSteps(3);
      const el = await mountTour(steps);
      (el as any).start();
      (el as any).goToStep(index);
      const recorder = captureEvents(el, [...EVENTS]);

      click(actionNamed('Skip'));

      expect(recorder.types(), 'skip must report, then end').toEqual(['spotlight-skip', 'spotlight-end']);
      expect(recorder.events[0].detail).toEqual({ index });
      expect(read().present).toBe(false);
    });
  }

  it('clicking the backdrop skips the tour', async () => {
    const steps = tourSteps(3);
    const el = await mountTour(steps);
    (el as any).start();
    (el as any).goToStep(1);
    const recorder = captureEvents(el, [...EVENTS]);

    click(read().backdrop);

    expect(recorder.types()).toEqual(['spotlight-skip', 'spotlight-end']);
    expect(recorder.events[0].detail).toEqual({ index: 1 });
  });

  // ── The popover's navigation buttons ─────────────────────────────────────

  for (const point of product({ length: [1, 2, 3], index: [0, 1, 2] })) {
    if (point.index >= point.length) continue;
    const id = `step ${point.index} of ${point.length} offers ${expectedActions(point.index, point.length).join('/')}`;

    it(id, async () => {
      const steps = tourSteps(point.length);
      const el = await mountTour(steps);
      (el as any).start();
      (el as any).goToStep(point.index);

      expect(read().actions, id).toEqual(expectedActions(point.index, point.length));
      expect(read().indicator, id).toBe(expectedIndicator(point.index, point.length));
      expect(spotlightProblems(steps, point.index), id).toEqual([]);
    });
  }

  it('the Next button advances and the Back button retreats', async () => {
    const steps = tourSteps(3);
    const el = await mountTour(steps);
    (el as any).start();
    const recorder = captureEvents(el, [...EVENTS]);

    click(actionNamed('Next'));
    expect(spotlightProblems(steps, 1)).toEqual([]);

    click(actionNamed('Back'));
    expect(spotlightProblems(steps, 0)).toEqual([]);

    expect(recorder.events.map(e => e.detail))
      .toEqual([{ index: 1, step: steps[1] }, { index: 0, step: steps[0] }]);
  });

  it('the Done button on the last step ends the tour', async () => {
    const steps = tourSteps(2);
    const el = await mountTour(steps);
    (el as any).start();
    (el as any).next();
    const recorder = captureEvents(el, [...EVENTS]);

    click(actionNamed('Done'));

    expect(recorder.types()).toEqual(['spotlight-end']);
    expect(read().present).toBe(false);
  });

  // ── Every documented position value is accepted ──────────────────────────

  for (const position of POSITIONS) {
    it(`position="${position}" renders the step normally`, async () => {
      // The DOM tier owns "the step still renders"; where the popover LANDS is
      // geometry, and belongs to the visual tier.
      const steps = tourSteps(2, position);
      const el = await mountTour(steps);
      (el as any).start();
      expect(spotlightProblems(steps, 0), position).toEqual([]);
      (el as any).next();
      expect(spotlightProblems(steps, 1), position).toEqual([]);
    });
  }

  // ── Restarting ───────────────────────────────────────────────────────────

  it('a tour can be started again after it ends', async () => {
    const steps = tourSteps(3);
    const el = await mountTour(steps);
    (el as any).start();
    (el as any).end();
    const recorder = captureEvents(el, [...EVENTS]);

    (el as any).start();

    expect(recorder.types()).toContain('spotlight-start');
    expect(spotlightProblems(steps, 0)).toEqual([]);
    expect(document.querySelectorAll('[data-snice-spotlight-portal]'),
      'restarting left a second overlay behind').toHaveLength(1);
  });
});
