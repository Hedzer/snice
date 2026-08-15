/**
 * snice-progress-ring feature-combination matrix.
 *
 * Dimensions (docs/ai/components/progress-ring.md + the .types.ts contract):
 *
 *   value x showValue x label         5 x 2 x 2 = 20  centre + a11y text
 *   value x max x thickness           5 x 3 x 3 = 45  ring geometry
 *   size x value                      3 x 4     = 12  size is presentation only
 *   colour                                        4   custom ring colour
 *   progress-complete                             7   the one event
 *   out-of-range input                            4   safety of a determinate ring
 *                                              ──────────────────────────────
 *                                                 92 combos
 *
 * `size` is documented as presentation only, so it is crossed against the value
 * scale precisely to assert that it changes NOTHING measurable in the DOM; its
 * paint is the visual tier's job (tests/live/matrix/progress-ring/).
 *
 * Sized to the component: a progress ring is two circles, one centre label and
 * one event. Ninety combos exhaust that surface; the table's thousand would be
 * padding.
 */
import { describe, it, afterEach } from 'vitest';
import { Problems, captureEvents, cross, expectClean, mount, removeComponent, wait } from '../matrix-kit';
import {
  LABELS, MAXES, SIZES, THICKNESSES, VALUES,
  checkColour, checkRing, fillPart, filledFraction, percentOf, valuePart,
  type ProgressRingSize, type RingCombo,
} from './progress-ring-support';
import '../../../packages/components/src/progress-ring/snice-progress-ring';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

/**
 * Mount through the ATTRIBUTE channel, which is how every documented example
 * writes a ring (`<snice-progress-ring value="75" show-value>`), so each combo
 * really crosses the declared converters — including the kebab-cased
 * `show-value`.
 */
async function mountRing(combo: RingCombo): Promise<HTMLElement> {
  const attrs: Record<string, string | number | boolean> = {
    value: combo.value,
    max: combo.max,
  };
  if (combo.size) attrs.size = combo.size;
  if (combo.thickness !== undefined) attrs.thickness = combo.thickness;
  if (combo.showValue) attrs['show-value'] = true;
  if (combo.label) attrs.label = combo.label;
  if (combo.color) attrs.color = combo.color;
  el = await mount('snice-progress-ring', attrs);
  return el;
}

// ── Centre text and the accessible name ─────────────────────────────────────

describe('progress-ring matrix: centre and a11y', () => {
  for (const combo of cross({ value: VALUES, showValue: [false, true], label: LABELS })) {
    it(combo.id, async () => {
      const spec: RingCombo = {
        value: combo.value, max: 100, showValue: combo.showValue, label: combo.label,
      };
      const ring = await mountRing(spec);
      const problems = new Problems();

      checkRing(ring, spec, problems);

      expectClean(problems, combo.id);
    });
  }
});

// ── Ring geometry: value x max x thickness ──────────────────────────────────

describe('progress-ring matrix: ring geometry', () => {
  for (const combo of cross({ value: VALUES, max: MAXES, thickness: THICKNESSES })) {
    it(combo.id, async () => {
      // `value` is documented as 0..max, so a value above max is clamped by the
      // percentage the ring draws — the oracle handles that, and the assertion
      // stays the documented one.
      const spec: RingCombo = {
        value: combo.value, max: combo.max, thickness: combo.thickness, showValue: true,
      };
      const ring = await mountRing(spec);
      const problems = new Problems();

      checkRing(ring, spec, problems);

      // A thicker ring draws on a SMALLER circle (the stroke is centred on the
      // radius and must stay inside the viewBox), so the circumference the dash
      // geometry is expressed in has to move with `thickness`.
      const radius = parseFloat(fillPart(ring)!.getAttribute('r') ?? 'NaN');
      const dasharray = parseFloat(fillPart(ring)!.getAttribute('stroke-dasharray') ?? 'NaN');
      problems.check(
        Math.abs(dasharray - 2 * Math.PI * radius) < 0.01,
        `stroke-dasharray ${dasharray} is not the circumference of radius ${radius}`,
      );
      problems.check(radius > 0, `radius ${radius} is not drawable`);

      expectClean(problems, combo.id);
    });
  }
});

// ── Size: presentation only ─────────────────────────────────────────────────

describe('progress-ring matrix: size', () => {
  for (const combo of cross({ size: SIZES, value: [0, 50, 99, 100] as const })) {
    it(combo.id, async () => {
      const spec: RingCombo = {
        value: combo.value, max: 100, size: combo.size as ProgressRingSize, showValue: true,
      };
      const ring = await mountRing(spec);
      const problems = new Problems();

      checkRing(ring, spec, problems);
      // Documented as a size, i.e. a CSS concern: the attribute must reach the
      // host (that is the only channel the stylesheet can read) and must not
      // change the geometry the ring reports.
      problems.equal(ring.getAttribute('size'), combo.size, 'size attribute');
      const fraction = filledFraction(fillPart(ring)!)!;
      const expected = percentOf(combo.value, 100) / 100;
      problems.check(
        Math.abs(fraction - expected) < 1e-9,
        `size="${combo.size}" changed the fill fraction: ${fraction} != ${expected}`,
      );

      expectClean(problems, combo.id);
    });
  }
});

