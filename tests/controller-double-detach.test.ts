import { describe, it, expect } from 'vitest';
import { element, controller, attachController, detachController, getController } from './test-imports';

// Probe: can two overlapping detachController() calls run the controller's
// detach() twice? detachController captures the instance up front but only
// deletes the key AFTER awaiting detach(), so a second call that starts before
// the first finishes still sees the instance and runs detach() again.
describe('controller: concurrent detach', () => {
  it('does not run detach() twice when two detaches overlap', async () => {
    let detachCount = 0;
    let releaseDetach!: () => void;
    const gate = new Promise<void>((r) => { releaseDetach = r; });

    @controller('double-detach-ctrl')
    class Ctrl {
      element: HTMLElement | null = null;
      async attach(el: HTMLElement) { this.element = el; }
      async detach() { detachCount++; await gate; }
    }

    @element('double-detach-el')
    class El extends HTMLElement { controller = 'double-detach-ctrl'; }

    const el = document.createElement('double-detach-el');
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 30)); // let the controller attach

    // Two overlapping detaches — e.g. disconnect's fire-and-forget detach racing
    // a controller reassignment (which detaches the old one first).
    const d1 = detachController(el);
    const d2 = detachController(el);
    releaseDetach();
    await Promise.all([d1, d2]);

    expect(detachCount).toBe(1);
  });

  it('does not run detach() on a controller whose attach was aborted before ready', async () => {
    let attachCount = 0;
    let detachCount = 0;

    @controller('zombie-ctrl')
    class Ctrl {
      element: HTMLElement | null = null;
      async attach(el: HTMLElement) { attachCount++; this.element = el; }
      async detach() { detachCount++; }
    }

    // An element whose `ready` never resolves — attach will wait forever until aborted.
    const el = document.createElement('div') as any;
    el.ready = new Promise<void>(() => {});

    const attachP = attachController(el, 'zombie-ctrl').catch(() => {});
    await new Promise((r) => setTimeout(r, 10)); // let attach reach the ready-await

    await detachController(el); // aborts the pending attach
    await attachP;

    // attach() never ran, so detach() must not run either, and nothing is left behind.
    expect(attachCount).toBe(0);
    expect(detachCount).toBe(0);
    expect(getController(el)).toBeUndefined();
  });
});
