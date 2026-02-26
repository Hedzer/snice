type TooltipPosition =
  | 'top' | 'bottom' | 'left' | 'right'
  | 'top-start' | 'top-end'
  | 'bottom-start' | 'bottom-end'
  | 'left-start' | 'left-end'
  | 'right-start' | 'right-end';

type TooltipTrigger = 'hover' | 'click' | 'focus';

// Portal CSS inlined (from snice-tooltip-portal.css)
const portalCss = `.snice-tooltip--visible{opacity:1!important;transform:scale(1)!important}.snice-tooltip__arrow{position:absolute;width:0;height:0;border-style:solid;border-color:transparent}.snice-tooltip--top .snice-tooltip__arrow,.snice-tooltip--top-start .snice-tooltip__arrow,.snice-tooltip--top-end .snice-tooltip__arrow{bottom:-6px;border-width:6px 6px 0;border-top-color:hsl(0 0% 20%)}.snice-tooltip--bottom .snice-tooltip__arrow,.snice-tooltip--bottom-start .snice-tooltip__arrow,.snice-tooltip--bottom-end .snice-tooltip__arrow{top:-6px;border-width:0 6px 6px;border-bottom-color:hsl(0 0% 20%)}.snice-tooltip--left .snice-tooltip__arrow,.snice-tooltip--left-start .snice-tooltip__arrow,.snice-tooltip--left-end .snice-tooltip__arrow{right:-6px;border-width:6px 0 6px 6px;border-left-color:hsl(0 0% 20%)}.snice-tooltip--right .snice-tooltip__arrow,.snice-tooltip--right-start .snice-tooltip__arrow,.snice-tooltip--right-end .snice-tooltip__arrow{left:-6px;border-width:6px 6px 6px 0;border-right-color:hsl(0 0% 20%)}.snice-tooltip--top .snice-tooltip__arrow,.snice-tooltip--bottom .snice-tooltip__arrow{left:50%;transform:translateX(-50%)}.snice-tooltip--top-start .snice-tooltip__arrow,.snice-tooltip--bottom-start .snice-tooltip__arrow{left:16px}.snice-tooltip--top-end .snice-tooltip__arrow,.snice-tooltip--bottom-end .snice-tooltip__arrow{right:16px}.snice-tooltip--left .snice-tooltip__arrow,.snice-tooltip--right .snice-tooltip__arrow{top:50%;transform:translateY(-50%)}.snice-tooltip--left-start .snice-tooltip__arrow,.snice-tooltip--right-start .snice-tooltip__arrow{top:16px}.snice-tooltip--left-end .snice-tooltip__arrow,.snice-tooltip--right-end .snice-tooltip__arrow{bottom:16px;top:auto}`;

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

let portalStylesInjected = false;

function ensurePortalStyles() {
  if (portalStylesInjected) return;
  try {
    if ('adoptedStyleSheets' in document && 'CSSStyleSheet' in window) {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(portalCss);
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    } else {
      const style = document.createElement('style');
      style.textContent = portalCss;
      document.head.appendChild(style);
    }
    portalStylesInjected = true;
  } catch (error) {
    console.warn('Failed to inject tooltip portal styles:', error);
  }
}

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

// --- Positioning (ported from snice-tooltip.ts) ---

function getPositionCoordinates(
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  position: TooltipPosition,
  offset: number,
  arrowSize: number
) {
  let left = 0;
  let top = 0;
  const centerX = triggerRect.left + triggerRect.width / 2;
  const centerY = triggerRect.top + triggerRect.height / 2;
  const verticalOffset = offset;
  const horizontalOffset = offset + arrowSize;

  switch (position) {
    case 'top':
      left = centerX - tooltipRect.width / 2;
      top = triggerRect.top - tooltipRect.height - verticalOffset;
      break;
    case 'top-start':
      left = triggerRect.left;
      top = triggerRect.top - tooltipRect.height - verticalOffset;
      break;
    case 'top-end':
      left = triggerRect.right - tooltipRect.width;
      top = triggerRect.top - tooltipRect.height - verticalOffset;
      break;
    case 'bottom':
      left = centerX - tooltipRect.width / 2;
      top = triggerRect.bottom + verticalOffset;
      break;
    case 'bottom-start':
      left = triggerRect.left;
      top = triggerRect.bottom + verticalOffset;
      break;
    case 'bottom-end':
      left = triggerRect.right - tooltipRect.width;
      top = triggerRect.bottom + verticalOffset;
      break;
    case 'left':
      left = triggerRect.left - tooltipRect.width - horizontalOffset;
      top = centerY - tooltipRect.height / 2;
      break;
    case 'left-start':
      left = triggerRect.left - tooltipRect.width - horizontalOffset;
      top = triggerRect.top;
      break;
    case 'left-end':
      left = triggerRect.left - tooltipRect.width - horizontalOffset;
      top = triggerRect.bottom - tooltipRect.height;
      break;
    case 'right':
      left = triggerRect.right + horizontalOffset;
      top = centerY - tooltipRect.height / 2;
      break;
    case 'right-start':
      left = triggerRect.right + horizontalOffset;
      top = triggerRect.top;
      break;
    case 'right-end':
      left = triggerRect.right + horizontalOffset;
      top = triggerRect.bottom - tooltipRect.height;
      break;
  }
  return { left, top };
}

