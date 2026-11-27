import type { PlatformBehaviorCleanup } from './types';

export const platform = 'macos' as const;

const FOCUS_SELECTOR = 'snice-button, snice-switch, snice-checkbox, snice-radio, snice-slider, snice-chip, snice-input, snice-select';

function isReducedMotion(): boolean {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function collectMatching(root: Document | Element, selector: string): HTMLElement[] {
  const results: HTMLElement[] = [];
  if (root instanceof HTMLElement && root.matches(selector)) {
    results.push(root);
  }
  const found = root.querySelectorAll<HTMLElement>(selector);
  for (let i = 0; i < found.length; i++) {
    results.push(found[i]);
  }
  return results;
}

function attachFocusHalo(el: HTMLElement, isKeyboardNav: () => boolean): PlatformBehaviorCleanup {
  const onFocusIn = () => {
    if (isKeyboardNav()) {
      el.setAttribute('data-macos-focus', 'keyboard');
    } else {
      el.removeAttribute('data-macos-focus');
    }
  };
  const onFocusOut = () => {
    el.removeAttribute('data-macos-focus');
  };

  el.addEventListener('focusin', onFocusIn);
  el.addEventListener('focusout', onFocusOut);
  return () => {
    el.removeEventListener('focusin', onFocusIn);
    el.removeEventListener('focusout', onFocusOut);
    el.removeAttribute('data-macos-focus');
  };
}

function attachGlassLens(el: HTMLElement): PlatformBehaviorCleanup {
  const onPointerDown = () => {
    if (!isReducedMotion()) {
      el.setAttribute('data-macos-pressed', 'true');
    }
  };
  const onRelease = () => {
    el.removeAttribute('data-macos-pressed');
  };

  el.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('pointerup', onRelease, { passive: true });
  window.addEventListener('pointercancel', onRelease, { passive: true });

  return () => {
    el.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointerup', onRelease);
    window.removeEventListener('pointercancel', onRelease);
    el.removeAttribute('data-macos-pressed');
  };
}

function attachSegmentedTabs(el: HTMLElement): PlatformBehaviorCleanup {
  const updatePill = () => {
    const shadow = el.shadowRoot;
    if (!shadow) return;
    const track = shadow.querySelector<HTMLElement>('[part~="nav-track"]');
    const pill = shadow.querySelector<HTMLElement>('[part~="pill"]');
    if (!track || !pill) return;

    const tabs = Array.from(el.querySelectorAll<HTMLElement>('snice-tab[slot="nav"]'));
    if (tabs.length === 0) return;
    const selectedIdx = Number((el as unknown as { selected?: number }).selected ?? 0);
    const active = tabs[selectedIdx] ?? tabs.find((t) => t.getAttribute('aria-selected') === 'true') ?? tabs[0];
    if (!active) return;

    const trackRect = track.getBoundingClientRect();
    const tabRect = active.getBoundingClientRect();
    if (tabRect.width <= 0) return;

    const left = Math.max(0, tabRect.left - trackRect.left + track.scrollLeft);
    const top = Math.max(0, tabRect.top - trackRect.top + track.scrollTop);
    pill.style.width = `${tabRect.width}px`;
    pill.style.height = `${Math.max(20, tabRect.height - 2)}px`;
    pill.style.transform = `translate3d(${left}px, ${top + 1}px, 0)`;
    pill.style.opacity = '1';
    el.setAttribute('data-macos-pill-ready', 'true');
  };

  const onTabChange = () => {
    updatePill();
    requestAnimationFrame(updatePill);
  };

  el.addEventListener('tab-change', onTabChange);
  el.addEventListener('click', onTabChange);
  window.addEventListener('resize', updatePill, { passive: true });
  requestAnimationFrame(updatePill);

  return () => {
    el.removeEventListener('tab-change', onTabChange);
    el.removeEventListener('click', onTabChange);
    window.removeEventListener('resize', updatePill);
    el.removeAttribute('data-macos-pill-ready');
  };
}

function attachScrollVibrancy(el: HTMLElement): PlatformBehaviorCleanup {
  const onScroll = () => {
    const scrolled = (window.scrollY || document.documentElement.scrollTop || 0) > 8;
    if (scrolled) {
      el.setAttribute('data-scrolled', 'true');
    } else {
      el.removeAttribute('data-scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  return () => {
    window.removeEventListener('scroll', onScroll);
    el.removeAttribute('data-scrolled');
  };
}

export function attach(root: Document | Element): PlatformBehaviorCleanup {
  const cleanups: PlatformBehaviorCleanup[] = [];

  let keyboardNav = false;
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Tab' || e.key.startsWith('Arrow') || e.key === 'Enter' || e.key === ' ') {
      keyboardNav = true;
    }
  };
  const onPointerDownGlobal = () => {
    keyboardNav = false;
  };
  document.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('pointerdown', onPointerDownGlobal, true);
  cleanups.push(() => {
    document.removeEventListener('keydown', onKeyDown, true);
    document.removeEventListener('pointerdown', onPointerDownGlobal, true);
  });

  for (const el of collectMatching(root, FOCUS_SELECTOR)) {
    cleanups.push(attachFocusHalo(el, () => keyboardNav));
  }
  for (const el of collectMatching(root, 'snice-switch, snice-slider')) {
    cleanups.push(attachGlassLens(el));
  }
  for (const el of collectMatching(root, 'snice-tabs')) {
    cleanups.push(attachSegmentedTabs(el));
  }
  for (const el of collectMatching(root, 'snice-nav')) {
    cleanups.push(attachScrollVibrancy(el));
  }

  return () => {
    for (let i = cleanups.length - 1; i >= 0; i--) {
      cleanups[i]();
    }
  };
}
