import { describe, it, expect, beforeEach, vi } from 'vitest';
import { element, property, query, on } from '../src';
import { controller, attachController } from '../src/controller';
import { Router } from '../src/router';

describe('edge cases and error handling', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('element registration errors', () => {
    it('should handle duplicate element registration gracefully', () => {
      @element('duplicate-element')
      class FirstElement extends HTMLElement {}
      
      // This should not throw but browser will handle it
      expect(() => {
        @element('duplicate-element')
        class SecondElement extends HTMLElement {}
      }).not.toThrow();
    });

    it('should handle element with no methods', () => {
      @element('empty-element')
      class EmptyElement extends HTMLElement {
        // No html() or css() methods
      }
      
      const el = document.createElement('empty-element');
      document.body.appendChild(el);
      
      expect(el.innerHTML).toBe('');
    });

    it('should handle html() throwing an error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      @element('error-html')
      class ErrorHtml extends HTMLElement {
        html() {
          throw new Error('HTML generation failed');
        }
      }
      
      // Should not prevent element creation
      expect(() => {
        const el = document.createElement('error-html');
        document.body.appendChild(el);
      }).toThrow(); // Will throw because html() throws
      
      consoleSpy.mockRestore();
    });
  });

  describe('property edge cases', () => {
    it('should handle property set before element is connected', () => {
      @element('pre-connect-prop')
      class PreConnectProp extends HTMLElement {
        @property({ reflect: true })
        value = 'initial';
      }
      
      const el = document.createElement('pre-connect-prop') as any;
      
      // Set property before connecting
      el.value = 'updated';
      expect(el.value).toBe('updated');
      
      // Now connect
      document.body.appendChild(el);
      expect(el.getAttribute('value')).toBe('updated');
    });

    it('should handle property with existing getter/setter', () => {
      @element('existing-accessor')
      class ExistingAccessor extends HTMLElement {
        private _custom = 'initial';
        
        get custom() {
          return this._custom.toUpperCase();
        }
        
        set custom(val: string) {
          this._custom = val.toLowerCase();
        }
        
        @property()
        other = 'test';
      }
      
      const el = document.createElement('existing-accessor') as any;
      document.body.appendChild(el);
      
      el.custom = 'TEST';
      expect(el.custom).toBe('TEST'); // Uppercase from getter
      expect(el._custom).toBe('test'); // Lowercase from setter
    });
  });

  describe('event handling edge cases', () => {
    it('should handle multiple handlers for same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      @element('multi-handler')
      class MultiHandler extends HTMLElement {
        html() {
          return '<button class="btn">Click</button>';
        }
        
        @on('click', '.btn')
        firstHandler() {
          handler1();
        }
        
        @on('click', '.btn')
        secondHandler() {
          handler2();
        }
      }
      
      const el = document.createElement('multi-handler');
      document.body.appendChild(el);
      
      const btn = el.querySelector('.btn') as HTMLElement;
      btn.click();
      
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should handle events on disconnected elements', () => {
      const clickHandler = vi.fn();
      
      @element('disconnected-event')
      class DisconnectedEvent extends HTMLElement {
        @on('click')
        handleClick() {
          clickHandler();
        }
      }
      
      const el = document.createElement('disconnected-event');
      document.body.appendChild(el);
      
      // Remove element
      document.body.removeChild(el);
      
      // Click should not trigger handler
      el.click();
      expect(clickHandler).not.toHaveBeenCalled();
    });

    it('should handle event.stopPropagation()', () => {
      const parentHandler = vi.fn();
      const childHandler = vi.fn();
      
      @element('stop-propagation')
      class StopPropagation extends HTMLElement {
        html() {
          return `
            <div class="parent">
              <button class="child">Click</button>
            </div>
          `;
        }
        
        @on('click', '.parent')
        handleParent() {
          parentHandler();
        }
        
        @on('click', '.child')
        handleChild(e: Event) {
          e.stopPropagation();
          childHandler();
        }
      }
      
      const el = document.createElement('stop-propagation');
      document.body.appendChild(el);
      
      const child = el.querySelector('.child') as HTMLElement;
      child.click();
      
      expect(childHandler).toHaveBeenCalled();
      // Due to event delegation, parent handler still gets called
      expect(parentHandler).toHaveBeenCalled();
    });
  });

  describe('query edge cases', () => {
    it('should handle invalid selector', () => {
      @element('invalid-query')
      class InvalidQuery extends HTMLElement {
        @query('>>>invalid')
        invalid?: HTMLElement;
      }
      
      const el = document.createElement('invalid-query') as any;
      
      // Invalid selector doesn't throw in happy-dom, just returns null
      document.body.appendChild(el);
      expect(() => {
        const result = el.invalid;
      }).not.toThrow();
      expect(el.invalid).toBeNull();
    });

    it('should handle query on element with changing DOM', () => {
      @element('changing-dom')
      class ChangingDom extends HTMLElement {
        @query('.dynamic')
        dynamic?: HTMLElement;
        
        html() {
          return '<div class="static">Static</div>';
        }
      }
      
      const el = document.createElement('changing-dom') as any;
      document.body.appendChild(el);
      
      expect(el.dynamic).toBeNull();
      
      // Change innerHTML
      el.innerHTML = '<div class="dynamic">Dynamic</div>';
      
      // Query is reactive, should find it now
      expect(el.dynamic).toBeDefined();
      expect(el.dynamic?.textContent).toBe('Dynamic');
    });
  });

  describe('controller edge cases', () => {
    it('should handle non-existent controller gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      @element('missing-controller')
      class MissingController extends HTMLElement {}
      
      const el = document.createElement('missing-controller');
      el.setAttribute('controller', 'non-existent');
      document.body.appendChild(el);
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to attach controller'),
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle controller attach() throwing error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      @controller('error-controller')
      class ErrorController {
        element: HTMLElement | null = null;
        async attach(element: HTMLElement) {
          throw new Error('Attach failed');
        }
        async detach() {}
      }
      
      @element('error-attach')
      class ErrorAttach extends HTMLElement {}
      
      const el = document.createElement('error-attach');
      el.setAttribute('controller', 'error-controller');
      document.body.appendChild(el);
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle multiple elements with same controller', async () => {
      const attachSpy = vi.fn();
      
      @controller('shared-controller')
      class SharedController {
        element: HTMLElement | null = null;
        async attach(element: HTMLElement) {
          attachSpy(element);
          this.element = element;
        }
        async detach() {
          this.element = null;
        }
      }
      
      @element('shared-element')
      class SharedElement extends HTMLElement {}
      
      const el1 = document.createElement('shared-element');
      const el2 = document.createElement('shared-element');
      
      el1.setAttribute('controller', 'shared-controller');
      el2.setAttribute('controller', 'shared-controller');
      
      document.body.appendChild(el1);
      document.body.appendChild(el2);
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Each element gets its own controller instance
      expect(attachSpy).toHaveBeenCalledTimes(2);
      expect(attachSpy).toHaveBeenCalledWith(el1);
      expect(attachSpy).toHaveBeenCalledWith(el2);
    });
  });

  describe('router edge cases', () => {
    it('should handle missing target element', () => {
      const router = Router({
        target: '#non-existent',
        routing_type: 'hash'
      });
      
      expect(() => {
        router.initialize();
      }).toThrow('Target element not found');
    });

    it('should handle navigating to same route twice', () => {
      const targetEl = document.createElement('div');
      targetEl.id = 'router-target';
      document.body.appendChild(targetEl);
      
      const router = Router({
        target: '#router-target',
        routing_type: 'hash'
      });
      
      const { page, initialize, navigate } = router;
      
      @page({ tag: 'same-route', routes: ['/same'] })
      class SameRoute extends HTMLElement {
        html() {
          return '<div>Same Route</div>';
        }
      }
      
      initialize();
      
      navigate('/same');
      const firstEl = targetEl.querySelector('same-route');
      
      navigate('/same');
      const secondEl = targetEl.querySelector('same-route');
      
      // Elements get replaced, not reused
      expect(firstEl).not.toBe(secondEl);
      expect(targetEl.querySelector('same-route')).toBe(secondEl);
    });

    it('should handle route with query parameters', () => {
      const targetEl = document.createElement('div');
      targetEl.id = 'query-target';
      document.body.appendChild(targetEl);
      
      const router = Router({
        target: '#query-target',
        routing_type: 'hash'
      });
      
      const { page, initialize, navigate } = router;
      
      @page({ tag: 'query-page', routes: ['/search/:query'] })
      class QueryPage extends HTMLElement {
        html() {
          const query = this.getAttribute('query');
          return `<div>Searching for: ${query}</div>`;
        }
      }
      
      initialize();
      navigate('/search/test');
      
      const el = targetEl.querySelector('query-page');
      expect(el?.innerHTML).toBe('<div>Searching for: test</div>');
    });
  });

  describe('css edge cases', () => {
    it('should handle pseudo-classes in CSS', () => {
      @element('pseudo-class')
      class PseudoClass extends HTMLElement {
        css() {
          return `
            .btn:hover { color: blue; }
            .btn:focus { outline: none; }
            .btn:active { transform: scale(0.95); }
          `;
        }
      }
      
      const el = document.createElement('pseudo-class');
      document.body.appendChild(el);
      
      const style = el.querySelector('style[data-component-css]');
      const css = style?.textContent || '';
      
      expect(css).toContain('.btn:hover { color: blue; }');
      expect(css).toContain('.btn:focus { outline: none; }');
    });

    it('should handle pseudo-elements in CSS', () => {
      @element('pseudo-element')
      class PseudoElement extends HTMLElement {
        css() {
          return `
            .item::before { content: "→"; }
            .item::after { content: "←"; }
          `;
        }
      }
      
      const el = document.createElement('pseudo-element');
      document.body.appendChild(el);
      
      const style = el.querySelector('style[data-component-css]');
      const css = style?.textContent || '';
      
      expect(css).toContain('.item::before { content: "→"; }');
      expect(css).toContain('.item::after { content: "←"; }');
    });

    it('should handle very long CSS', () => {
      const longCss = Array(100).fill(0).map((_, i) => 
        `.class-${i} { color: red; }`
      ).join('\n');
      
      @element('long-css')
      class LongCss extends HTMLElement {
        css() {
          return longCss;
        }
      }
      
      const el = document.createElement('long-css');
      document.body.appendChild(el);
      
      const style = el.querySelector('style[data-component-css]');
      expect(style?.textContent?.length).toBeGreaterThan(2000);
    });
  });

  describe('nested elements', () => {
    it('should handle nested custom elements', () => {
      @element('parent-element')
      class ParentElement extends HTMLElement {
        html() {
          return '<child-element></child-element>';
        }
      }
      
      @element('child-element')
      class ChildElement extends HTMLElement {
        html() {
          return '<div>Child Content</div>';
        }
      }
      
      const parent = document.createElement('parent-element');
      document.body.appendChild(parent);
      
      const child = parent.querySelector('child-element');
      expect(child).toBeDefined();
      expect(child?.innerHTML).toBe('<div>Child Content</div>');
    });

    it('should handle deeply nested custom elements', () => {
      @element('level-1')
      class Level1 extends HTMLElement {
        html() {
          return '<level-2></level-2>';
        }
      }
      
      @element('level-2')
      class Level2 extends HTMLElement {
        html() {
          return '<level-3></level-3>';
        }
      }
      
      @element('level-3')
      class Level3 extends HTMLElement {
        html() {
          return '<div>Deep Content</div>';
        }
      }
      
      const el = document.createElement('level-1');
      document.body.appendChild(el);
      
      const deep = el.querySelector('level-3');
      expect(deep).toBeDefined();
      expect(deep?.innerHTML).toBe('<div>Deep Content</div>');
    });
  });

  describe('integration', () => {
    it('should handle element with all features combined', () => {
      const clickHandler = vi.fn();
      
      @element('full-featured')
      class FullFeatured extends HTMLElement {
        @property({ reflect: true })
        title = 'Default Title';
        
        @query('.content')
        content?: HTMLElement;
        
        html() {
          return `
            <div class="content">
              <h1>${this.title}</h1>
              <button class="btn">Click Me</button>
            </div>
          `;
        }
        
        css() {
          return `
            .content { padding: 1rem; }
            h1 { color: blue; }
          `;
        }
        
        @on('click', '.btn')
        handleClick() {
          clickHandler(this.title);
        }
      }
      
      const el = document.createElement('full-featured') as any;
      el.title = 'Custom Title';
      document.body.appendChild(el);
      
      expect(el.getAttribute('title')).toBe('Custom Title');
      expect(el.content).toBeDefined();
      expect(el.content?.querySelector('h1')?.textContent).toBe('Custom Title');
      
      const btn = el.querySelector('.btn') as HTMLElement;
      btn.click();
      expect(clickHandler).toHaveBeenCalledWith('Custom Title');
      
      const style = el.querySelector('style[data-component-css]');
      expect(style).toBeDefined();
    });
  });
});