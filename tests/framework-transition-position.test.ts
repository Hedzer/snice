import { describe, it, expect, afterEach } from 'vitest';
import { performTransition } from '../src/transitions';

afterEach(() => { document.body.innerHTML = ''; });

describe('performTransition: container position restored correctly', () => {
  it('restores original position after a single transition', async () => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    document.body.appendChild(container);

    const oldEl = document.createElement('span');
    oldEl.textContent = 'old';
    container.appendChild(oldEl);
    const newEl = document.createElement('span');
    newEl.textContent = 'new';

    await performTransition(container, oldEl, newEl, {
      name: 'fade',
      outDuration: 10,
      inDuration: 10,
    });

    expect(container.style.position).toBe('absolute');
  });

  it('restores original position after overlapping transitions', async () => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    document.body.appendChild(container);

    const elA = document.createElement('span'); elA.textContent = 'a';
    const elB = document.createElement('span'); elB.textContent = 'b';
    const elC = document.createElement('span'); elC.textContent = 'c';
    container.appendChild(elA);

    // Start two overlapping transitions
    const t1 = performTransition(container, elA, elB, {
      name: 'fade',
      outDuration: 20,
      inDuration: 20,
    });
    const t2 = performTransition(container, elB, elC, {
      name: 'fade',
      outDuration: 20,
      inDuration: 20,
    });

    await Promise.all([t1, t2]);

    // With the bug: the first-to-finish restored to 'relative' (saved while
    // the second had already overwritten to 'relative'), so final state leaks.
    // With the fix: reference-counted restore returns to 'absolute'.
    expect(container.style.position).toBe('absolute');
  });

  it('restores position when transition is marked stale mid-animation', async () => {
    const container = document.createElement('div');
    container.style.position = 'static';
    document.body.appendChild(container);

    const oldEl = document.createElement('span'); oldEl.textContent = 'old';
    const newEl = document.createElement('span'); newEl.textContent = 'new';
    container.appendChild(oldEl);

    let stale = false;
    const p = performTransition(container, oldEl, newEl, {
      name: 'fade',
      outDuration: 30,
      inDuration: 30,
    }, () => stale);

    // Mark stale quickly
    setTimeout(() => { stale = true; }, 5);
    await p;

    expect(container.style.position).toBe('static');
  });
});
