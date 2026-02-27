import type { TooltipPosition } from './snice-tooltip.types';
import { ensurePortalStyles, calculatePosition } from './tooltip-positioning';

type TooltipTrigger = 'hover' | 'click' | 'focus';

interface TooltipConfig {
  position: TooltipPosition;
  trigger: TooltipTrigger;
  delay: number;
  hideDelay: number;
  offset: number;
  arrow: boolean;
  maxWidth: number;
  zIndex: number;
  strictPositioning: boolean;
  bg: string;
  color: string;
  padding: string;
  radius: string;
  fontSize: string;
}

interface TooltipState {
  portal: HTMLElement | null;
  listeners: { type: string; fn: EventListener }[];
  showTimeout?: number;
  hideTimeout?: number;
  activePosition: TooltipPosition;
}

const stateMap = new WeakMap<HTMLElement, TooltipState>();

function readConfig(el: HTMLElement): TooltipConfig {
  const cs = getComputedStyle(el);
  const get = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
  return {
    position: get('--tooltip-position', 'top') as TooltipPosition,
    trigger: get('--tooltip-trigger', 'hover') as TooltipTrigger,
    delay: parseInt(get('--tooltip-delay', '0'), 10),
    hideDelay: parseInt(get('--tooltip-hide-delay', '0'), 10),
    offset: parseInt(get('--tooltip-offset', '12'), 10),
    arrow: get('--tooltip-arrow', 'auto') !== 'none',
    maxWidth: parseInt(get('--tooltip-max-width', '250'), 10),
    zIndex: parseInt(get('--tooltip-z-index', '10000'), 10),
    strictPositioning: get('--tooltip-strict-positioning', '') === 'true',
    bg: get('--tooltip-bg', 'hsl(0 0% 20%)'),
    color: get('--tooltip-color', 'white'),
    padding: get('--tooltip-padding', '8px 12px'),
    radius: get('--tooltip-radius', '6px'),
    fontSize: get('--tooltip-font-size', '14px'),
  };
}

// --- Portal creation ---

function createPortal(config: TooltipConfig): HTMLElement {
  const portal = document.createElement('div');
  portal.className = `snice-tooltip snice-tooltip--${config.position}`;
  portal.setAttribute('role', 'tooltip');
  portal.style.cssText = `
    position: fixed;
    z-index: ${config.zIndex};
    padding: ${config.padding};
    background: ${config.bg};
    color: ${config.color};
    border-radius: ${config.radius};
    font-size: ${config.fontSize};
    line-height: 1.4;
    max-width: ${config.maxWidth}px;
    width: max-content;
    pointer-events: none;
    opacity: 0;
    transform: scale(0.95);
    transition: opacity 0.2s, transform 0.2s;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    display: none;
  `;

  const content = document.createElement('div');
  content.className = 'snice-tooltip__content';
  portal.appendChild(content);

  if (config.arrow) {
    const arrow = document.createElement('div');
    arrow.className = 'snice-tooltip__arrow';
    arrow.style.cssText = 'position:absolute;width:0;height:0;border-style:solid;';
    portal.appendChild(arrow);
  }

  document.body.appendChild(portal);
  return portal;
}

// --- Show / Hide ---

function showTooltip(el: HTMLElement) {
  const text = el.getAttribute('tooltip');
  if (!text) return;

  ensurePortalStyles();

  const config = readConfig(el);
  let state = stateMap.get(el);

  if (!state) {
    state = { portal: null, listeners: [], activePosition: config.position };
    stateMap.set(el, state);
  }

  // Create or update portal
  if (!state.portal) {
    state.portal = createPortal(config);
  } else {
    // Update styling in case CSS vars changed
    const p = state.portal;
    p.style.zIndex = String(config.zIndex);
    p.style.padding = config.padding;
    p.style.background = config.bg;
    p.style.color = config.color;
    p.style.borderRadius = config.radius;
    p.style.fontSize = config.fontSize;
    p.style.maxWidth = `${config.maxWidth}px`;

    // Update arrow element
    const arrow = p.querySelector('.snice-tooltip__arrow') as HTMLElement | null;
    if (config.arrow && !arrow) {
      const newArrow = document.createElement('div');
      newArrow.className = 'snice-tooltip__arrow';
      newArrow.style.cssText = 'position:absolute;width:0;height:0;border-style:solid;';
      p.appendChild(newArrow);
    } else if (arrow) {
      arrow.style.display = config.arrow ? '' : 'none';
    }
  }

  const portal = state.portal;
  const contentEl = portal.querySelector('.snice-tooltip__content');
  if (contentEl) contentEl.textContent = text;

  portal.style.display = 'block';
  void portal.offsetHeight; // force reflow

  // Position
  portal.style.visibility = 'hidden';
  portal.style.left = '-9999px';
  portal.style.top = '-9999px';

  const triggerRect = el.getBoundingClientRect();
  const tooltipRect = portal.getBoundingClientRect();

  portal.style.visibility = '';

  const arrowSize = config.arrow ? 6 : 0;
  const result = calculatePosition(
    triggerRect, tooltipRect, config.position, config.offset, arrowSize, config.strictPositioning
  );

  if (result.adjustedPosition !== state.activePosition) {
    portal.classList.remove(`snice-tooltip--${state.activePosition}`);
    portal.classList.add(`snice-tooltip--${result.adjustedPosition}`);
    state.activePosition = result.adjustedPosition;
  }

  portal.style.left = `${result.left}px`;
  portal.style.top = `${result.top}px`;
  portal.classList.add('snice-tooltip--visible');
}

