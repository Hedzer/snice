/**
 * ════════════════════════════════════════════════════════════════════════════
 *  snice-toast / snice-toast-container matrix — the oracle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Transcribed from `docs/ai/components/toast.md` and `snice-toast.types.ts`:
 *
 *   snice-toast
 *     type      success|error|warning|info = info
 *     message   string = ''
 *     closable  boolean = true
 *     icon      boolean = true
 *     event     close-toast → { id }   "Close button clicked"
 *     parts     base ("has type modifier class"), icon, content
 *     method    hide()
 *
 *   snice-toast-container
 *     position  top-left|top-center|top-right
 *               |bottom-left|bottom-center|bottom-right = bottom-center
 *     methods   show(message, options?) → id, hide(id), clear()
 *
 *   Toast (static)
 *     success / error / warning / info / show → Promise<string>
 *     hide(id), clear()
 *
 *   ToastOptions
 *     type, duration (ms, 0 = no auto-dismiss, default 4000), position,
 *     closable, icon, id
 *
 * ── What this tier owns ────────────────────────────────────────────────────
 *
 * A toast's DEPARTURE is animated: `hide()` marks the toast, and the container
 * removes it from the DOM when the CSS slide-out animation ends. No animation
 * runs without a layout engine, so `animationend` never fires here and a
 * dismissed toast stays in the tree wearing its hiding mark. That is an
 * environment limit, not a defect, and it draws the line cleanly:
 *
 *   DOM tier     — which toasts exist, in what ORDER, with which type, message,
 *                  chrome and ARIA; which ones have been TOLD to leave; the ids
 *                  the API hands back; the auto-dismiss timer firing (or not,
 *                  at `duration: 0`).
 *   visual tier  — that a dismissed toast actually leaves the screen, that the
 *                  container really sits at its documented corner, and that the
 *                  four types really paint four distinguishable colours.
 *
 * So `dismissed()` below is the DOM-tier reading of "this toast is going away",
 * and the assertions built on it say exactly that and no more.
 */
import { expect } from 'vitest';
import { mount, unmountAll, wait } from '../matrix-utils';

import Toast from '../../../packages/components/src/toast/snice-toast-container';
import '../../../packages/components/src/toast/snice-toast';

export { Toast, expect, mount, unmountAll, wait };

export const SETTLE = 30;

// ── Documented dimensions ───────────────────────────────────────────────────

export const TYPES = ['success', 'error', 'warning', 'info'] as const;
export type ToastType = typeof TYPES[number];

export const POSITIONS = [
  'top-left', 'top-center', 'top-right',
  'bottom-left', 'bottom-center', 'bottom-right',
] as const;
export type ToastPosition = typeof POSITIONS[number];

/** Every part `snice-toast` documents. */
export const TOAST_PARTS = ['base', 'icon', 'content'] as const;

export const TOAST_DEFAULTS = { type: 'info' as ToastType, message: '', closable: true, icon: true };
export const CONTAINER_DEFAULT_POSITION: ToastPosition = 'bottom-center';
/** "duration?: number; // ms, 0 = no auto-dismiss, default: 4000" */
export const DEFAULT_DURATION = 4000;

/**
 * The ARIA a notification owes a screen reader, by type.
 *
 * The doc calls the component a "Temporary notification system"; an error or a
 * warning is the half a user must not miss, so it is announced assertively as
 * an `alert`, while success and info are polite `status` updates. Both live
 * on the `base` part.
 */
export function expectedLiveRegion(type: ToastType): { role: string; live: string } {
  const urgent = type === 'error' || type === 'warning';
  return { role: urgent ? 'alert' : 'status', live: urgent ? 'assertive' : 'polite' };
}

// ── Mounting a bare toast ───────────────────────────────────────────────────

export interface ToastCombo {
  id: string;
  type: ToastType;
  message: string;
  closable: boolean;
  icon: boolean;
}

export function combo(overrides: Partial<ToastCombo> = {}): ToastCombo {
  const base: ToastCombo = {
    id: '',
    type: 'info',
    message: 'Saved successfully',
    closable: true,
    icon: true,
    ...overrides,
  };
  const off = [!base.closable && 'no-close', !base.icon && 'no-icon'].filter(Boolean);
  base.id = base.id || `${base.type}${off.length ? `/${off.join('+')}` : ''}`;
  return base;
}

/**
 * A standalone `<snice-toast>`, built the way the container builds one:
 * `type` and `message` through attributes, the two boolean switches through
 * the property channel because both DEFAULT to true and an absent boolean
 * attribute cannot express false.
 */
export async function makeToast(c: ToastCombo): Promise<any> {
  const props: Record<string, unknown> = {};
  if (!c.closable) props.closable = false;
  if (!c.icon) props.icon = false;
  return mount<any>('snice-toast', { type: c.type, message: c.message }, '', props);
}

// ── Reading ─────────────────────────────────────────────────────────────────