function getAlternativePositions(position: TooltipPosition): TooltipPosition[] {
  const opposites: Record<string, TooltipPosition[]> = {
    'top': ['bottom', 'left', 'right'],
    'top-start': ['bottom-start', 'left', 'right'],
    'top-end': ['bottom-end', 'left', 'right'],
    'bottom': ['top', 'left', 'right'],
    'bottom-start': ['top-start', 'left', 'right'],
    'bottom-end': ['top-end', 'left', 'right'],
    'left': ['right', 'top', 'bottom'],
    'left-start': ['right-start', 'top', 'bottom'],
    'left-end': ['right-end', 'top', 'bottom'],
    'right': ['left', 'top', 'bottom'],
    'right-start': ['left-start', 'top', 'bottom'],
    'right-end': ['left-end', 'top', 'bottom'],
  };
  return opposites[position] || ['top', 'bottom', 'left', 'right'];
}

function calculatePosition(
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  position: TooltipPosition,
  offset: number,
  arrowSize: number,
  strictPositioning: boolean
) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let pos = position;
  let coords = getPositionCoordinates(triggerRect, tooltipRect, pos, offset, arrowSize);

  if (!strictPositioning) {
    const fits =
      coords.left >= 0 &&
      coords.top >= 0 &&
      coords.left + tooltipRect.width <= vw &&
      coords.top + tooltipRect.height <= vh;

    if (!fits) {
      for (const alt of getAlternativePositions(pos)) {
        const altCoords = getPositionCoordinates(triggerRect, tooltipRect, alt, offset, arrowSize);
        if (
          altCoords.left >= 0 &&
          altCoords.top >= 0 &&
          altCoords.left + tooltipRect.width <= vw &&
          altCoords.top + tooltipRect.height <= vh
        ) {
          pos = alt;
          coords = altCoords;
          break;
        }
      }
    }
  }

  return { left: coords.left, top: coords.top, adjustedPosition: pos };
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

    // Update arrow — CSS handles color via class-based rules, but we need
    // the arrow element to exist/not-exist
    let arrow = p.querySelector('.snice-tooltip__arrow') as HTMLElement | null;
    if (config.arrow && !arrow) {
      arrow = document.createElement('div');
      arrow.className = 'snice-tooltip__arrow';
      arrow.style.cssText = 'position:absolute;width:0;height:0;border-style:solid;';
      p.appendChild(arrow);
    } else if (!config.arrow && arrow) {
      arrow.style.display = 'none';
    } else if (config.arrow && arrow) {
      arrow.style.display = '';
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
  // Skip if already attached
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
  const tooltip = el.getAttribute('tooltip');
  if (tooltip) {
    attachTooltip(el);
  }
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
        if (el.hasAttribute('tooltip')) {
          // Attribute added or changed — detach old, re-attach
          detachTooltip(el);
          attachTooltip(el);
        } else {
          // Attribute removed
          detachTooltip(el);
        }
      } else if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node instanceof HTMLElement) {
            processElement(node);
            node.querySelectorAll('[tooltip]').forEach(processElement);
          }
        });
        mutation.removedNodes.forEach(node => {
          if (node instanceof HTMLElement) {
            detachTooltip(node);
            node.querySelectorAll('[tooltip]').forEach(child => {
              if (child instanceof HTMLElement) detachTooltip(child);
            });
          }
        });
      }
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
