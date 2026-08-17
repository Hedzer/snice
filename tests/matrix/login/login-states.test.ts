/**
 * snice-login matrix — the STATE cross.
 *
 * `disabled` and `loading` are documented as independent switches, and the
 * accessibility section makes one specific promise about them: "Loading and
 * disabled states propagate to every input and the submit button." That is
 * four vectors, crossed against the three variants and against whether the
 * optional controls are present (because "every input" includes the
 * remember-me checkbox, which only exists sometimes).
 *
 * 4 x 3 x 2 = 24 combos, plus the inline-alert surface: `alertMessage` and
 * `alertVariant` are documented JS-only properties, and `showAlert` /
 * `clearAlert` / `setError` / `clearError` are the four documented methods
 * that drive them.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { expectClean, removeComponent, textOf, wait } from '../matrix-common';
import {
  ALERT_VARIANTS, VARIANTS, alertElement, checkLogin, comboId, mountLogin,
  passwordInput, rememberInput, submitButton, usernameInput,
  type AlertVariant, type LoginCombo, type LoginVariant,
} from './login-support';

let el: HTMLElement | null = null;
afterEach(() => { if (el) { removeComponent(el); el = null; } });

const STATE_COMBOS: LoginCombo[] = (() => {
  const out: LoginCombo[] = [];
  for (const disabled of [false, true]) {
    for (const loading of [false, true]) {
      for (const variant of VARIANTS as readonly LoginVariant[]) {
        for (const showRememberMe of [true, false]) {
          out.push({ disabled, loading, variant, showRememberMe });
        }
      }
    }
  }
  return out;
})();

describe('login matrix: disabled x loading x variant x remember-me', () => {
  for (const combo of STATE_COMBOS) {
    it(comboId(combo), async () => {
      el = await mountLogin(combo);
      expectClean(checkLogin(el, combo), comboId(combo));
    });
  }
});

describe('login matrix: the state switches are reactive', () => {
  it('turning loading on disables every input and marks the button', async () => {
    const combo: LoginCombo = {};
    el = await mountLogin(combo);
    expectClean(checkLogin(el, combo), 'idle');

    (el as any).loading = true;
    await wait(30);
    expectClean(checkLogin(el, { loading: true }), 'loading');
    expect(usernameInput(el)!.hasAttribute('disabled')).toBe(true);
    expect(passwordInput(el)!.hasAttribute('disabled')).toBe(true);
    expect(rememberInput(el)!.hasAttribute('disabled')).toBe(true);
    expect(submitButton(el)!.hasAttribute('loading')).toBe(true);
  });

  it('turning loading off restores every input', async () => {
    el = await mountLogin({ loading: true });
    (el as any).loading = false;
    await wait(30);
    expectClean(checkLogin(el, { loading: false }), 'loading off again');
  });

  it('disabled and loading are independent', async () => {
    el = await mountLogin({ disabled: true, loading: false });
    expect(submitButton(el)!.hasAttribute('disabled')).toBe(true);
    expect(submitButton(el)!.hasAttribute('loading')).toBe(false);

    (el as any).loading = true;
    await wait(30);
    expectClean(checkLogin(el, { disabled: true, loading: true }), 'both');
  });
});

describe('login matrix: the inline alert', () => {
  for (const variant of ALERT_VARIANTS as readonly AlertVariant[]) {
    it(`alertVariant=${variant || 'empty'} renders the message it is given`, async () => {
      const combo: LoginCombo = { alertMessage: 'Something happened', alertVariant: variant };
      el = await mountLogin(combo);
      expectClean(checkLogin(el, combo), comboId(combo) + `/alert=${variant || 'empty'}`);
    });
  }

  it('an empty alertMessage shows no alert at all', async () => {
    const combo: LoginCombo = { alertMessage: '', alertVariant: '' };
    el = await mountLogin(combo);
    expectClean(checkLogin(el, combo), 'no alert');
    expect(alertElement(el)).toBeNull();
  });

  it('showAlert(message, variant) is the general form', async () => {
    el = await mountLogin({});
    (el as any).showAlert('Welcome back', 'success');
    await wait(30);
    expectClean(
      checkLogin(el, { alertMessage: 'Welcome back', alertVariant: 'success' }),
      'showAlert success',
    );
  });

  it('setError(message) is the error-only shorthand', async () => {
    el = await mountLogin({});
    (el as any).setError('Bad credentials');
    await wait(30);
    expectClean(
      checkLogin(el, { alertMessage: 'Bad credentials', alertVariant: 'error' }),
      'setError',
    );
    expect(textOf(alertElement(el))).toBe('Bad credentials');
    expect(alertElement(el)!.getAttribute('variant')).toBe('error');
  });

  it('clearError removes the alert', async () => {
    el = await mountLogin({});
    (el as any).setError('Bad credentials');
    await wait(30);
    (el as any).clearError();
    await wait(30);
    expectClean(checkLogin(el, {}), 'clearError');
    expect(alertElement(el)).toBeNull();
  });

  it('clearAlert removes the alert whatever set it', async () => {
    el = await mountLogin({});
    (el as any).showAlert('Welcome back', 'success');
    await wait(30);
    (el as any).clearAlert();
    await wait(30);
    expect(alertElement(el)).toBeNull();
    expect((el as any).alertMessage).toBe('');
    expect((el as any).alertVariant).toBe('');
  });

  it('a later alert replaces the earlier one rather than stacking', async () => {
    el = await mountLogin({});
    (el as any).setError('First');
    await wait(30);
    (el as any).showAlert('Second', 'success');
    await wait(30);
    expect(el.shadowRoot!.querySelectorAll('snice-alert')).toHaveLength(1);
    expectClean(
      checkLogin(el, { alertMessage: 'Second', alertVariant: 'success' }),
      'alert replaced',
    );
  });
});
