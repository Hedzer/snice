/**
 * snice-login matrix — the SIGN-IN FLOW.
 *
 * The docs describe one request channel and four events, and a specific
 * relationship between them:
 *
 *   login-user  ->  sends LoginCredentials, expects LoginResult
 *   login-attempt { username, timestamp }
 *   login-success { timestamp }        when result.success
 *   login-error   { error, timestamp } when it is not
 *   login-forgot-password { timestamp }
 *
 * plus the four documented methods that drive a form from the outside —
 * `login(credentials?)`, `setCredentials(...)`, `reset()` — and the
 * accessibility promise that "Enter on the password field submits".
 *
 * The cross is over the ways a sign-in can START (button click, Enter on the
 * password field, `login()` called directly) times how it can END (success,
 * a failing result, a rejecting controller, missing credentials), because
 * that product is the whole of the component's application-facing contract.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { removeComponent, wait } from '../matrix-common';
import {
  alertElement, forgotLink, mountLogin, passwordInput, recordEvents,
  rememberInput, respondToLogin, submitButton, type, usernameInput,
} from './login-support';

let el: HTMLElement | null = null;
let stop: (() => void) | null = null;
afterEach(() => {
  stop?.(); stop = null;
  if (el) { removeComponent(el); el = null; }
});

/** The three documented ways a sign-in begins. */
const STARTS = {
  'button click': async (host: HTMLElement) => {
    submitButton(host)!.dispatchEvent(new MouseEvent('click', {
      bubbles: true, composed: true, cancelable: true,
    }));
  },
  'Enter on the password field': async (host: HTMLElement) => {
    passwordInput(host)!.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter', bubbles: true, composed: true, cancelable: true,
    }));
  },
  'form submit': async (host: HTMLElement) => {
    host.shadowRoot!.querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  },
};

/** The four documented ways it ends. */
const OUTCOMES = [
  {
    name: 'success',
    reply: () => ({ success: true, data: { token: 'abc' } }),
    expectSuccess: true,
    expectError: undefined as string | undefined,
  },
  {
    name: 'failure with a message',
    reply: () => ({ success: false, error: 'Invalid credentials' }),
    expectSuccess: false,
    expectError: 'Invalid credentials',
  },
  {
    name: 'failure with no message',
    reply: () => ({ success: false }),
    expectSuccess: false,
    expectError: 'Login failed',
  },
  {
    name: 'a controller that throws',
    reply: () => { throw new Error('network down'); },
    expectSuccess: false,
    expectError: 'network down',
  },
];

describe('login matrix: how a sign-in starts x how it ends', () => {
  for (const [startName, start] of Object.entries(STARTS)) {
    for (const outcome of OUTCOMES) {
      const id = `${startName} -> ${outcome.name}`;
      it(id, async () => {
        el = await mountLogin({});
        const events = recordEvents(el);
        const controller = respondToLogin(document, outcome.reply);
        stop = controller.stop;

        type(usernameInput(el), 'ada');
        type(passwordInput(el), 'hunter2');
        await start(el);
        await wait(80);

        // The request carried the documented LoginCredentials shape.
        expect(controller.payloads, `${id}: no login-user request was sent`)
          .toHaveLength(1);
        expect(controller.payloads[0]).toEqual({
          username: 'ada', password: 'hunter2', remember: false,
        });

        // login-attempt names the user and carries a timestamp.
        const attempts = events.of('login-attempt');
        expect(attempts, `${id}: no login-attempt`).toHaveLength(1);
        expect(attempts[0].username).toBe('ada');
        expect(typeof attempts[0].timestamp).toBe('string');

        if (outcome.expectSuccess) {
          expect(events.of('login-success'), `${id}: no login-success`).toHaveLength(1);
          expect(typeof events.of('login-success')[0].timestamp).toBe('string');
          expect(events.of('login-error'), `${id}: an error was announced too`).toHaveLength(0);
        } else {
          expect(events.of('login-error'), `${id}: no login-error`).toHaveLength(1);
          expect(events.of('login-error')[0].error).toBe(outcome.expectError);
          expect(typeof events.of('login-error')[0].timestamp).toBe('string');
          expect(events.of('login-success'), `${id}: a success was announced too`)
            .toHaveLength(0);
          // The failure is shown to the visitor, not only to the console.
          expect(alertElement(el)?.textContent?.trim()).toBe(outcome.expectError);
          expect(alertElement(el)?.getAttribute('variant')).toBe('error');
        }

        // Whatever happened, the form is usable again.
        expect((el as any).loading, `${id}: the form is still loading`).toBe(false);
      });
    }
  }
});

