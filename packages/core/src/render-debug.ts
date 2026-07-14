/**
 * Render debugging utilities for Snice v3.0.0
 * For testing and debugging only - not recommended for production use
 */

import { RENDER_CALLBACKS } from './symbols';

/**
 * Track renders of an element using an async generator
 * Each call to tracker.next() waits for the next render to complete
 *
 * @example
 * ```typescript
 * const tracker = trackRenders(element);
 *
 * element.someProp = 'new value';
 * await tracker.next(); // Waits for render
 * // DOM is now updated
 *
 * element.someProp = 'another value';
 * await tracker.next(); // Waits for next render
 * // DOM is updated again
 * ```
 *
 * WARNING: For testing/debugging only!
 * - Do not use in production code
 * - The generator yields indefinitely - use it only in controlled test environments
 * - Each yield waits for the next render event
 */
export async function* trackRenders(element: HTMLElement): AsyncGenerator<void, void, unknown> {
  while (true) {
    await new Promise<void>(resolve => {
      if (!(element as any)[RENDER_CALLBACKS]) {
        (element as any)[RENDER_CALLBACKS] = [];
      }
      (element as any)[RENDER_CALLBACKS].push(resolve);
    });
    yield;
  }
}
