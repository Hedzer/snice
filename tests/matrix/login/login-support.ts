/**
 * ════════════════════════════════════════════════════════════════════════════
 *  Oracle for the <snice-login> feature matrix
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Every expectation is read off `docs/ai/components/login.md` and
 * `snice-login.types.ts`, never off rendered output (`.ai/fuzzing.md`):
 *
 *   variant: 'default'|'card'|'minimal' = 'default'
 *   size: 'small'|'medium'|'large' = 'medium'
 *   title = 'Sign In'
 *   disabled = false, loading = false
 *   showRememberMe = true      attr show-remember-me
 *   showForgotPassword = true  attr show-forgot-password
 *   actionText = 'Sign In'     attr action-text
 *   alertMessage = ''          JS only; inline alert above the form
 *   alertVariant: 'error'|'success'|'' = ''
 *
 *   Requests: login-user -> LoginCredentials, expects LoginResult
 *   Events:   login-attempt { username, timestamp }
 *             login-success { timestamp }
 *             login-error   { error, timestamp }
 *             login-forgot-password { timestamp }
 *   Methods:  login(credentials?), setCredentials(...), reset(), setError(m),
 *             clearError(), showAlert(m, variant), clearAlert()
 *   Parts:    base, header, title, form, footer
 *   Slots:    before-header, after-header, subtitle, before-form, after-form,
 *             form-top, between-fields, before-submit, after-submit, footer
 *
 *   Accessibility (the doc's own list, each item an assertion below):
 *     · inputs use `<label for>`; `autocomplete="username"` /
 *       `"current-password"`
 *     · required fields carry `required`
 *     · Enter on the password field submits
 *     · loading and disabled states propagate to EVERY input and the submit
 *       button
 */
import { Problems, mount, shadow, textOf, wait } from '../matrix-common';
import { exactPart } from '../part-exact';
import '../../../packages/components/src/login/snice-login';

export const VARIANTS = ['default', 'card', 'minimal'] as const;
export const SIZES = ['small', 'medium', 'large'] as const;
export const ALERT_VARIANTS = ['error', 'success', ''] as const;

export type LoginVariant = typeof VARIANTS[number];
export type LoginSize = typeof SIZES[number];
export type AlertVariant = typeof ALERT_VARIANTS[number];

/** The documented CSS parts, in the order the doc lists them. */
export const PARTS = ['base', 'header', 'title', 'form', 'footer'] as const;

/** The documented slots, in the order the doc lists them. */
export const SLOTS = [
  'before-header', 'after-header', 'subtitle', 'before-form', 'after-form',
  'form-top', 'between-fields', 'before-submit', 'after-submit', 'footer',
] as const;

export interface LoginCombo {
  variant?: LoginVariant;
  size?: LoginSize;
  title?: string;
  actionText?: string;
  disabled?: boolean;
  loading?: boolean;
  showRememberMe?: boolean;
  showForgotPassword?: boolean;
  alertMessage?: string;
  alertVariant?: AlertVariant;
}

export function comboId(combo: LoginCombo): string {
  return [
    `variant=${combo.variant ?? 'default'}`,
    `size=${combo.size ?? 'medium'}`,
    combo.showRememberMe === false ? 'no-remember' : 'remember',
    combo.showForgotPassword === false ? 'no-forgot' : 'forgot',
    combo.disabled ? 'disabled' : '-',
    combo.loading ? 'loading' : '-',
    combo.title !== undefined ? `title="${combo.title}"` : 'title=default',
    combo.actionText !== undefined ? `action="${combo.actionText}"` : 'action=default',
  ].join('/');
}

/** The documented defaults, applied where a combo leaves a dimension unset. */
export function resolved(combo: LoginCombo) {
  return {
    variant: combo.variant ?? 'default',
    size: combo.size ?? 'medium',
    title: combo.title ?? 'Sign In',
    actionText: combo.actionText ?? 'Sign In',
    disabled: combo.disabled ?? false,
    loading: combo.loading ?? false,
    showRememberMe: combo.showRememberMe ?? true,
    showForgotPassword: combo.showForgotPassword ?? true,
    alertMessage: combo.alertMessage ?? '',
    alertVariant: combo.alertVariant ?? '',
  };
}

