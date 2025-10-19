/**
 * Custom element readiness utilities
 * Handles waiting for custom elements to be defined with timeout warnings
 */

/**
 * Global flag to disable custom element readiness timeout warnings
 * Set this to true in environments where slow element registration is expected
 */
export let DISABLE_ELEMENT_READY_WARNINGS = false;

/**
 * Set whether to disable custom element readiness timeout warnings
 */
export function setDisableElementReadyWarnings(value: boolean): void {
  DISABLE_ELEMENT_READY_WARNINGS = value;
}

/**
 * Default timeout for custom element registration warning (500ms)
 */
const DEFAULT_WARNING_TIMEOUT = 500;

/**
 * Wait for a custom element to be defined
 * Logs a warning if it takes longer than the warning timeout
 *
 * @param tagName - The custom element tag name
 * @param warningTimeout - Time in ms before warning (default 500ms)
 * @returns Promise that resolves when element is defined
 */
export async function waitForElementDefined(
  tagName: string,
  warningTimeout = DEFAULT_WARNING_TIMEOUT
): Promise<void> {
  // If already defined, return immediately
  if (customElements.get(tagName)) {
    return;
  }

  // Set up warning timer if not disabled
  let warningTimer: any = null;
  if (!DISABLE_ELEMENT_READY_WARNINGS) {
    warningTimer = setTimeout(() => {
      console.warn(
        `Custom element <${tagName}> is taking longer than ${warningTimeout}ms to register. ` +
        `This may indicate a missing import or circular dependency. ` +
        `Set DISABLE_ELEMENT_READY_WARNINGS=true to disable this warning.`
      );
    }, warningTimeout);
  }

  try {
    // Wait for element to be defined
    await customElements.whenDefined(tagName);
  } finally {
    // Clear warning timer
    if (warningTimer) {
      clearTimeout(warningTimer);
    }
  }
}

/**
 * Wait for a custom element to be defined and ready
 * First waits for the element to be registered, then waits for its ready promise
 *
 * @param element - The custom element instance
 * @param warningTimeout - Time in ms before warning about registration (default 500ms)
 * @returns Promise that resolves when element is defined and ready
 */
export async function waitForElementReady(
  element: HTMLElement,
  warningTimeout = DEFAULT_WARNING_TIMEOUT
): Promise<void> {
  const tagName = element.tagName.toLowerCase();

  // Wait for element to be defined
  await waitForElementDefined(tagName, warningTimeout);

  // Wait for element's ready promise if it exists
  if ('ready' in element && typeof (element as any).ready?.then === 'function') {
    await (element as any).ready;
  }
}

/**
 * Process all custom elements in a node tree and wait for them to be ready
 * This is useful after inserting a template with custom elements
 *
 * @param node - The root node to scan for custom elements
 * @param warningTimeout - Time in ms before warning about registration (default 500ms)
 * @returns Promise that resolves when all custom elements are ready
 */
export async function waitForAllCustomElements(
  node: Node,
  warningTimeout = DEFAULT_WARNING_TIMEOUT
): Promise<void> {
  const customElements: HTMLElement[] = [];

  // Find all custom elements (tag names with hyphens)
  if (node instanceof Element) {
    if (node.tagName.includes('-')) {
      customElements.push(node as HTMLElement);
    }

    // Also check in shadow DOM
    if (node.shadowRoot) {
      const shadowCustomElements = node.shadowRoot.querySelectorAll('*');
      shadowCustomElements.forEach(el => {
        if (el.tagName.includes('-')) {
          customElements.push(el as HTMLElement);
        }
      });
    }
  }

  // If it's a DocumentFragment, check all children
  if (node instanceof DocumentFragment) {
    const elements = node.querySelectorAll('*');
    elements.forEach(el => {
      if (el.tagName.includes('-')) {
        customElements.push(el as HTMLElement);
      }
    });
  }

  // Wait for all custom elements to be ready
  await Promise.all(
    customElements.map(el => waitForElementReady(el, warningTimeout))
  );
}
