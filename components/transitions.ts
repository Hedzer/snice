// Import all transitions from core
import { 
  fadeTransition,
  slideTransition,
  slideRightTransition,
  slideUpTransition,
  slideDownTransition,
  scaleTransition,
  rotateTransition,
  flipTransition,
  zoomTransition,
  noneTransition,
  type Transition,
  performTransition
} from '../src/transitions';

/**
 * Map of all transitions for components to use
 * This is in components folder to avoid affecting tree-shaking in core library
 */
export const transitions: Record<string, Transition> = {
  fade: fadeTransition,
  slide: slideTransition,
  'slide-right': slideRightTransition,
  'slide-up': slideUpTransition,
  'slide-down': slideDownTransition,
  scale: scaleTransition,
  rotate: rotateTransition,
  flip: flipTransition,
  zoom: zoomTransition,
  none: noneTransition
};

/**
 * Perform a transition between two panels that need to stay in the DOM
 * Unlike performTransition, this doesn't add/remove elements
 */
export async function performPanelTransition(
  oldPanel: HTMLElement,
  newPanel: HTMLElement,
  transition: Transition = {}
): Promise<void> {
  // If panels are the same, just return
  if (oldPanel === newPanel) return;
  
  // Get parent container
  const parent = oldPanel.parentElement;
  if (!parent) return;
  
  // Create temporary container to perform the transition
  const container = document.createElement('div');
  container.style.position = 'relative';
  container.style.width = '100%';
  container.style.overflow = 'hidden';
  
  // Calculate container height to prevent layout shift
  const oldHeight = oldPanel.offsetHeight;
  container.style.minHeight = `${oldHeight}px`;
  
  // Clone the panels for transition
  const oldClone = oldPanel.cloneNode(true) as HTMLElement;
  const newClone = newPanel.cloneNode(true) as HTMLElement;
  
  // Insert container before old panel
  parent.insertBefore(container, oldPanel);
  
  // Add the old clone to the container first
  container.appendChild(oldClone);
  
  // Hide the original panels during transition
  oldPanel.style.visibility = 'hidden';
  oldPanel.style.position = 'absolute';
  newPanel.hidden = false;
  newPanel.style.visibility = 'hidden';
  newPanel.style.position = 'absolute';
  
  try {
    // Perform the transition with clones
    // performTransition expects oldClone to already be in container
    await performTransition(container, oldClone, newClone, transition);
  } catch (error) {
    console.error('Transition error:', error);
  }
  
  // Restore original panels
  oldPanel.style.visibility = '';
  oldPanel.style.position = '';
  oldPanel.hidden = true;
  newPanel.style.visibility = '';
  newPanel.style.position = '';
  
  // Remove temporary container
  container.remove();
}