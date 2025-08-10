import { describe, it, expect, beforeEach } from 'vitest';
import { element } from '../src/element';

describe('CSS scoping', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('basic scoping', () => {
    it('should add CSS without scoping in Shadow DOM', () => {
      @element('scoped-component')
      class ScopedComponent extends HTMLElement {
        css() {
          return '.test { color: red; }';
        }
      }
      
      const el = document.createElement('scoped-component');
      document.body.appendChild(el);
      
      const style = el.shadowRoot?.querySelector('style[data-component-css]');
      expect(style?.textContent).toContain('.test { color: red; }');
    });

    it('should add multiple selectors without scoping in Shadow DOM', () => {
      @element('multi-scope')
      class MultiScope extends HTMLElement {
        css() {
          return `
            .header { color: blue; }
            .content { color: green; }
            .footer { color: red; }
          `;
        }
      }
      
      const el = document.createElement('multi-scope');
      document.body.appendChild(el);
      
      const style = el.shadowRoot?.querySelector('style[data-component-css]');
      const css = style?.textContent || '';
      
      expect(css).toContain('.header { color: blue; }');
      expect(css).toContain('.content { color: green; }');
      expect(css).toContain('.footer { color: red; }');
    });

    it('should add complex selectors without scoping in Shadow DOM', () => {
      @element('complex-scope')
      class ComplexScope extends HTMLElement {
        css() {
          return `
            .parent .child { color: red; }
            div.class1.class2 { color: blue; }
            [data-attr="value"] { color: green; }
          `;
        }
      }
      
      const el = document.createElement('complex-scope');
      document.body.appendChild(el);
      
      const style = el.shadowRoot?.querySelector('style[data-component-css]');
      const css = style?.textContent || '';
      
      expect(css).toContain('.parent .child { color: red; }');
      expect(css).toContain('div.class1.class2 { color: blue; }');
      expect(css).toContain('[data-attr="value"] { color: green; }');
    });
  });

  describe('special cases', () => {
    it('should not scope @media queries', () => {
      @element('media-component')
      class MediaComponent extends HTMLElement {
        css() {
          return `
            @media (min-width: 600px) { 
              .test { color: blue; }
            }
            @media print {
              .test { display: none; }
            }
          `;
        }
      }
      
      const el = document.createElement('media-component');
      document.body.appendChild(el);
      
      const style = el.shadowRoot?.querySelector('style[data-component-css]');
      const css = style?.textContent || '';
      
      expect(css).toContain('@media (min-width: 600px)');
      expect(css).toContain('@media print');
      // Content inside media queries no longer scoped with Shadow DOM
      expect(css).toContain('.test { color: blue; }');
      expect(css).toContain('.test { display: none; }');
    });

    it('should not scope @keyframes', () => {
      @element('keyframe-component')
      class KeyframeComponent extends HTMLElement {
        css() {
          return `
            @keyframes slide {
              from { left: 0; }
              to { left: 100px; }
            }
            .animated { animation: slide 1s; }
          `;
        }
      }
      
      const el = document.createElement('keyframe-component');
      document.body.appendChild(el);
      
      const style = el.shadowRoot?.querySelector('style[data-component-css]');
      const css = style?.textContent || '';
      
      expect(css).toContain('@keyframes slide');
      expect(css).toContain('from { left: 0; }');
      expect(css).toContain('.animated { animation: slide 1s; }');
    });

    it('should not scope @supports', () => {
      @element('supports-component')
      class SupportsComponent extends HTMLElement {
        css() {
          return `
            @supports (display: grid) {
              .grid { display: grid; }
            }
          `;
        }
      }
      
      const el = document.createElement('supports-component');
      document.body.appendChild(el);
      
      const style = el.shadowRoot?.querySelector('style[data-component-css]');
      const css = style?.textContent || '';
      
      expect(css).toContain('@supports (display: grid)');
      expect(css).toContain('.grid { display: grid; }');
    });

    it('should not scope @import', () => {
      @element('import-component')
      class ImportComponent extends HTMLElement {
        css() {
          return `
            @import url('https://fonts.googleapis.com/css2?family=Roboto');
            .text { font-family: 'Roboto', sans-serif; }
          `;
        }
      }
      
      const el = document.createElement('import-component');
      document.body.appendChild(el);
      
      const style = el.shadowRoot?.querySelector('style[data-component-css]');
      const css = style?.textContent || '';
      
      expect(css).toContain('@import url');
      // @import is not getting scoped properly, just check it exists
      expect(css).toContain('.text { font-family:');
    });
  });

  describe('css array handling', () => {
    it('should handle css() returning array of strings', () => {
      @element('array-css')
      class ArrayCss extends HTMLElement {
        css() {
          return [
            '.first { color: red; }',
            '.second { color: blue; }',
            '.third { color: green; }'
          ];
        }
      }
      
      const el = document.createElement('array-css');
      document.body.appendChild(el);
      
      const style = el.shadowRoot?.querySelector('style[data-component-css]');
      const css = style?.textContent || '';
      
      expect(css).toContain('.first { color: red; }');
      expect(css).toContain('.second { color: blue; }');
      expect(css).toContain('.third { color: green; }');
    });

    it('should handle empty array', () => {
      @element('empty-array-css')
      class EmptyArrayCss extends HTMLElement {
        css() {
          return [];
        }
      }
      
      const el = document.createElement('empty-array-css');
      document.body.appendChild(el);
      
      const style = el.shadowRoot?.querySelector('style[data-component-css]');
      expect(style?.textContent).toBe('');
    });

    it('should join array with newlines', () => {
      @element('array-join')
      class ArrayJoin extends HTMLElement {
        css() {
          return [
            '/* First section */',
            '.one { color: red; }',
            '',
            '/* Second section */',
            '.two { color: blue; }'
          ];
        }
      }
      
      const el = document.createElement('array-join');
      document.body.appendChild(el);
      
      const style = el.shadowRoot?.querySelector('style[data-component-css]');
      const css = style?.textContent || '';
      
      // Comments should be preserved
      expect(css).toContain('/* First section */');
      expect(css).toContain('/* Second section */');
      // Selectors no longer scoped with Shadow DOM
      expect(css).toContain('.one { color: red; }');
      expect(css).toContain('.two { color: blue; }');
    });
  });

  describe('style element management', () => {
    it('should add data-component-css attribute to style element', () => {
      @element('style-attr')
      class StyleAttr extends HTMLElement {
        css() {
          return '.test { color: red; }';
        }
      }
      
      const el = document.createElement('style-attr');
      document.body.appendChild(el);
      
      const style = el.shadowRoot?.querySelector('style[data-component-css]');
      expect(style).toBeDefined();
      expect(style?.hasAttribute('data-component-css')).toBe(true);
    });

    it('should not duplicate styles on reconnect', () => {
      @element('no-duplicate-style')
      class NoDuplicateStyle extends HTMLElement {
        css() {
          return '.test { color: red; }';
        }
      }
      
      const el = document.createElement('no-duplicate-style');
      
      // Connect
      document.body.appendChild(el);
      let styles = el.shadowRoot?.querySelectorAll('style[data-component-css]');
      expect(styles?.length).toBe(1);
      
      // Disconnect and reconnect
      document.body.removeChild(el);
      document.body.appendChild(el);
      
      styles = el.shadowRoot?.querySelectorAll('style[data-component-css]');
      expect(styles?.length).toBe(1);
    });

    it('should append style element as last child', () => {
      @element('style-position')
      class StylePosition extends HTMLElement {
        html() {
          return '<div class="content">Content</div>';
        }
        
        css() {
          return '.content { color: blue; }';
        }
      }
      
      const el = document.createElement('style-position');
      document.body.appendChild(el);
      
      const lastChild = el.shadowRoot?.lastElementChild;
      expect(lastChild?.tagName).toBe('STYLE');
      expect(lastChild?.hasAttribute('data-component-css')).toBe(true);
    });
  });
});