import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait , queryShadowAll} from './test-utils';
import '../../components/countdown/snice-countdown';
import type { SniceCountdownElement, CountdownValues } from '../../components/countdown/snice-countdown.types';

describe('snice-countdown', () => {
  let countdown: SniceCountdownElement;

  afterEach(() => {
    if (countdown) {
      removeComponent(countdown as HTMLElement);
    }
    vi.useRealTimers();
  });

  describe('Component Registration', () => {
    it('should be defined as a custom element', () => {
      expect(customElements.get('snice-countdown')).toBeDefined();
    });

    it('should render countdown element', async () => {
      countdown = await createComponent<SniceCountdownElement>('snice-countdown');
      expect(countdown).toBeTruthy();
      expect(countdown.tagName).toBe('SNICE-COUNTDOWN');
    });

    it('should have shadow root', async () => {
      countdown = await createComponent<SniceCountdownElement>('snice-countdown');
      expect(countdown.shadowRoot).toBeTruthy();
    });
  });

  describe('Properties', () => {
    it('should have default properties', async () => {
      countdown = await createComponent<SniceCountdownElement>('snice-countdown');
      
      expect(countdown.target).toBe('');
      expect(countdown.format).toBe('dhms');
      expect(countdown.variant).toBe('simple');
    });

    it('should accept target property', async () => {
      countdown = await createComponent<SniceCountdownElement>('snice-countdown');
      const futureDate = new Date(Date.now() + 60000).toISOString();
      
      countdown.target = futureDate;
      await wait(10);
      
      expect(countdown.target).toBe(futureDate);
    });

    it('should accept target attribute', async () => {
      const futureDate = new Date(Date.now() + 60000).toISOString();
      countdown = await createComponent<SniceCountdownElement>('snice-countdown', {
        target: futureDate
      });
      
      expect(countdown.target).toBe(futureDate);
    });

    it('should accept format property', async () => {
      countdown = await createComponent<SniceCountdownElement>('snice-countdown');
      
      countdown.format = 'hms';
      await wait(10);
      
      expect(countdown.format).toBe('hms');
    });

    it('should accept format attribute', async () => {
      countdown = await createComponent<SniceCountdownElement>('snice-countdown', {
        format: 'ms'
      });
      
      expect(countdown.format).toBe('ms');
    });

    it('should accept variant property', async () => {
      countdown = await createComponent<SniceCountdownElement>('snice-countdown');
      
      countdown.variant = 'flip';
      await wait(10);
      
      expect(countdown.variant).toBe('flip');
    });

    it('should accept variant attribute', async () => {
      countdown = await createComponent<SniceCountdownElement>('snice-countdown', {
        variant: 'circular'
      });
      
      expect(countdown.variant).toBe('circular');
    });
  });

  describe('Format variations', () => {
    it('should render all segments for dhms format', async () => {
      const futureDate = new Date(Date.now() + 90061000).toISOString(); // 1 day, 1 hour, 1 min, 1 sec
      countdown = await createComponent<SniceCountdownElement>('snice-countdown', {
        target: futureDate,
        format: 'dhms'
      });
      await wait(100);

      const segments = queryShadowAll(countdown as HTMLElement, '.segment');
      expect(segments.length).toBe(4); // Days, Hours, Minutes, Seconds
    });

    it('should render 3 segments for hms format', async () => {
      const futureDate = new Date(Date.now() + 3661000).toISOString(); // 1 hour, 1 min, 1 sec
      countdown = await createComponent<SniceCountdownElement>('snice-countdown', {
        target: futureDate,
        format: 'hms'
      });
      await wait(100);

      const segments = queryShadowAll(countdown as HTMLElement, '.segment');
      expect(segments.length).toBe(3); // Hours, Minutes, Seconds
    });

    it('should render 2 segments for ms format', async () => {
      const futureDate = new Date(Date.now() + 61000).toISOString(); // 1 min, 1 sec
      countdown = await createComponent<SniceCountdownElement>('snice-countdown', {
        target: futureDate,
        format: 'ms'
      });
      await wait(100);

      const segments = queryShadowAll(countdown as HTMLElement, '.segment');
      expect(segments.length).toBe(2); // Minutes, Seconds
    });
  });

  describe('Countdown behavior', () => {
    it('should start countdown automatically when target is set', async () => {
      const futureDate = new Date(Date.now() + 60000).toISOString();
      countdown = await createComponent<SniceCountdownElement>('snice-countdown', {
        target: futureDate
      });
      await wait(1100);

      // After 1 second, countdown should have ticked
      const values = queryShadowAll(countdown as HTMLElement, '.value');
      expect(values.length).toBeGreaterThan(0);
    });

    it('should show zeros when target is in the past', async () => {
      const pastDate = new Date(Date.now() - 1000).toISOString();
      countdown = await createComponent<SniceCountdownElement>('snice-countdown', {
        target: pastDate
      });
      await wait(100);

      const values = queryShadowAll(countdown as HTMLElement, '.value');
      values.forEach(value => {
        expect(value.textContent).toBe('00');
      });
    });

    it('should add complete class when countdown finishes', async () => {
      const nearFutureDate = new Date(Date.now() + 1100).toISOString();
      countdown = await createComponent<SniceCountdownElement>('snice-countdown', {
        target: nearFutureDate
      });
      
      expect(countdown.classList.contains('complete')).toBe(false);
      
      await wait(1500);
      
      expect(countdown.classList.contains('complete')).toBe(true);
    });
  });

  describe('Events', () => {
    it('should emit countdown-tick event', async () => {
      const futureDate = new Date(Date.now() + 60000).toISOString();
      countdown = await createComponent<SniceCountdownElement>('snice-countdown', {
        target: futureDate
      });

      const tickSpy = vi.fn();
      countdown.addEventListener('countdown-tick', tickSpy);

      await wait(1100);

      expect(tickSpy).toHaveBeenCalled();
      const event = tickSpy.mock.calls[0][0] as CustomEvent<CountdownValues>;
      expect(event.detail).toHaveProperty('days');
      expect(event.detail).toHaveProperty('hours');
      expect(event.detail).toHaveProperty('minutes');
      expect(event.detail).toHaveProperty('seconds');
      expect(event.detail).toHaveProperty('total');
    });

    it('should emit countdown-complete event when target is reached', async () => {
      const nearFutureDate = new Date(Date.now() + 1100).toISOString();
      countdown = await createComponent<SniceCountdownElement>('snice-countdown', {
        target: nearFutureDate
      });

      const completeSpy = vi.fn();
      countdown.addEventListener('countdown-complete', completeSpy);

      await wait(1500);

      expect(completeSpy).toHaveBeenCalled();
    });

    it('should emit countdown-tick with correct values', async () => {
      const futureDate = new Date(Date.now() + 3661000).toISOString(); // 1 hour, 1 min, 1 sec
      countdown = await createComponent<SniceCountdownElement>('snice-countdown', {
        target: futureDate,
        format: 'dhms'
      });

      let tickDetail: CountdownValues | null = null;
      countdown.addEventListener('countdown-tick', (e: Event) => {
        tickDetail = (e as CustomEvent<CountdownValues>).detail;
      });

      await wait(100);

      expect(tickDetail).not.toBeNull();
      expect(tickDetail!.days).toBe(0);
      expect(tickDetail!.hours).toBe(1);
      expect(tickDetail!.minutes).toBe(1);
    });
  });

  describe('Display', () => {
    it('should display correct values for time remaining', async () => {
      const futureDate = new Date(Date.now() + 90061000).toISOString(); // 1 day, 1 hour, 1 min, 1 sec
      countdown = await createComponent<SniceCountdownElement>('snice-countdown', {
        target: futureDate,
        format: 'dhms'
      });
      await wait(100);

      const values = queryShadowAll(countdown as HTMLElement, '.value');
      expect(values[0].textContent).toBe('01'); // Days
    });

    it('should pad single digit values with zero', async () => {
      const futureDate = new Date(Date.now() + 5000).toISOString(); // 5 seconds
      countdown = await createComponent<SniceCountdownElement>('snice-countdown', {
        target: futureDate,
        format: 'ms'
      });
      await wait(100);

      const values = queryShadowAll(countdown as HTMLElement, '.value');
      expect(values[0].textContent).toMatch(/^\d{2}$/); // Minutes with padding
      expect(values[1].textContent).toBe('05'); // Seconds with padding
    });

    it('should have correct labels', async () => {
      const futureDate = new Date(Date.now() + 60000).toISOString();
      countdown = await createComponent<SniceCountdownElement>('snice-countdown', {
        target: futureDate,
        format: 'dhms'
      });
      await wait(100);

      const labels = queryShadowAll(countdown as HTMLElement, '.label');
      expect(labels[0].textContent).toBe('Days');
      expect(labels[1].textContent).toBe('Hours');
      expect(labels[2].textContent).toBe('Min');
      expect(labels[3].textContent).toBe('Sec');
    });

    it('should display separators between segments', async () => {
      const futureDate = new Date(Date.now() + 60000).toISOString();
      countdown = await createComponent<SniceCountdownElement>('snice-countdown', {
        target: futureDate,
        format: 'dhms'
      });
      await wait(100);

      const separators = queryShadowAll(countdown as HTMLElement, '.separator');
      expect(separators.length).toBe(3); // 4 segments = 3 separators
    });
  });

  describe('Variants styling', () => {
    it('should apply flip variant styles', async () => {
      const futureDate = new Date(Date.now() + 60000).toISOString();
      countdown = await createComponent<SniceCountdownElement>('snice-countdown', {
        target: futureDate,
        variant: 'flip'
      });
      await wait(100);

      expect(countdown.variant).toBe('flip');
    });

    it('should apply circular variant styles', async () => {
      const futureDate = new Date(Date.now() + 60000).toISOString();
      countdown = await createComponent<SniceCountdownElement>('snice-countdown', {
        target: futureDate,
        variant: 'circular'
      });
      await wait(100);

      expect(countdown.variant).toBe('circular');
    });
  });

  describe('Dynamic updates', () => {
    it('should update display when target changes', async () => {
      const futureDate1 = new Date(Date.now() + 60000).toISOString();
      countdown = await createComponent<SniceCountdownElement>('snice-countdown', {
        target: futureDate1,
        format: 'ms'
      });
      await wait(100);

      const valuesBefore = queryShadowAll(countdown as HTMLElement, '.value');
      const minutesBefore = valuesBefore[0].textContent;

      // Update target to be 10 minutes later
      const futureDate2 = new Date(Date.now() + 600000).toISOString();
      countdown.target = futureDate2;
      await wait(100);

      const valuesAfter = queryShadowAll(countdown as HTMLElement, '.value');
      const minutesAfter = valuesAfter[0].textContent;

      expect(minutesAfter).not.toBe(minutesBefore);
    });

    it('should stop timer when component is removed', async () => {
      const futureDate = new Date(Date.now() + 60000).toISOString();
      countdown = await createComponent<SniceCountdownElement>('snice-countdown', {
        target: futureDate
      });

      const tickSpy = vi.fn();
      countdown.addEventListener('countdown-tick', tickSpy);

      // Remove component
      countdown.remove();

      await wait(1100);

      // After removal, no more tick events should fire
      const tickCount = tickSpy.mock.calls.length;
      await wait(1100);
      expect(tickSpy.mock.calls.length).toBe(tickCount);
    });
  });
});
