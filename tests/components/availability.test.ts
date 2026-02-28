import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../components/availability/snice-availability';
import type { SniceAvailabilityElement, AvailabilityRange } from '../../components/availability/snice-availability.types';

describe('snice-availability', () => {
  let availability: SniceAvailabilityElement;

  afterEach(() => {
    if (availability) {
      removeComponent(availability as HTMLElement);
    }
  });

  it('should render', async () => {
    availability = await createComponent<SniceAvailabilityElement>('snice-availability');
    expect(availability).toBeTruthy();
  });

  it('should have default properties', async () => {
    availability = await createComponent<SniceAvailabilityElement>('snice-availability');
    expect(availability.granularity).toBe(60);
    expect(availability.startHour).toBe(0);
    expect(availability.endHour).toBe(24);
    expect(availability.format).toBe('12h');
    expect(availability.readonly).toBe(false);
    expect(availability.value).toEqual([]);
  });

  it('should accept value', async () => {
    availability = await createComponent<SniceAvailabilityElement>('snice-availability');
    const ranges: AvailabilityRange[] = [
      { day: 0, start: '09:00', end: '17:00' },
      { day: 1, start: '09:00', end: '17:00' },
    ];
    availability.value = ranges;
    await wait();
    expect(availability.value.length).toBe(2);
  });

  it('should support granularity', async () => {
    availability = await createComponent<SniceAvailabilityElement>('snice-availability', {
      granularity: 30
    });
    expect(availability.granularity).toBe(30);
  });

  it('should support start-hour and end-hour', async () => {
    availability = await createComponent<SniceAvailabilityElement>('snice-availability', {
      'start-hour': 8,
      'end-hour': 18,
    });
    expect(availability.startHour).toBe(8);
    expect(availability.endHour).toBe(18);
  });

  it('should support 24h format', async () => {
    availability = await createComponent<SniceAvailabilityElement>('snice-availability', {
      format: '24h'
    });
    expect(availability.format).toBe('24h');
  });

  it('should support 12h format', async () => {
    availability = await createComponent<SniceAvailabilityElement>('snice-availability', {
      format: '12h'
    });
    expect(availability.format).toBe('12h');
  });

  it('should support readonly', async () => {
    availability = await createComponent<SniceAvailabilityElement>('snice-availability', {
      readonly: true
    });
    expect(availability.readonly).toBe(true);
  });

  it('should get availability', async () => {
    availability = await createComponent<SniceAvailabilityElement>('snice-availability');
    const ranges: AvailabilityRange[] = [
      { day: 0, start: '09:00', end: '12:00' },
    ];
    availability.setAvailability(ranges);
    await wait();

    const result = availability.getAvailability();
    expect(result.length).toBe(1);
    expect(result[0].day).toBe(0);
    expect(result[0].start).toBe('09:00');
    expect(result[0].end).toBe('12:00');
  });

  it('should set availability', async () => {
    availability = await createComponent<SniceAvailabilityElement>('snice-availability');
    const ranges: AvailabilityRange[] = [
      { day: 2, start: '10:00', end: '14:00' },
      { day: 4, start: '08:00', end: '16:00' },
    ];
    availability.setAvailability(ranges);
    await wait();

    expect(availability.value.length).toBe(2);
  });

  it('should clear all', async () => {
    availability = await createComponent<SniceAvailabilityElement>('snice-availability');
    availability.setAvailability([
      { day: 0, start: '09:00', end: '17:00' },
    ]);
    await wait();

    availability.clear();
    await wait();

    expect(availability.getAvailability().length).toBe(0);
  });

  it('should emit availability-change', async () => {
    availability = await createComponent<SniceAvailabilityElement>('snice-availability');
    let changed = false;
    availability.addEventListener('availability-change', () => {
      changed = true;
    });

    availability.clear();
    await wait();
    expect(changed).toBe(true);
  });
});
