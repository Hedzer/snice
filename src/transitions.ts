/**
 * Generic transition system for animating between elements
 */

import { Transition } from './types/transition';

// Re-export Transition type for external consumers
export type { Transition };


/**
 * Parse CSS property string into an object
 */
function parseStyles(styleString: string): Record<string, string> {
  const styles: Record<string, string> = {};
  styleString.split(';').forEach(rule => {
    const [prop, value] = rule.split(':').map(s => s.trim());
    if (prop && value) {
      styles[prop] = value;
    }
  });
  return styles;
}

/**
 * Perform a transition between two elements
 */
const enum TransitionMode {
  SEQUENTIAL = 'sequential',
  SIMULTANEOUS = 'simultaneous'
}

function applyBaseTransitionStyles(el: HTMLElement, isSlotted: boolean, duration: number, prop: string) {
  el.style.position = 'absolute';
  el.style.width = '100%';

  if (isSlotted) {
    el.style.height = '100%';
    el.style.transition = `opacity ${duration}ms ease-in-out`;
    return;
  }

  el.style.top = '0';
  el.style.left = '0';
  el.style.transition = `${prop} ${duration}ms ease-in-out`;
}

function resetTransitionStyles(el: HTMLElement, isSlotted: boolean) {
  el.style.position = '';
  el.style.width = '';
  el.style.transition = '';

  if (isSlotted) {
    el.style.height = '';
    return;
  }

  el.style.top = '';
  el.style.left = '';
}

export async function performTransition(
  container: Element,
  oldElement: HTMLElement,
  newElement: HTMLElement,
  transition: Transition = {}
): Promise<void> {
  const outDuration = transition.outDuration || 300;
  const inDuration = transition.inDuration || 300;
  const mode = (transition.mode || 'sequential') as TransitionMode;

  const outStyles = transition.out ? parseStyles(transition.out) : { opacity: '0' };
  const inStartStyles = { opacity: '0' };
  const inEndStyles = transition.in ? parseStyles(transition.in) : { opacity: '1' };

  const containerStyle = (container as HTMLElement).style;
  const originalPosition = containerStyle.position;
  const isLayoutElement = container.tagName.includes('-') && container.shadowRoot;

  if (!isLayoutElement) containerStyle.position = 'relative';

  const isSlotted = oldElement.hasAttribute('slot') || newElement.hasAttribute('slot');

  applyBaseTransitionStyles(oldElement, isSlotted, outDuration, 'all');
  applyBaseTransitionStyles(newElement, isSlotted, inDuration, 'all');
  Object.assign(newElement.style, inStartStyles);

  container.appendChild(newElement);
  void newElement.offsetHeight;

  // Animate
  switch (mode) {
    case TransitionMode.SIMULTANEOUS:
      Object.assign(oldElement.style, outStyles);
      Object.assign(newElement.style, inEndStyles);
      await new Promise(resolve => setTimeout(resolve, Math.max(outDuration, inDuration)));
      break;

    case TransitionMode.SEQUENTIAL:
      Object.assign(oldElement.style, outStyles);
      await new Promise(resolve => setTimeout(resolve, outDuration));
      Object.assign(newElement.style, inEndStyles);
      await new Promise(resolve => setTimeout(resolve, inDuration));
      break;
  }

  // Cleanup
  oldElement.remove();
  resetTransitionStyles(newElement, isSlotted);

  Object.keys({...inStartStyles, ...inEndStyles}).forEach(prop => {
    newElement.style[prop as any] = '';
  });

  if (!isLayoutElement) containerStyle.position = originalPosition;
}

/**
 * Predefined transitions
 */

// Fade transition
export const fadeTransition: Transition = {
  name: 'fade',
  outDuration: 200,
  inDuration: 200,
  out: 'opacity: 0',
  in: 'opacity: 1',
  mode: 'simultaneous'
};

// Slide transition (from left)
export const slideTransition: Transition = {
  name: 'slide',
  outDuration: 300,
  inDuration: 300,
  out: 'transform: translateX(-100%)',
  in: 'transform: translateX(0)',
  mode: 'sequential'
};

// Slide from right
export const slideRightTransition: Transition = {
  name: 'slide-right',
  outDuration: 300,
  inDuration: 300,
  out: 'transform: translateX(100%)',
  in: 'transform: translateX(0)',
  mode: 'sequential'
};

// Slide from top
export const slideUpTransition: Transition = {
  name: 'slide-up',
  outDuration: 300,
  inDuration: 300,
  out: 'transform: translateY(-100%)',
  in: 'transform: translateY(0)',
  mode: 'sequential'
};

// Slide from bottom
export const slideDownTransition: Transition = {
  name: 'slide-down',
  outDuration: 300,
  inDuration: 300,
  out: 'transform: translateY(100%)',
  in: 'transform: translateY(0)',
  mode: 'sequential'
};

// Scale transition
export const scaleTransition: Transition = {
  name: 'scale',
  outDuration: 250,
  inDuration: 250,
  out: 'transform: scale(0.9); opacity: 0',
  in: 'transform: scale(1); opacity: 1',
  mode: 'simultaneous'
};

// Rotate transition
export const rotateTransition: Transition = {
  name: 'rotate',
  outDuration: 400,
  inDuration: 400,
  out: 'transform: rotate(180deg) scale(0.5); opacity: 0',
  in: 'transform: rotate(0) scale(1); opacity: 1',
  mode: 'simultaneous'
};

// Flip transition
export const flipTransition: Transition = {
  name: 'flip',
  outDuration: 400,
  inDuration: 400,
  out: 'transform: rotateY(180deg); opacity: 0',
  in: 'transform: rotateY(0); opacity: 1',
  mode: 'sequential'
};

// Zoom transition
export const zoomTransition: Transition = {
  name: 'zoom',
  outDuration: 300,
  inDuration: 300,
  out: 'transform: scale(2); opacity: 0',
  in: 'transform: scale(1); opacity: 1',
  mode: 'simultaneous'
};

// None transition (instant swap)
export const noneTransition: Transition = {
  name: 'none',
  outDuration: 0,
  inDuration: 0,
  out: '',
  in: '',
  mode: 'simultaneous'
};