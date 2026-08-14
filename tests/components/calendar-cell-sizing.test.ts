// `cell-sizing` on <snice-calendar>: 'square' (default) keeps day cells as
// wide as they are tall; 'stretch' lets rows collapse to their content and
// event-lane reservation.
import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/calendar/snice-calendar';
import type { SniceCalendarElement } from '../../packages/components/src/calendar/snice-calendar.types';

describe('snice-calendar cell-sizing', () => {
  let calendar: SniceCalendarElement;

  afterEach(() => {
    if (calendar) removeComponent(calendar as HTMLElement);
  });

  it('defaults to square', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar');
    expect((calendar as any).cellSizing).toBe('square');
    const cell = (calendar as any).shadowRoot.querySelector('.calendar__day') as HTMLElement;
    expect(cell.classList.contains('calendar__day--stretch')).toBe(false);
  });

  it('stretch mode marks day cells', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar', { 'cell-sizing': 'stretch' });
    await wait(20);
    const cells = [...(calendar as any).shadowRoot.querySelectorAll('.calendar__day')] as HTMLElement[];
    expect(cells.every(c => c.classList.contains('calendar__day--stretch'))).toBe(true);
  });

  it('toggling back to square clears the marker', async () => {
    calendar = await createComponent<SniceCalendarElement>('snice-calendar', { 'cell-sizing': 'stretch' });
    await wait(20);
    (calendar as any).cellSizing = 'square';
    await wait(20);
    const cell = (calendar as any).shadowRoot.querySelector('.calendar__day') as HTMLElement;
    expect(cell.classList.contains('calendar__day--stretch')).toBe(false);
  });
});
