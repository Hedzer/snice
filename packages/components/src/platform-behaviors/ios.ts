/**
 * iOS 26+ Liquid Glass contemporary micro-behaviors (tree-shakeable, 0 B in non-iOS builds).
 *
 * Implements browser-expressible native iOS 26+ interaction physics:
 * 1. Interactive Liquid Glass press/drag magnification & thumb stretch on snice-switch & snice-slider
 * 2. Sliding Liquid Glass capsule pill on snice-tabs / segmented controls
 * 3. Spring-driven bottom-sheet drag detents & rubber-band physics on bottom snice-drawer / sheet snice-modal
 * 4. Optional scroll-condense morphing (`data-condensed="true"`) on snice-nav / bottom snice-tabs
 */
import { prefersReducedMotion, type PlatformBehaviorCleanup } from './types';

export const platform = 'ios' as const;

function attachSwitchBehavior(el: Element): PlatformBehaviorCleanup {
  const root = el.shadowRoot;
  if (!root) return () => {};
  let activePointerId: number | null = null;
  let startX = 0;
  let moved = false;

  const setPressed = (pressed: boolean, dragOffset = 0) => {
    const thumb = root.querySelector<HTMLElement>('[part~="thumb"]');
    const track = root.querySelector<HTMLElement>('[part~="track"]');
    if (!thumb || !track) return;
    if (pressed) {
      el.setAttribute('data-ios-pressed', 'true');
      thumb.style.setProperty('--snice-ios-drag-x', `${dragOffset}px`);
    } else {
      el.removeAttribute('data-ios-pressed');
      thumb.style.removeProperty('--snice-ios-drag-x');
    }
  };

  const onPointerDown = (e: Event) => {
    const pe = e as PointerEvent;
    if (el.hasAttribute('disabled') || el.hasAttribute('loading')) return;
    activePointerId = pe.pointerId;
    startX = pe.clientX;
    moved = false;
    setPressed(true, 0);
  };

  const onPointerMove = (e: Event) => {
    const pe = e as PointerEvent;
    if (activePointerId === null || pe.pointerId !== activePointerId) return;
    const dx = pe.clientX - startX;
    if (Math.abs(dx) > 4) moved = true;
    const clamped = Math.max(-10, Math.min(10, dx * 0.45));
    setPressed(true, prefersReducedMotion(el) ? 0 : clamped);
  };

  const onPointerEnd = (e: Event) => {
    const pe = e as PointerEvent;
    if (activePointerId === null || pe.pointerId !== activePointerId) return;
    const dx = pe.clientX - startX;
    activePointerId = null;
    setPressed(false, 0);
    if (moved && Math.abs(dx) > 16) {
      const sw = el as HTMLElement & { checked?: boolean; click?: () => void };
      const wantChecked = dx > 0;
      if (typeof sw.checked === 'boolean' && sw.checked !== wantChecked) {
        sw.click?.();
      }
    }
  };

  root.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerEnd);
  window.addEventListener('pointercancel', onPointerEnd);

  return () => {
    setPressed(false, 0);
    root.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerEnd);
    window.removeEventListener('pointercancel', onPointerEnd);
  };
}

function attachSliderBehavior(el: Element): PlatformBehaviorCleanup {
  const root = el.shadowRoot;
  if (!root) return () => {};
  let dragging = false;

  const setActive = (active: boolean) => {
    if (active) el.setAttribute('data-ios-pressed', 'true');
    else el.removeAttribute('data-ios-pressed');
  };

  const onDown = () => {
    if (el.hasAttribute('disabled') || el.hasAttribute('readonly')) return;
    dragging = true;
    setActive(true);
  };
  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    setActive(false);
  };

  root.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);

  return () => {
    setActive(false);
    root.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
  };
}

