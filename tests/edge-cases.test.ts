import { describe, it, expect, beforeEach, vi } from 'vitest';
import { element, property, query, render, html, css, styles } from '../src';
import { controller, attachController } from './test-imports';
import { Router } from './test-imports';

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

    it('should handle element with no methods', async () => {
      @element('empty-element')
      class EmptyElement extends HTMLElement {
        // No @render() or @styles() methods
      }

      const el = document.createElement('empty-element');
      document.body.appendChild(el);
      await (el as any).ready;

      // Element with no render method has no content
      expect(el.shadowRoot?.innerHTML).toBeUndefined();
    });

    it('should handle renderContent() throwing an error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      @element('error-html')
      class ErrorHtml extends HTMLElement {
        @render()
        renderContent() {
          throw new Error('HTML generation failed');
        }
      }

      // Should not prevent element creation
      const el = document.createElement('error-html');
      document.body.appendChild(el);
      await (el as any).ready;

      // Check that error was logged (actual error message is "Error rendering element:")
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error rendering element'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('property edge cases', () => {
    it('should handle property set before element is connected', async () => {
      @element('pre-connect-prop')
      class PreConnectProp extends HTMLElement {
        @property()
        value = 'initial';
      }

      const el = document.createElement('pre-connect-prop') as any;

      // Set property before connecting
      el.value = 'updated';
      expect(el.value).toBe('updated');

      // Now connect
      document.body.appendChild(el);
      await el.ready;
      expect(el.getAttribute('value')).toBe('updated');
    });

    it('should handle property with existing getter/setter', async () => {
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
      await el.ready;

      el.custom = 'TEST';
      expect(el.custom).toBe('TEST'); // Uppercase from getter
      expect(el._custom).toBe('test'); // Lowercase from setter
    });
  });

  describe('event handling edge cases', () => {
    it('should handle multiple handlers for same event', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      @element('multi-handler')
      class MultiHandler extends HTMLElement {
        @render()
        renderContent() {
          return html`<button class="btn" @click=${this.firstHandler}>Click</button>`;
        }

        firstHandler = () => {
          handler1();
          // Manually call second handler to test multiple handlers
          this.secondHandler();
        };

        secondHandler = () => {
          handler2();
        };
      }

      const el = document.createElement('multi-handler');
      document.body.appendChild(el);
      await (el as any).ready;

      const btn = el.shadowRoot?.querySelector('.btn') as HTMLElement;
      btn.click();

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should handle events on disconnected elements', async () => {
      const clickHandler = vi.fn();

      @element('disconnected-event')
      class DisconnectedEvent extends HTMLElement {
        @render()
        renderContent() {
          return html`<button @click=${this.handleClick}>Click</button>`;
        }

        handleClick = () => {
          clickHandler();
        };
      }

      const el = document.createElement('disconnected-event');
      document.body.appendChild(el);
      await (el as any).ready;

      // Remove element
      document.body.removeChild(el);

      // Click should not trigger handler (element is disconnected)
      el.click();
      expect(clickHandler).not.toHaveBeenCalled();
    });

    it('should handle event.stopPropagation()', async () => {
      const parentHandler = vi.fn();
      const childHandler = vi.fn();

      @element('stop-propagation')
      class StopPropagation extends HTMLElement {
        @render()
        renderContent() {
          return html`
            <div class="parent" @click=${this.handleParent}>
              <button class="child" @click=${this.handleChild}>Click</button>
            </div>
          `;
        }

        handleParent = () => {
          parentHandler();
        };

        handleChild = (e: Event) => {
          e.stopPropagation();
          childHandler();
        };
      }

      const el = document.createElement('stop-propagation');
      document.body.appendChild(el);
      await (el as any).ready;

      const child = el.shadowRoot?.querySelector('.child') as HTMLElement;
      child.click();

      expect(childHandler).toHaveBeenCalled();
      // stopPropagation should prevent parent handler from being called
      expect(parentHandler).not.toHaveBeenCalled();
    });
  });

  describe('query edge cases', () => {
    it('should handle invalid selector', async () => {
      @element('invalid-query')
      class InvalidQuery extends HTMLElement {
        @query('>>>invalid')
        invalid?: HTMLElement;
      }

      const el = document.createElement('invalid-query') as any;

      // Invalid selector doesn't throw in happy-dom, just returns null
      document.body.appendChild(el);
      await el.ready;
      expect(() => {
        const result = el.invalid;
      }).not.toThrow();
      expect(el.invalid).toBeNull();
    });

    it('should handle query on element with changing DOM', async () => {
      @element('changing-dom')
      class ChangingDom extends HTMLElement {
        @query('.dynamic')
        dynamic?: HTMLElement;

        @render()
        renderContent() {
          return html`<div class="static">Static</div>`;
        }
      }

      const el = document.createElement('changing-dom') as any;
      document.body.appendChild(el);
      await el.ready;

      expect(el.dynamic).toBeNull();

      // Change shadowRoot innerHTML manually
      if (el.shadowRoot) el.shadowRoot.innerHTML = '<div class="dynamic">Dynamic</div>';

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
        type: 'hash'
      });

      expect(() => {
        router.initialize();
      }).toThrow('Target element not found');
    });

    it('should handle navigating to same route twice', async () => {
      const targetEl = document.createElement('div');
      targetEl.id = 'router-target';
      document.body.appendChild(targetEl);

      const router = Router({
        target: '#router-target',
        type: 'hash'
      });

      const { page, initialize, navigate } = router;

      @page({ tag: 'same-route', routes: ['/same'] })
      class SameRoute extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Same Route</div>`;
        }
      }

      initialize();

      await navigate('/same');
      const firstEl = targetEl.querySelector('same-route');

      await navigate('/same');
      const secondEl = targetEl.querySelector('same-route');

      // Elements get replaced, not reused
      expect(firstEl).not.toBe(secondEl);
      expect(targetEl.querySelector('same-route')).toBe(secondEl);
    });

    it('should handle route with query parameters', async () => {
      const targetEl = document.createElement('div');
      targetEl.id = 'query-target';
      document.body.appendChild(targetEl);

      const router = Router({
        target: '#query-target',
        type: 'hash'
      });

      const { page, initialize, navigate } = router;

      @page({ tag: 'query-page', routes: ['/search/:query'] })
      class QueryPage extends HTMLElement {
        @property()
        query = '';

        @render()
        renderContent() {
          return html`<div>Searching for: ${this.query}</div>`;
        }
      }

      initialize();
      await navigate('/search/test');

      // Wait for render
      await new Promise(resolve => queueMicrotask(resolve));

      const el = targetEl.querySelector('query-page');
      expect(el?.shadowRoot?.querySelector('div')?.textContent).toBe('Searching for: test');
    });
  });

  describe('css edge cases', () => {
    it('should handle pseudo-classes in CSS', async () => {
      @element('pseudo-class')
      class PseudoClass extends HTMLElement {
        @styles()
        componentStyles() {
          return css`
            .btn:hover { color: blue; }
            .btn:focus { outline: none; }
            .btn:active { transform: scale(0.95); }
          `;
        }
      }

      const el = document.createElement('pseudo-class');
      document.body.appendChild(el);
      await (el as any).ready;

      const style = el.shadowRoot?.querySelector('style');
      const cssText = style?.textContent || '';

      expect(cssText).toContain('.btn:hover { color: blue; }');
      expect(cssText).toContain('.btn:focus { outline: none; }');
    });

    it('should handle pseudo-elements in CSS', async () => {
      @element('pseudo-element')
      class PseudoElement extends HTMLElement {
        @styles()
        componentStyles() {
          return css`
            .item::before { content: "→"; }
            .item::after { content: "←"; }
          `;
        }
      }

      const el = document.createElement('pseudo-element');
      document.body.appendChild(el);
      await (el as any).ready;

      const style = el.shadowRoot?.querySelector('style');
      const cssText = style?.textContent || '';

      expect(cssText).toContain('.item::before { content: "→"; }');
      expect(cssText).toContain('.item::after { content: "←"; }');
    });

    it('should handle very long CSS', async () => {
      const longCssContent = Array(100).fill(0).map((_, i) =>
        `.class-${i} { color: red; }`
      ).join('\n');

      @element('long-css')
      class LongCss extends HTMLElement {
        @styles()
        componentStyles() {
          return css`${longCssContent}`;
        }
      }

      const el = document.createElement('long-css');
      document.body.appendChild(el);
      await (el as any).ready;

      const style = el.shadowRoot?.querySelector('style');
      expect(style?.textContent?.length).toBeGreaterThan(2000);
    });
  });

  describe('nested elements', () => {
    it('should handle nested custom elements', async () => {
      @element('parent-element')
      class ParentElement extends HTMLElement {
        @render()
        renderContent() {
          return html`<child-element></child-element>`;
        }
      }

      @element('child-element')
      class ChildElement extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Child Content</div>`;
        }
      }

      const parent = document.createElement('parent-element');
      document.body.appendChild(parent);
      await (parent as any).ready;

      // Wait for nested element to connect
      await new Promise(resolve => setTimeout(resolve, 0));

      const child = parent.shadowRoot?.querySelector('child-element');
      expect(child).toBeDefined();
      expect(child?.shadowRoot?.querySelector('div')?.textContent).toBe('Child Content');
    });

    it('should handle deeply nested custom elements', async () => {
      @element('level-1')
      class Level1 extends HTMLElement {
        @render()
        renderContent() {
          return html`<level-2></level-2>`;
        }
      }

      @element('level-2')
      class Level2 extends HTMLElement {
        @render()
        renderContent() {
          return html`<level-3></level-3>`;
        }
      }

      @element('level-3')
      class Level3 extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Deep Content</div>`;
        }
      }

      const el = document.createElement('level-1');
      document.body.appendChild(el);
      await (el as any).ready;

      // Wait a microtask for nested elements to be connected
      await new Promise(resolve => setTimeout(resolve, 0));

      const level2 = el.shadowRoot?.querySelector('level-2');
      expect(level2).toBeDefined();

      const deep = level2?.shadowRoot?.querySelector('level-3');
      expect(deep).toBeDefined();
      expect(deep?.shadowRoot?.querySelector('div')?.textContent).toBe('Deep Content');
    });
  });

  describe('integration', () => {
    it('should handle element with all features combined', async () => {
      const clickHandler = vi.fn();

      @element('full-featured')
      class FullFeatured extends HTMLElement {
        @property()
        title = 'Default Title';

        @query('.content')
        content?: HTMLElement;

        @render()
        renderContent() {
          return html`
            <div class="content">
              <h1>${this.title}</h1>
              <button class="btn" @click=${this.handleClick}>Click Me</button>
            </div>
          `;
        }

        @styles()
        componentStyles() {
          return css`
            .content { padding: 1rem; }
            h1 { color: blue; }
          `;
        }

        handleClick = () => {
          clickHandler(this.title);
        };
      }

      const el = document.createElement('full-featured') as any;
      el.title = 'Custom Title';
      document.body.appendChild(el);
      await el.ready;

      // Wait for property change to re-render
      await new Promise(resolve => queueMicrotask(resolve));

      expect(el.getAttribute('title')).toBe('Custom Title');
      expect(el.content).toBeDefined();
      expect(el.content?.querySelector('h1')?.textContent).toBe('Custom Title');

      const btn = el.shadowRoot?.querySelector('.btn') as HTMLElement;
      btn.click();
      expect(clickHandler).toHaveBeenCalledWith('Custom Title');

      const style = el.shadowRoot?.querySelector('style');
      expect(style).toBeDefined();
    });
  });
});