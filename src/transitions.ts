/**
 * Generic transition system for animating between elements
 */

import { Transition, TransitionMode } from './types/transition';

// Re-export Transition type + TransitionMode enum for external consumers
export type { Transition };
export { TransitionMode };


/**
 * Parse CSS property string into an object
 */
export function parseStyles(styleString: string): Record<string, string> {
  const styles: Record<string, string> = {};
  styleString.split(';').forEach(rule => {
    const idx = rule.indexOf(':');
    if (idx === -1) return;
    const prop = rule.slice(0, idx).trim();
    const value = rule.slice(idx + 1).trim();
    if (prop && value) {
      styles[prop] = value;
    }
  });
  return styles;
}

/**
 * Perform a transition between two elements
 */

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
  transition: Transition = {},
  /**
   * Called at each async boundary — if it returns true, this transition has
   * been superseded by a newer navigation. We abort cleanup so we don't tear
   * down elements now owned by the newer transition.
   */
  isStale: () => boolean = () => false,
): Promise<void> {
  const outDuration = transition.outDuration ?? 300;
  const inDuration = transition.inDuration ?? 300;
  const mode = (transition.mode || 'sequential') as TransitionMode;

  const outStyles = transition.out ? parseStyles(transition.out) : { opacity: '0' };
  const inStartStyles = { opacity: '0' };
  const inEndStyles = transition.in ? parseStyles(transition.in) : { opacity: '1' };

  const containerStyle = (container as HTMLElement).style;
  const isLayoutElement = container.tagName.includes('-') && container.shadowRoot;

  // Track the position we were ORIGINALLY given, not what a concurrent
  // transition may have already written. The first transition to touch this
  // container wins; subsequent overlapping transitions reuse the same value
  // and the last one to finish restores it.
  const POS_KEY = Symbol.for('snice:transition-original-position');
  const POS_COUNT = Symbol.for('snice:transition-count');
  const c = container as any;
  if (!isLayoutElement) {
    if (!(POS_KEY in c)) {
      c[POS_KEY] = containerStyle.position;
      c[POS_COUNT] = 0;
    }
    c[POS_COUNT]++;
    containerStyle.position = 'relative';
  }

  const restorePosition = () => {
    if (isLayoutElement) return;
    c[POS_COUNT]--;
    if (c[POS_COUNT] <= 0) {
      containerStyle.position = c[POS_KEY];
      delete c[POS_KEY];
      delete c[POS_COUNT];
    }
  };

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
      if (isStale()) {
        if (newElement.parentNode === container) newElement.remove();
        restorePosition();
        return;
      }
      Object.assign(newElement.style, inEndStyles);
      await new Promise(resolve => setTimeout(resolve, inDuration));
      break;
  }

  if (isStale()) {
    // A newer navigation took over while we were animating. Don't touch
    // oldElement (the newer transition owns it now) and remove OUR newElement
    // since the newer transition appended its own.
    if (newElement.parentNode === container) newElement.remove();
    restorePosition();
    return;
  }

  // Cleanup
  oldElement.remove();
  resetTransitionStyles(newElement, isSlotted);

  Object.keys({...inStartStyles, ...inEndStyles}).forEach(prop => {
    newElement.style[prop as any] = '';
  });

  restorePosition();
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
