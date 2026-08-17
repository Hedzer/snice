/**
 * snice-flip-card matrix — the control cross.
 *
 * The card has four documented ways to turn — `flip()`, `flipTo(side)`, a
 * pointer click, and Enter/Space — gated by `clickToFlip`. This file crosses
 * every entry point against both starting sides and both activation modes, and
 * asserts BOTH the resulting side and the `flip-change` payload each time: a
 * card that turns without telling its owner is as broken as one that will not
 * turn.
 */
import { describe, it, afterEach, expect } from 'vitest';
import { removeComponent } from '../../components/test-utils';
import {
  mountCard, flipProblems, combo, clickCard, pressCard, captureFlips,
  expectedSide, wait, DIRECTIONS,
} from './flip-card-support';

let el: any;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

describe('flip-card matrix: flip()', () => {
  for (const direction of DIRECTIONS) {
    for (const flipped of [false, true]) {
      it(`${direction}: flip() from the ${expectedSide(flipped)} face turns the card`, async () => {
        el = await mountCard(combo('flip', { direction, flipped }));
        const seen = captureFlips(el);
        el.flip();
        await wait(20);
        expect(el.flipped).toBe(!flipped);
        expect(seen).toEqual([{ flipped: !flipped, side: expectedSide(!flipped) }]);
        expect(flipProblems(el, combo('after flip', { direction, flipped: !flipped }),
          { fresh: false })).toEqual([]);
      });
    }
  }

  it('two flips return the card to where it started', async () => {
    el = await mountCard(combo('flip'));
    const seen = captureFlips(el);
    el.flip();
    await wait(20);
    el.flip();
    await wait(20);
    expect(el.flipped).toBe(false);
    expect(seen).toEqual([
      { flipped: true, side: 'back' },
      { flipped: false, side: 'front' },
    ]);
    expect(flipProblems(el, combo('round trip'), { fresh: false })).toEqual([]);
  });
});

describe('flip-card matrix: flipTo(side)', () => {
  const cases: Array<[boolean, 'front' | 'back']> = [
    [false, 'back'], [true, 'front'], [false, 'front'], [true, 'back'],
  ];
  for (const [flipped, side] of cases) {
    const changes = expectedSide(flipped) !== side;
    it(`flipTo("${side}") from the ${expectedSide(flipped)} face`
      + ` ${changes ? 'turns the card' : 'is a no-op'}`, async () => {
      el = await mountCard(combo('flipTo', { flipped }));
      const seen = captureFlips(el);
      el.flipTo(side);
      await wait(20);
      expect(el.flipped).toBe(side === 'back');
      // A change event announces a CHANGE: asking for the side already showing
      // has nothing to announce.
      expect(seen).toEqual(changes ? [{ flipped: side === 'back', side }] : []);
      expect(flipProblems(el, combo('after flipTo', { flipped: side === 'back' }),
        { fresh: false })).toEqual([]);
    });
  }
});

describe('flip-card matrix: the pointer path', () => {
  for (const flipped of [false, true]) {
    it(`click turns a clickable card from the ${expectedSide(flipped)} face`, async () => {
      el = await mountCard(combo('click', { flipped }));
      const seen = captureFlips(el);
      clickCard(el);
      await wait(20);
      expect(el.flipped).toBe(!flipped);
      expect(seen).toEqual([{ flipped: !flipped, side: expectedSide(!flipped) }]);
    });
  }

  it('click does nothing when click-to-flip is off', async () => {
    const c = combo('static', { clickToFlip: false });
    el = await mountCard(c);
    const seen = captureFlips(el);
    clickCard(el);
    await wait(20);
    expect(el.flipped).toBe(false);
    expect(seen).toEqual([]);
    expect(flipProblems(el, c)).toEqual([]);
  });

  it('a card with click-to-flip off can still be turned programmatically', async () => {
    el = await mountCard(combo('static', { clickToFlip: false }));
    const seen = captureFlips(el);
    el.flipTo('back');
    await wait(20);
    expect(el.flipped).toBe(true);
    expect(seen).toEqual([{ flipped: true, side: 'back' }]);
  });
});

describe('flip-card matrix: the keyboard path', () => {
  for (const key of ['Enter', ' ']) {
    it(`${key === ' ' ? 'Space' : key} turns a clickable card`, async () => {
      el = await mountCard(combo('key'));
      const seen = captureFlips(el);
      pressCard(el, key);
      await wait(20);
      expect(el.flipped).toBe(true);
      expect(seen).toEqual([{ flipped: true, side: 'back' }]);
    });

    it(`${key === ' ' ? 'Space' : key} does nothing when click-to-flip is off`, async () => {
      el = await mountCard(combo('key', { clickToFlip: false }));
      const seen = captureFlips(el);
      pressCard(el, key);
      await wait(20);
      expect(el.flipped).toBe(false);
      expect(seen).toEqual([]);
    });
  }

  it('an unrelated key leaves the card alone', async () => {
    el = await mountCard(combo('key'));
    const seen = captureFlips(el);
    pressCard(el, 'ArrowRight');
    pressCard(el, 'a');
    await wait(20);
    expect(el.flipped).toBe(false);
    expect(seen).toEqual([]);
  });
});

describe('flip-card matrix: the event escapes the shadow root', () => {
  it('flip-change bubbles to the document with the documented payload', async () => {
    el = await mountCard(combo('event'));
    const seen: any[] = [];
    document.addEventListener('flip-change', (event: Event) => {
      seen.push((event as CustomEvent).detail);
    }, { once: true });
    clickCard(el);
    await wait(20);
    expect(seen).toEqual([{ flipped: true, side: 'back' }]);
  });
});

describe('flip-card matrix: duration transitions', () => {
  it('a new duration reaches --flip-duration', async () => {
    el = await mountCard(combo('duration'));
    el.duration = 900;
    await wait(20);
    expect(flipProblems(el, combo('duration->900', { duration: 900 }), { fresh: false }))
      .toEqual([]);
    expect(el.style.getPropertyValue('--flip-duration').trim()).toBe('900ms');
  });

  it('duration changes do not disturb the side the card is showing', async () => {
    el = await mountCard(combo('duration', { flipped: true }));
    const seen = captureFlips(el);
    el.duration = 250;
    await wait(20);
    expect(el.flipped).toBe(true);
    expect(seen).toEqual([]);
  });
});
