import { describe, it, expect, beforeEach, vi } from 'vitest';
import '../../components/timer/snice-timer';
import type { SniceTimer } from '../../components/timer/snice-timer';

describe('SniceTimer', () => {
  let timer: SniceTimer;

  beforeEach(() => {
    timer = document.createElement('snice-timer');
    document.body.appendChild(timer);
  });

  afterEach(() => {
    timer.remove();
  });

  describe('Stopwatch mode', () => {
    it('should start at 0 in stopwatch mode', () => {
      timer.mode = 'stopwatch';
      expect(timer.getTime()).toBe(0);
    });

    it('should increment time when started', async () => {
      timer.mode = 'stopwatch';
      timer.start();

      await new Promise(resolve => setTimeout(resolve, 200));

      const time = timer.getTime();
      expect(time).toBeGreaterThan(0);
      expect(time).toBeLessThan(1);

      timer.stop();
    });

    it('should stop incrementing when stopped', async () => {
      timer.mode = 'stopwatch';
      timer.start();

      await new Promise(resolve => setTimeout(resolve, 100));
      timer.stop();

      const timeAfterStop = timer.getTime();

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(timer.getTime()).toBe(timeAfterStop);
    });

    it('should reset to 0', async () => {
      timer.mode = 'stopwatch';
      timer.start();

      await new Promise(resolve => setTimeout(resolve, 100));
      timer.reset();

      expect(timer.getTime()).toBe(0);
      expect(timer.running).toBe(false);
    });

    it('should update display on reset', async () => {
      timer.mode = 'stopwatch';
      timer.start();

      await new Promise(resolve => setTimeout(resolve, 100));
      timer.reset();

      await new Promise(resolve => setTimeout(resolve, 50));

      const display = timer.shadowRoot?.querySelector('.timer-display');
      expect(display?.textContent).toBe('0:00.0');
    });
  });

  describe('Timer mode', () => {
    it('should start at initialTime', () => {
      timer.mode = 'timer';
      timer.initialTime = 60;
      expect(timer.getTime()).toBe(0);

      // Reset to initialize
      timer.reset();
      expect(timer.getTime()).toBe(60);
    });

    it('should decrement time when started', async () => {
      timer.mode = 'timer';
      timer.initialTime = 10;
      timer.reset();
      timer.start();

      await new Promise(resolve => setTimeout(resolve, 200));

      const time = timer.getTime();
      expect(time).toBeLessThan(10);
      expect(time).toBeGreaterThan(9);

      timer.stop();
    });

    it('should stop at 0', async () => {
      timer.mode = 'timer';
      timer.initialTime = 0.2;
      timer.reset();
      timer.start();

      await new Promise(resolve => setTimeout(resolve, 300));

      expect(timer.getTime()).toBe(0);
      expect(timer.running).toBe(false);
    });

    it('should emit timer-complete event when reaching 0', async () => {
      timer.mode = 'timer';
      timer.initialTime = 0.2;
      timer.reset();

      const completeSpy = vi.fn();
      timer.addEventListener('@snice/timer-complete', completeSpy);

      timer.start();

      await new Promise(resolve => setTimeout(resolve, 300));

      expect(completeSpy).toHaveBeenCalled();
    });

    it('should reset to initialTime', async () => {
      timer.mode = 'timer';
      timer.initialTime = 60;
      timer.reset();
      timer.start();

      await new Promise(resolve => setTimeout(resolve, 100));
      timer.reset();

      expect(timer.getTime()).toBe(60);
      expect(timer.running).toBe(false);
    });
  });

  describe('Events', () => {
    it('should emit timer-start event', () => {
      const startSpy = vi.fn();
      timer.addEventListener('@snice/timer-start', startSpy);

      timer.start();

      expect(startSpy).toHaveBeenCalled();
      const detail = startSpy.mock.calls[0][0].detail;
      expect(detail.timer).toBe(timer);
      expect(typeof detail.time).toBe('number');
    });

    it('should emit timer-stop event', () => {
      const stopSpy = vi.fn();
      timer.addEventListener('@snice/timer-stop', stopSpy);

      timer.start();
      timer.stop();

      expect(stopSpy).toHaveBeenCalled();
    });

    it('should emit timer-reset event', () => {
      const resetSpy = vi.fn();
      timer.addEventListener('@snice/timer-reset', resetSpy);

      timer.reset();

      expect(resetSpy).toHaveBeenCalled();
    });
  });

  describe('Controls', () => {
    it('should have start button when not running', () => {
      const startBtn = timer.shadowRoot?.querySelector('.timer-btn.start');
      expect(startBtn).toBeTruthy();
    });

    it('should have pause button when running', async () => {
      timer.start();
      await new Promise(resolve => setTimeout(resolve, 50));

      const pauseBtn = timer.shadowRoot?.querySelector('.timer-btn.pause');
      expect(pauseBtn).toBeTruthy();
    });

    it('should always have reset button', () => {
      const resetBtn = timer.shadowRoot?.querySelector('.timer-btn.reset');
      expect(resetBtn).toBeTruthy();
    });

    it('should start timer when start button clicked', async () => {
      const startBtn = timer.shadowRoot?.querySelector<HTMLButtonElement>('.timer-btn.start');
      startBtn?.click();

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(timer.running).toBe(true);
      timer.stop();
    });

    it('should stop timer when pause button clicked', async () => {
      timer.start();
      await new Promise(resolve => setTimeout(resolve, 50));

      const pauseBtn = timer.shadowRoot?.querySelector<HTMLButtonElement>('.timer-btn.pause');
      pauseBtn?.click();

      expect(timer.running).toBe(false);
    });

    it('should reset timer when reset button clicked', async () => {
      timer.mode = 'stopwatch';
      timer.start();

      await new Promise(resolve => setTimeout(resolve, 100));

      const resetBtn = timer.shadowRoot?.querySelector<HTMLButtonElement>('.timer-btn.reset');
      resetBtn?.click();

      expect(timer.getTime()).toBe(0);
      expect(timer.running).toBe(false);
    });
  });

  describe('Display', () => {
    it('should format time correctly for under 1 minute', () => {
      timer.mode = 'stopwatch';
      const display = timer.shadowRoot?.querySelector('.timer-display');
      expect(display?.textContent).toBe('0:00.0');
    });

    it('should format time correctly for over 1 minute', async () => {
      timer.mode = 'timer';
      timer.initialTime = 125; // 2:05
      timer.reset();

      await new Promise(resolve => setTimeout(resolve, 50));

      const display = timer.shadowRoot?.querySelector('.timer-display');
      expect(display?.textContent).toContain('2:05');
    });

    it('should format time correctly for over 1 hour', async () => {
      timer.mode = 'timer';
      timer.initialTime = 3665; // 1:01:05
      timer.reset();

      await new Promise(resolve => setTimeout(resolve, 50));

      const display = timer.shadowRoot?.querySelector('.timer-display');
      expect(display?.textContent).toBe('1:01:05');
    });
  });

  describe('Properties', () => {
    it('should have correct default properties', () => {
      expect(timer.mode).toBe('stopwatch');
      expect(timer.initialTime).toBe(0);
      expect(timer.running).toBe(false);
    });

    it('should accept mode attribute', () => {
      timer.setAttribute('mode', 'timer');
      expect(timer.mode).toBe('timer');
    });

    it('should accept initial-time attribute', () => {
      timer.setAttribute('initial-time', '120');
      expect(timer.initialTime).toBe(120);
    });
  });
});
