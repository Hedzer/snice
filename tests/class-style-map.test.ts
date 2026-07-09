import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { element, property, render, html, classMap, styleMap } from '../src/index';

describe('classMap / styleMap helpers', () => {
  let container: HTMLDivElement;
  let uniqueId = 0;

  const getUniqueTag = () => `class-style-test-${++uniqueId}`;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('classMap', () => {
    it('joins truthy keys and drops falsy ones', () => {
      expect(classMap({ a: true, b: false, c: 1, d: 0, e: 'x', f: '', g: null, h: undefined }))
        .toBe('a c e');
    });

    it('returns empty string for an empty object', () => {
      expect(classMap({})).toBe('');
    });

    it('works in a class attribute binding', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property({ type: Boolean }) active = true;

        @render()
        renderContent() {
          return html`<div class="${classMap({ box: true, 'box--active': this.active })}">x</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      const div = el.shadowRoot?.querySelector('div');
      expect(div?.className).toBe('box box--active');

      el.active = false;
      await new Promise(resolve => queueMicrotask(resolve));
      expect(div?.className).toBe('box');
    });
  });

  describe('styleMap', () => {
    it('converts camelCase to kebab-case and joins declarations', () => {
      expect(styleMap({ backgroundColor: 'red', fontSize: '2rem' }))
        .toBe('background-color: red; font-size: 2rem');
    });

    it('passes CSS custom properties through unchanged', () => {
      expect(styleMap({ '--my-token': 'blue' })).toBe('--my-token: blue');
    });

    it('drops null/undefined/false values', () => {
      expect(styleMap({ color: 'red', width: null, height: undefined, border: false as any }))
        .toBe('color: red');
    });

    it('returns empty string for an empty object', () => {
      expect(styleMap({})).toBe('');
    });

    it('works in a style attribute binding', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property() color = 'red';

        @render()
        renderContent() {
          return html`<div style="${styleMap({ color: this.color, fontWeight: 'bold' })}">x</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      const div = el.shadowRoot?.querySelector('div') as HTMLElement;
      expect(div.style.color).toBe('red');
      expect(div.style.fontWeight).toBe('bold');

      el.color = 'blue';
      await new Promise(resolve => queueMicrotask(resolve));
      expect(div.style.color).toBe('blue');
    });
  });
});
