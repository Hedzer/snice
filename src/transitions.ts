/**
 * Generic transition system for animating between elements
 */

export interface Transition {
  /**
   * Name of the transition (for identification)
   */
  name?: string;
  
  /**
   * Duration of the out transition in ms
   */
  outDuration?: number;
  
  /**
   * Duration of the in transition in ms
   */
  inDuration?: number;
  
  /**
   * CSS properties for the out transition (as string)
   * Example: 'opacity: 0; transform: scale(0.9)'
   */
  out?: string;
  
  /**
   * CSS properties for the in transition (as string)
   * Example: 'opacity: 1; transform: scale(1)'
   */
  in?: string;
  
  /**
   * Transition mode:
   * - 'sequential': out transition completes before in transition starts
   * - 'simultaneous': both transitions happen at the same time
   */
  mode?: 'sequential' | 'simultaneous';
}

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
export async function performTransition(
  container: Element,
  oldElement: HTMLElement,
  newElement: HTMLElement,
  transition: Transition = {}
): Promise<void> {
  const outDuration = transition.outDuration || 300;
  const inDuration = transition.inDuration || 300;
  const mode = transition.mode || 'sequential';

  // Default transitions
  const outStyles = transition.out ? parseStyles(transition.out) : { opacity: '0' };
  const inStartStyles = { opacity: '0' }; // Always start invisible
  const inEndStyles = transition.in ? parseStyles(transition.in) : { opacity: '1' };

  // Set container to relative positioning to allow absolute positioning
  // Skip for layout elements to avoid jumpy transitions
  const containerStyle = (container as HTMLElement).style;
  const originalPosition = containerStyle.position;
  const isLayoutElement = container.tagName.includes('-') && container.shadowRoot;
  
  if (!isLayoutElement) {
    containerStyle.position = 'relative';
  }

  // Check if elements are slotted (inside a layout)
  const isSlottedTransition = oldElement.hasAttribute('slot') || newElement.hasAttribute('slot');
  
  if (isSlottedTransition) {
    // For slotted elements, use absolute with width/height for crossfade
    oldElement.style.position = 'absolute';
    oldElement.style.width = '100%';
    oldElement.style.height = '100%';
    oldElement.style.transition = `opacity ${outDuration}ms ease-in-out`;
    
    newElement.style.position = 'absolute';
    newElement.style.width = '100%';
    newElement.style.height = '100%';
    newElement.style.transition = `opacity ${inDuration}ms ease-in-out`;
  } else {
    // Original absolute positioning for non-slotted elements
    oldElement.style.position = 'absolute';
    oldElement.style.top = '0';
    oldElement.style.left = '0';
    oldElement.style.width = '100%';
    oldElement.style.transition = `all ${outDuration}ms ease-in-out`;

    newElement.style.position = 'absolute';
    newElement.style.top = '0';
    newElement.style.left = '0';
    newElement.style.width = '100%';
  }
  Object.assign(newElement.style, inStartStyles);
  newElement.style.transition = `all ${inDuration}ms ease-in-out`;

  // Add new element to container
  container.appendChild(newElement);

  // Force browser to calculate styles
  void newElement.offsetHeight;

  if (mode === 'simultaneous') {
    // Start both transitions at once
    Object.assign(oldElement.style, outStyles);
    Object.assign(newElement.style, inEndStyles);
    
    // Wait for both transitions to complete
    await new Promise(resolve => setTimeout(resolve, Math.max(outDuration, inDuration)));
  } else {
    // Sequential: transition out old, then transition in new
    Object.assign(oldElement.style, outStyles);
    await new Promise(resolve => setTimeout(resolve, outDuration));
    
    Object.assign(newElement.style, inEndStyles);
    await new Promise(resolve => setTimeout(resolve, inDuration));
  }

  // Cleanup
  oldElement.remove();
  
  if (isSlottedTransition) {
    // Cleanup for slotted elements
    newElement.style.position = '';
    newElement.style.width = '';
    newElement.style.height = '';
    newElement.style.transition = '';
  } else {
    // Cleanup for non-slotted elements
    newElement.style.position = '';
    newElement.style.top = '';
    newElement.style.left = '';
    newElement.style.width = '';
    newElement.style.transition = '';
  }
  
  // Reset any transition styles
  Object.keys({...inStartStyles, ...inEndStyles}).forEach(prop => {
    newElement.style[prop as any] = '';
  });
  if (!isLayoutElement) {
    containerStyle.position = originalPosition;
  }
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