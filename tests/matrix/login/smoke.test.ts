/**
 * Smoke slice of the snice-login matrix — the everyday-loop tier.
 *
 * The full matrix (tests/matrix/login: 48 structure combos, 36 state combos,
 * 12 start-x-outcome flow combos plus the credential and reset paths, and 13
 * slot combos) runs via `npm run test:matrix`. This file stays collected by
 * the default loop and pays for one combo per family:
 *
 *   · a default form, its five parts, its ten slots and every item on the
 *     documented accessibility list;
 *   · `variant` + `size` reaching the base, the only styling hook;
 *   · `loading`, the state that must reach every input AND the button;
 *   · a successful sign-in end to end — request payload, login-attempt,
 *     login-success;
 *   · a failed one — the error alert and login-error;
 *   · the forgot-password link, the component's other event.
 *
 * Every structural assertion routes through the matrix's own oracle.
 * BUDGET: under ~1s.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { expectClean, removeComponent, wait } from '../matrix-common';
import {
  alertElement, checkLogin, comboId, forgotLink, mountLogin, passwordInput,
  recordEvents, respondToLogin, submitButton, type, usernameInput,
  type LoginCombo,
} from './login-support';

let el: HTMLElement | null = null;
let stop: (() => void) | null = null;
afterEach(() => {
  stop?.(); stop = null;
  if (el) { removeComponent(el); el = null; }
});

describe('login matrix smoke', () => {
  it('a default form has its parts, slots, labels and autocomplete hints', async () => {
    const combo: LoginCombo = {};
    el = await mountLogin(combo);
    expectClean(checkLogin(el, combo), comboId(combo));
  });

  it('variant and size both reach the base element', async () => {
    const combo: LoginCombo = { variant: 'card', size: 'large' };
    el = await mountLogin(combo);
    expectClean(checkLogin(el, combo), comboId(combo));
  });

  it('loading reaches every input and the submit button', async () => {
    const combo: LoginCombo = { loading: true };
    el = await mountLogin(combo);
    expectClean(checkLogin(el, combo), comboId(combo));
    expect(usernameInput(el)!.hasAttribute('disabled')).toBe(true);
    expect(submitButton(el)!.hasAttribute('loading')).toBe(true);
  });

  it('a successful sign-in sends LoginCredentials and announces success', async () => {
    el = await mountLogin({});
    const events = recordEvents(el);
    const controller = respondToLogin(document, () => ({ success: true, data: { token: 't' } }));
    stop = controller.stop;

    type(usernameInput(el), 'ada');
    type(passwordInput(el), 'hunter2');
    submitButton(el)!.dispatchEvent(new MouseEvent('click', {
      bubbles: true, composed: true, cancelable: true,
    }));
    await wait(80);

    expect(controller.payloads[0])
      .toEqual({ username: 'ada', password: 'hunter2', remember: false });
    expect(events.of('login-attempt')[0].username).toBe('ada');
    expect(events.of('login-success')).toHaveLength(1);
  });

  it('a rejected sign-in shows the controller\'s error and announces it', async () => {
    el = await mountLogin({});
    const events = recordEvents(el);
    const controller = respondToLogin(document, () => ({
      success: false, error: 'Invalid credentials',
    }));
    stop = controller.stop;

    (el as any).setCredentials({ username: 'ada', password: 'wrong' });
    el.shadowRoot!.querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await wait(80);

    expect(events.of('login-error')[0].error).toBe('Invalid credentials');
    expect(alertElement(el)!.textContent!.trim()).toBe('Invalid credentials');
    expect(alertElement(el)!.getAttribute('variant')).toBe('error');
  });

  it('the forgot-password link announces itself and does not navigate', async () => {
    el = await mountLogin({});
    const events = recordEvents(el);
    const event = new MouseEvent('click', { bubbles: true, composed: true, cancelable: true });
    forgotLink(el)!.dispatchEvent(event);
    await wait(20);

    expect(events.of('login-forgot-password')).toHaveLength(1);
    expect(event.defaultPrevented).toBe(true);
  });
});
