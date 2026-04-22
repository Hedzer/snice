import { describe, it, expect, afterEach } from 'vitest';
import { wait } from './test-utils';

afterEach(() => {
  document.body.innerHTML = '';
  document.body.style.overflow = '';
});

// ---------------------------------------------------------------------------
// modal: scroll-lock not restored when disconnected while open
// ---------------------------------------------------------------------------
describe('modal: body scroll restored on disconnect', () => {
  it('removing open modal from DOM restores body overflow', async () => {
    await import('../../components/modal/snice-modal');
    const el = document.createElement('snice-modal') as any;
    el.open = true;
    document.body.appendChild(el);
    await el.ready;
    await wait(20);

    expect(document.body.style.overflow).toBe('hidden');

    el.remove();
    await wait(20);

    // With the bug: overflow stays 'hidden'
    // With the fix: overflow restored to ''
    expect(document.body.style.overflow).toBe('');
  });
});

// ---------------------------------------------------------------------------
// split-pane: touch listeners added in handleDividerTouchStart, only mouse
// listeners removed in @dispose → mid-drag unmount leaks touch listeners.
// We can't trigger handleDividerTouchStart in happy-dom cleanly, so simulate
// the state: call the touchstart handler, then remove element, then verify
// no orphan listeners remain by counting calls after dispatch.
// ---------------------------------------------------------------------------
describe('split-pane: touch listeners removed on dispose', () => {
  it('disconnect removes touchmove/touchend listeners registered during drag', async () => {
    await import('../../components/split-pane/snice-split-pane');
    const el = document.createElement('snice-split-pane') as any;
    document.body.appendChild(el);
    await el.ready;
    await wait(20);

    // Simulate mid-drag: directly register the touch listeners like handleDividerTouchStart does
    el.isDragging = true;
    el.startPosition = 0;
    el.startSize = 50;
    document.addEventListener('touchmove', el.handleTouchMove, { passive: false });
    document.addEventListener('touchend', el.handleTouchEnd);
    document.addEventListener('touchcancel', el.handleTouchEnd);

    el.remove();
    await wait(20);

    // After disconnect, dispatching touchmove must NOT invoke the element's
    // handleTouchMove. With the bug, the listener is still attached and
    // would be fired. With the fix, it's been removed.
    let moved = false;
    const origMove = el.handleTouchMove;
    el.handleTouchMove = () => { moved = true; origMove.call(el); };
    // Re-add our spy to measure whether the stock listener is still present
    // (we can't directly measure this, so just invoke directly and verify)

    // Cleaner check: add a flag to detect if the original listener fires.
    // Since `el.handleTouchMove` is an arrow-bound property, we check by mutating
    // el.isDragging and dispatching; if listener is still attached, size updates.
    const beforeSize = el.primarySize;
    el.isDragging = true;
    el.startSize = 50;
    el.startPosition = 0;
    document.dispatchEvent(
      Object.assign(new Event('touchmove', { cancelable: true }), {
        touches: [{ clientX: 500, clientY: 500 }],
      } as any)
    );
    await wait(10);
    expect(el.primarySize).toBe(beforeSize);
  });
});

// ---------------------------------------------------------------------------
// recipe: setInterval timers never cleared on disconnect
// ---------------------------------------------------------------------------
describe('recipe: timer intervals cleared on disconnect', () => {
  it('active timers are cleared when element disconnects', async () => {
    await import('../../components/recipe/snice-recipe');
    const el = document.createElement('snice-recipe') as any;
    el.title = 'Test';
    el.steps = [{ text: 'Boil', timerMinutes: 1 }];
    document.body.appendChild(el);
    await el.ready;
    await wait(20);

    // Start a timer by calling the private method directly
    el.startTimer(0, 1);
    expect(el.activeTimers.size).toBe(1);
    const timer = el.activeTimers.get(0);
    expect(timer).toBeTruthy();

    // Track that clearInterval is called for this intervalId
    const origClear = window.clearInterval;
    let clearedIds: number[] = [];
    (window as any).clearInterval = (id: number) => {
      clearedIds.push(id);
      return origClear(id);
    };

    el.remove();
    await wait(20);

    (window as any).clearInterval = origClear;

    // With the bug: clearInterval was NOT called with timer.intervalId
    // With the fix: it was
    expect(clearedIds).toContain(timer.intervalId);
  });
});
