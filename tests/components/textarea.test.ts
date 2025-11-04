import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../components/textarea/snice-textarea';
import type { SniceTextareaElement } from '../../components/textarea/snice-textarea.types';

describe('snice-textarea', () => {
  let textarea: SniceTextareaElement;

  afterEach(() => {
    if (textarea) {
      removeComponent(textarea as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render textarea element', async () => {
      textarea = await createComponent<SniceTextareaElement>('snice-textarea');
      expect(textarea).toBeTruthy();
      expect(textarea.tagName).toBe('SNICE-TEXTAREA');
    });

    it('should have default properties', async () => {
      textarea = await createComponent<SniceTextareaElement>('snice-textarea');
      expect(textarea.size).toBe('medium');
      expect(textarea.variant).toBe('outlined');
      expect(textarea.resize).toBe('vertical');
      expect(textarea.value).toBe('');
      expect(textarea.disabled).toBe(false);
      expect(textarea.readonly).toBe(false);
      expect(textarea.required).toBe(false);
      expect(textarea.invalid).toBe(false);
      expect(textarea.rows).toBe(3);
      expect(textarea.autoGrow).toBe(false);
    });

    it('should render internal textarea element', async () => {
      textarea = await createComponent<SniceTextareaElement>('snice-textarea');
      await wait(50);

      const textareaEl = queryShadow(textarea as HTMLElement, '.textarea');
      expect(textareaEl).toBeTruthy();
      expect(textareaEl?.tagName).toBe('TEXTAREA');
    });
  });

  describe('sizes', () => {
    const sizes = ['small', 'medium', 'large'];

    sizes.forEach(size => {
      it(`should apply ${size} size class`, async () => {
        textarea = await createComponent<SniceTextareaElement>('snice-textarea', {
          size
        });
        await wait(50);

        const textareaEl = queryShadow(textarea as HTMLElement, '.textarea');
        expect(textareaEl?.classList.contains(`textarea--${size}`)).toBe(true);
      });
    });
  });

  describe('variants', () => {
    const variants = ['outlined', 'filled', 'underlined'];

    variants.forEach(variant => {
      it(`should apply ${variant} variant class`, async () => {
        textarea = await createComponent<SniceTextareaElement>('snice-textarea', {
          variant
        });
        await wait(50);

        const textareaEl = queryShadow(textarea as HTMLElement, '.textarea');
        expect(textareaEl?.classList.contains(`textarea--${variant}`)).toBe(true);
      });
    });
  });

  describe('resize', () => {
    const resizeOptions = ['none', 'vertical', 'horizontal', 'both'];

    resizeOptions.forEach(resize => {
      it(`should apply ${resize} resize class`, async () => {
        textarea = await createComponent<SniceTextareaElement>('snice-textarea', {
          resize
        });
        await wait(50);

        const textareaEl = queryShadow(textarea as HTMLElement, '.textarea');
        expect(textareaEl?.classList.contains(`textarea--resize-${resize}`)).toBe(true);
      });
    });
  });

  describe('value', () => {
    it('should set initial value', async () => {
      textarea = await createComponent<SniceTextareaElement>('snice-textarea', {
        value: 'test value'
      });
      await wait(50);

      const textareaEl = queryShadow(textarea as HTMLElement, '.textarea') as HTMLTextAreaElement;
      expect(textareaEl?.value).toBe('test value');
    });

    it('should update value dynamically', async () => {
      textarea = await createComponent<SniceTextareaElement>('snice-textarea');
      await wait(50);

      textarea.value = 'new value';

      const textareaEl = queryShadow(textarea as HTMLElement, '.textarea') as HTMLTextAreaElement;
      expect(textareaEl?.value).toBe('new value');
    });
  });

  describe('label', () => {
    it('should render label when provided', async () => {
      textarea = await createComponent<SniceTextareaElement>('snice-textarea', {
        label: 'Comments'
      });
      await wait(50);

      const labelEl = queryShadow(textarea as HTMLElement, '.label');
      expect(labelEl).toBeTruthy();
      expect(labelEl?.textContent).toContain('Comments');
    });

    it('should show required indicator', async () => {
      textarea = await createComponent<SniceTextareaElement>('snice-textarea', {
        label: 'Message',
        required: true
      });
      await wait(50);

      const labelEl = queryShadow(textarea as HTMLElement, '.label');
      expect(labelEl?.classList.contains('label--required')).toBe(true);
    });
  });

  describe('placeholder', () => {
    it('should set placeholder', async () => {
      textarea = await createComponent<SniceTextareaElement>('snice-textarea', {
        placeholder: 'Enter text...'
      });
      await wait(50);

      const textareaEl = queryShadow(textarea as HTMLElement, '.textarea') as HTMLTextAreaElement;
      expect(textareaEl?.placeholder).toBe('Enter text...');
    });
  });

  describe('helper and error text', () => {
    it('should show helper text', async () => {
      textarea = await createComponent<SniceTextareaElement>('snice-textarea', {
        'helper-text': 'Enter your message'
      });
      await wait(50);

      const helperEl = queryShadow(textarea as HTMLElement, '.helper-text');
      expect(helperEl?.textContent).toContain('Enter your message');
    });

    it('should show error text', async () => {
      textarea = await createComponent<SniceTextareaElement>('snice-textarea', {
        'error-text': 'Invalid input'
      });
      await wait(50);

      const errorEl = queryShadow(textarea as HTMLElement, '.error-text');
      expect(errorEl?.textContent).toContain('Invalid input');
    });
  });

  describe('states', () => {
    it('should apply disabled state', async () => {
      textarea = await createComponent<SniceTextareaElement>('snice-textarea', {
        disabled: true
      });
      await wait(50);

      const textareaEl = queryShadow(textarea as HTMLElement, '.textarea') as HTMLTextAreaElement;
      expect(textareaEl?.disabled).toBe(true);
    });

    it('should apply readonly state', async () => {
      textarea = await createComponent<SniceTextareaElement>('snice-textarea', {
        readonly: true
      });
      await wait(50);

      const textareaEl = queryShadow(textarea as HTMLElement, '.textarea') as HTMLTextAreaElement;
      expect(textareaEl?.readOnly).toBe(true);
    });

    it('should apply required state', async () => {
      textarea = await createComponent<SniceTextareaElement>('snice-textarea', {
        required: true
      });
      await wait(50);

      const textareaEl = queryShadow(textarea as HTMLElement, '.textarea') as HTMLTextAreaElement;
      expect(textareaEl?.required).toBe(true);
    });

    it('should apply invalid class', async () => {
      textarea = await createComponent<SniceTextareaElement>('snice-textarea', {
        invalid: true
      });
      await wait(50);

      const textareaEl = queryShadow(textarea as HTMLElement, '.textarea');
      expect(textareaEl?.classList.contains('textarea--invalid')).toBe(true);
    });
  });

  describe('rows and cols', () => {
    it('should set rows attribute', async () => {
      textarea = await createComponent<SniceTextareaElement>('snice-textarea', {
        rows: 5
      });
      await wait(50);

      const textareaEl = queryShadow(textarea as HTMLElement, '.textarea') as HTMLTextAreaElement;
      expect(textareaEl?.rows).toBe('5');
    });

    it('should set cols attribute', async () => {
      textarea = await createComponent<SniceTextareaElement>('snice-textarea', {
        cols: 50
      });
      await wait(50);

      const textareaEl = queryShadow(textarea as HTMLElement, '.textarea') as HTMLTextAreaElement;
      expect(textareaEl?.cols).toBe('50');
    });
  });

  describe('validation', () => {
    it('should set maxlength attribute', async () => {
      textarea = await createComponent<SniceTextareaElement>('snice-textarea', {
        maxlength: 100
      });
      await wait(50);

      const textareaEl = queryShadow(textarea as HTMLElement, '.textarea') as HTMLTextAreaElement;
      expect(textareaEl?.maxLength).toBe(100);
    });

    it('should show character count when maxlength is set', async () => {
      textarea = await createComponent<SniceTextareaElement>('snice-textarea', {
        maxlength: 100,
        value: 'Hello'
      });
      await wait(50);

      const charCount = queryShadow(textarea as HTMLElement, '.character-count');
      expect(charCount).toBeTruthy();
      expect(charCount?.textContent).toContain('5 / 100');
    });
  });

  describe('auto-grow', () => {
    it('should support auto-grow property', async () => {
      textarea = await createComponent<SniceTextareaElement>('snice-textarea', {
        'auto-grow': true,
        value: 'Line 1\nLine 2\nLine 3'
      });
      await wait(50);

      expect(textarea.autoGrow).toBe(true);
    });
  });

  describe('events', () => {
    it('should dispatch textarea-change event', async () => {
      textarea = await createComponent<SniceTextareaElement>('snice-textarea');
      await wait(50);

      let changeDetail: any = null;
      (textarea as HTMLElement).addEventListener('textarea-change', (e: Event) => {
        changeDetail = (e as CustomEvent).detail;
      });

      const textareaEl = queryShadow(textarea as HTMLElement, '.textarea') as HTMLTextAreaElement;
      textareaEl.value = 'test';
      textareaEl.dispatchEvent(new Event('change', { bubbles: true }));

      expect(changeDetail).toBeTruthy();
      expect(changeDetail.value).toBe('test');
    });

    it('should dispatch textarea-focus event', async () => {
      textarea = await createComponent<SniceTextareaElement>('snice-textarea');
      await wait(50);

      let focusFired = false;
      (textarea as HTMLElement).addEventListener('textarea-focus', () => {
        focusFired = true;
      });

      const textareaEl = queryShadow(textarea as HTMLElement, '.textarea') as HTMLTextAreaElement;
      textareaEl?.dispatchEvent(new Event('focus'));

      expect(focusFired).toBe(true);
    });

    it('should dispatch textarea-blur event', async () => {
      textarea = await createComponent<SniceTextareaElement>('snice-textarea');
      await wait(50);

      let blurFired = false;
      (textarea as HTMLElement).addEventListener('textarea-blur', () => {
        blurFired = true;
      });

      const textareaEl = queryShadow(textarea as HTMLElement, '.textarea') as HTMLTextAreaElement;
      textareaEl?.dispatchEvent(new Event('blur'));

      expect(blurFired).toBe(true);
    });
  });

  describe('API methods', () => {
    it('should support focus method', async () => {
      textarea = await createComponent<SniceTextareaElement>('snice-textarea');
      await wait(50);

      expect(() => textarea.focus()).not.toThrow();
    });

    it('should support blur method', async () => {
      textarea = await createComponent<SniceTextareaElement>('snice-textarea');
      await wait(50);

      expect(() => textarea.blur()).not.toThrow();
    });

    it('should support select method', async () => {
      textarea = await createComponent<SniceTextareaElement>('snice-textarea', {
        value: 'test'
      });
      await wait(50);

      expect(() => textarea.select()).not.toThrow();
    });
  });
});