export async function mountLogin(
  combo: LoginCombo, options: { html?: string } = {},
): Promise<HTMLElement> {
  const want = resolved(combo);
  const props: Record<string, any> = {
    variant: want.variant,
    size: want.size,
    title: want.title,
    actionText: want.actionText,
    disabled: want.disabled,
    loading: want.loading,
    showRememberMe: want.showRememberMe,
    showForgotPassword: want.showForgotPassword,
  };
  const el = await mount<HTMLElement>('snice-login', props, options);
  if (want.alertMessage) {
    (el as any).alertVariant = want.alertVariant;
    (el as any).alertMessage = want.alertMessage;
  }
  await wait(30);
  return el;
}

// ── Field accessors ─────────────────────────────────────────────────────────

export const usernameInput = (el: HTMLElement) =>
  shadow(el).querySelector('input[name="username"]') as HTMLInputElement | null;
export const passwordInput = (el: HTMLElement) =>
  shadow(el).querySelector('input[name="password"]') as HTMLInputElement | null;
export const rememberInput = (el: HTMLElement) =>
  shadow(el).querySelector('input[name="remember"]') as HTMLInputElement | null;
export const forgotLink = (el: HTMLElement) =>
  shadow(el).querySelector('.login__forgot') as HTMLAnchorElement | null;
export const submitButton = (el: HTMLElement) =>
  shadow(el).querySelector('snice-button') as HTMLElement | null;
export const alertElement = (el: HTMLElement) =>
  shadow(el).querySelector('snice-alert') as HTMLElement | null;
export const formElement = (el: HTMLElement) =>
  exactPart<HTMLFormElement>(el, 'form');

