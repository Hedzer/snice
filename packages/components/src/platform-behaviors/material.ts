/**
 * Android Material 3 Expressive micro-behaviors (tree-shakeable, 0 B in non-Material builds).
 *
 * Implements contemporary M3 Expressive interactions pure CSS cannot express:
 * 1. Pointer-origin & keyboard-centered state-layer ripple (--snice-ripple-x/y/size)
 * 2. M3 Expressive press/selection shape morphing & connected button-group coordination
 * 3. Updated M3 slider drag state & value/stop-indicator coordination
 * 4. On-demand lazy loader for M3 Expressive wavy progress SVG engine (material-wavy.ts)
 */
import { prefersReducedMotion, type PlatformBehaviorCleanup } from './types';

export const platform = 'material' as const;

type WavyModule = typeof import('./material-wavy');
let wavyModPromise: Promise<WavyModule> | null = null;

function loadWavyModule(): Promise<WavyModule> {
  if (!wavyModPromise) {
    wavyModPromise = import('./material-wavy');
  }
  return wavyModPromise;
}

function attachLazyWavyProgress(el: Element): PlatformBehaviorCleanup {
  let disposed = false;
  let innerCleanup: PlatformBehaviorCleanup | null = null;

  loadWavyModule()
    .then((mod) => {
      if (disposed) return;
      innerCleanup = mod.attachWavyProgress(el);
    })
    .catch(() => {});

  return () => {
    disposed = true;
    innerCleanup?.();
    innerCleanup = null;
  };
}

function triggerRipple(
  host: Element,
  clientX?: number,
  clientY?: number
): void {
  const root = host.shadowRoot;
  if (!root) return;
  const ripple = root.querySelector<HTMLElement>('[part~="ripple"]');
  if (!ripple) return;

  const container = ripple.parentElement ?? (host as HTMLElement);
  const rect = container.getBoundingClientRect();
  const w = Math.max(1, rect.width);
  const h = Math.max(1, rect.height);

  const rx = typeof clientX === 'number' ? clientX - rect.left : w / 2;
  const ry = typeof clientY === 'number' ? clientY - rect.top : h / 2;
  const maxDist = Math.hypot(Math.max(rx, w - rx), Math.max(ry, h - ry));
  // 2.15x matches AOSP RippleAnimation target diameter past the furthest corner
  const size = Math.ceil(maxDist * 2.15);

  ripple.style.setProperty('--snice-ripple-x', `${Math.round(rx)}px`);
  ripple.style.setProperty('--snice-ripple-y', `${Math.round(ry)}px`);
  ripple.style.setProperty('--snice-ripple-size', `${size}px`);

  if (prefersReducedMotion(host)) {
    host.setAttribute('data-m3-ripple', 'static');
    return;
  }

  // Explicitly reset scale via entering state (overrides :hover scale(1) on checkbox/radio/switch)
  host.setAttribute('data-m3-ripple', 'entering');
  void ripple.offsetWidth;
  host.setAttribute('data-m3-ripple', 'active');
}

function clearRippleAndPress(host: Element): void {
  host.removeAttribute('data-m3-pressed');
  host.removeAttribute('data-m3-ripple');
  host.previousElementSibling?.removeAttribute('data-m3-neighbor-pressed');
  host.nextElementSibling?.removeAttribute('data-m3-neighbor-pressed');
}