function attachTabsPillBehavior(el: Element): PlatformBehaviorCleanup {
  const root = el.shadowRoot;
  if (!root) return () => {};

  const syncPill = () => {
    const track = root.querySelector<HTMLElement>('[part~="nav-track"]');
    const pill = root.querySelector<HTMLElement>('[part~="pill"]');
    if (!track || !pill) return;

    const tabs = Array.from(el.querySelectorAll<HTMLElement>('snice-tab[slot="nav"]'));
    if (tabs.length === 0) return;
    const selectedIdx = Number((el as any).selected ?? 0);
    const activeTab = tabs[selectedIdx] ?? tabs.find((t) => t.getAttribute('aria-selected') === 'true') ?? tabs[0];
    if (!activeTab) return;

    const trackRect = track.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    if (tabRect.width === 0 && tabRect.height === 0) return;

    const left = tabRect.left - trackRect.left + track.scrollLeft;
    const top = tabRect.top - trackRect.top + track.scrollTop;
    pill.style.width = `${tabRect.width}px`;
    pill.style.height = `${Math.max(28, tabRect.height - 6)}px`;
    pill.style.transform = `translate3d(${left}px, ${top + 3}px, 0)`;
    pill.style.opacity = '1';
  };

  const scheduleSync = () => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(syncPill);
    } else {
      syncPill();
    }
  };

  el.addEventListener('tab-change', scheduleSync);
  el.addEventListener('click', scheduleSync);
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(scheduleSync) : null;
  const nav = root.querySelector('[part~="nav"]');
  if (ro && nav) ro.observe(nav);
  scheduleSync();

  return () => {
    el.removeEventListener('tab-change', scheduleSync);
    el.removeEventListener('click', scheduleSync);
    ro?.disconnect();
  };
}

function attachSheetDragBehavior(el: Element): PlatformBehaviorCleanup {
  const root = el.shadowRoot;
  if (!root) return () => {};

  let dragging = false;
  let pointerId = -1;
  let startY = 0;
  let lastY = 0;
  let lastTime = 0;
  let velocityY = 0;
  let activePanel: HTMLElement | null = null;

  const isBottomSheet = () => {
    if (el.tagName.toLowerCase() === 'snice-drawer') {
      return el.getAttribute('position') === 'bottom';
    }
    return false;
  };

  const onPointerDown = (e: Event) => {
    const pe = e as PointerEvent;
    if (!isBottomSheet() || !el.hasAttribute('open')) return;
    const target = pe.target as HTMLElement | null;
    if (!target) return;
    const isGrabberOrHeader = Boolean(
      target.closest('[part~="grabber"], [part~="header"]')
    );
    const body = root.querySelector<HTMLElement>('[part~="body"]');
    if (!isGrabberOrHeader) {
      // Yield to inner scrollable content when scrolled down
      if (body && body.scrollTop > 0) return;
      return;
    }

    activePanel = root.querySelector<HTMLElement>('[part~="base"]');
    if (!activePanel) return;
    dragging = true;
    pointerId = pe.pointerId;
    startY = pe.clientY;
    lastY = pe.clientY;
    lastTime = performance.now();
    velocityY = 0;
    activePanel.style.transition = 'none';
    el.setAttribute('data-ios-dragging', 'true');
  };

  const onPointerMove = (e: Event) => {
    const pe = e as PointerEvent;
    if (!dragging || pe.pointerId !== pointerId || !activePanel) return;
    const dy = pe.clientY - startY;
    const now = performance.now();
    const dt = Math.max(1, now - lastTime);
    velocityY = (pe.clientY - lastY) / dt;
    lastY = pe.clientY;
    lastTime = now;

    // Rubber-band resistance when pulling upward past top detent
    const offset = dy < 0 ? -Math.pow(Math.abs(dy), 0.72) : dy;
    activePanel.style.transform = `translate3d(0, ${offset}px, 0)`;
  };

  const onPointerEnd = (e: Event) => {
    const pe = e as PointerEvent;
    if (!dragging || pe.pointerId !== pointerId || !activePanel) return;
    const dy = pe.clientY - startY;
    const panelHeight = activePanel.getBoundingClientRect().height || 300;
    dragging = false;
    pointerId = -1;
    el.removeAttribute('data-ios-dragging');

    const panel = activePanel;
    activePanel = null;
    panel.style.transition = prefersReducedMotion(el)
      ? 'none'
      : 'transform 320ms var(--snice-ios-spring-sheet, cubic-bezier(0.32, 0.72, 0, 1))';

    const shouldDismiss =
      !el.hasAttribute('persistent') && (dy > panelHeight * 0.32 || velocityY > 0.55);

    if (shouldDismiss) {
      panel.style.transform = '';
      const drawer = el as HTMLElement & { hide?: () => void; open?: boolean };
      if (typeof drawer.hide === 'function') drawer.hide();
      else drawer.open = false;
    } else {
      // Snap back to detent
      panel.style.transform = 'translate3d(0, 0, 0)';
      setTimeout(() => {
        if (!dragging) {
          panel.style.transition = '';
          panel.style.transform = '';
        }
      }, prefersReducedMotion(el) ? 0 : 340);
    }
  };

  root.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerEnd);
  window.addEventListener('pointercancel', onPointerEnd);

  return () => {
    el.removeAttribute('data-ios-dragging');
    root.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerEnd);
    window.removeEventListener('pointercancel', onPointerEnd);
  };
}