describe('login matrix: credentials', () => {
  it('the remember-me checkbox rides along in the request payload', async () => {
    el = await mountLogin({});
    const controller = respondToLogin(document, () => ({ success: true }));
    stop = controller.stop;

    type(usernameInput(el), 'ada');
    type(passwordInput(el), 'hunter2');
    rememberInput(el)!.checked = true;
    submitButton(el)!.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await wait(80);

    expect(controller.payloads[0]).toEqual({
      username: 'ada', password: 'hunter2', remember: true,
    });
  });

  it('setCredentials fills the form the request will read', async () => {
    el = await mountLogin({});
    const controller = respondToLogin(document, () => ({ success: true }));
    stop = controller.stop;

    (el as any).setCredentials({ username: 'grace', password: 'compiler', remember: true });
    await wait(20);
    expect(usernameInput(el)!.value).toBe('grace');
    expect(passwordInput(el)!.value).toBe('compiler');
    expect(rememberInput(el)!.checked).toBe(true);

    submitButton(el)!.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await wait(80);
    expect(controller.payloads[0]).toEqual({
      username: 'grace', password: 'compiler', remember: true,
    });
  });

  it('setCredentials sets only the fields it is given', async () => {
    el = await mountLogin({});
    (el as any).setCredentials({ username: 'grace', password: 'compiler' });
    await wait(20);
    (el as any).setCredentials({ username: 'ada' });
    await wait(20);
    expect(usernameInput(el)!.value).toBe('ada');
    expect(passwordInput(el)!.value, 'an unmentioned field was cleared').toBe('compiler');
  });

  it('clicking submit on an empty form sends nothing — the fields are required', async () => {
    // The documented accessibility claim: "Required fields carry `required`".
    // `requestSubmit()` runs constraint validation, so an empty form never
    // even reaches the component's own handler — the browser stops it first.
    el = await mountLogin({});
    const events = recordEvents(el);
    const controller = respondToLogin(document, () => ({ success: true }));
    stop = controller.stop;

    submitButton(el)!.dispatchEvent(new MouseEvent('click', {
      bubbles: true, composed: true, cancelable: true,
    }));
    await wait(80);

    expect(controller.payloads, 'empty credentials were sent to the controller').toEqual([]);
    expect(events.of('login-attempt'), 'an invalid form still announced an attempt')
      .toEqual([]);
    expect((el as any).loading, 'the form was left spinning').toBe(false);
  });

  it('a submit that bypasses validation is caught by the component\'s own guard', async () => {
    // The other half: a programmatic `submit` event skips constraint
    // validation, and the component still refuses to send incomplete
    // credentials — it shows the documented error instead.
    el = await mountLogin({});
    const controller = respondToLogin(document, () => ({ success: true }));
    stop = controller.stop;

    el.shadowRoot!.querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await wait(80);

    expect(controller.payloads, 'empty credentials were sent to the controller').toEqual([]);
    expect(alertElement(el)?.textContent?.trim())
      .toBe('Username and password are required');
    expect(alertElement(el)?.getAttribute('variant')).toBe('error');
  });

  it('a username with no password never reaches the controller', async () => {
    el = await mountLogin({});
    const controller = respondToLogin(document, () => ({ success: true }));
    stop = controller.stop;

    type(usernameInput(el), 'ada');
    el.shadowRoot!.querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await wait(80);

    expect(controller.payloads).toEqual([]);
    expect(alertElement(el)?.getAttribute('variant')).toBe('error');
  });

  it('login(credentials) sends exactly what it is handed', async () => {
    el = await mountLogin({});
    const controller = respondToLogin(document, () => ({ success: true, data: { token: 't' } }));
    stop = controller.stop;

    const result = await (el as any).login({
      username: 'ada', password: 'hunter2', remember: true,
    });
    expect(controller.payloads[0]).toEqual({
      username: 'ada', password: 'hunter2', remember: true,
    });
    expect(result).toEqual({ success: true, data: { token: 't' } });
  });

  it('login() with no argument reads the form', async () => {
    el = await mountLogin({});
    const controller = respondToLogin(document, () => ({ success: true }));
    stop = controller.stop;

    type(usernameInput(el), 'ada');
    type(passwordInput(el), 'hunter2');
    await (el as any).login();
    expect(controller.payloads[0]).toMatchObject({ username: 'ada', password: 'hunter2' });
  });

  it('login() with incomplete credentials resolves a failing LoginResult', async () => {
    el = await mountLogin({});
    const controller = respondToLogin(document, () => ({ success: true }));
    stop = controller.stop;

    const result = await (el as any).login({ username: 'ada', password: '' });
    expect(result).toEqual({
      success: false, error: 'Username and password are required',
    });
    expect(controller.payloads).toEqual([]);
  });
});