export function sr(el: HTMLElement): ShadowRoot {
  const root = el.shadowRoot;
  if (!root) throw new Error(`${el.tagName.toLowerCase()} rendered no shadow root`);
  return root;
}

export const part = (el: HTMLElement, name: string): HTMLElement | null =>
  sr(el).querySelector<HTMLElement>(`[part~="${name}"]`);

export const parts = (el: HTMLElement, name: string): HTMLElement[] =>
  [...sr(el).querySelectorAll<HTMLElement>(`[part~="${name}"]`)];

export const closeButton = (el: HTMLElement): HTMLElement | null =>
  sr(el).querySelector('.toast-close');

/** Has this toast been told to leave? (`hide()` marks it for the slide-out.) */
export const dismissed = (toast: HTMLElement): boolean => toast.classList.contains('hiding');

/** Live toasts of a container, in rendered order. */
export function toastsOf(container: HTMLElement): any[] {
  return [...sr(container).querySelectorAll('snice-toast')];
}

export const messagesOf = (container: HTMLElement): string[] =>
  toastsOf(container).map(toast => toast.message);

export const idsOf = (container: HTMLElement): string[] =>
  toastsOf(container).map(toast => toast.getAttribute('toast-id'));

export const findToast = (container: HTMLElement, id: string): any =>
  toastsOf(container).find(toast => toast.getAttribute('toast-id') === id) ?? null;

// ── The oracle ──────────────────────────────────────────────────────────────

class Problems {
  readonly list: string[] = [];
  check(ok: boolean, message: string): void { if (!ok) this.list.push(message); }
  equal(actual: unknown, expected: unknown, what: string): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      this.list.push(`${what}: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`);
    }
  }
}

export function toastProblems(el: any, c: ToastCombo): Problems {
  const problems = new Problems();

  problems.equal(el.type, c.type, 'type');
  problems.equal(el.message, c.message, 'message');
  problems.equal(el.closable, c.closable, 'closable');
  problems.equal(el.icon, c.icon, 'icon');

  // "base - Outer toast div (has type modifier class)"
  const base = part(el, 'base');
  if (!problems.check(!!base, 'no part="base"')) return problems;
  const classes = (base!.getAttribute('class') ?? '').split(/\s+/).filter(Boolean).sort();
  problems.equal(classes, ['toast', `toast--${c.type}`].sort(), 'base classes');

  const aria = expectedLiveRegion(c.type);
  problems.equal(base!.getAttribute('role'), aria.role, 'base role');
  problems.equal(base!.getAttribute('aria-live'), aria.live, 'base aria-live');

  // "icon - Icon span wrapper" exists only when the documented switch is on…
  problems.equal(parts(el, 'icon').length, c.icon ? 1 : 0, 'part="icon" count');
  if (c.icon) {
    problems.check(!!part(el, 'icon')!.querySelector('svg'),
      'the icon wrapper renders no glyph');
  }

  // …and the close button only when `closable` is.
  problems.equal(!!closeButton(el), c.closable, 'close button rendered');
  if (c.closable) {
    problems.equal(closeButton(el)!.getAttribute('aria-label'), 'Close', 'close aria-label');
  }

  // "content - Message text span"
  problems.equal(parts(el, 'content').length, 1, 'part="content" count');
  problems.equal((part(el, 'content')!.textContent ?? '').trim(), c.message, 'content text');

  return problems;
}

export function expectToastMatches(el: any, c: ToastCombo): void {
  expect(toastProblems(el, c).list, `combo ${c.id}`).toEqual([]);
}

// ── Container ───────────────────────────────────────────────────────────────

/**
 * A container mounted at a documented position.
 *
 * The container hoists ITSELF to `document.body` on ready (so its z-index is
 * not trapped in a parent stacking context), which is why the returned element
 * is looked up again rather than trusted to still be where it was put.
 */
export async function makeContainer(position: ToastPosition = CONTAINER_DEFAULT_POSITION): Promise<any> {
  const el = await mount<any>('snice-toast-container', { position });
  await wait(SETTLE);
  return el;
}

/** The container the static API registered as the global one, if any. */
export function globalContainer(): any {
  return document.body.querySelector('snice-toast-container');
}

export function recordClose(toast: HTMLElement): any[] {
  const seen: any[] = [];
  toast.addEventListener('close-toast', (event: Event) => seen.push((event as CustomEvent).detail));
  return seen;
}

export function clickClose(toast: HTMLElement): boolean {
  const button = closeButton(toast);
  if (!button) return false;
  button.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
  return true;
}

/**
 * Tear the whole toast world down between combos.
 *
 * The container registers itself in a module-global slot on ready and clears
 * it on disposal, and the static API reuses whatever is registered — so a
 * container left behind by one test would silently receive the next test's
 * toasts. Removing every container and letting disposal run is what makes each
 * combo independent.
 */
export async function teardown(): Promise<void> {
  for (const container of [...document.body.querySelectorAll('snice-toast-container')]) {
    container.remove();
  }
  unmountAll();
  await wait(SETTLE);
}
