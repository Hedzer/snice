import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, wait } from './test-utils';
import '../../packages/components/src/date-range-picker/snice-date-range-picker';
import type { SniceDateRangePickerElement } from '../../packages/components/src/date-range-picker/snice-date-range-picker.types';

describe('snice-date-range-picker', () => {
  let picker: SniceDateRangePickerElement;

  afterEach(() => {
    if (picker && picker.isConnected) removeComponent(picker as HTMLElement);
  });

  it('should render', async () => {
    picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker');
    expect(picker).toBeTruthy();
    expect(picker.tagName).toBe('SNICE-DATE-RANGE-PICKER');
  });

  describe('@reconnect: outside-click closes calendar after reconnect', () => {
    it('outside-click closes the calendar on first connect', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker');
      (picker as any).showCalendar = true;
      await wait(20);

      document.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await wait(20);

      expect((picker as any).showCalendar).toBe(false);
    });

    it('outside-click still closes the calendar after disconnect+reconnect', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker');
      const parent = picker.parentNode!;

      parent.removeChild(picker);
      await wait(20);
      parent.appendChild(picker);
      await wait(20);

      (picker as any).showCalendar = true;
      await wait(20);
      document.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await wait(20);

      expect((picker as any).showCalendar).toBe(false);
    });

    it('does NOT respond to clicks after final dispose', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker');
      (picker as any).showCalendar = true;
      await wait(20);

      const parent = picker.parentNode!;
      parent.removeChild(picker);
      await wait(20);

      document.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await wait(20);

      expect((picker as any).showCalendar).toBe(true);
    });

    it('document click listener is balanced across reconnect (not double-attached)', async () => {
      picker = await createComponent<SniceDateRangePickerElement>('snice-date-range-picker');

      let net = 0;
      const origAdd = document.addEventListener;
      const origRemove = document.removeEventListener;
      document.addEventListener = ((type: string, h: any, opts?: any) => {
        if (type === 'click') net++;
        return (origAdd as any).call(document, type, h, opts);
      }) as any;
      document.removeEventListener = ((type: string, h: any, opts?: any) => {
        if (type === 'click') net--;
        return (origRemove as any).call(document, type, h, opts);
      }) as any;

      const parent = picker.parentNode!;
      const baseline = net;

      parent.removeChild(picker);
      await wait(20);
      const afterDispose = net;

      parent.appendChild(picker);
      await wait(20);
      const afterReconnect = net;

      document.addEventListener = origAdd;
      document.removeEventListener = origRemove;

      expect(afterDispose).toBeLessThan(baseline);
      expect(afterReconnect).toBe(baseline);
    });
  });
});
