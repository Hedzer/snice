/**
 * Windows 11 Fluent 2 / WinUI 3 contemporary desktop behaviors (tree-shakeable, 0 B in non-Windows builds).
 *
 * Implements:
 * 1. WinUI 3 keyboard-vs-pointer dual-stroke focus tracking (`data-win-focus="keyboard"`)
 * 2. Fluent 2 press micro-detent (`data-win-pressed="true"`) on switch/slider/button
 * 3. Connected 3px accent-pill indicator travel on NavigationView / TabView
 */
import { prefersReducedMotion, type PlatformBehaviorCleanup } from './types';

export const platform = 'windows' as const;

let lastInputModality: 'keyboard' | 'pointer' = 'pointer';
let modalityRefCount = 0;

const onGlobalKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Tab' || e.key.startsWith('Arrow') || e.key === 'Home' || e.key === 'End') {
    lastInputModality = 'keyboard';
  }
};
const onGlobalPointerDown = () => {
  lastInputModality = 'pointer';
};

function acquireModalityTracker(): () => void {
  if (modalityRefCount === 0 && typeof window !== 'undefined') {
    window.addEventListener('keydown', onGlobalKeyDown, { capture: true, passive: true });
    window.addEventListener('pointerdown', onGlobalPointerDown, { capture: true, passive: true });
  }
  modalityRefCount++;
  return () => {
    modalityRefCount = Math.max(0, modalityRefCount - 1);
    if (modalityRefCount === 0 && typeof window !== 'undefined') {
      window.removeEventListener('keydown', onGlobalKeyDown, { capture: true });
      window.removeEventListener('pointerdown', onGlobalPointerDown, { capture: true });
    }
  };
}

function attachFocusAndPress(el: Element): PlatformBehaviorCleanup {
  const root = el.shadowRoot;
  if (!root) return () => {};
  const releaseModality = acquireModalityTracker();

  const onFocusIn = () => {
    if (lastInputModality === 'keyboard') {
      el.setAttribute('data-win-focus', 'keyboard');
    } else {
      el.removeAttribute('data-win-focus');
    }
  };
  const onFocusOut = () => {
    el.removeAttribute('data-win-focus');
  };
  const onPointerDown = () => {
    if (el.hasAttribute('disabled') || el.hasAttribute('loading')) return;
    el.removeAttribute('data-win-focus');
    el.setAttribute('data-win-pressed', 'true');
  };
  const onPointerUp = () => {
    el.removeAttribute('data-win-pressed');
  };

  el.addEventListener('focusin', onFocusIn);
  el.addEventListener('focusout', onFocusOut);
  root.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);

  return () => {
    releaseModality();
    el.removeAttribute('data-win-focus');
    el.removeAttribute('data-win-pressed');
    el.removeEventListener('focusin', onFocusIn);
    el.removeEventListener('focusout', onFocusOut);
    root.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
  };
}

function attachNavIndicatorSlide(el: Element): PlatformBehaviorCleanup {
  const root = el.shadowRoot;
  if (!root) return () => {};
  let lastActiveRect: DOMRect | null = null;

  const animateSlide = () => {
    const active = root.querySelector<HTMLElement>('[part~="link-active"]');
    if (!active) return;
    const nextRect = active.getBoundingClientRect();
    if (lastActiveRect && !prefersReducedMotion(el)) {
      const dy = lastActiveRect.top - nextRect.top;
      const dx = lastActiveRect.left - nextRect.left;
      if (Math.abs(dy) > 2 || Math.abs(dx) > 2) {
        active.style.setProperty('--snice-win-slide-y', `${Math.round(dy)}px`);
        active.style.setProperty('--snice-win-slide-x', `${Math.round(dx)}px`);
        el.setAttribute('data-win-sliding', 'true');
        requestAnimationFrame(() => {
          active.style.setProperty('--snice-win-slide-y', '0px');
          active.style.setProperty('--snice-win-slide-x', '0px');
          setTimeout(() => el.removeAttribute('data-win-sliding'), 190);
        });
      }
    }
    lastActiveRect = nextRect;
  };

  const mo =
    typeof MutationObserver !== 'undefined'
      ? new MutationObserver(() => animateSlide())
      : null;
  mo?.observe(root, { subtree: true, attributes: true, attributeFilter: ['part'] });
  animateSlide();

  return () => {
    mo?.disconnect();
    el.removeAttribute('data-win-sliding');
  };
}

function attachSingleElement(el: Element): PlatformBehaviorCleanup {
  const tag = el.tagName.toLowerCase();
  if (tag === 'snice-nav') return attachNavIndicatorSlide(el);
  if (
    tag === 'snice-button' ||
    tag === 'snice-switch' ||
    tag === 'snice-slider' ||
    tag === 'snice-checkbox' ||
    tag === 'snice-radio' ||
    tag === 'snice-chip'
  ) {
    return attachFocusAndPress(el);
  }
  return () => {};
}

const WIN_SELECTOR =
  'snice-button, snice-switch, snice-slider, snice-checkbox, snice-radio, snice-chip, snice-nav';

export function attach(root: Document | Element): PlatformBehaviorCleanup {
  if (root instanceof Element && root.tagName.toLowerCase().startsWith('snice-')) {
    return attachSingleElement(root);
  }

  const container = root instanceof Document ? root.documentElement : root;
  if (!container) return () => {};

  const bound = new Map<Element, PlatformBehaviorCleanup>();

  const sync = () => {
    const found = new Set(Array.from(container.querySelectorAll(WIN_SELECTOR)));
    for (const [el, cleanup] of Array.from(bound.entries())) {
      if (!found.has(el)) {
        cleanup();
        bound.delete(el);
      }
    }
    for (const el of found) {
      const nearest = el.closest('[data-platform]');
      if (nearest && nearest !== container && nearest.getAttribute('data-platform') !== 'windows') {
        continue;
      }
      if (!bound.has(el)) {
        bound.set(el, attachSingleElement(el));
      }
    }
  };

  sync();

  const mo =
    typeof MutationObserver !== 'undefined'
      ? new MutationObserver(() => sync())
      : null;
  mo?.observe(container, { childList: true, subtree: true });

  return () => {
    mo?.disconnect();
    for (const cleanup of bound.values()) cleanup();
    bound.clear();
  };
}
