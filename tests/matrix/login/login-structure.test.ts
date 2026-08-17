/**
 * snice-login matrix — the STRUCTURE cross.
 *
 * The four properties that decide what a signed-out visitor sees:
 *
 *   · `variant` (3) and `size` (3) — the documented layout enumerations, both
 *     of which must reach the base element or their stylesheets never apply;
 *   · `showRememberMe` (2) and `showForgotPassword` (2) — the two optional
 *     controls, whose four vectors also cover the case where the options row
 *     has nothing left to hold.
 *
 * 3 x 3 x 2 x 2 = 36 combos, each judged by the shared oracle, which also
 * re-checks the accessibility list the docs publish (labels, autocomplete,
 * required) on every one of them.
 */
import { describe, it, afterEach } from 'vitest';
import { expectClean, removeComponent } from '../matrix-common';
import {
  SIZES, VARIANTS, checkLogin, comboId, mountLogin,
  type LoginCombo, type LoginSize, type LoginVariant,
} from './login-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const COMBOS: LoginCombo[] = (() => {
  const out: LoginCombo[] = [];
  for (const variant of VARIANTS as readonly LoginVariant[]) {
    for (const size of SIZES as readonly LoginSize[]) {
      for (const showRememberMe of [true, false]) {
        for (const showForgotPassword of [true, false]) {
          out.push({ variant, size, showRememberMe, showForgotPassword });
        }
      }
    }
  }
  return out;
})();

describe('login matrix: variant x size x remember-me x forgot-password', () => {
  for (const combo of COMBOS) {
    it(comboId(combo), async () => {
      el = await mountLogin(combo);
      expectClean(checkLogin(el, combo), comboId(combo));
    });
  }
});

describe('login matrix: the two documented text properties', () => {
  const TEXTS = [
    { title: 'Sign In', actionText: 'Sign In' },
    { title: 'Welcome', actionText: 'Continue' },
    { title: '', actionText: '' },
    { title: 'Sign in to Acme Corp', actionText: 'Log me in' },
  ];
  for (const text of TEXTS) {
    for (const variant of VARIANTS as readonly LoginVariant[]) {
      const combo: LoginCombo = { ...text, variant };
      it(comboId(combo), async () => {
        el = await mountLogin(combo);
        expectClean(checkLogin(el, combo), comboId(combo));
      });
    }
  }
});
