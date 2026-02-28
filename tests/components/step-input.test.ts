import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, trackRenders, wait } from './test-utils';
import '../../components/step-input/snice-step-input';
import type { SniceStepInputElement } from '../../components/step-input/snice-step-input.types';

describe('snice-step-input', () => {
  let el: SniceStepInputElement;

  afterEach(() => {
    if (el) {
      removeComponent(el as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render step-input element', async () => {
      el = await createComponent<SniceStepInputElement>('snice-step-input');
      expect(el).toBeTruthy();
      expect(el.tagName).toBe('SNICE-STEP-INPUT');
    });

    it('should have default properties', async () => {
      el = await createComponent<SniceStepInputElement>('snice-step-input');
      expect(el.value).toBe(0);
      expect(el.step).toBe(1);
      expect(el.disabled).toBe(false);
      expect(el.readonly).toBe(false);
      expect(el.size).toBe('medium');
      expect(el.wrap).toBe(false);
    });

    it('should render buttons and input', async () => {
      el = await createComponent<SniceStepInputElement>('snice-step-input');
      await wait(50);

      const decBtn = queryShadow(el as HTMLElement, '.step-input__button--decrement');
      const incBtn = queryShadow(el as HTMLElement, '.step-input__button--increment');
      const input = queryShadow(el as HTMLElement, '.step-input__input');

      expect(decBtn).toBeTruthy();
      expect(incBtn).toBeTruthy();
      expect(input).toBeTruthy();
    });
  });

  describe('sizes', () => {
    const sizes = ['small', 'medium', 'large'];

    sizes.forEach(size => {
      it(`should apply ${size} size class`, async () => {
        el = await createComponent<SniceStepInputElement>('snice-step-input', { size });
        await wait(50);

        const base = queryShadow(el as HTMLElement, '.step-input');
        expect(base?.classList.contains(`step-input--${size}`)).toBe(true);
      });
    });
  });

  describe('increment and decrement', () => {
    it('should increment value', async () => {
      el = await createComponent<SniceStepInputElement>('snice-step-input', { value: 5 });
      await wait(50);

      el.increment();
      expect(el.value).toBe(6);
    });

    it('should decrement value', async () => {
      el = await createComponent<SniceStepInputElement>('snice-step-input', { value: 5 });
      await wait(50);

      el.decrement();
      expect(el.value).toBe(4);
    });

    it('should respect step value', async () => {
      el = await createComponent<SniceStepInputElement>('snice-step-input', { value: 0, step: 5 });
      await wait(50);

      el.increment();
      expect(el.value).toBe(5);

      el.increment();
      expect(el.value).toBe(10);
    });

    it('should not increment past max', async () => {
      el = await createComponent<SniceStepInputElement>('snice-step-input', { value: 9, max: 10 });
      await wait(50);

      el.increment();
      expect(el.value).toBe(10);

      el.increment();
      expect(el.value).toBe(10);
    });

    it('should not decrement below min', async () => {
      el = await createComponent<SniceStepInputElement>('snice-step-input', { value: 1, min: 0 });
      await wait(50);

      el.decrement();
      expect(el.value).toBe(0);

      el.decrement();
      expect(el.value).toBe(0);
    });
  });

  describe('wrap', () => {
    it('should wrap from max to min when incrementing', async () => {
      el = await createComponent<SniceStepInputElement>('snice-step-input', {
        value: 10,
        min: 0,
        max: 10,
        wrap: true
      });
      await wait(50);

      el.increment();
      expect(el.value).toBe(0);
    });

    it('should wrap from min to max when decrementing', async () => {
      el = await createComponent<SniceStepInputElement>('snice-step-input', {
        value: 0,
        min: 0,
        max: 10,
        wrap: true
      });
      await wait(50);

      el.decrement();
      expect(el.value).toBe(10);
    });
  });

  describe('disabled and readonly', () => {
    it('should not change value when disabled', async () => {
      el = await createComponent<SniceStepInputElement>('snice-step-input', {
        value: 5,
        disabled: true
      });
      await wait(50);

      el.increment();
      expect(el.value).toBe(5);

      el.decrement();
      expect(el.value).toBe(5);
    });

    it('should not change value when readonly', async () => {
      el = await createComponent<SniceStepInputElement>('snice-step-input', {
        value: 5,
        readonly: true
      });
      await wait(50);

      el.increment();
      expect(el.value).toBe(5);
    });
  });

  describe('events', () => {
    it('should dispatch value-change on increment', async () => {
      el = await createComponent<SniceStepInputElement>('snice-step-input', { value: 5 });
      await wait(50);

      let detail: any = null;
      (el as HTMLElement).addEventListener('value-change', (e: Event) => {
        detail = (e as CustomEvent).detail;
      });

      el.increment();

      expect(detail).toBeTruthy();
      expect(detail.value).toBe(6);
      expect(detail.oldValue).toBe(5);
    });

    it('should dispatch value-change on decrement', async () => {
      el = await createComponent<SniceStepInputElement>('snice-step-input', { value: 5 });
      await wait(50);

      let detail: any = null;
      (el as HTMLElement).addEventListener('value-change', (e: Event) => {
        detail = (e as CustomEvent).detail;
      });

      el.decrement();

      expect(detail).toBeTruthy();
      expect(detail.value).toBe(4);
      expect(detail.oldValue).toBe(5);
    });
  });

  describe('API methods', () => {
    it('should support focus method', async () => {
      el = await createComponent<SniceStepInputElement>('snice-step-input');
      await wait(50);

      expect(() => el.focus()).not.toThrow();
    });

    it('should support blur method', async () => {
      el = await createComponent<SniceStepInputElement>('snice-step-input');
      await wait(50);

      expect(() => el.blur()).not.toThrow();
    });
  });

  describe('initial clamping', () => {
    it('should clamp initial value above max', async () => {
      el = await createComponent<SniceStepInputElement>('snice-step-input', {
        value: 200,
        min: 0,
        max: 100
      });
      await wait(50);

      expect(el.value).toBe(100);
    });

    it('should clamp initial value below min', async () => {
      el = await createComponent<SniceStepInputElement>('snice-step-input', {
        value: -10,
        min: 0,
        max: 100
      });
      await wait(50);

      expect(el.value).toBe(0);
    });
  });
});
