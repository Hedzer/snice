import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, wait, queryShadow, queryShadowAll } from './test-utils';
import '../../components/order-tracker/snice-order-tracker';
import type { SniceOrderTrackerElement, OrderStep } from '../../components/order-tracker/snice-order-tracker.types';

const sampleSteps: OrderStep[] = [
  { label: 'Ordered', status: 'completed', timestamp: 'Feb 20, 2026' },
  { label: 'Confirmed', status: 'completed', timestamp: 'Feb 20, 2026' },
  { label: 'Shipped', status: 'active', timestamp: 'Feb 22, 2026', description: 'Package left the warehouse' },
  { label: 'Out for Delivery', status: 'pending' },
  { label: 'Delivered', status: 'pending' }
];

describe('snice-order-tracker', () => {
  let el: SniceOrderTrackerElement;

  afterEach(() => {
    if (el) {
      removeComponent(el as HTMLElement);
    }
  });

  it('should render', async () => {
    el = await createComponent<SniceOrderTrackerElement>('snice-order-tracker');
    expect(el).toBeTruthy();
    expect(el.shadowRoot).toBeTruthy();
  });

  it('should have default properties', async () => {
    el = await createComponent<SniceOrderTrackerElement>('snice-order-tracker');
    expect(el.steps).toEqual([]);
    expect(el.trackingNumber).toBe('');
    expect(el.carrier).toBe('');
    expect(el.variant).toBe('horizontal');
  });

  it('should render steps', async () => {
    el = await createComponent<SniceOrderTrackerElement>('snice-order-tracker');
    el.steps = sampleSteps;
    await wait(50);
    const steps = queryShadowAll(el as HTMLElement, '.tracker__step');
    expect(steps.length).toBe(5);
  });

  it('should render step labels', async () => {
    el = await createComponent<SniceOrderTrackerElement>('snice-order-tracker');
    el.steps = sampleSteps;
    await wait(50);
    const labels = queryShadowAll(el as HTMLElement, '.tracker__step-label');
    expect(labels[0]?.textContent).toBe('Ordered');
    expect(labels[2]?.textContent).toBe('Shipped');
    expect(labels[4]?.textContent).toBe('Delivered');
  });

  it('should apply completed status', async () => {
    el = await createComponent<SniceOrderTrackerElement>('snice-order-tracker');
    el.steps = sampleSteps;
    await wait(50);
    const completed = queryShadowAll(el as HTMLElement, '.tracker__step--completed');
    expect(completed.length).toBe(2);
  });

  it('should apply active status', async () => {
    el = await createComponent<SniceOrderTrackerElement>('snice-order-tracker');
    el.steps = sampleSteps;
    await wait(50);
    const active = queryShadow(el as HTMLElement, '.tracker__step--active');
    expect(active).toBeTruthy();
  });

  it('should apply pending status', async () => {
    el = await createComponent<SniceOrderTrackerElement>('snice-order-tracker');
    el.steps = sampleSteps;
    await wait(50);
    const pending = queryShadowAll(el as HTMLElement, '.tracker__step--pending');
    expect(pending.length).toBe(2);
  });

  it('should render checkmark for completed steps', async () => {
    el = await createComponent<SniceOrderTrackerElement>('snice-order-tracker');
    el.steps = sampleSteps;
    await wait(50);
    const completedIndicators = queryShadowAll(el as HTMLElement, '.tracker__step--completed .tracker__step-icon');
    expect(completedIndicators.length).toBe(2);
  });

  it('should render timestamps', async () => {
    el = await createComponent<SniceOrderTrackerElement>('snice-order-tracker');
    el.steps = sampleSteps;
    await wait(50);
    const timestamps = queryShadowAll(el as HTMLElement, '.tracker__step-timestamp');
    expect(timestamps.length).toBe(3);
    expect(timestamps[0]?.textContent).toBe('Feb 20, 2026');
  });

  it('should render descriptions', async () => {
    el = await createComponent<SniceOrderTrackerElement>('snice-order-tracker');
    el.steps = sampleSteps;
    await wait(50);
    const desc = queryShadow(el as HTMLElement, '.tracker__step-description');
    expect(desc).toBeTruthy();
    expect(desc?.textContent).toBe('Package left the warehouse');
  });

  it('should render tracking number', async () => {
    el = await createComponent<SniceOrderTrackerElement>('snice-order-tracker', {
      'tracking-number': '1Z999AA10123456784'
    });
    el.steps = sampleSteps;
    await wait(50);
    const values = queryShadowAll(el as HTMLElement, '.tracker__info-value');
    const hasTracking = Array.from(values).some(v => v.textContent?.includes('1Z999AA10123456784'));
    expect(hasTracking).toBe(true);
  });

  it('should render carrier', async () => {
    el = await createComponent<SniceOrderTrackerElement>('snice-order-tracker', {
      carrier: 'UPS'
    });
    el.steps = sampleSteps;
    await wait(50);
    const values = queryShadowAll(el as HTMLElement, '.tracker__info-value');
    const hasCarrier = Array.from(values).some(v => v.textContent?.includes('UPS'));
    expect(hasCarrier).toBe(true);
  });

  it('should not render tracking info when empty', async () => {
    el = await createComponent<SniceOrderTrackerElement>('snice-order-tracker');
    el.steps = sampleSteps;
    await wait(50);
    const info = queryShadow(el as HTMLElement, '.tracker__info');
    expect(info).toBeFalsy();
  });

  it('should render horizontal variant by default', async () => {
    el = await createComponent<SniceOrderTrackerElement>('snice-order-tracker');
    el.steps = sampleSteps;
    await wait(50);
    const horizontal = queryShadow(el as HTMLElement, '.tracker__steps--horizontal');
    expect(horizontal).toBeTruthy();
  });

  it('should render vertical variant', async () => {
    el = await createComponent<SniceOrderTrackerElement>('snice-order-tracker', {
      variant: 'vertical'
    });
    el.steps = sampleSteps;
    await wait(50);
    const vertical = queryShadow(el as HTMLElement, '.tracker__steps--vertical');
    expect(vertical).toBeTruthy();
  });

  it('should emit step-click event', async () => {
    el = await createComponent<SniceOrderTrackerElement>('snice-order-tracker');
    el.steps = sampleSteps;
    await wait(50);
    let detail: any = null;
    (el as HTMLElement).addEventListener('step-click', (e: Event) => {
      detail = (e as CustomEvent).detail;
    });
    const steps = queryShadowAll(el as HTMLElement, '.tracker__step');
    (steps[2] as HTMLElement).click();
    await wait(50);
    expect(detail).toBeTruthy();
    expect(detail.step.label).toBe('Shipped');
    expect(detail.index).toBe(2);
  });

  it('should render connector lines', async () => {
    el = await createComponent<SniceOrderTrackerElement>('snice-order-tracker');
    el.steps = sampleSteps;
    await wait(50);
    const connectors = queryShadowAll(el as HTMLElement, '.tracker__step-connector');
    expect(connectors.length).toBe(5);
  });

  it('should color completed connectors', async () => {
    el = await createComponent<SniceOrderTrackerElement>('snice-order-tracker');
    el.steps = sampleSteps;
    await wait(50);
    const completedConnectors = queryShadowAll(el as HTMLElement, '.tracker__step--completed .tracker__step-connector');
    expect(completedConnectors.length).toBe(2);
  });

  it('should render all-completed tracker', async () => {
    el = await createComponent<SniceOrderTrackerElement>('snice-order-tracker');
    el.steps = [
      { label: 'Ordered', status: 'completed' },
      { label: 'Shipped', status: 'completed' },
      { label: 'Delivered', status: 'completed' }
    ];
    await wait(50);
    const completed = queryShadowAll(el as HTMLElement, '.tracker__step--completed');
    expect(completed.length).toBe(3);
    const pending = queryShadowAll(el as HTMLElement, '.tracker__step--pending');
    expect(pending.length).toBe(0);
  });

  it('should render step indicators for non-completed steps', async () => {
    el = await createComponent<SniceOrderTrackerElement>('snice-order-tracker');
    el.steps = [
      { label: 'Step 1', status: 'pending' },
      { label: 'Step 2', status: 'pending' }
    ];
    await wait(50);
    const indicators = queryShadowAll(el as HTMLElement, '.tracker__step-indicator');
    expect(indicators.length).toBe(2);
    // Non-completed step indicators should not contain a check icon
    const icons = queryShadowAll(el as HTMLElement, '.tracker__step-indicator .tracker__step-icon');
    expect(icons.length).toBe(0);
  });
});
