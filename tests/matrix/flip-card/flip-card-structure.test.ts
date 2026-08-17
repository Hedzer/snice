/**
 * snice-flip-card matrix — the generated cross.
 *
 * direction x flipped x clickToFlip x duration — 24 combos — with the slot-fill
 * states rotated across them. Every combo is judged by the shared oracle in
 * flip-card-support.ts, which encodes docs/ai/components/flip-card.md and the
 * documented reflection rules — never observed output.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  generateCombos, mountCard, expectCard, flipProblems, combo,
  DIRECTIONS, DURATIONS,
} from './flip-card-support';

let el: any;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const combos = generateCombos();

describe('flip-card matrix: generated cross', () => {
  for (const c of combos) {
    it(c.id, async () => {
      el = await mountCard(c);
      expectCard(el, c);
    });
  }
});

describe('flip-card matrix: the cross is what it claims to be', () => {
  it('covers every direction, side, activation mode and duration', () => {
    const seen = new Set(combos.map(c =>
      `${c.direction}/${c.flipped}/${c.clickToFlip}/${c.duration}`));
    const want = DIRECTIONS.length * 2 * 2 * DURATIONS.length;
    expect(combos.length).toBe(want);
    expect(seen.size).toBe(want);
  });

  it('rotates the slot-fill states in', () => {
    expect(combos.some(c => c.slots.front && c.slots.back), 'both faces are never filled').toBe(true);
    expect(combos.some(c => !c.slots.back), 'a missing back face is never exercised').toBe(true);
    expect(combos.some(c => !c.slots.front), 'a missing front face is never exercised').toBe(true);
  });
});

describe('flip-card matrix: the documented markup channel', () => {
  it('<snice-flip-card direction="vertical"> arrives as the vertical flip', async () => {
    el = document.createElement('snice-flip-card');
    el.setAttribute('direction', 'vertical');
    el.innerHTML = '<div slot="front">F</div><div slot="back">B</div>';
    document.body.appendChild(el);
    await el.ready;
    await new Promise(r => setTimeout(r, 20));
    expect(el.direction).toBe('vertical');
    expect(flipProblems(el, combo('markup', { direction: 'vertical' }), { fresh: false }))
      .toEqual([]);
  });

  // docs/ai/properties.md: `<element enabled="false">` -> false. The documented
  // attribute name is spelled out in the Properties block as `click-to-flip`.
  it('<snice-flip-card click-to-flip="false"> leaves the tab order', async () => {
    el = document.createElement('snice-flip-card');
    el.setAttribute('click-to-flip', 'false');
    el.innerHTML = '<div slot="front">F</div><div slot="back">B</div>';
    document.body.appendChild(el);
    await el.ready;
    await new Promise(r => setTimeout(r, 20));
    expect(el.clickToFlip).toBe(false);
    expect(flipProblems(el, combo('markup', { clickToFlip: false }), { fresh: false }))
      .toEqual([]);
  });

  it('<snice-flip-card flipped> starts on its back face', async () => {
    el = document.createElement('snice-flip-card');
    el.setAttribute('flipped', '');
    el.innerHTML = '<div slot="front">F</div><div slot="back">B</div>';
    document.body.appendChild(el);
    await el.ready;
    await new Promise(r => setTimeout(r, 20));
    expect(el.flipped).toBe(true);
    expect(flipProblems(el, combo('markup', { flipped: true }), { fresh: false })).toEqual([]);
  });
});

describe('flip-card matrix: the oracle is not vacuous', () => {
  it('rejects a card whose flipped state never reached the host', async () => {
    el = await mountCard(combo('probe', {}));
    const problems = flipProblems(el, combo('probe', { flipped: true }));
    expect(problems.length, 'oracle accepted a front-facing card documented as flipped')
      .toBeGreaterThan(0);
  });

  it('rejects a card that kept its tab stop with click-to-flip off', async () => {
    el = await mountCard(combo('probe', {}));
    const problems = flipProblems(el, combo('probe', { clickToFlip: false }));
    expect(problems.length, 'oracle accepted a tab stop on a non-interactive card')
      .toBeGreaterThan(0);
  });
});
