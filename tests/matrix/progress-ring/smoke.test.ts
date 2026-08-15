/**
 * Smoke slice of the snice-progress-ring matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/progress-ring/, 91 combos) is
 * excluded from the default Vitest include and runs via `npm run test:matrix`.
 * This file lives at `smoke.test.ts` so it stays collected, and every
 * assertion routes through the matrix's own oracle.
 *
 * The marquee: the doc's own four examples (percentage, label, custom colour,
 * large + thick), the empty and full boundaries, and the one event.
 *
 * BUDGET: under 1s.
 */
import { describe, it, afterEach } from 'vitest';
import { Problems, captureEvents, expectClean, mount, removeComponent, wait } from '../matrix-kit';
import {
  checkColour, checkRing, fillPart, filledFraction, type RingCombo,
} from './progress-ring-support';
import '../../../packages/components/src/progress-ring/snice-progress-ring';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

async function mountRing(combo: RingCombo): Promise<HTMLElement> {
  const attrs: Record<string, string | number | boolean> = { value: combo.value, max: combo.max };
  if (combo.size) attrs.size = combo.size;
  if (combo.thickness !== undefined) attrs.thickness = combo.thickness;
  if (combo.showValue) attrs['show-value'] = true;
  if (combo.label) attrs.label = combo.label;
  if (combo.color) attrs.color = combo.color;
  el = await mount('snice-progress-ring', attrs);
  return el;
}

describe('progress-ring matrix smoke', () => {
  it('value="75" show-value renders the documented ring and percentage', async () => {
    const spec: RingCombo = { value: 75, max: 100, showValue: true };
    const problems = new Problems();
    checkRing(await mountRing(spec), spec, problems);
    expectClean(problems, 'smoke/percentage');
  });

  it('a label replaces the percentage as the centre text and the accessible name', async () => {
    const spec: RingCombo = { value: 60, max: 100, label: 'CPU' };
    const problems = new Problems();
    checkRing(await mountRing(spec), spec, problems);
    expectClean(problems, 'smoke/label');
  });

  it('a custom colour reaches the host, and size + thickness keep the geometry honest', async () => {
    const spec: RingCombo = {
      value: 50, max: 100, size: 'large', thickness: 6, showValue: true, color: '#10b981',
    };
    const problems = new Problems();
    const ring = await mountRing(spec);
    checkRing(ring, spec, problems);
    checkColour(ring, '#10b981', problems);
    expectClean(problems, 'smoke/colour');
  });

  it('the empty and full boundaries draw an empty and a full ring', async () => {
    const problems = new Problems();

    const empty: RingCombo = { value: 0, max: 100, showValue: true };
    checkRing(await mountRing(empty), empty, problems);
    problems.equal(filledFraction(fillPart(el!)!), 0, 'fill fraction at 0');
    removeComponent(el!);

    const full: RingCombo = { value: 100, max: 100, showValue: true };
    checkRing(await mountRing(full), full, problems);
    problems.equal(filledFraction(fillPart(el!)!), 1, 'fill fraction at max');

    expectClean(problems, 'smoke/boundaries');
  });

  it('reaching max emits progress-complete once, with the documented detail', async () => {
    const ring = await mountRing({ value: 0, max: 100, showValue: true });
    const problems = new Problems();
    const seen = captureEvents<{ value: number; max: number; component: unknown }>(ring, 'progress-complete');

    (ring as any).value = 50;
    await wait(20);
    problems.equal(seen.length, 0, 'progress-complete before max');

    (ring as any).value = 100;
    await wait(20);
    problems.equal(seen.length, 1, 'progress-complete count');
    if (seen.length === 1) {
      problems.equal(seen[0].value, 100, 'progress-complete value');
      problems.equal(seen[0].max, 100, 'progress-complete max');
      problems.check(seen[0].component === ring, 'progress-complete component');
    }

    expectClean(problems, 'smoke/complete');
  });
});
