/**
 * Render tracking for testing/debugging
 * Uses symbols and generators to "pull" render events from elements
 * Use Symbol.for() to ensure symbols are shared across multiple Snice instances
 */

export const RENDER_TRACKER = Symbol.for('snice:renderTracker');
export const TRACK_RENDERS = Symbol.for('snice:trackRenders');

/**
 * Generator that yields after each render of an element
 * Usage in tests:
 *   const tracker = trackRenders(element);
 *   element.someProp = 'value';
 *   await tracker.next(); // waits for next render
 */
export async function* trackRenders(element: HTMLElement): AsyncGenerator<void, void, unknown> {
  const renders: Array<() => void> = [];
  let resolveNext: (() => void) | null = null;

  // Set up symbol on element to signal we want render events
  (element as any)[TRACK_RENDERS] = (renderComplete: Promise<void>) => {
    renderComplete.then(() => {
      if (resolveNext) {
        const resolve = resolveNext;
        resolveNext = null;
        resolve();
      } else {
        // No one waiting, queue it
        renders.push(() => {});
      }
    });
  };

  try {
    while (true) {
      if (renders.length > 0) {
        renders.shift();
        yield;
      } else {
        // Wait for next render
        await new Promise<void>(resolve => {
          resolveNext = resolve;
        });
        yield;
      }
    }
  } finally {
    // Cleanup
    delete (element as any)[TRACK_RENDERS];
  }
}
