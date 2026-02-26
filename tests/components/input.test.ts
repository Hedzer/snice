import { describe, it, expect, afterEach } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../components/input/snice-input';
import type { SniceInputElement } from '../../components/input/snice-input.types';

describe('snice-input', () => {
  let input: SniceInputElement;

  afterEach(() => {
    if (input) {
      removeComponent(input as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render input element', async () => {
      input = await createComponent<SniceInputElement>('snice-input');
      expect(input).toBeTruthy();
      expect(input.tagName).toBe('SNICE-INPUT');
    });

    it('should have default properties', async () => {
      input = await createComponent<SniceInputElement>('snice-input');
      expect(input.type).toBe('text');
      expect(input.size).toBe('medium');
      expect(input.variant).toBe('outlined');
      expect(input.value).toBe('');
      expect(input.disabled).toBe(false);
      expect(input.readonly).toBe(false);
      expect(input.required).toBe(false);
      expect(input.invalid).toBe(false);
      expect(input.clearable).toBe(false);
    });

    it('should render internal input element', async () => {
      input = await createComponent<SniceInputElement>('snice-input');
      await wait(50);

      const inputEl = queryShadow(input as HTMLElement, '.input');
      expect(inputEl).toBeTruthy();
      expect(inputEl?.tagName).toBe('INPUT');
    });
  });

  describe('input types', () => {
    const types = ['text', 'email', 'password', 'number', 'tel', 'url', 'search'];

    types.forEach(type => {
      it(`should support ${type} type`, async () => {
        input = await createComponent<SniceInputElement>('snice-input', {
          type
        });
        await wait(50);

        const inputEl = queryShadow(input as HTMLElement, '.input') as HTMLInputElement;
        expect(inputEl?.type).toBe(type);
      });
    });
  });

  describe('sizes', () => {
    const sizes = ['small', 'medium', 'large'];

    sizes.forEach(size => {
      it(`should apply ${size} size class`, async () => {
        input = await createComponent<SniceInputElement>('snice-input', {
          size
        });
        await wait(50);

        const inputEl = queryShadow(input as HTMLElement, '.input');
        expect(inputEl?.classList.contains(`input--${size}`)).toBe(true);
      });
    });
  });

  describe('variants', () => {
    const variants = ['outlined', 'filled', 'underlined'];

    variants.forEach(variant => {
      it(`should apply ${variant} variant class`, async () => {
        input = await createComponent<SniceInputElement>('snice-input', {
          variant
        });
        await wait(50);

        const inputEl = queryShadow(input as HTMLElement, '.input');
        expect(inputEl?.classList.contains(`input--${variant}`)).toBe(true);
      });
    });
  });

  describe('value', () => {
    it('should set initial value', async () => {
      input = await createComponent<SniceInputElement>('snice-input', {
        value: 'test value'
      });
      await wait(50);

      const inputEl = queryShadow(input as HTMLElement, '.input') as HTMLInputElement;
      expect(inputEl?.value).toBe('test value');
    });

    it('should update value dynamically', async () => {
      input = await createComponent<SniceInputElement>('snice-input');
      await wait(50);

      input.value = 'new value';

      const inputEl = queryShadow(input as HTMLElement, '.input') as HTMLInputElement;
      expect(inputEl?.value).toBe('new value');
    });
  });

  describe('label', () => {
    it('should render label when provided', async () => {
      input = await createComponent<SniceInputElement>('snice-input', {
        label: 'Username'
      });
      await wait(50);

      const labelEl = queryShadow(input as HTMLElement, '.label');
      expect(labelEl).toBeTruthy();
      expect(labelEl?.textContent).toContain('Username');
    });

    it('should show required indicator', async () => {
      input = await createComponent<SniceInputElement>('snice-input', {
        label: 'Email',
        required: true
      });
      await wait(50);

      const labelEl = queryShadow(input as HTMLElement, '.label');
      expect(labelEl?.classList.contains('label--required')).toBe(true);
    });
  });

  describe('placeholder', () => {
    it('should set placeholder', async () => {
      input = await createComponent<SniceInputElement>('snice-input', {
        placeholder: 'Enter text...'
      });
      await wait(50);

      const inputEl = queryShadow(input as HTMLElement, '.input') as HTMLInputElement;
      expect(inputEl?.placeholder).toBe('Enter text...');
    });
  });

  describe('helper and error text', () => {
    it('should show helper text', async () => {
      input = await createComponent<SniceInputElement>('snice-input', {
        'helper-text': 'Enter your username'
      });
      await wait(50);

      const helperEl = queryShadow(input as HTMLElement, '.helper-text');
      expect(helperEl?.textContent).toContain('Enter your username');
    });

    it('should show error text', async () => {
      input = await createComponent<SniceInputElement>('snice-input', {
        'error-text': 'Invalid input'
      });
      await wait(50);

      const errorEl = queryShadow(input as HTMLElement, '.error-text');
      expect(errorEl?.textContent).toContain('Invalid input');
    });
  });

  describe('states', () => {
    it('should apply disabled state', async () => {
      input = await createComponent<SniceInputElement>('snice-input', {
        disabled: true
      });
      await wait(50);

      const inputEl = queryShadow(input as HTMLElement, '.input') as HTMLInputElement;
      expect(inputEl?.disabled).toBe(true);
    });

    it('should apply readonly state', async () => {
      input = await createComponent<SniceInputElement>('snice-input', {
        readonly: true
      });
      await wait(50);

      const inputEl = queryShadow(input as HTMLElement, '.input') as HTMLInputElement;
      expect(inputEl?.readOnly).toBe(true);
    });

    it('should apply required state', async () => {
      input = await createComponent<SniceInputElement>('snice-input', {
        required: true
      });
      await wait(50);

      const inputEl = queryShadow(input as HTMLElement, '.input') as HTMLInputElement;
      expect(inputEl?.required).toBe(true);
    });

    it('should apply invalid class', async () => {
      input = await createComponent<SniceInputElement>('snice-input', {
        invalid: true
      });
      await wait(50);

      const inputEl = queryShadow(input as HTMLElement, '.input');
      expect(inputEl?.classList.contains('input--invalid')).toBe(true);
    });
  });

  describe('clearable', () => {
    it('should show clear button when clearable and has value', async () => {
      input = await createComponent<SniceInputElement>('snice-input', {
        clearable: true,
        value: 'test'
      });
      await wait(50);

      const clearBtn = queryShadow(input as HTMLElement, '.clear-button');
      expect(clearBtn).toBeTruthy();
    });

    it('should clear value when clear button clicked', async () => {
      input = await createComponent<SniceInputElement>('snice-input', {
        clearable: true,
        value: 'test'
      });
      await wait(50);

      input.clear();

      expect(input.value).toBe('');
    });
  });

  describe('password toggle', () => {
    it('should show password toggle for password type', async () => {
      input = await createComponent<SniceInputElement>('snice-input', {
        type: 'password',
        password: true
      });
      await wait(50);

      const toggleBtn = queryShadow(input as HTMLElement, '.password-toggle');
      expect(toggleBtn).toBeTruthy();
    });
  });

  describe('icons', () => {
    it('should render prefix icon', async () => {
      input = await createComponent<SniceInputElement>('snice-input', {
        'prefix-icon': '🔍'
      });
      await wait(50);

      const prefixEl = queryShadow(input as HTMLElement, '.icon--prefix');
      expect(prefixEl).toBeTruthy();
      expect(prefixEl?.textContent).toBe('🔍');
    });

    it('should render suffix icon', async () => {
      input = await createComponent<SniceInputElement>('snice-input', {
        'suffix-icon': '✓'
      });
      await wait(50);

      const suffixEl = queryShadow(input as HTMLElement, '.icon--suffix');
      expect(suffixEl).toBeTruthy();
      expect(suffixEl?.textContent).toBe('✓');
    });
  });

  describe('validation', () => {
    it('should set min attribute', async () => {
      input = await createComponent<SniceInputElement>('snice-input', {
        type: 'number',
        min: '0'
      });
      await wait(50);

      const inputEl = queryShadow(input as HTMLElement, '.input') as HTMLInputElement;
      expect(inputEl?.min).toBe('0');
    });

    it('should set max attribute', async () => {
      input = await createComponent<SniceInputElement>('snice-input', {
        type: 'number',
        max: '100'
      });
      await wait(50);

      const inputEl = queryShadow(input as HTMLElement, '.input') as HTMLInputElement;
      expect(inputEl?.max).toBe('100');
    });

    it('should set pattern attribute', async () => {
      input = await createComponent<SniceInputElement>('snice-input', {
        pattern: '[0-9]+'
      });
      await wait(50);

      const inputEl = queryShadow(input as HTMLElement, '.input') as HTMLInputElement;
      expect(inputEl?.pattern).toBe('[0-9]+');
    });

    it('should set maxlength attribute', async () => {
      input = await createComponent<SniceInputElement>('snice-input', {
        maxlength: 10
      });
      await wait(50);

      const inputEl = queryShadow(input as HTMLElement, '.input') as HTMLInputElement;
      expect(inputEl?.maxLength).toBe(10);
    });
  });

  describe('events', () => {
    it('should dispatch input-change event', async () => {
      input = await createComponent<SniceInputElement>('snice-input');
      await wait(50);

      let changeDetail: any = null;
      (input as HTMLElement).addEventListener('input-change', (e: Event) => {
        changeDetail = (e as CustomEvent).detail;
      });

      // Simulate actual change event on the input element
      const inputEl = queryShadow(input as HTMLElement, '.input') as HTMLInputElement;
      inputEl.value = 'test';
      inputEl.dispatchEvent(new Event('change', { bubbles: true }));

      expect(changeDetail).toBeTruthy();
      expect(changeDetail.value).toBe('test');
    });

    it('should dispatch input-focus event', async () => {
      input = await createComponent<SniceInputElement>('snice-input');
      await wait(50);

      let focusFired = false;
      (input as HTMLElement).addEventListener('input-focus', () => {
        focusFired = true;
      });

      const inputEl = queryShadow(input as HTMLElement, '.input') as HTMLInputElement;
      inputEl?.dispatchEvent(new Event('focus'));

      expect(focusFired).toBe(true);
    });

    it('should dispatch input-blur event', async () => {
      input = await createComponent<SniceInputElement>('snice-input');
      await wait(50);

      let blurFired = false;
      (input as HTMLElement).addEventListener('input-blur', () => {
        blurFired = true;
      });

      const inputEl = queryShadow(input as HTMLElement, '.input') as HTMLInputElement;
      inputEl?.dispatchEvent(new Event('blur'));

      expect(blurFired).toBe(true);
    });
  });

  describe('align', () => {
    it('should default to no align attribute', async () => {
      input = await createComponent<SniceInputElement>('snice-input');
      await wait(50);

      expect((input as HTMLElement).hasAttribute('align')).toBe(false);
    });

    it('should not apply flex layout to wrapper without align', async () => {
      input = await createComponent<SniceInputElement>('snice-input');
      await wait(50);

      const wrapper = queryShadow(input as HTMLElement, '.input-wrapper');
      const style = window.getComputedStyle(wrapper!);
      expect(style.display).not.toBe('flex');
    });

    it('should accept align="top"', async () => {
      input = await createComponent<SniceInputElement>('snice-input', {
        align: 'top'
      });
      await wait(50);

      expect((input as HTMLElement).getAttribute('align')).toBe('top');
      expect(input.align).toBe('top');
    });

    it('should accept align="center"', async () => {
      input = await createComponent<SniceInputElement>('snice-input', {
        align: 'center'
      });
      await wait(50);

      expect((input as HTMLElement).getAttribute('align')).toBe('center');
      expect(input.align).toBe('center');
    });

    it('should accept align="bottom"', async () => {
      input = await createComponent<SniceInputElement>('snice-input', {
        align: 'bottom'
      });
      await wait(50);

      expect((input as HTMLElement).getAttribute('align')).toBe('bottom');
      expect(input.align).toBe('bottom');
    });

    it('should update align dynamically', async () => {
      input = await createComponent<SniceInputElement>('snice-input');
      await wait(50);

      input.align = 'bottom';
      await wait(50);

      expect((input as HTMLElement).getAttribute('align')).toBe('bottom');
    });
  });

  describe('stretch', () => {
    it('should default to no stretch', async () => {
      input = await createComponent<SniceInputElement>('snice-input');
      await wait(50);

      expect(input.stretch).toBe(false);
      expect((input as HTMLElement).hasAttribute('stretch')).toBe(false);
    });

    it('should accept stretch attribute', async () => {
      input = await createComponent<SniceInputElement>('snice-input', {
        stretch: true
      });
      await wait(50);

      expect(input.stretch).toBe(true);
      expect((input as HTMLElement).hasAttribute('stretch')).toBe(true);
    });

    it('should set stretch attribute on host for CSS targeting', async () => {
      input = await createComponent<SniceInputElement>('snice-input', {
        stretch: true
      });
      await wait(50);

      // CSS uses :host([stretch]) to apply flex:1 to .input-container
      // and height:100% to .input — verify attribute is present for selector to match
      expect((input as HTMLElement).hasAttribute('stretch')).toBe(true);
      const container = queryShadow(input as HTMLElement, '.input-container');
      expect(container).toBeTruthy();
    });

    it('should update stretch dynamically', async () => {
      input = await createComponent<SniceInputElement>('snice-input');
      await wait(50);

      input.stretch = true;
      await wait(50);

      expect((input as HTMLElement).hasAttribute('stretch')).toBe(true);
    });
  });

  describe('API methods', () => {
    it('should support focus method', async () => {
      input = await createComponent<SniceInputElement>('snice-input');
      await wait(50);

      expect(() => input.focus()).not.toThrow();
    });

    it('should support blur method', async () => {
      input = await createComponent<SniceInputElement>('snice-input');
      await wait(50);

      expect(() => input.blur()).not.toThrow();
    });

    it('should support select method', async () => {
      input = await createComponent<SniceInputElement>('snice-input', {
        value: 'test'
      });
      await wait(50);

      expect(() => input.select()).not.toThrow();
    });

    it('should support clear method', async () => {
      input = await createComponent<SniceInputElement>('snice-input', {
        value: 'test'
      });
      await wait(50);

      input.clear();

      expect(input.value).toBe('');
    });
  });
});
