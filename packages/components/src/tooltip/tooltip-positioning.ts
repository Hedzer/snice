import type { TooltipPosition } from './snice-tooltip.types';
import portalCss from './snice-tooltip-portal.css?inline';

let portalStylesInjected = false;

export function ensurePortalStyles() {
  if (portalStylesInjected) return;
  try {
    if ('adoptedStyleSheets' in document && 'CSSStyleSheet' in window) {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(portalCss);
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
      portalStylesInjected = true;
      return;
    }
    const style = document.createElement('style');
    style.textContent = portalCss;
    document.head.appendChild(style);
    portalStylesInjected = true;
  } catch (error) {
    console.warn('Failed to inject tooltip portal styles:', error);
  }
}

export function resetPortalStyles() {
  portalStylesInjected = false;
}

export function getPositionCoordinates(
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

export function getAlternativePositions(position: TooltipPosition): TooltipPosition[] {
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

export function calculatePosition(
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

  if (strictPositioning) {
    return { left: coords.left, top: coords.top, adjustedPosition: pos };
  }

  const fitsViewport = (c: { left: number; top: number }) =>
    c.left >= 0 && c.top >= 0 &&
    c.left + tooltipRect.width <= vw &&
    c.top + tooltipRect.height <= vh;

  if (fitsViewport(coords)) {
    return { left: coords.left, top: coords.top, adjustedPosition: pos };
  }

  for (const alt of getAlternativePositions(pos)) {
    const altCoords = getPositionCoordinates(triggerRect, tooltipRect, alt, offset, arrowSize);
    if (fitsViewport(altCoords)) {
      return { left: altCoords.left, top: altCoords.top, adjustedPosition: alt };
    }
  }

  return { left: coords.left, top: coords.top, adjustedPosition: pos };
}