function attachRippleAndMorph(el: Element): PlatformBehaviorCleanup {
  const root = el.shadowRoot;
  if (!root) return () => {};
  let active = false;
  let pressStart = 0;
  let holdTimer: ReturnType<typeof setTimeout> | null = null;
  let clearTimer: ReturnType<typeof setTimeout> | null = null;

  const cancelTimers = () => {
    if (holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
    }
    if (clearTimer) {
      clearTimeout(clearTimer);
      clearTimer = null;
    }
  };

  const markNeighbors = () => {
    const parent = el.parentElement;
    if (!parent) return;
    if (
      parent.getAttribute('role') === 'group' ||
      parent.hasAttribute('data-m3-connected') ||
      parent.classList.contains('button-group')
    ) {
      el.previousElementSibling?.setAttribute('data-m3-neighbor-pressed', 'end');
      el.nextElementSibling?.setAttribute('data-m3-neighbor-pressed', 'start');
    }
  };

  const startPress = (clientX?: number, clientY?: number) => {
    if (el.hasAttribute('disabled') || el.hasAttribute('loading')) return;
    cancelTimers();
    active = true;
    pressStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
    el.setAttribute('data-m3-pressed', 'true');
    markNeighbors();
    triggerRipple(el, clientX, clientY);
  };

  const releasePress = () => {
    if (!active) return;
    active = false;
    el.removeAttribute('data-m3-pressed');
    el.previousElementSibling?.removeAttribute('data-m3-neighbor-pressed');
    el.nextElementSibling?.removeAttribute('data-m3-neighbor-pressed');

    if (prefersReducedMotion(el)) {
      clearTimer = setTimeout(() => {
        el.removeAttribute('data-m3-ripple');
        clearTimer = null;
      }, 60);
      return;
    }

    // AOSP RippleAnimation: ensure outward expansion finishes before fading out at scale(1)
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const minHold = Math.max(0, 180 - (now - pressStart));
    const beginFade = () => {
      holdTimer = null;
      if (el.getAttribute('data-m3-ripple') !== 'active') return;
      el.setAttribute('data-m3-ripple', 'fading');
      clearTimer = setTimeout(() => {
        if (el.getAttribute('data-m3-ripple') === 'fading') {
          el.removeAttribute('data-m3-ripple');
        }
        clearTimer = null;
      }, 220);
    };

    if (minHold > 0) {
      holdTimer = setTimeout(beginFade, minHold);
    } else {
      beginFade();
    }
  };

  const onPointerDown = (e: Event) => {
    const pe = e as PointerEvent;
    startPress(pe.clientX, pe.clientY);
  };

  const onKeyDown = (e: Event) => {
    const ke = e as KeyboardEvent;
    if (ke.key !== 'Enter' && ke.key !== ' ') return;
    if (ke.repeat) return;
    startPress();
  };

  const onKeyUp = (e: Event) => {
    const ke = e as KeyboardEvent;
    if (ke.key !== 'Enter' && ke.key !== ' ') return;
    releasePress();
  };

  root.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', releasePress);
  window.addEventListener('pointercancel', releasePress);
  root.addEventListener('keydown', onKeyDown);
  root.addEventListener('keyup', onKeyUp);
  el.addEventListener('blur', releasePress);

  return () => {
    cancelTimers();
    clearRippleAndPress(el);
    root.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointerup', releasePress);
    window.removeEventListener('pointercancel', releasePress);
    root.removeEventListener('keydown', onKeyDown);
    root.removeEventListener('keyup', onKeyUp);
    el.removeEventListener('blur', releasePress);
  };
}

function attachSliderBehavior(el: Element): PlatformBehaviorCleanup {
  const root = el.shadowRoot;
  if (!root) return () => {};
  const rippleCleanup = attachRippleAndMorph(el);
  let dragging = false;

  const syncPct = () => {
    const s = el as HTMLElement & { value?: number; min?: number; max?: number };
    const min = Number(s.min ?? 0);
    const max = Number(s.max ?? 100);
    const val = Number(s.value ?? 0);
    const pct = max > min ? Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100)) : 0;
    (el as HTMLElement).style.setProperty('--snice-m3-slider-pct', `${pct}%`);
  };

  const onDown = () => {
    if (el.hasAttribute('disabled') || el.hasAttribute('readonly')) return;
    dragging = true;
    el.setAttribute('data-m3-dragging', 'true');
    syncPct();
  };

  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    el.removeAttribute('data-m3-dragging');
  };

  root.addEventListener('pointerdown', onDown);
  el.addEventListener('slider-input', syncPct);
  el.addEventListener('slider-change', syncPct);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  syncPct();

  return () => {
    rippleCleanup();
    el.removeAttribute('data-m3-dragging');
    root.removeEventListener('pointerdown', onDown);
    el.removeEventListener('slider-input', syncPct);
    el.removeEventListener('slider-change', syncPct);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
  };
}

function attachSingleElement(el: Element): PlatformBehaviorCleanup {
  const tag = el.tagName.toLowerCase();
  if (tag === 'snice-slider') return attachSliderBehavior(el);
  if (tag === 'snice-progress') return attachLazyWavyProgress(el);
  if (
    tag === 'snice-button' ||
    tag === 'snice-switch' ||
    tag === 'snice-checkbox' ||
    tag === 'snice-radio' ||
    tag === 'snice-tab' ||
    tag === 'snice-chip'
  ) {
    return attachRippleAndMorph(el);
  }
  return () => {};
}

const M3_INTERACTIVE_SELECTOR =
  'snice-button, snice-switch, snice-checkbox, snice-radio, snice-tab, snice-chip, snice-slider, snice-progress';

export function attach(root: Document | Element): PlatformBehaviorCleanup {
  if (root instanceof Element && root.tagName.toLowerCase().startsWith('snice-')) {
    return attachSingleElement(root);
  }

  const container = root instanceof Document ? root.documentElement : root;
  if (!container) return () => {};

  const bound = new Map<Element, PlatformBehaviorCleanup>();

  const sync = () => {
    const found = new Set(Array.from(container.querySelectorAll(M3_INTERACTIVE_SELECTOR)));
    for (const [el, cleanup] of Array.from(bound.entries())) {
      if (!found.has(el)) {
        cleanup();
        bound.delete(el);
      }
    }
    for (const el of found) {
      const nearest = el.closest('[data-platform]');
      if (nearest && nearest !== container && nearest.getAttribute('data-platform') !== 'material') {
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
