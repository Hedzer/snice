import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait, triggerMouseEvent } from './test-utils';
import '../../packages/components/src/button/snice-button';
import type { SniceButtonElement } from '../../packages/components/src/button/snice-button.types';

describe('snice-button', () => {
  let button: SniceButtonElement;

  afterEach(() => {
    vi.restoreAllMocks();
    delete (globalThis as any).__sniceButtonInjected;
    if (button) {
      removeComponent(button as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render button element', async () => {
      button = await createComponent<SniceButtonElement>('snice-button');

      expect(button).toBeTruthy();
      expect(button.tagName).toBe('SNICE-BUTTON');
    });

    it('should have default properties', async () => {
      button = await createComponent<SniceButtonElement>('snice-button');

      expect(button.variant).toBe('default');
      expect(button.size).toBe('medium');
      expect(button.type).toBe('button');
      expect(button.disabled).toBe(false);
      expect(button.loading).toBe(false);
      expect(button.outline).toBe(false);
      expect(button.pill).toBe(false);
      expect(button.circle).toBe(false);
      expect(button.href).toBe('');
      expect(button.target).toBe('');
      expect(button.icon).toBe('');
      expect(button.iconPlacement).toBe('start');
    });

    it('should render internal button element', async () => {
      button = await createComponent<SniceButtonElement>('snice-button');
      await wait(10);

      const btnEl = queryShadow(button as HTMLElement, '.button');
      expect(btnEl).toBeTruthy();
      expect(btnEl?.tagName).toBe('BUTTON');
    });
  });

  describe('variants', () => {
    const variants = ['default', 'primary', 'success', 'warning', 'danger'];

    variants.forEach(variant => {
      it(`should apply ${variant} variant class`, async () => {
        button = await createComponent<SniceButtonElement>('snice-button', {
          variant
        });
        await wait(10);

        const btnEl = queryShadow(button as HTMLElement, '.button');
        expect(btnEl?.classList.contains(`button--${variant}`)).toBe(true);
      });
    });
  });

  describe('sizes', () => {
    const sizes = ['small', 'medium', 'large'];

    sizes.forEach(size => {
      it(`should apply ${size} size class`, async () => {
        button = await createComponent<SniceButtonElement>('snice-button', {
          size
        });
        await wait(10);

        const btnEl = queryShadow(button as HTMLElement, '.button');
        expect(btnEl?.classList.contains(`button--${size}`)).toBe(true);
      });
    });
  });

  describe('button type', () => {
    it('should default to type="button"', async () => {
      button = await createComponent<SniceButtonElement>('snice-button');
      await wait(10);

      const btnEl = queryShadow(button as HTMLElement, '.button') as HTMLButtonElement;
      expect(btnEl?.type).toBe('button');
    });

    it('should support type="submit"', async () => {
      button = await createComponent<SniceButtonElement>('snice-button', {
        type: 'submit'
      });
      await wait(10);

      const btnEl = queryShadow(button as HTMLElement, '.button') as HTMLButtonElement;
      expect(btnEl?.type).toBe('submit');
    });

    it('should support type="reset"', async () => {
      button = await createComponent<SniceButtonElement>('snice-button', {
        type: 'reset'
      });
      await wait(10);

      const btnEl = queryShadow(button as HTMLElement, '.button') as HTMLButtonElement;
      expect(btnEl?.type).toBe('reset');
    });

    it('should update type dynamically', async () => {
      button = await createComponent<SniceButtonElement>('snice-button');
      await wait(10);

      let btnEl = queryShadow(button as HTMLElement, '.button') as HTMLButtonElement;
      expect(btnEl?.type).toBe('button');

      button.type = 'submit';
      await wait(10);

      btnEl = queryShadow(button as HTMLElement, '.button') as HTMLButtonElement;
      expect(btnEl?.type).toBe('submit');
    });

    it('should set type attribute on internal button via property', async () => {
      button = await createComponent<SniceButtonElement>('snice-button');
      await wait(10);

      button.setAttribute('type', 'submit');
      await wait(10);

      const btnEl = queryShadow(button as HTMLElement, '.button') as HTMLButtonElement;
      expect(btnEl?.type).toBe('submit');
    });

    it('should trigger form submission when type="submit"', async () => {
      const form = document.createElement('form');
      form.id = 'test-form-submit';
      document.body.appendChild(form);

      button = await createComponent<SniceButtonElement>('snice-button', {
        type: 'submit'
      });
      form.appendChild(button);
      await wait(10);

      let formSubmitted = false;
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        formSubmitted = true;
      });

      button.click();
      await wait(10);

      expect(formSubmitted).toBe(true);
      form.remove();
    });

    it('should trigger form reset when type="reset"', async () => {
      const form = document.createElement('form');
      form.id = 'test-form-reset';
      const input = document.createElement('input');
      input.type = 'text';
      input.name = 'test';
      input.defaultValue = '';
      form.appendChild(input);
      document.body.appendChild(form);

      button = await createComponent<SniceButtonElement>('snice-button', {
        type: 'reset'
      });
      form.appendChild(button);
      await wait(10);

      input.value = 'changed';
      expect(input.value).toBe('changed');

      button.click();
      await wait(10);

      expect(input.value).toBe('');
      form.remove();
    });
  });

  describe('modifiers', () => {
    it('should apply outline modifier', async () => {
      button = await createComponent<SniceButtonElement>('snice-button', {
        outline: true
      });
      await wait(10);

      const btnEl = queryShadow(button as HTMLElement, '.button');
      expect(btnEl?.classList.contains('button--outline')).toBe(true);
    });

    it('should apply pill modifier', async () => {
      button = await createComponent<SniceButtonElement>('snice-button', {
        pill: true
      });
      await wait(10);

      const btnEl = queryShadow(button as HTMLElement, '.button');
      expect(btnEl?.classList.contains('button--pill')).toBe(true);
    });

    it('should apply circle modifier', async () => {
      button = await createComponent<SniceButtonElement>('snice-button', {
        circle: true
      });
      await wait(10);

      const btnEl = queryShadow(button as HTMLElement, '.button');
      expect(btnEl?.classList.contains('button--circle')).toBe(true);
    });
  });

  describe('disabled state', () => {
    it('should apply disabled attribute and class', async () => {
      button = await createComponent<SniceButtonElement>('snice-button', {
        disabled: true
      });
      await wait(10);

      const btnEl = queryShadow(button as HTMLElement, '.button') as HTMLButtonElement;
      expect(btnEl?.disabled).toBe(true);
      expect(btnEl?.classList.contains('button--disabled')).toBe(true);
    });

    it('should prevent click when disabled', async () => {
      button = await createComponent<SniceButtonElement>('snice-button', {
        disabled: true
      });
      await wait(10);

      let eventFired = false;
      (button as HTMLElement).addEventListener('button-click', () => {
        eventFired = true;
      });

      const btnEl = queryShadow(button as HTMLElement, '.button');
      triggerMouseEvent(btnEl as HTMLElement, 'click');
      await wait(10);

      // Event still fires but should be prevented in handler
      expect(button.disabled).toBe(true);
    });

    it('should update disabled state via setDisabled method', async () => {
      button = await createComponent<SniceButtonElement>('snice-button');

      button.setDisabled(true);
      await wait(10);

      expect(button.disabled).toBe(true);

      const btnEl = queryShadow(button as HTMLElement, '.button') as HTMLButtonElement;
      expect(btnEl?.disabled).toBe(true);
    });
  });

  describe('loading state', () => {
    it('should apply loading class', async () => {
      button = await createComponent<SniceButtonElement>('snice-button', {
        loading: true
      });
      await wait(10);

      const btnEl = queryShadow(button as HTMLElement, '.button');
      expect(btnEl?.classList.contains('button--loading')).toBe(true);
    });

    it('should show spinner element', async () => {
      button = await createComponent<SniceButtonElement>('snice-button', {
        loading: true
      });
      await wait(10);

      const spinner = queryShadow(button as HTMLElement, '.spinner');
      expect(spinner).toBeTruthy();
    });

    it('should update loading state via setLoading method', async () => {
      button = await createComponent<SniceButtonElement>('snice-button');

      button.setLoading(true);
      await wait(10);

      expect(button.loading).toBe(true);

      const btnEl = queryShadow(button as HTMLElement, '.button');
      expect(btnEl?.classList.contains('button--loading')).toBe(true);
    });
  });

  describe('icon support', () => {
    it('should render icon when provided', async () => {
      button = await createComponent<SniceButtonElement>('snice-button', {
        icon: '/test-icon.svg'
      });
      await wait(10);

      const iconEl = queryShadow(button as HTMLElement, '.icon') as HTMLImageElement;
      expect(iconEl).toBeTruthy();
      expect(iconEl?.src).toContain('test-icon.svg');
    });

    it('should place icon at start by default', async () => {
      button = await createComponent<SniceButtonElement>('snice-button', {
        icon: '/test-icon.svg'
      });
      await wait(10);

      const btnEl = queryShadow(button as HTMLElement, '.button');
      expect(btnEl?.classList.contains('button--icon-start')).toBe(true);
    });

    it('should place icon at end when specified', async () => {
      button = await createComponent<SniceButtonElement>('snice-button', {
        icon: '/test-icon.svg',
        'icon-placement': 'end'
      });
      await wait(10);

      const btnEl = queryShadow(button as HTMLElement, '.button');
      expect(btnEl?.classList.contains('button--icon-end')).toBe(true);
    });
  });

  describe('click events', () => {
    it('should dispatch @snice/click event', async () => {
      button = await createComponent<SniceButtonElement>('snice-button');
      await wait(10);

      let clickDetail: any = null;
      (button as HTMLElement).addEventListener('button-click', (e: Event) => {
        clickDetail = (e as CustomEvent).detail;
      });

      const btnEl = queryShadow(button as HTMLElement, '.button');
      triggerMouseEvent(btnEl as HTMLElement, 'click');
      await wait(10);

      expect(clickDetail).toBeTruthy();
      expect(clickDetail.originalEvent).toBeTruthy();
    });
  });

  describe('safe URL navigation', () => {
    const unsafeUrls = [
      '   ',
      '\u00a0',
      'javascript:globalThis.__sniceButtonInjected++',
      'JaVaScRiPt:globalThis.__sniceButtonInjected++',
      '  javascript:globalThis.__sniceButtonInjected++',
      '\u00a0javascript:globalThis.__sniceButtonInjected++',
      'java\tscript:globalThis.__sniceButtonInjected++',
      'java\nscript:globalThis.__sniceButtonInjected++',
      'jav\u0000ascript:globalThis.__sniceButtonInjected++',
      'data:text/html,<script>globalThis.__sniceButtonInjected++</script>',
      'vbscript:msgbox(1)',
      'file:///tmp/private',
      'custom:payload',
      'http://['
    ];

    it.each(unsafeUrls)('blocks an unsafe target navigation without a success event: %j', async (href) => {
      const open = vi.spyOn(window, 'open').mockImplementation(() => null);
      button = await createComponent<SniceButtonElement>('snice-button', {
        href,
        target: '_blank'
      });
      let buttonClicks = 0;
      button.addEventListener('button-click', () => buttonClicks++);

      button.click();
      await wait(10);

      expect(open).not.toHaveBeenCalled();
      expect(buttonClicks).toBe(0);
    });

    it('blocks a direct script URL without execution, history changes, or click propagation', async () => {
      (globalThis as any).__sniceButtonInjected = 0;
      const initialHref = window.location.href;
      const initialHistoryLength = window.history.length;
      const documentClick = vi.fn();
      document.addEventListener('click', documentClick);
      button = await createComponent<SniceButtonElement>('snice-button', {
        href: 'javascript:globalThis.__sniceButtonInjected++'
      });
      const buttonClick = vi.fn();
      button.addEventListener('button-click', buttonClick);

      try {
        button.click();
        await wait(10);

        expect((globalThis as any).__sniceButtonInjected).toBe(0);
        expect(window.location.href).toBe(initialHref);
        expect(window.history.length).toBe(initialHistoryLength);
        expect(buttonClick).not.toHaveBeenCalled();
        expect(documentClick).not.toHaveBeenCalled();
      } finally {
        document.removeEventListener('click', documentClick);
      }
    });

    it('blocks unsafe href values supplied through the reflected attribute', async () => {
      const open = vi.spyOn(window, 'open').mockImplementation(() => null);
      button = await createComponent<SniceButtonElement>('snice-button');
      button.setAttribute('href', 'JaVaScRiPt:globalThis.__sniceButtonInjected++');
      button.setAttribute('target', '_blank');
      await wait(10);
      const buttonClick = vi.fn();
      button.addEventListener('button-click', buttonClick);

      button.click();
      await wait(10);

      expect(button.href).toBe('JaVaScRiPt:globalThis.__sniceButtonInjected++');
      expect(open).not.toHaveBeenCalled();
      expect(buttonClick).not.toHaveBeenCalled();
    });

    it('fails closed for a non-string runtime href without throwing', async () => {
      const open = vi.spyOn(window, 'open').mockImplementation(() => null);
      button = await createComponent<SniceButtonElement>('snice-button', { target: '_blank' });
      (button as any).href = { toString: () => 'https://example.com' };
      const buttonClick = vi.fn();
      button.addEventListener('button-click', buttonClick);

      expect(() => button.click()).not.toThrow();
      await wait(10);
      expect(open).not.toHaveBeenCalled();
      expect(buttonClick).not.toHaveBeenCalled();
    });

    it.each([null, undefined, false, 0, Number.NaN])(
      'fails closed for a falsey non-string runtime href: %j',
      async (href) => {
        const form = document.createElement('form');
        document.body.appendChild(form);
        button = await createComponent<SniceButtonElement>('snice-button', {
          type: 'submit'
        });
        form.appendChild(button);
        (button as any).href = href;
        const submit = vi.fn((event: Event) => event.preventDefault());
        const buttonClick = vi.fn();
        form.addEventListener('submit', submit);
        button.addEventListener('button-click', buttonClick);

        try {
          expect(() => button.click()).not.toThrow();
          await wait(10);

          expect(submit).not.toHaveBeenCalled();
          expect(buttonClick).not.toHaveBeenCalled();
        } finally {
          form.remove();
        }
      }
    );

    it('does not create a download activation for an unsafe URL', async () => {
      button = await createComponent<SniceButtonElement>('snice-button', {
        href: 'javascript:globalThis.__sniceButtonInjected++',
        download: 'report.txt'
      });
      const originalCreateElement = document.createElement.bind(document);
      const createdAnchors: HTMLAnchorElement[] = [];
      vi.spyOn(document, 'createElement').mockImplementation(((tagName: string, options?: ElementCreationOptions) => {
        const element = originalCreateElement(tagName, options);
        if (tagName.toLowerCase() === 'a') createdAnchors.push(element as HTMLAnchorElement);
        return element;
      }) as typeof document.createElement);
      const buttonClick = vi.fn();
      button.addEventListener('button-click', buttonClick);

      button.click();
      await wait(10);

      expect(createdAnchors).toEqual([]);
      expect(buttonClick).not.toHaveBeenCalled();
    });

    it.each(['submit', 'reset'] as const)('does not perform a %s action for an unsafe URL', async (type) => {
      const form = document.createElement('form');
      const input = document.createElement('input');
      input.defaultValue = 'authored';
      input.value = 'changed';
      form.appendChild(input);
      document.body.appendChild(form);
      button = await createComponent<SniceButtonElement>('snice-button', {
        href: 'javascript:globalThis.__sniceButtonInjected++',
        type
      });
      form.appendChild(button);
      const submit = vi.fn((event: Event) => event.preventDefault());
      const reset = vi.fn();
      const buttonClick = vi.fn();
      form.addEventListener('submit', submit);
      form.addEventListener('reset', reset);
      button.addEventListener('button-click', buttonClick);

      try {
        button.click();
        await wait(10);

        expect(submit).not.toHaveBeenCalled();
        expect(reset).not.toHaveBeenCalled();
        expect(input.value).toBe('changed');
        expect(buttonClick).not.toHaveBeenCalled();
      } finally {
        form.remove();
      }
    });

    it.each([
      ['/relative/path', '_self'],
      ['https://example.com/path', '_blank'],
      ['mailto:test@example.com', '_blank'],
      ['tel:+15550100', 'phone-window'],
      ['//example.com/network-path', '_blank']
    ])('opens an allowed URL through its requested target: %s', async (href, target) => {
      const open = vi.spyOn(window, 'open').mockImplementation(() => null);
      button = await createComponent<SniceButtonElement>('snice-button', {
        href: `  ${href}  `,
        target
      });
      const buttonClick = vi.fn();
      button.addEventListener('button-click', buttonClick);

      button.click();
      await wait(10);

      expect(open).toHaveBeenCalledOnce();
      expect(open).toHaveBeenCalledWith(href, target);
      expect(buttonClick).toHaveBeenCalledOnce();
    });

    it('navigates an allowed hash and emits the click event', async () => {
      const initialHref = window.location.href;
      button = await createComponent<SniceButtonElement>('snice-button', {
        href: '#snice-button-safe-target'
      });
      const buttonClick = vi.fn();
      button.addEventListener('button-click', buttonClick);

      try {
        button.click();
        await wait(10);

        expect(window.location.hash).toBe('#snice-button-safe-target');
        expect(buttonClick).toHaveBeenCalledOnce();
      } finally {
        window.history.replaceState(null, '', initialHref);
      }
    });

    it('creates an anchor download only for an allowed URL', async () => {
      let activation: { href: string | null; download: string } | null = null;
      button = await createComponent<SniceButtonElement>('snice-button', {
        href: '/files/report.pdf',
        download: 'quarterly-report.pdf'
      });
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation(((tagName: string, options?: ElementCreationOptions) => {
        const element = originalCreateElement(tagName, options);
        if (tagName.toLowerCase() === 'a') {
          const anchor = element as HTMLAnchorElement;
          anchor.click = () => {
            activation = {
              href: anchor.getAttribute('href'),
              download: anchor.download
            };
          };
        }
        return element;
      }) as typeof document.createElement);
      const buttonClick = vi.fn();
      button.addEventListener('button-click', buttonClick);

      button.click();
      await wait(10);

      expect(activation).toEqual({
        href: '/files/report.pdf',
        download: 'quarterly-report.pdf'
      });
      expect(buttonClick).toHaveBeenCalledOnce();
    });
  });

  describe('API methods', () => {
    beforeEach(async () => {
      button = await createComponent<SniceButtonElement>('snice-button');
      await wait(10);
    });

    it('should support focus method', () => {
      expect(() => button.focus()).not.toThrow();
    });

    it('should support blur method', () => {
      expect(() => button.blur()).not.toThrow();
    });

    it('should support click method', () => {
      expect(() => button.click()).not.toThrow();
    });

    it('should update variant via setVariant method', async () => {
      button.setVariant('primary');
      await wait(10);

      expect(button.variant).toBe('primary');
    });
  });

  describe('property updates', () => {
    beforeEach(async () => {
      button = await createComponent<SniceButtonElement>('snice-button');
      await wait(10);
    });

    it('should update classes when variant changes', async () => {
      button.variant = 'primary';
      await wait(10);

      const btnEl = queryShadow(button as HTMLElement, '.button');
      expect(btnEl?.classList.contains('button--primary')).toBe(true);
    });

    it('should update classes when size changes', async () => {
      button.size = 'large';
      await wait(10);

      const btnEl = queryShadow(button as HTMLElement, '.button');
      expect(btnEl?.classList.contains('button--large')).toBe(true);
    });
  });
});
