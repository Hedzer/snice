/**
 * Smoke slice of the snice-flip-card matrix — the everyday-loop tier.
 *
 * One case per documented feature family: the two faces and their slots, the
 * flipped attribute the transform selects on, the vertical direction, the four
 * control paths and the duration hook. Every assertion routes through the
 * matrix's own oracle, so this file cannot drift into something weaker than the
 * suite it stands in for. Budget: well under 1s.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  mountCard, flipProblems, combo, clickCard, pressCard, captureFlips, wait,
} from './flip-card-support';

let el: any;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

describe('flip-card matrix smoke', () => {
  it('a default card shows its front face and projects both slots', async () => {
    const c = combo('smoke');
    el = await mountCard(c);
    expect(flipProblems(el, c)).toEqual([]);
  });

  it('a flipped card carries the attribute its transform selects on', async () => {
    const c = combo('smoke', { flipped: true });
    el = await mountCard(c);
    expect(flipProblems(el, c)).toEqual([]);
  });

  it('a vertical card reflects its direction', async () => {
    const c = combo('smoke', { direction: 'vertical', duration: 250 });
    el = await mountCard(c);
    expect(flipProblems(el, c)).toEqual([]);
  });

  it('click-to-flip off leaves the card out of the tab order', async () => {
    const c = combo('smoke', { clickToFlip: false });
    el = await mountCard(c);
    expect(flipProblems(el, c)).toEqual([]);
  });

  it('flip() turns the card and announces the new side', async () => {
    el = await mountCard(combo('smoke'));
    const seen = captureFlips(el);
    el.flip();
    await wait(20);
    expect(seen).toEqual([{ flipped: true, side: 'back' }]);
    expect(flipProblems(el, combo('smoke', { flipped: true }), { fresh: false })).toEqual([]);
  });

  it('flipTo the side already showing announces nothing', async () => {
    el = await mountCard(combo('smoke'));
    const seen = captureFlips(el);
    el.flipTo('front');
    await wait(20);
    expect(seen).toEqual([]);
  });

  it('click and Enter both turn a clickable card', async () => {
    el = await mountCard(combo('smoke'));
    const seen = captureFlips(el);
    clickCard(el);
    await wait(20);
    pressCard(el, 'Enter');
    await wait(20);
    expect(seen).toEqual([
      { flipped: true, side: 'back' },
      { flipped: false, side: 'front' },
    ]);
  });

  it('a new duration reaches --flip-duration', async () => {
    el = await mountCard(combo('smoke'));
    el.duration = 900;
    await wait(20);
    expect(el.style.getPropertyValue('--flip-duration').trim()).toBe('900ms');
  });
});
