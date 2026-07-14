/**
 * Shared body scroll-lock with refcounting.
 *
 * Multiple overlay components (drawer, modal, etc.) can each lock body
 * scroll independently. Without coordination, closing one overlay would
 * unlock scroll while another is still open. This utility increments
 * a module-scope counter on lock, decrements on unlock, and only mutates
 * `document.body.style.overflow` on the 0 ↔ 1 transitions. The original
 * overflow value is captured at the first lock and restored at the last
 * unlock — important because some pages set `overflow: scroll` for layout
 * and a naive `= ''` would clobber it.
 */

let count = 0;
let savedOverflow: string | null = null;

// Test hook — `afterEach` in test suites can call `.clear()` to reset the
// counter when document.body.innerHTML is wiped. The counter is module-scope,
// so without this it survives across tests and the second test's first lock
// would only increment instead of flipping `overflow: hidden`.
const TEST_HOOK = Symbol.for('snice:body-scroll-lock');
(globalThis as any)[TEST_HOOK] = {
  clear() {
    count = 0;
    savedOverflow = null;
  },
};

export function lockBodyScroll(): void {
  if (count === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  count++;
}

export function unlockBodyScroll(): void {
  if (count === 0) return;
  count--;
  if (count === 0) {
    document.body.style.overflow = savedOverflow ?? '';
    savedOverflow = null;
  }
}

/**
 * Test/debug only — peek at the current refcount.
 */
export function getBodyScrollLockCount(): number {
  return count;
}
