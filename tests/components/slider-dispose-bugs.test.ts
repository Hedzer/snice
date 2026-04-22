import { describe, it, expect, afterEach } from 'vitest';
import { wait } from './test-utils';

afterEach(() => { document.body.innerHTML = ''; });

// Slider + range-slider both use disconnectedCallback to call stopDragging(),
// which emits a spurious change event on disconnect. And disconnectedCallback
// is banned in favor of @dispose.

describe('slider: no spurious change event on disconnect when not dragging', () => {
  it('removing a never-dragged slider should not fire range-change / change event', async () => {
    await import('../../components/slider/snice-slider');
    const el = document.createElement('snice-slider') as any;
    el.min = 0;
    el.max = 100;
    el.value = 50;
    document.body.appendChild(el);
    await el.ready;
    await wait(20);

    let fired = 0;
    el.addEventListener('slider-change', () => fired++);
    el.addEventListener('change', () => fired++);

    el.remove();
    await wait(20);

    // With the bug, stopDragging() fires dispatchChangeEvent on disconnect.
    expect(fired).toBe(0);
  });
});

describe('range-slider: no spurious change event on disconnect when not dragging', () => {
  it('removing a never-dragged range-slider should not fire range-change', async () => {
    await import('../../components/range-slider/snice-range-slider');
    const el = document.createElement('snice-range-slider') as any;
    el.min = 0;
    el.max = 100;
    el.valueLow = 20;
    el.valueHigh = 80;
    document.body.appendChild(el);
    await el.ready;
    await wait(20);

    let fired = 0;
    el.addEventListener('range-change', () => fired++);

    el.remove();
    await wait(20);

    expect(fired).toBe(0);
  });
});
