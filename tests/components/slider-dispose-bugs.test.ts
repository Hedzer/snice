import { describe, it, expect, afterEach } from 'vitest';
import { wait } from './test-utils';

afterEach(() => { document.body.innerHTML = ''; });

// Slider + range-slider both use disconnectedCallback to call stopDragging(),
// which emits a spurious change event on disconnect. And disconnectedCallback
// is banned in favor of @dispose.

describe('slider: no spurious change event on disconnect when not dragging', () => {
  it('removing a never-dragged slider should not fire range-change / change event', async () => {
    await import('../../packages/components/src/slider/snice-slider');
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
    await import('../../packages/components/src/range-slider/snice-range-slider');
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

describe('active slider gestures respect effective disabledness', () => {
  it('silently stops a slider drag when its fieldset disables it', async () => {
    await import('../../packages/components/src/slider/snice-slider');
    const el = document.createElement('snice-slider') as any;
    el.value = 20;
    document.body.appendChild(el);
    await el.ready;
    await wait(20);

    let changes = 0;
    el.addEventListener('slider-change', () => changes++);
    el.startDragging();
    expect(el.isDragging).toBe(true);

    el.formDisabledCallback(true);
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 100 }));

    expect(el.isDragging).toBe(false);
    expect(el.value).toBe(20);
    expect(changes).toBe(0);
  });

  it('silently stops a range-slider drag when its fieldset disables it', async () => {
    await import('../../packages/components/src/range-slider/snice-range-slider');
    const el = document.createElement('snice-range-slider') as any;
    el.valueLow = 20;
    el.valueHigh = 80;
    document.body.appendChild(el);
    await el.ready;
    await wait(20);

    let changes = 0;
    el.addEventListener('range-change', () => changes++);
    el.draggingThumb = 'low';
    el.startDragging();

    el.formDisabledCallback(true);
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 100 }));

    expect(el.draggingThumb).toBeNull();
    expect([el.valueLow, el.valueHigh]).toEqual([20, 80]);
    expect(changes).toBe(0);
  });
});