function attachNavCondenseBehavior(el: Element): PlatformBehaviorCleanup {
  let lastY = typeof window !== 'undefined' ? window.scrollY : 0;
  const scrollHost = el.closest<HTMLElement>('[data-ios-scroll-container]');
  const target: EventTarget | null = scrollHost ?? (typeof window !== 'undefined' ? window : null);
  if (!target) return () => {};

  const getScrollY = () => (scrollHost ? scrollHost.scrollTop : window.scrollY);

  const onScroll = () => {
    const y = getScrollY();
    if (y > 32 && y > lastY + 4) {
      el.setAttribute('data-condensed', 'true');
    } else if (y < 16 || y < lastY - 6) {
      el.removeAttribute('data-condensed');
    }
    lastY = y;
  };

  target.addEventListener('scroll', onScroll, { passive: true });
  return () => {
    el.removeAttribute('data-condensed');
    target.removeEventListener('scroll', onScroll);
  };
}

function attachSingleElement(el: Element): PlatformBehaviorCleanup {
  const tag = el.tagName.toLowerCase();
  if (tag === 'snice-switch') return attachSwitchBehavior(el);
  if (tag === 'snice-slider') return attachSliderBehavior(el);
  if (tag === 'snice-tabs') return attachTabsPillBehavior(el);
  if (tag === 'snice-drawer') return attachSheetDragBehavior(el);
  if (tag === 'snice-nav') return attachNavCondenseBehavior(el);
  return () => {};
}

const IOS_INTERACTIVE_SELECTOR = 'snice-switch, snice-slider, snice-tabs, snice-drawer, snice-nav';

export function attach(root: Document | Element): PlatformBehaviorCleanup {
  if (root instanceof Element && root.tagName.toLowerCase().startsWith('snice-')) {
    return attachSingleElement(root);
  }

  const container = root instanceof Document ? root.documentElement : root;
  if (!container) return () => {};

  const bound = new Map<Element, PlatformBehaviorCleanup>();

  const sync = () => {
    const found = new Set(Array.from(container.querySelectorAll(IOS_INTERACTIVE_SELECTOR)));
    for (const [el, cleanup] of Array.from(bound.entries())) {
      if (!found.has(el)) {
        cleanup();
        bound.delete(el);
      }
    }
    for (const el of found) {
      // Skip elements nested inside another inner [data-platform] scope
      const nearest = el.closest('[data-platform]');
      if (nearest && nearest !== container && nearest.getAttribute('data-platform') !== 'ios') {
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