describe('login matrix: disabled and loading gate the flow', () => {
  for (const state of ['disabled', 'loading'] as const) {
    it(`a ${state} form does not submit`, async () => {
      el = await mountLogin({ [state]: true });
      const events = recordEvents(el);
      const controller = respondToLogin(document, () => ({ success: true }));
      stop = controller.stop;

      (el as any).setCredentials({ username: 'ada', password: 'hunter2' });
      el.shadowRoot!.querySelector('form')!
        .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await wait(60);

      expect(controller.payloads, `a ${state} form sent a request`).toEqual([]);
      expect(events.of('login-success')).toEqual([]);
      expect(events.of('login-error')).toEqual([]);
    });
  }

  it('Enter on the password field is inert while disabled', async () => {
    el = await mountLogin({ disabled: true });
    const controller = respondToLogin(document, () => ({ success: true }));
    stop = controller.stop;

    (el as any).setCredentials({ username: 'ada', password: 'hunter2' });
    passwordInput(el)!.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter', bubbles: true, composed: true, cancelable: true,
    }));
    await wait(60);
    expect(controller.payloads).toEqual([]);
  });

  it('a key that is not Enter never submits', async () => {
    el = await mountLogin({});
    const controller = respondToLogin(document, () => ({ success: true }));
    stop = controller.stop;

    (el as any).setCredentials({ username: 'ada', password: 'hunter2' });
    passwordInput(el)!.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'a', bubbles: true, composed: true, cancelable: true,
    }));
    await wait(60);
    expect(controller.payloads).toEqual([]);
  });
});

describe('login matrix: forgot password and reset', () => {
  it('the forgot-password link announces itself and does not navigate', async () => {
    el = await mountLogin({ showForgotPassword: true });
    const events = recordEvents(el);

    const event = new MouseEvent('click', {
      bubbles: true, composed: true, cancelable: true,
    });
    forgotLink(el)!.dispatchEvent(event);
    await wait(20);

    expect(events.of('login-forgot-password')).toHaveLength(1);
    expect(typeof events.of('login-forgot-password')[0].timestamp).toBe('string');
    expect(event.defaultPrevented, 'the link navigated away from the form').toBe(true);
  });

  it('reset() clears the form, the alert and the loading state', async () => {
    el = await mountLogin({});
    (el as any).setCredentials({ username: 'ada', password: 'hunter2', remember: true });
    (el as any).setError('Bad credentials');
    (el as any).loading = true;
    await wait(30);

    (el as any).reset();
    await wait(30);

    expect(usernameInput(el)!.value).toBe('');
    expect(passwordInput(el)!.value).toBe('');
    expect(rememberInput(el)!.checked).toBe(false);
    expect(alertElement(el)).toBeNull();
    expect((el as any).loading).toBe(false);
  });
});
