import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, trackRenders } from './test-utils';
import '../../components/segmented-control/snice-segmented-control';
import type { SniceSegmentedControlElement, SegmentedControlOption } from '../../components/segmented-control/snice-segmented-control.types';

describe('snice-segmented-control', () => {
  let el: SniceSegmentedControlElement;

  const defaultOptions: SegmentedControlOption[] = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
  ];

  async function createControl(attrs: Record<string, any> = {}) {
    el = await createComponent<SniceSegmentedControlElement>('snice-segmented-control', attrs);
    el.options = attrs.options || defaultOptions;
    await new Promise(resolve => setTimeout(resolve, 50));
    return el;
  }

  afterEach(() => {
    if (el) {
      removeComponent(el as HTMLElement);
    }
  });

  it('should render segmented control element', async () => {
    await createControl();
    expect(el).toBeTruthy();
  });

  it('should select first option by default when no value set', async () => {
    await createControl();
    expect(el.value).toBe('day');
  });

  it('should support pre-selected value', async () => {
    await createControl({ value: 'week' });
    expect(el.value).toBe('week');
  });

  it('should not be disabled by default', async () => {
    await createControl();
    expect(el.disabled).toBe(false);
  });

  it('should support disabled state', async () => {
    await createControl({ disabled: true });
    expect(el.disabled).toBe(true);
  });

  it('should have default size of medium', async () => {
    await createControl();
    expect(el.size).toBe('medium');
  });

  it('should support small size', async () => {
    await createControl({ size: 'small' });
    expect(el.size).toBe('small');
  });

  it('should support large size', async () => {
    await createControl({ size: 'large' });
    expect(el.size).toBe('large');
  });

  it('should render segment buttons', async () => {
    await createControl();
    const segments = queryShadowAll(el as HTMLElement, '.segmented-control__segment');
    expect(segments.length).toBe(3);
  });

  it('should render indicator', async () => {
    await createControl();
    const indicator = queryShadow(el as HTMLElement, '.segmented-control__indicator');
    expect(indicator).toBeTruthy();
  });

  it('should change value on segment click', async () => {
    await createControl();
    const tracker = trackRenders(el as HTMLElement);

    const segments = queryShadowAll(el as HTMLElement, '.segmented-control__segment');
    (segments[1] as HTMLButtonElement).click();
    await tracker.next();

    expect(el.value).toBe('week');
  });

  it('should dispatch value-change event on selection', async () => {
    await createControl();

    let eventDetail: any = null;
    (el as HTMLElement).addEventListener('value-change', (e: Event) => {
      eventDetail = (e as CustomEvent).detail;
    });

    const segments = queryShadowAll(el as HTMLElement, '.segmented-control__segment');
    (segments[2] as HTMLButtonElement).click();
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(eventDetail).toBeTruthy();
    expect(eventDetail.value).toBe('month');
    expect(eventDetail.previousValue).toBe('day');
  });

  it('should not fire event when clicking already selected segment', async () => {
    await createControl({ value: 'day' });

    let eventFired = false;
    (el as HTMLElement).addEventListener('value-change', () => {
      eventFired = true;
    });

    const segments = queryShadowAll(el as HTMLElement, '.segmented-control__segment');
    (segments[0] as HTMLButtonElement).click();
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(eventFired).toBe(false);
  });

  it('should not select disabled option', async () => {
    const opts = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B', disabled: true },
      { value: 'c', label: 'C' },
    ];
    await createControl({ options: opts, value: 'a' });

    const segments = queryShadowAll(el as HTMLElement, '.segmented-control__segment');
    (segments[1] as HTMLButtonElement).click();
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(el.value).toBe('a');
  });

  it('should update value dynamically', async () => {
    await createControl();
    const tracker = trackRenders(el as HTMLElement);

    el.value = 'month';
    await tracker.next();

    expect(el.value).toBe('month');
  });

  it('should accept options array', async () => {
    await createControl();
    expect(el.options).toHaveLength(3);
  });

  it('should update options dynamically', async () => {
    await createControl();
    const newOptions = [
      { value: 'x', label: 'X' },
      { value: 'y', label: 'Y' },
    ];
    el.options = newOptions;
    await new Promise(resolve => setTimeout(resolve, 50));

    const segments = queryShadowAll(el as HTMLElement, '.segmented-control__segment');
    expect(segments.length).toBe(2);
  });

  it('should have correct ARIA attributes', async () => {
    await createControl({ value: 'day' });

    const container = queryShadow(el as HTMLElement, '.segmented-control');
    expect(container?.getAttribute('role')).toBe('radiogroup');

    const segments = queryShadowAll(el as HTMLElement, '.segmented-control__segment');
    expect(segments[0]?.getAttribute('role')).toBe('radio');
    expect(segments[0]?.getAttribute('aria-checked')).toBe('true');
    expect(segments[1]?.getAttribute('aria-checked')).toBe('false');
  });
});