// ── The custom ring colour ──────────────────────────────────────────────────

describe('progress-ring matrix: colour', () => {
  const COLOURS = ['', '#10b981', 'rgb(220, 38, 38)', 'var(--brand)'] as const;

  for (const combo of cross({ color: COLOURS })) {
    it(combo.id, async () => {
      const spec: RingCombo = { value: 60, max: 100, showValue: true, color: combo.color };
      const ring = await mountRing(spec);
      const problems = new Problems();

      checkRing(ring, spec, problems);
      checkColour(ring, combo.color, problems);

      // Clearing the colour must release the override, not leave it pinned.
      (ring as any).color = '';
      await wait(30);
      checkColour(ring, '', problems);

      expectClean(problems, combo.id);
    });
  }
});

// ── progress-complete ───────────────────────────────────────────────────────

describe('progress-ring matrix: progress-complete', () => {
  for (const combo of cross({ max: MAXES })) {
    it(`${combo.id}/reaches-max`, async () => {
      const ring = await mountRing({ value: 0, max: combo.max, showValue: true });
      const problems = new Problems();
      const seen = captureEvents<{ value: number; max: number; component: unknown }>(ring, 'progress-complete');

      // Climbing to just under max announces nothing…
      (ring as any).value = combo.max / 2;
      await wait(30);
      problems.equal(seen.length, 0, 'progress-complete before reaching max');

      // …and reaching it announces exactly once, with the documented detail.
      (ring as any).value = combo.max;
      await wait(30);
      problems.equal(seen.length, 1, 'progress-complete on reaching max');
      if (seen.length === 1) {
        problems.equal(seen[0].value, combo.max, 'progress-complete value');
        problems.equal(seen[0].max, combo.max, 'progress-complete max');
        problems.check(seen[0].component === ring, 'progress-complete carried a different component');
      }

      // The ring is full, and says so.
      problems.equal(filledFraction(fillPart(ring)!), 1, 'fill fraction at max');
      problems.equal((valuePart(ring)?.textContent ?? '').trim(), '100%', 'percentage at max');

      expectClean(problems, `${combo.id}/reaches-max`);
    });
  }

  it('a ring that is already at max on mount does not announce a completion nobody caused', async () => {
    const problems = new Problems();
    const seen: unknown[] = [];
    document.addEventListener('progress-complete', event => seen.push(event));
    const ring = await mountRing({ value: 100, max: 100, showValue: true });
    await wait(30);
    document.removeEventListener('progress-complete', event => seen.push(event));

    problems.equal(seen.length, 0, 'progress-complete events from the initial value');
    problems.equal(filledFraction(fillPart(ring)!), 1, 'fill fraction at mount');
    expectClean(problems, 'complete-on-mount');
  });

  it('dropping back below max re-arms the completion', async () => {
    const ring = await mountRing({ value: 0, max: 100, showValue: true });
    const problems = new Problems();
    const seen = captureEvents(ring, 'progress-complete');

    (ring as any).value = 100;
    await wait(30);
    (ring as any).value = 40;
    await wait(30);
    (ring as any).value = 100;
    await wait(30);

    problems.equal(seen.length, 2, 'progress-complete count across two climbs');
    expectClean(problems, 'complete-rearm');
  });

  it('staying at max does not announce a second completion', async () => {
    const ring = await mountRing({ value: 0, max: 100, showValue: true });
    const problems = new Problems();
    const seen = captureEvents(ring, 'progress-complete');

    (ring as any).value = 100;
    await wait(30);
    (ring as any).value = 100;
    await wait(30);

    problems.equal(seen.length, 1, 'progress-complete count while pinned at max');
    expectClean(problems, 'complete-once');
  });
});

// ── Out-of-range input ──────────────────────────────────────────────────────
//
// The doc's range is "0 to max". Outside it a DETERMINATE ring still may not
// draw an impossible arc, and its percentage may not read past 100%.

describe('progress-ring matrix: out of range', () => {
  const CASES: RingCombo[] = [
    { value: 150, max: 100, showValue: true },
    { value: -20, max: 100, showValue: true },
    { value: 0, max: 0, showValue: true },
    { value: 5, max: 0, showValue: true },
  ];

  for (const spec of CASES) {
    it(`value=${spec.value}/max=${spec.max}`, async () => {
      const ring = await mountRing(spec);
      const problems = new Problems();

      checkRing(ring, spec, problems);

      expectClean(problems, `value=${spec.value}/max=${spec.max}`);
    });
  }
});
