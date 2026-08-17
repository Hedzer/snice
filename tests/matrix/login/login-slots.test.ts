/**
 * snice-login matrix — the SLOT cross.
 *
 * Ten slots are documented, and each is an insertion point a consumer builds
 * a real sign-in page out of:
 *
 *   before-header, after-header, subtitle, before-form, after-form,
 *   form-top, between-fields, before-submit, after-submit, footer
 *
 * Every one is asserted twice — once alone (the slot exists, and content named
 * for it is assigned to it) and once with all ten filled at the same time,
 * which is the arrangement a real page uses and the one where a mis-named slot
 * shows up as content landing in the wrong place.
 *
 * `subtitle` gets its own case because it is the only slot the docs give a
 * FALLBACK ("Enter your credentials to continue"), so it has two states rather
 * than one.
 *
 * happy-dom assigns every light-DOM child to the default slot regardless of
 * its `slot` attribute, so ASSIGNMENT itself is the visual tier's job (see
 * tests/live/matrix/login/). What this file owns is that the named slots exist
 * at all and that the content survives into the light DOM addressed by name.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { expectClean, removeComponent, shadow, textOf } from '../matrix-common';
import { SLOTS, checkLogin, mountLogin, type LoginCombo } from './login-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const content = (name: string) => `<div slot="${name}" id="in-${name}">${name} content</div>`;

describe('login matrix: each documented slot, one at a time', () => {
  for (const name of SLOTS) {
    it(`slot="${name}"`, async () => {
      const combo: LoginCombo = {};
      el = await mountLogin(combo, { html: content(name) });
      expectClean(checkLogin(el, combo), `slot=${name}`);

      const slot = shadow(el).querySelector(`slot[name="${name}"]`);
      expect(slot, `no slot[name="${name}"] to receive the content`).not.toBeNull();
      const projected = el.querySelector(`#in-${name}`);
      expect(projected, `the content named for "${name}" left the light DOM`).not.toBeNull();
      expect(projected!.getAttribute('slot')).toBe(name);
    });
  }
});

describe('login matrix: all ten slots at once', () => {
  it('every slot keeps its own content', async () => {
    const combo: LoginCombo = {};
    el = await mountLogin(combo, { html: SLOTS.map(content).join('') });
    expectClean(checkLogin(el, combo), 'all slots');

    for (const name of SLOTS) {
      const projected = el.querySelector(`#in-${name}`);
      expect(projected, `"${name}" content disappeared`).not.toBeNull();
      expect(textOf(projected)).toBe(`${name} content`);
    }
    // One slot element per documented name — a duplicate would make projection
    // ambiguous.
    for (const name of SLOTS) {
      expect(
        shadow(el).querySelectorAll(`slot[name="${name}"]`).length,
        `slot[name="${name}"] is declared more than once`,
      ).toBe(1);
    }
  });
});

describe('login matrix: the subtitle slot and its documented fallback', () => {
  it('an unfilled subtitle shows the built-in copy', async () => {
    const combo: LoginCombo = {};
    el = await mountLogin(combo);
    expectClean(checkLogin(el, combo), 'subtitle fallback');
    const fallback = shadow(el).querySelector('.login__subtitle');
    expect(fallback, 'no fallback subtitle').not.toBeNull();
    expect(textOf(fallback)).toBe('Enter your credentials to continue');
  });

  it('a filled subtitle still declares the slot that holds it', async () => {
    const combo: LoginCombo = {};
    el = await mountLogin(combo, { html: '<p slot="subtitle" id="mine">Please sign in</p>' });
    expectClean(checkLogin(el, combo), 'subtitle filled');
    expect(shadow(el).querySelector('slot[name="subtitle"]')).not.toBeNull();
    expect(textOf(el.querySelector('#mine'))).toBe('Please sign in');
  });
});