function hideTooltip(el: HTMLElement) {
  const state = stateMap.get(el);
  if (!state?.portal) return;

  state.portal.classList.remove('snice-tooltip--visible');
  const p = state.portal;
  setTimeout(() => {
    if (p) p.style.display = 'none';
  }, 200);
}

function scheduleShow(el: HTMLElement) {
  const state = stateMap.get(el);
  if (!state) return;
  clearTimeouts(state);
  const config = readConfig(el);
  if (config.delay > 0) {
    state.showTimeout = window.setTimeout(() => showTooltip(el), config.delay);
  } else {
    showTooltip(el);
  }
}

function scheduleHide(el: HTMLElement) {
  const state = stateMap.get(el);
  if (!state) return;
  clearTimeouts(state);
  const config = readConfig(el);
  if (config.hideDelay > 0) {
    state.hideTimeout = window.setTimeout(() => hideTooltip(el), config.hideDelay);
  } else {
    hideTooltip(el);
  }
}

function clearTimeouts(state: TooltipState) {
  if (state.showTimeout !== undefined) {
    clearTimeout(state.showTimeout);
    state.showTimeout = undefined;
  }
  if (state.hideTimeout !== undefined) {
    clearTimeout(state.hideTimeout);
    state.hideTimeout = undefined;
  }
}

// --- Attach / Detach ---

function attachTooltip(el: HTMLElement) {
  if (stateMap.has(el)) return;

  const config = readConfig(el);
  const state: TooltipState = { portal: null, listeners: [], activePosition: config.position };
  stateMap.set(el, state);

  const addListener = (type: string, fn: EventListener) => {
    el.addEventListener(type, fn);
    state.listeners.push({ type, fn });
  };

  switch (config.trigger) {
    case 'hover':
      addListener('mouseenter', () => scheduleShow(el));
      addListener('mouseleave', () => scheduleHide(el));
      addListener('focusin', () => scheduleShow(el));
      addListener('focusout', () => scheduleHide(el));
      break;
    case 'focus':
      addListener('focusin', () => scheduleShow(el));
      addListener('focusout', () => scheduleHide(el));
      break;
    case 'click': {
      const clickOutside = (e: Event) => {
        if (!el.contains(e.target as Node)) {
          scheduleHide(el);
          document.removeEventListener('click', clickOutside);
        }
      };
      addListener('click', () => {
        const s = stateMap.get(el);
        const isVisible = s?.portal?.classList.contains('snice-tooltip--visible');
        if (isVisible) {
          scheduleHide(el);
        } else {
          scheduleShow(el);
          setTimeout(() => document.addEventListener('click', clickOutside), 0);
        }
      });
      break;
    }
  }
}

function detachTooltip(el: HTMLElement) {
  const state = stateMap.get(el);
  if (!state) return;

  clearTimeouts(state);
  for (const { type, fn } of state.listeners) {
    el.removeEventListener(type, fn);
  }
  if (state.portal) {
    state.portal.remove();
  }
  stateMap.delete(el);
}

// --- Observer ---

function processElement(el: Element) {
  if (!(el instanceof HTMLElement)) return;
  if (!el.hasAttribute('tooltip')) return;
  attachTooltip(el);
}

/**
 * Initialize attribute-based tooltips.
 * Any element with a `tooltip` attribute will show a tooltip on interaction.
 * Configure via CSS custom properties (--tooltip-position, --tooltip-delay, etc.).
 * Idempotent — safe to call multiple times.
 */
export function useTooltips() {
  if ((globalThis as any).sniceTooltipsInitialized) return;
  (globalThis as any).sniceTooltipsInitialized = true;

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'tooltip') {
        const el = mutation.target as HTMLElement;
        detachTooltip(el);
        if (el.hasAttribute('tooltip')) attachTooltip(el);
        continue;
      }

      if (mutation.type !== 'childList') continue;

      mutation.addedNodes.forEach(node => {
        if (!(node instanceof HTMLElement)) return;
        processElement(node);
        node.querySelectorAll('[tooltip]').forEach(processElement);
      });
      mutation.removedNodes.forEach(node => {
        if (!(node instanceof HTMLElement)) return;
        detachTooltip(node);
        node.querySelectorAll('[tooltip]').forEach(child => {
          if (child instanceof HTMLElement) detachTooltip(child);
        });
      });
    }
  });

  const start = () => {
    document.querySelectorAll('[tooltip]').forEach(processElement);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['tooltip'],
      childList: true,
      subtree: true,
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  (globalThis as any).sniceTooltipObserver = observer;
}

/**
 * Disconnect the tooltip observer and remove all portals.
 */
export function cleanupTooltips() {
  const observer = (globalThis as any).sniceTooltipObserver as MutationObserver | undefined;
  if (observer) {
    observer.disconnect();
    (globalThis as any).sniceTooltipObserver = undefined;
  }

  document.querySelectorAll('[tooltip]').forEach(el => {
    if (el instanceof HTMLElement) detachTooltip(el);
  });

  (globalThis as any).sniceTooltipsInitialized = false;
}

// Auto-enable in browser environments
if (typeof document !== 'undefined') {
  useTooltips();
}