/** Class tokens of a node. happy-dom's `classList` is not iterable. */
export function classesOf(node: Element | null | undefined): string[] {
  return (node?.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
}

// ── The oracle ──────────────────────────────────────────────────────────────

/**
 * Judge one mounted login form against the documented contract, collecting
 * EVERY violation so a failing combo tells its whole story in one run.
 */
export function checkLogin(el: HTMLElement, combo: LoginCombo): Problems {
  const problems = new Problems();
  const want = resolved(combo);
  const root = shadow(el);

  // ── the five documented parts ───────────────────────────────────────────
  for (const name of PARTS) {
    problems.check(!!exactPart(el, name), `no part="${name}"`);
  }

  // ── variant and size are layout claims; they must reach the DOM ─────────
  const base = exactPart(el, 'base');
  if (base) {
    const classes = classesOf(base);
    problems.check(classes.includes('login'), `part="base" classes ${classes.join(' ')} lack "login"`);
    problems.check(
      classes.includes(`login--${want.variant}`),
      `variant="${want.variant}" did not reach the base (classes: ${classes.join(' ')})`,
    );
    problems.check(
      classes.includes(`login--${want.size}`),
      `size="${want.size}" did not reach the base (classes: ${classes.join(' ')})`,
    );
    problems.equal(
      VARIANTS.filter(v => classes.includes(`login--${v}`)).length, 1,
      'variant classes on the base',
    );
    problems.equal(
      SIZES.filter(s => classes.includes(`login--${s}`)).length, 1,
      'size classes on the base',
    );
  }

  // ── the title is an <h1>, per the doc's "H1 title element" ──────────────
  const title = exactPart(el, 'title');
  problems.check(!!title, 'no part="title"');
  if (title) {
    problems.equal(title.tagName.toLowerCase(), 'h1', 'the title element');
    problems.equal(textOf(title), want.title, 'title text');
  }

  // ── the form and its two required, labelled, autocompleting fields ──────
  const form = formElement(el);
  problems.check(!!form, 'no part="form"');
  if (form) problems.equal(form.tagName.toLowerCase(), 'form', 'part="form" element');

  const fields: Array<[string, HTMLInputElement | null, string, string]> = [
    ['username', usernameInput(el), 'text', 'username'],
    ['password', passwordInput(el), 'password', 'current-password'],
  ];
  for (const [name, input, type, autocomplete] of fields) {
    problems.check(!!input, `no input[name="${name}"]`);
    if (!input) continue;
    problems.equal(input.getAttribute('type'), type, `${name} input type`);
    problems.equal(input.getAttribute('autocomplete'), autocomplete, `${name} autocomplete`);
    problems.check(input.hasAttribute('required'), `${name} input is not required`);

    // `<label for>` — the doc's own wording.
    const id = input.getAttribute('id');
    problems.check(!!id, `${name} input has no id for a label to point at`);
    if (id) {
      const label = root.querySelector(`label[for="${id}"]`);
      problems.check(!!label, `no <label for="${id}">`);
      problems.check(textOf(label).length > 0, `the label for ${name} is empty`);
    }

    // "loading and disabled states propagate to every input"
    problems.equal(
      input.hasAttribute('disabled'), want.disabled || want.loading,
      `${name} input disabled under { disabled: ${want.disabled}, loading: ${want.loading} }`,
    );
  }

  // ── the two optional controls ───────────────────────────────────────────
  const remember = rememberInput(el);
  problems.equal(!!remember, want.showRememberMe, 'the remember-me checkbox is offered');
  if (want.showRememberMe && remember) {
    problems.equal(remember.getAttribute('type'), 'checkbox', 'remember-me input type');
    problems.equal(
      remember.hasAttribute('disabled'), want.disabled || want.loading,
      'remember-me disabled state',
    );
  }

  const forgot = forgotLink(el);
  problems.equal(!!forgot, want.showForgotPassword, 'the forgot-password link is offered');

  // ── the submit button ───────────────────────────────────────────────────
  const button = submitButton(el);
  problems.check(!!button, 'no submit button');
  if (button) {
    problems.equal(button.getAttribute('type'), 'submit', 'submit button type');
    problems.equal(textOf(button), want.actionText, 'submit button label');
    // "loading and disabled states propagate to … the submit button"
    problems.equal(button.hasAttribute('disabled'), want.disabled, 'submit button disabled');
    problems.equal(button.hasAttribute('loading'), want.loading, 'submit button loading');
  }

  // ── the inline alert ────────────────────────────────────────────────────
  const alert = alertElement(el);
  problems.equal(!!alert, !!want.alertMessage, 'the inline alert is shown');
  if (want.alertMessage && alert) {
    problems.equal(textOf(alert), want.alertMessage, 'alert text');
    problems.equal(alert.getAttribute('variant'), want.alertVariant, 'alert variant');
  }

  // ── every documented slot exists ────────────────────────────────────────
  for (const name of SLOTS) {
    problems.check(
      !!root.querySelector(`slot[name="${name}"]`),
      `no slot[name="${name}"]`,
    );
  }

  return problems;
}

// ── Requests and events ─────────────────────────────────────────────────────

export const LOGIN_EVENTS = [
  'login-attempt', 'login-success', 'login-error', 'login-forgot-password',
] as const;

export interface Recorded { type: string; detail: any }

export function recordEvents(el: HTMLElement): { seen: Recorded[]; of: (t: string) => any[] } {
  const seen: Recorded[] = [];
  for (const type of LOGIN_EVENTS) {
    el.addEventListener(type, (event: Event) => {
      seen.push({ type, detail: (event as CustomEvent).detail });
    });
  }
  return { seen, of: (type: string) => seen.filter(e => e.type === type).map(e => e.detail) };
}

/**
 * Answer the documented `login-user` request channel the way a controller
 * would (docs/ai/request-response.md), recording every payload it receives.
 */
export function respondToLogin(
  target: EventTarget,
  reply: (credentials: any) => any,
): { payloads: any[]; stop: () => void } {
  const payloads: any[] = [];
  const type = '@request/login-user';
  const handler = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    payloads.push(detail.payload);
    detail.discovery.resolve();
    try {
      detail.data.resolve(reply(detail.payload));
    } catch (error) {
      detail.data.reject(error);
    }
  };
  target.addEventListener(type, handler);
  return { payloads, stop: () => target.removeEventListener(type, handler) };
}

/** Type into a field the way a user would. */
export function type(input: HTMLInputElement | null, value: string): void {
  if (!input) throw new Error('the login form rendered no such input');
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
}

export { Problems, shadow, textOf, wait };
