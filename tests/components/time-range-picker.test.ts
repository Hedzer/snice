import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, queryShadowAll, wait } from './test-utils';
import '../../components/time-range-picker/snice-time-range-picker';
import type { SniceTimeRangePickerElement } from '../../components/time-range-picker/snice-time-range-picker.types';

describe('snice-time-range-picker', () => {
  let picker: SniceTimeRangePickerElement;

  afterEach(() => {
    if (picker) {
      removeComponent(picker as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render time-range-picker element', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker');
      expect(picker).toBeTruthy();
      expect(picker.tagName).toBe('SNICE-TIME-RANGE-PICKER');
    });

    it('should have default properties', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker');
      expect(picker.granularity).toBe(15);
      expect(picker.startTime).toBe('00:00');
      expect(picker.endTime).toBe('23:59');
      expect(picker.value).toBe('');
      expect(picker.format).toBe('24h');
      expect(picker.multiple).toBe(false);
      expect(picker.readonly).toBe(false);
      expect(picker.disabled).toBe(false);
    });

    it('should render header', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker');
      await wait(50);
      const header = queryShadow(picker as HTMLElement, '.header');
      expect(header).toBeTruthy();
    });

    it('should render slots container', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker');
      await wait(50);
      const container = queryShadow(picker as HTMLElement, '.slots-container');
      expect(container).toBeTruthy();
    });

    it('should show "No selection" by default', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker');
      await wait(50);
      const headerValue = queryShadow(picker as HTMLElement, '.header-value');
      expect(headerValue?.textContent?.trim()).toContain('No selection');
    });
  });

  describe('granularity', () => {
    it('should generate correct number of slots for 15min granularity', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker', {
        'start-time': '09:00',
        'end-time': '10:00',
        granularity: 15
      });
      await wait(50);
      // 09:00, 09:15, 09:30, 09:45, 10:00 = 5 slots
      const slots = queryShadowAll(picker as HTMLElement, '.slot');
      expect(slots.length).toBe(5);
    });

    it('should generate correct number of slots for 30min granularity', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker', {
        'start-time': '09:00',
        'end-time': '12:00',
        granularity: 30
      });
      await wait(50);
      // 09:00, 09:30, 10:00, 10:30, 11:00, 11:30, 12:00 = 7 slots
      const slots = queryShadowAll(picker as HTMLElement, '.slot');
      expect(slots.length).toBe(7);
    });

    it('should generate correct number of slots for 60min granularity', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker', {
        'start-time': '09:00',
        'end-time': '12:00',
        granularity: 60
      });
      await wait(50);
      // 09:00, 10:00, 11:00, 12:00 = 4 slots
      const slots = queryShadowAll(picker as HTMLElement, '.slot');
      expect(slots.length).toBe(4);
    });

    it('should generate correct number of slots for 5min granularity', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker', {
        'start-time': '09:00',
        'end-time': '09:30',
        granularity: 5
      });
      await wait(50);
      // 09:00, 09:05, 09:10, 09:15, 09:20, 09:25, 09:30 = 7 slots
      const slots = queryShadowAll(picker as HTMLElement, '.slot');
      expect(slots.length).toBe(7);
    });
  });

  describe('time format', () => {
    it('should display 24h format by default', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker', {
        'start-time': '09:00',
        'end-time': '10:00',
        granularity: 60
      });
      await wait(50);
      const slotTime = queryShadow(picker as HTMLElement, '.slot-time');
      expect(slotTime?.textContent?.trim()).toBe('09:00');
    });

    it('should display 12h format when configured', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker', {
        'start-time': '09:00',
        'end-time': '10:00',
        granularity: 60,
        format: '12h'
      });
      await wait(50);
      const slotTime = queryShadow(picker as HTMLElement, '.slot-time');
      expect(slotTime?.textContent?.trim()).toBe('9:00 AM');
    });

    it('should display PM for afternoon times', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker', {
        'start-time': '13:00',
        'end-time': '14:00',
        granularity: 60,
        format: '12h'
      });
      await wait(50);
      const slotTime = queryShadow(picker as HTMLElement, '.slot-time');
      expect(slotTime?.textContent?.trim()).toBe('1:00 PM');
    });
  });

  describe('disabled state', () => {
    it('should apply disabled attribute', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker', {
        disabled: true
      });
      expect(picker.disabled).toBe(true);
    });

    it('should have disabled attribute on host element', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker', {
        disabled: true
      });
      expect(picker.hasAttribute('disabled')).toBe(true);
    });
  });

  describe('readonly state', () => {
    it('should apply readonly attribute', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker', {
        readonly: true
      });
      expect(picker.readonly).toBe(true);
    });
  });

  describe('disabled ranges', () => {
    it('should mark slots as disabled', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker', {
        'start-time': '09:00',
        'end-time': '12:00',
        granularity: 60,
        'disabled-ranges': '[{"start":"10:00","end":"11:00"}]'
      });
      await wait(50);
      const disabledSlots = queryShadowAll(picker as HTMLElement, '.slot--disabled');
      expect(disabledSlots.length).toBe(2); // 10:00 and 11:00
    });

    it('should report slot disabled status via API', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker', {
        'start-time': '09:00',
        'end-time': '12:00',
        granularity: 60,
        'disabled-ranges': '[{"start":"10:00","end":"11:00"}]'
      });
      await wait(50);
      expect(picker.isSlotDisabled('10:00')).toBe(true);
      expect(picker.isSlotDisabled('09:00')).toBe(false);
    });
  });

  describe('pre-selected value', () => {
    it('should render pre-selected slots', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker', {
        'start-time': '09:00',
        'end-time': '12:00',
        granularity: 60,
        value: '[{"start":"09:00","end":"10:00"}]'
      });
      await wait(50);
      const selectedSlots = queryShadowAll(picker as HTMLElement, '.slot--selected');
      expect(selectedSlots.length).toBe(2); // 09:00 and 10:00
    });

    it('should display selected range in header', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker', {
        'start-time': '09:00',
        'end-time': '12:00',
        granularity: 60,
        value: '[{"start":"09:00","end":"10:00"}]'
      });
      await wait(50);
      const headerValue = queryShadow(picker as HTMLElement, '.header-value');
      expect(headerValue?.textContent?.trim()).toContain('09:00');
      expect(headerValue?.textContent?.trim()).toContain('11:00');
    });
  });

  describe('API methods', () => {
    it('should return selected ranges via getSelectedRanges()', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker', {
        'start-time': '09:00',
        'end-time': '12:00',
        granularity: 60,
        value: '[{"start":"09:00","end":"10:00"}]'
      });
      await wait(50);
      const ranges = picker.getSelectedRanges();
      expect(ranges.length).toBe(1);
      expect(ranges[0].start).toBe('09:00');
      expect(ranges[0].end).toBe('10:00');
    });

    it('should set ranges via setSelectedRanges()', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker', {
        'start-time': '09:00',
        'end-time': '12:00',
        granularity: 60
      });
      await wait(50);
      picker.setSelectedRanges([{ start: '10:00', end: '11:00' }]);
      await wait(50);
      const ranges = picker.getSelectedRanges();
      expect(ranges.length).toBe(1);
      expect(ranges[0].start).toBe('10:00');
      expect(ranges[0].end).toBe('11:00');
    });

    it('should clear selection via clearSelection()', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker', {
        'start-time': '09:00',
        'end-time': '12:00',
        granularity: 60,
        value: '[{"start":"09:00","end":"10:00"}]'
      });
      await wait(50);
      picker.clearSelection();
      await wait(50);
      const ranges = picker.getSelectedRanges();
      expect(ranges.length).toBe(0);
    });

    it('should check disabled status via isSlotDisabled()', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker', {
        'start-time': '09:00',
        'end-time': '12:00',
        granularity: 60,
        'disabled-ranges': '[{"start":"10:00","end":"10:00"}]'
      });
      await wait(50);
      expect(picker.isSlotDisabled('10:00')).toBe(true);
      expect(picker.isSlotDisabled('09:00')).toBe(false);
      expect(picker.isSlotDisabled('12:00')).toBe(false);
    });
  });

  describe('events', () => {
    it('should dispatch change event when selection changes programmatically', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker', {
        'start-time': '09:00',
        'end-time': '12:00',
        granularity: 60
      });
      await wait(50);

      let changeDetail: any = null;
      (picker as HTMLElement).addEventListener('@snice/time-range-change', (e: Event) => {
        changeDetail = (e as CustomEvent).detail;
      });

      picker.setSelectedRanges([{ start: '09:00', end: '10:00' }]);
      await wait(50);

      expect(changeDetail).toBeTruthy();
      expect(changeDetail.ranges.length).toBe(1);
    });

    it('should dispatch change event when selection is cleared', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker', {
        'start-time': '09:00',
        'end-time': '12:00',
        granularity: 60,
        value: '[{"start":"09:00","end":"10:00"}]'
      });
      await wait(50);

      let changeFired = false;
      (picker as HTMLElement).addEventListener('@snice/time-range-change', () => {
        changeFired = true;
      });

      picker.clearSelection();
      await wait(50);
      expect(changeFired).toBe(true);
    });
  });

  describe('keyboard interaction', () => {
    it('should select slot on Enter key', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker', {
        'start-time': '09:00',
        'end-time': '10:00',
        granularity: 60
      });
      await wait(50);

      const slot = queryShadow(picker as HTMLElement, '.slot') as HTMLElement;
      slot.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await wait(50);

      const selectedSlots = queryShadowAll(picker as HTMLElement, '.slot--selected');
      expect(selectedSlots.length).toBe(1);
    });

    it('should select slot on Space key', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker', {
        'start-time': '09:00',
        'end-time': '10:00',
        granularity: 60
      });
      await wait(50);

      const slot = queryShadow(picker as HTMLElement, '.slot') as HTMLElement;
      slot.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      await wait(50);

      const selectedSlots = queryShadowAll(picker as HTMLElement, '.slot--selected');
      expect(selectedSlots.length).toBe(1);
    });

    it('should clear selection on Escape key', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker', {
        'start-time': '09:00',
        'end-time': '10:00',
        granularity: 60,
        value: '[{"start":"09:00","end":"09:00"}]'
      });
      await wait(50);

      const slot = queryShadow(picker as HTMLElement, '.slot') as HTMLElement;
      slot.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await wait(50);

      const ranges = picker.getSelectedRanges();
      expect(ranges.length).toBe(0);
    });
  });

  describe('multiple selection mode', () => {
    it('should allow multiple non-contiguous selections', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker', {
        'start-time': '09:00',
        'end-time': '12:00',
        granularity: 60,
        multiple: true,
        value: '[{"start":"09:00","end":"09:00"},{"start":"11:00","end":"11:00"}]'
      });
      await wait(50);

      const ranges = picker.getSelectedRanges();
      expect(ranges.length).toBe(2);
    });
  });

  describe('hour boundary markers', () => {
    it('should mark hour boundaries', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker', {
        'start-time': '09:00',
        'end-time': '11:00',
        granularity: 30
      });
      await wait(50);
      // 10:00 and 11:00 should be hour boundaries (not 09:00 since it's the first slot)
      const hourSlots = queryShadowAll(picker as HTMLElement, '.slot--hour-start');
      expect(hourSlots.length).toBe(2);
    });
  });

  describe('accessibility', () => {
    it('should have role="option" on slots', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker', {
        'start-time': '09:00',
        'end-time': '10:00',
        granularity: 60
      });
      await wait(50);
      const slot = queryShadow(picker as HTMLElement, '.slot');
      expect(slot?.getAttribute('role')).toBe('option');
    });

    it('should have aria-selected on selected slots', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker', {
        'start-time': '09:00',
        'end-time': '10:00',
        granularity: 60,
        value: '[{"start":"09:00","end":"09:00"}]'
      });
      await wait(50);
      const slot = queryShadow(picker as HTMLElement, '.slot--selected');
      expect(slot?.getAttribute('aria-selected')).toBe('true');
    });

    it('should have aria-disabled on disabled slots', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker', {
        'start-time': '09:00',
        'end-time': '10:00',
        granularity: 60,
        'disabled-ranges': '[{"start":"09:00","end":"09:00"}]'
      });
      await wait(50);
      const slot = queryShadow(picker as HTMLElement, '.slot--disabled');
      expect(slot?.getAttribute('aria-disabled')).toBe('true');
    });

    it('should have tabindex on non-disabled slots', async () => {
      picker = await createComponent<SniceTimeRangePickerElement>('snice-time-range-picker', {
        'start-time': '09:00',
        'end-time': '10:00',
        granularity: 60
      });
      await wait(50);
      const slot = queryShadow(picker as HTMLElement, '.slot');
      expect(slot?.getAttribute('tabindex')).toBe('0');
    });
  });
});
