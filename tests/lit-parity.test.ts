import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { element, property, render, html, nothing, noChange } from '../src/index';

/**
 * Tests verifying interpolation and reactivity parity with lit-html
 *
 * These tests ensure snice supports the same template features as lit-html:
 * - Multiple interpolations in attributes
 * - Template reuse and efficient updates
 * - Array rendering with part reuse
 * - Nested templates
 * - The `nothing` sentinel
 * - Text node reuse
 * - noChange sentinel
 * - Dirty checking
 * - Property bindings
 * - Boolean attribute bindings
 * - Event bindings
 */
describe('lit-html parity - interpolation and reactivity', () => {
  let container: HTMLDivElement;
  let uniqueId = 0;

  const getUniqueTag = () => `lit-parity-test-${++uniqueId}`;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('multiple interpolations in attributes', () => {
    it('should support two interpolations in a single attribute', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property()
        prefix = 'hello';

        @property()
        suffix = 'world';

        @render()
        renderContent() {
          return html`<div class="${this.prefix}-${this.suffix}">Content</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      const div = el.shadowRoot?.querySelector('div');
      expect(div?.className).toBe('hello-world');

      // Update both
      el.prefix = 'foo';
      el.suffix = 'bar';
      await new Promise(resolve => queueMicrotask(resolve));

      expect(div?.className).toBe('foo-bar');
    });

    it('should support three or more interpolations in a single attribute', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property()
        a = 'one';

        @property()
        b = 'two';

        @property()
        c = 'three';

        @render()
        renderContent() {
          return html`<div class="prefix-${this.a}-${this.b}-${this.c}-suffix">Content</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      const div = el.shadowRoot?.querySelector('div');
      expect(div?.className).toBe('prefix-one-two-three-suffix');

      // Update all three
      el.a = 'A';
      el.b = 'B';
      el.c = 'C';
      await new Promise(resolve => queueMicrotask(resolve));

      expect(div?.className).toBe('prefix-A-B-C-suffix');
    });

    it('should handle interpolation with static prefix and suffix', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property()
        value = 'middle';

        @render()
        renderContent() {
          return html`<div data-attr="start-${this.value}-end">Content</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      const div = el.shadowRoot?.querySelector('div');
      expect(div?.getAttribute('data-attr')).toBe('start-middle-end');

      el.value = 'updated';
      await new Promise(resolve => queueMicrotask(resolve));

      expect(div?.getAttribute('data-attr')).toBe('start-updated-end');
    });
  });

  describe('template reuse (same template updates in place)', () => {
    it('should reuse DOM when rendering same template with different values', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property({ type: Number })
        count = 0;

        @render()
        renderContent() {
          return html`<div class="counter">${this.count}</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      const div = el.shadowRoot?.querySelector('.counter');
      const originalDiv = div;

      // Update multiple times
      for (let i = 1; i <= 5; i++) {
        el.count = i;
        await new Promise(resolve => queueMicrotask(resolve));

        // Same DOM element should be reused
        const currentDiv = el.shadowRoot?.querySelector('.counter');
        expect(currentDiv).toBe(originalDiv);
        expect(currentDiv?.textContent).toBe(String(i));
      }
    });

    it('should reuse text nodes when updating primitives', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property()
        message = 'initial';

        @render()
        renderContent() {
          return html`<span>${this.message}</span>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      const span = el.shadowRoot?.querySelector('span');
      // Get the text node (after the comment marker)
      const getTextNode = () => {
        const children = Array.from(span?.childNodes || []);
        return children.find(n => n.nodeType === Node.TEXT_NODE);
      };

      const originalTextNode = getTextNode();
      expect(originalTextNode?.textContent).toBe('initial');

      // Update
      el.message = 'updated';
      await new Promise(resolve => queueMicrotask(resolve));

      const newTextNode = getTextNode();
      // Same text node should be reused (data property updated)
      expect(newTextNode).toBe(originalTextNode);
      expect(newTextNode?.textContent).toBe('updated');
    });
  });

  describe('array/iterable rendering', () => {
    it('should render arrays of primitives', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property({ type: Object })
        items: string[] = ['a', 'b', 'c'];

        @render()
        renderContent() {
          return html`<ul>${this.items.map(item => html`<li>${item}</li>`)}</ul>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      const lis = el.shadowRoot?.querySelectorAll('li');
      expect(lis?.length).toBe(3);
      expect(lis?.[0].textContent).toBe('a');
      expect(lis?.[1].textContent).toBe('b');
      expect(lis?.[2].textContent).toBe('c');
    });

    it('should update arrays efficiently (reuse parts)', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property({ type: Object })
        items: string[] = ['one', 'two', 'three'];

        @render()
        renderContent() {
          return html`<div>${this.items.map(item => html`<span>${item}</span>`)}</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      const getSpans = () => el.shadowRoot?.querySelectorAll('span');

      expect(getSpans()?.length).toBe(3);

      // Update with same length array
      el.items = ['ONE', 'TWO', 'THREE'];
      await new Promise(resolve => queueMicrotask(resolve));

      const spans = getSpans();
      expect(spans?.length).toBe(3);
      expect(spans?.[0].textContent).toBe('ONE');
      expect(spans?.[1].textContent).toBe('TWO');
      expect(spans?.[2].textContent).toBe('THREE');
    });

    it('should handle array growing and shrinking', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property({ type: Object })
        items: number[] = [1, 2];

        @render()
        renderContent() {
          return html`<div>${this.items.map(n => html`<span>${n}</span>`)}</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      const getSpans = () => Array.from(el.shadowRoot?.querySelectorAll('span') || []);

      expect(getSpans().length).toBe(2);

      // Grow
      el.items = [1, 2, 3, 4, 5];
      await new Promise(resolve => queueMicrotask(resolve));

      expect(getSpans().length).toBe(5);
      expect(getSpans().map(s => s.textContent)).toEqual(['1', '2', '3', '4', '5']);

      // Shrink
      el.items = [1];
      await new Promise(resolve => queueMicrotask(resolve));

      expect(getSpans().length).toBe(1);
      expect(getSpans()[0].textContent).toBe('1');

      // Empty
      el.items = [];
      await new Promise(resolve => queueMicrotask(resolve));

      expect(getSpans().length).toBe(0);
    });

    it('should handle nested arrays (2D)', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property({ type: Object })
        matrix: number[][] = [[1, 2], [3, 4]];

        @render()
        renderContent() {
          return html`
            <div>
              ${this.matrix.map(row => html`
                <div class="row">${row.map(cell => html`<span>${cell}</span>`)}</div>
              `)}
            </div>
          `;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      const rows = el.shadowRoot?.querySelectorAll('.row');
      expect(rows?.length).toBe(2);

      const spans = el.shadowRoot?.querySelectorAll('span');
      expect(spans?.length).toBe(4);
      expect(Array.from(spans || []).map(s => s.textContent)).toEqual(['1', '2', '3', '4']);
    });
  });

  describe('nested templates', () => {
    it('should render nested template results', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property()
        showNested = true;

        @render()
        renderContent() {
          const nested = html`<span class="nested">Nested content</span>`;
          return html`<div>${this.showNested ? nested : 'No nested'}</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      expect(el.shadowRoot?.querySelector('.nested')).toBeTruthy();
      expect(el.shadowRoot?.querySelector('.nested')?.textContent).toBe('Nested content');

      // Toggle off
      el.showNested = false;
      await new Promise(resolve => queueMicrotask(resolve));

      expect(el.shadowRoot?.querySelector('.nested')).toBeFalsy();
      expect(el.shadowRoot?.querySelector('div')?.textContent?.trim()).toBe('No nested');
    });

    it('should handle deeply nested templates', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property()
        depth = 3;

        @render()
        renderContent() {
          const createNested = (d: number): any => {
            if (d === 0) return html`<span class="leaf">Leaf</span>`;
            return html`<div class="level-${d}">${createNested(d - 1)}</div>`;
          };
          return createNested(this.depth);
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      expect(el.shadowRoot?.querySelector('.level-3')).toBeTruthy();
      expect(el.shadowRoot?.querySelector('.level-2')).toBeTruthy();
      expect(el.shadowRoot?.querySelector('.level-1')).toBeTruthy();
      expect(el.shadowRoot?.querySelector('.leaf')).toBeTruthy();
    });
  });

  describe('nothing sentinel', () => {
    it('should remove content when nothing is returned', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property()
        showContent = true;

        @render()
        renderContent() {
          return html`<div>${this.showContent ? 'Visible' : nothing}</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      const div = el.shadowRoot?.querySelector('div');
      expect(div?.textContent?.trim()).toBe('Visible');

      // Set to nothing
      el.showContent = false;
      await new Promise(resolve => queueMicrotask(resolve));

      expect(div?.textContent?.trim()).toBe('');

      // Set back
      el.showContent = true;
      await new Promise(resolve => queueMicrotask(resolve));

      expect(div?.textContent?.trim()).toBe('Visible');
    });

    it('should handle nothing in attributes', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property()
        showClass = true;

        @render()
        renderContent() {
          return html`<div class=${this.showClass ? 'active' : nothing}>Content</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      const div = el.shadowRoot?.querySelector('div');
      expect(div?.hasAttribute('class')).toBe(true);
      expect(div?.className).toBe('active');

      // Set to nothing - should remove attribute
      el.showClass = false;
      await new Promise(resolve => queueMicrotask(resolve));

      expect(div?.hasAttribute('class')).toBe(false);
    });
  });

  describe('conditional rendering with <if>', () => {
    it('should handle conditional element showing/hiding', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property({ type: Boolean })
        show = true;

        @render()
        renderContent() {
          return html`
            <if ${this.show}>
              <div class="conditional">Shown when true</div>
            </if>
          `;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      expect(el.shadowRoot?.querySelector('.conditional')).toBeTruthy();

      el.show = false;
      await new Promise(resolve => queueMicrotask(resolve));

      expect(el.shadowRoot?.querySelector('.conditional')).toBeFalsy();

      el.show = true;
      await new Promise(resolve => queueMicrotask(resolve));

      expect(el.shadowRoot?.querySelector('.conditional')).toBeTruthy();
    });
  });

  describe('case/when conditional rendering', () => {
    it('should render correct branch based on value', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property()
        status = 'loading';

        @render()
        renderContent() {
          return html`
            <case ${this.status}>
              <when value="loading"><span class="loading">Loading...</span></when>
              <when value="success"><span class="success">Done!</span></when>
              <when value="error"><span class="error">Error!</span></when>
              <default><span class="default">Unknown</span></default>
            </case>
          `;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      expect(el.shadowRoot?.querySelector('.loading')).toBeTruthy();
      expect(el.shadowRoot?.querySelector('.success')).toBeFalsy();

      el.status = 'success';
      await new Promise(resolve => queueMicrotask(resolve));

      expect(el.shadowRoot?.querySelector('.loading')).toBeFalsy();
      expect(el.shadowRoot?.querySelector('.success')).toBeTruthy();

      el.status = 'unknown-value';
      await new Promise(resolve => queueMicrotask(resolve));

      expect(el.shadowRoot?.querySelector('.default')).toBeTruthy();
    });
  });

  describe('mixed bindings', () => {
    it('should handle multiple binding types in same template', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property()
        text = 'Hello';

        @property()
        className = 'active';

        @property({ type: Boolean })
        disabled = false;

        @property({ type: Object })
        items: string[] = ['a', 'b'];

        clickCount = 0;

        handleClick() {
          this.clickCount++;
        }

        @render()
        renderContent() {
          return html`
            <div class="${this.className}">
              <span>${this.text}</span>
              <button ?disabled=${this.disabled} @click=${this.handleClick}>Click</button>
              <ul>${this.items.map(item => html`<li>${item}</li>`)}</ul>
            </div>
          `;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      // Check all bindings work
      expect(el.shadowRoot?.querySelector('div')?.className).toBe('active');
      expect(el.shadowRoot?.querySelector('span')?.textContent).toBe('Hello');
      expect(el.shadowRoot?.querySelector('button')?.hasAttribute('disabled')).toBe(false);
      expect(el.shadowRoot?.querySelectorAll('li').length).toBe(2);

      // Test event binding BEFORE disabling the button
      const button = el.shadowRoot?.querySelector('button') as HTMLButtonElement;
      button.click();
      expect(el.clickCount).toBe(1);

      // Update all
      el.text = 'World';
      el.className = 'inactive';
      el.disabled = true;
      el.items = ['x', 'y', 'z'];
      await new Promise(resolve => queueMicrotask(resolve));

      expect(el.shadowRoot?.querySelector('div')?.className).toBe('inactive');
      expect(el.shadowRoot?.querySelector('span')?.textContent).toBe('World');
      expect(el.shadowRoot?.querySelector('button')?.hasAttribute('disabled')).toBe(true);
      expect(el.shadowRoot?.querySelectorAll('li').length).toBe(3);
    });
  });

  describe('DOM node binding', () => {
    it('should handle direct DOM node insertion', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        // Use private field instead of @property for DOM nodes
        // (DOM nodes can't be serialized to attributes)
        private _node: Node | null = null;

        get node() { return this._node; }
        set node(v: Node | null) {
          this._node = v;
          // Manually trigger render
          if ((this as any).renderContent) {
            (this as any).renderContent();
          }
        }

        @render()
        renderContent() {
          return html`<div class="container">${this._node}</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      // Insert a DOM node
      const span = document.createElement('span');
      span.className = 'injected';
      span.textContent = 'Injected node';

      el.node = span;
      await new Promise(resolve => queueMicrotask(resolve));

      expect(el.shadowRoot?.querySelector('.injected')).toBeTruthy();
      expect(el.shadowRoot?.querySelector('.injected')?.textContent).toBe('Injected node');

      // Replace with different node
      const div = document.createElement('div');
      div.className = 'replaced';

      el.node = div;
      await new Promise(resolve => queueMicrotask(resolve));

      expect(el.shadowRoot?.querySelector('.injected')).toBeFalsy();
      expect(el.shadowRoot?.querySelector('.replaced')).toBeTruthy();
    });
  });

  describe('text rendering - primitives', () => {
    it('should render strings', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property()
        value = 'test string';

        @render()
        renderContent() {
          return html`<div>${this.value}</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      expect(el.shadowRoot?.querySelector('div')?.textContent).toBe('test string');
    });

    it('should render numbers', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property({ type: Number })
        value = 42;

        @render()
        renderContent() {
          return html`<div>${this.value}</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      expect(el.shadowRoot?.querySelector('div')?.textContent).toBe('42');
    });

    it('should render booleans', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property({ type: Boolean })
        value = true;

        @render()
        renderContent() {
          return html`<div>${this.value}</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      expect(el.shadowRoot?.querySelector('div')?.textContent).toBe('true');
    });

    it('should render undefined as empty', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property()
        value: string | undefined = undefined;

        @render()
        renderContent() {
          return html`<div>${this.value}</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      const div = el.shadowRoot?.querySelector('div');
      // undefined should render as empty (like lit)
      expect(div?.textContent?.trim()).toBe('');
    });

    it('should render null as empty', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property()
        value: string | null = null;

        @render()
        renderContent() {
          return html`<div>${this.value}</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      const div = el.shadowRoot?.querySelector('div');
      // null should render as empty (like lit)
      expect(div?.textContent?.trim()).toBe('');
    });
  });

  describe('sibling parts', () => {
    it('should render sibling text interpolations', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property()
        foo = 'foo';

        @property()
        bar = 'bar';

        @render()
        renderContent() {
          return html`<div>${this.foo}${this.bar}</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      expect(el.shadowRoot?.querySelector('div')?.textContent).toBe('foobar');

      el.foo = 'bbb';
      await new Promise(resolve => queueMicrotask(resolve));

      expect(el.shadowRoot?.querySelector('div')?.textContent).toBe('bbbbar');
    });

    it('should render text with static content between', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property()
        first = 'A';

        @property()
        second = 'B';

        @render()
        renderContent() {
          return html`<div>${this.first} and ${this.second}</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      expect(el.shadowRoot?.querySelector('div')?.textContent).toBe('A and B');
    });
  });

  describe('attribute edge cases', () => {
    it('should handle empty string in attribute', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property()
        value = '';

        @render()
        renderContent() {
          return html`<div data-value="${this.value}">Content</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      const div = el.shadowRoot?.querySelector('div');
      expect(div?.getAttribute('data-value')).toBe('');
    });

    it('should handle attribute without quotes', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property()
        value = 'test';

        @render()
        renderContent() {
          return html`<div data-value=${this.value}>Content</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      const div = el.shadowRoot?.querySelector('div');
      expect(div?.getAttribute('data-value')).toBe('test');
    });

    it('should handle multiple attributes with interpolations', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property()
        id = 'my-id';

        @property()
        className = 'my-class';

        @property()
        title = 'my-title';

        @render()
        renderContent() {
          return html`<div id="${this.id}" class="${this.className}" title="${this.title}">Content</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      const div = el.shadowRoot?.querySelector('div');
      expect(div?.id).toBe('my-id');
      expect(div?.className).toBe('my-class');
      expect(div?.title).toBe('my-title');
    });
  });

  describe('boolean attributes', () => {
    it('should add attribute when value is true', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property({ type: Boolean })
        isDisabled = true;

        @render()
        renderContent() {
          return html`<button ?disabled=${this.isDisabled}>Click</button>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      const button = el.shadowRoot?.querySelector('button');
      expect(button?.hasAttribute('disabled')).toBe(true);
    });

    it('should remove attribute when value is false', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property({ type: Boolean })
        isDisabled = false;

        @render()
        renderContent() {
          return html`<button ?disabled=${this.isDisabled}>Click</button>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      const button = el.shadowRoot?.querySelector('button');
      expect(button?.hasAttribute('disabled')).toBe(false);
    });

    it('should toggle attribute on value change', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property({ type: Boolean })
        isHidden = false;

        @render()
        renderContent() {
          return html`<div ?hidden=${this.isHidden}>Content</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      const div = el.shadowRoot?.querySelector('div');
      expect(div?.hasAttribute('hidden')).toBe(false);

      el.isHidden = true;
      await new Promise(resolve => queueMicrotask(resolve));

      expect(div?.hasAttribute('hidden')).toBe(true);

      el.isHidden = false;
      await new Promise(resolve => queueMicrotask(resolve));

      expect(div?.hasAttribute('hidden')).toBe(false);
    });
  });

  describe('property bindings', () => {
    it('should set property on element', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property()
        inputValue = 'test value';

        @render()
        renderContent() {
          return html`<input .value=${this.inputValue}>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      const input = el.shadowRoot?.querySelector('input') as HTMLInputElement;
      expect(input?.value).toBe('test value');
    });

    it('should update property on change', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property()
        inputValue = 'initial';

        @render()
        renderContent() {
          return html`<input .value=${this.inputValue}>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      const input = el.shadowRoot?.querySelector('input') as HTMLInputElement;
      expect(input?.value).toBe('initial');

      el.inputValue = 'updated';
      await new Promise(resolve => queueMicrotask(resolve));

      expect(input?.value).toBe('updated');
    });

    it('should handle object properties', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property({ type: Object })
        data = { key: 'value' };

        @render()
        renderContent() {
          return html`<div .data=${this.data}>Content</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      const div = el.shadowRoot?.querySelector('div') as any;
      expect(div?.data).toEqual({ key: 'value' });
    });
  });

  describe('event bindings', () => {
    it('should attach click handler', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        clicked = false;

        handleClick() {
          this.clicked = true;
        }

        @render()
        renderContent() {
          return html`<button @click=${this.handleClick}>Click</button>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      expect(el.clicked).toBe(false);

      const button = el.shadowRoot?.querySelector('button') as HTMLButtonElement;
      button.click();

      expect(el.clicked).toBe(true);
    });

    it('should receive event object', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        lastEvent: Event | null = null;

        handleClick(e: Event) {
          this.lastEvent = e;
        }

        @render()
        renderContent() {
          return html`<button @click=${(e: Event) => this.handleClick(e)}>Click</button>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      const button = el.shadowRoot?.querySelector('button') as HTMLButtonElement;
      button.click();

      expect(el.lastEvent).toBeInstanceOf(Event);
      expect(el.lastEvent?.type).toBe('click');
    });

    it('should handle multiple event listeners', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        mouseDownCount = 0;
        mouseUpCount = 0;

        @render()
        renderContent() {
          return html`<button
            @mousedown=${() => this.mouseDownCount++}
            @mouseup=${() => this.mouseUpCount++}
          >Click</button>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      const button = el.shadowRoot?.querySelector('button') as HTMLButtonElement;

      button.dispatchEvent(new MouseEvent('mousedown'));
      expect(el.mouseDownCount).toBe(1);
      expect(el.mouseUpCount).toBe(0);

      button.dispatchEvent(new MouseEvent('mouseup'));
      expect(el.mouseDownCount).toBe(1);
      expect(el.mouseUpCount).toBe(1);
    });
  });

  describe('dirty checking', () => {
    it('should not update DOM when value unchanged', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property()
        value = 'test';

        @render()
        renderContent() {
          return html`<div>${this.value}</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      const div = el.shadowRoot?.querySelector('div');
      const getTextNode = () => {
        return Array.from(div?.childNodes || []).find(n => n.nodeType === Node.TEXT_NODE);
      };
      const originalTextNode = getTextNode();

      // Manually modify the text content
      if (originalTextNode) {
        originalTextNode.textContent = 'manually changed';
      }

      // Re-render with same value - should be a no-op due to dirty checking
      el.value = 'test'; // same value
      await new Promise(resolve => queueMicrotask(resolve));

      // The manual change should persist since value didn't change
      expect(getTextNode()?.textContent).toBe('manually changed');
    });
  });

  describe('template switching', () => {
    it('should replace template when switching to different template', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property({ type: Boolean })
        useFirst = true;

        @render()
        renderContent() {
          if (this.useFirst) {
            return html`<div class="first">First template</div>`;
          }
          return html`<span class="second">Second template</span>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      expect(el.shadowRoot?.querySelector('.first')).toBeTruthy();
      expect(el.shadowRoot?.querySelector('.second')).toBeFalsy();

      el.useFirst = false;
      await new Promise(resolve => queueMicrotask(resolve));

      expect(el.shadowRoot?.querySelector('.first')).toBeFalsy();
      expect(el.shadowRoot?.querySelector('.second')).toBeTruthy();
    });
  });

  describe('updates', () => {
    it('should preserve DOM elements when updating same template', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property({ type: Number })
        count = 0;

        @render()
        renderContent() {
          return html`<div><span class="counter">${this.count}</span></div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      const originalSpan = el.shadowRoot?.querySelector('.counter');

      el.count = 1;
      await new Promise(resolve => queueMicrotask(resolve));

      const spanAfterUpdate = el.shadowRoot?.querySelector('.counter');
      expect(spanAfterUpdate).toBe(originalSpan); // Same DOM element
      expect(spanAfterUpdate?.textContent).toBe('1');
    });

    it('should update element when value changes to different node', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        private _child: any = null;

        set child(v: any) {
          this._child = v;
          if ((this as any).renderContent) {
            (this as any).renderContent();
          }
        }
        get child() { return this._child; }

        @render()
        renderContent() {
          return html`<div>${this._child}</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      // Insert a <p>
      const p = document.createElement('p');
      el.child = p;
      await new Promise(resolve => queueMicrotask(resolve));

      expect(el.shadowRoot?.querySelector('div p')).toBeTruthy();

      // Set to undefined
      el.child = undefined;
      await new Promise(resolve => queueMicrotask(resolve));

      expect(el.shadowRoot?.querySelector('div p')).toBeFalsy();

      // Insert a text node
      const text = document.createTextNode('foo');
      el.child = text;
      await new Promise(resolve => queueMicrotask(resolve));

      expect(el.shadowRoot?.querySelector('div')?.textContent?.includes('foo')).toBe(true);
    });
  });

  describe('noChange sentinel', () => {
    it('should not update when noChange is returned', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property({ type: Number })
        updateCount = 0;

        getValue() {
          // Return noChange after first render
          if (this.updateCount > 0) {
            return noChange;
          }
          return 'initial';
        }

        @render()
        renderContent() {
          return html`<div>${this.getValue()}</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      const div = el.shadowRoot?.querySelector('div');
      expect(div?.textContent?.trim()).toBe('initial');

      // Trigger a re-render with noChange
      el.updateCount = 1;
      await new Promise(resolve => queueMicrotask(resolve));

      // Value should remain 'initial' since noChange was returned
      expect(div?.textContent?.trim()).toBe('initial');
    });
  });

  describe('inline ternary expressions', () => {
    it('should handle ternary with primitive values', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property({ type: Boolean })
        isActive = true;

        @render()
        renderContent() {
          return html`<div>${this.isActive ? 'Active' : 'Inactive'}</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      expect(el.shadowRoot?.querySelector('div')?.textContent).toBe('Active');

      el.isActive = false;
      await new Promise(resolve => queueMicrotask(resolve));

      expect(el.shadowRoot?.querySelector('div')?.textContent).toBe('Inactive');
    });

    it('should handle ternary with template results', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property({ type: Boolean })
        showA = true;

        @render()
        renderContent() {
          return html`<div>${this.showA ? html`<span class="a">A</span>` : html`<span class="b">B</span>`}</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      expect(el.shadowRoot?.querySelector('.a')).toBeTruthy();
      expect(el.shadowRoot?.querySelector('.b')).toBeFalsy();

      el.showA = false;
      await new Promise(resolve => queueMicrotask(resolve));

      expect(el.shadowRoot?.querySelector('.a')).toBeFalsy();
      expect(el.shadowRoot?.querySelector('.b')).toBeTruthy();
    });

    it('should handle ternary with nothing sentinel', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property({ type: Boolean })
        show = true;

        @render()
        renderContent() {
          return html`<div>${this.show ? html`<span class="content">Content</span>` : nothing}</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      expect(el.shadowRoot?.querySelector('.content')).toBeTruthy();

      el.show = false;
      await new Promise(resolve => queueMicrotask(resolve));

      expect(el.shadowRoot?.querySelector('.content')).toBeFalsy();
      expect(el.shadowRoot?.querySelector('div')?.textContent?.trim()).toBe('');
    });

    it('should handle ternary in attributes', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property({ type: Boolean })
        isPrimary = true;

        @render()
        renderContent() {
          return html`<button class="${this.isPrimary ? 'primary' : 'secondary'}">Click</button>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      expect(el.shadowRoot?.querySelector('button')?.className).toBe('primary');

      el.isPrimary = false;
      await new Promise(resolve => queueMicrotask(resolve));

      expect(el.shadowRoot?.querySelector('button')?.className).toBe('secondary');
    });

    it('should handle nested ternary expressions', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property()
        status: 'loading' | 'success' | 'error' = 'loading';

        @render()
        renderContent() {
          return html`<div>${
            this.status === 'loading'
              ? html`<span class="loading">Loading...</span>`
              : this.status === 'success'
                ? html`<span class="success">Done!</span>`
                : html`<span class="error">Error!</span>`
          }</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      expect(el.shadowRoot?.querySelector('.loading')).toBeTruthy();

      el.status = 'success';
      await new Promise(resolve => queueMicrotask(resolve));

      expect(el.shadowRoot?.querySelector('.loading')).toBeFalsy();
      expect(el.shadowRoot?.querySelector('.success')).toBeTruthy();

      el.status = 'error';
      await new Promise(resolve => queueMicrotask(resolve));

      expect(el.shadowRoot?.querySelector('.success')).toBeFalsy();
      expect(el.shadowRoot?.querySelector('.error')).toBeTruthy();
    });

    it('should handle ternary with arrays', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property({ type: Boolean })
        showList = true;

        @property({ type: Object })
        items = ['a', 'b', 'c'];

        @render()
        renderContent() {
          return html`<div>${
            this.showList
              ? this.items.map(item => html`<span>${item}</span>`)
              : html`<p>No items</p>`
          }</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      expect(el.shadowRoot?.querySelectorAll('span').length).toBe(3);
      expect(el.shadowRoot?.querySelector('p')).toBeFalsy();

      el.showList = false;
      await new Promise(resolve => queueMicrotask(resolve));

      expect(el.shadowRoot?.querySelectorAll('span').length).toBe(0);
      expect(el.shadowRoot?.querySelector('p')?.textContent).toBe('No items');
    });

    it('should handle ternary with function calls', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property({ type: Number })
        count = 5;

        isEven(n: number) {
          return n % 2 === 0;
        }

        @render()
        renderContent() {
          return html`<div>${this.isEven(this.count) ? 'Even' : 'Odd'}</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      expect(el.shadowRoot?.querySelector('div')?.textContent).toBe('Odd');

      el.count = 4;
      await new Promise(resolve => queueMicrotask(resolve));

      expect(el.shadowRoot?.querySelector('div')?.textContent).toBe('Even');
    });

    it('should handle ternary with mixed content types', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property({ type: Number })
        mode = 0;

        @render()
        renderContent() {
          return html`<div>${
            this.mode === 0
              ? 'Text mode'
              : this.mode === 1
                ? 42
                : this.mode === 2
                  ? html`<strong>HTML mode</strong>`
                  : nothing
          }</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      expect(el.shadowRoot?.querySelector('div')?.textContent).toBe('Text mode');

      el.mode = 1;
      await new Promise(resolve => queueMicrotask(resolve));
      expect(el.shadowRoot?.querySelector('div')?.textContent).toBe('42');

      el.mode = 2;
      await new Promise(resolve => queueMicrotask(resolve));
      expect(el.shadowRoot?.querySelector('strong')?.textContent).toBe('HTML mode');

      el.mode = 3;
      await new Promise(resolve => queueMicrotask(resolve));
      expect(el.shadowRoot?.querySelector('div')?.textContent?.trim()).toBe('');
    });
  });

  describe('special characters in attributes', () => {
    it('should handle quotes in attribute values', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property()
        value = 'contains "quotes"';

        @render()
        renderContent() {
          return html`<div data-value="${this.value}">Content</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      const div = el.shadowRoot?.querySelector('div');
      expect(div?.getAttribute('data-value')).toBe('contains "quotes"');
    });

    it('should handle angle brackets in text', async () => {
      const tag = getUniqueTag();

      @element(tag)
      class TestElement extends HTMLElement {
        @property()
        value = '<script>alert("xss")</script>';

        @render()
        renderContent() {
          return html`<div>${this.value}</div>`;
        }
      }

      const el = document.createElement(tag) as InstanceType<typeof TestElement>;
      container.appendChild(el);
      await el.ready;

      const div = el.shadowRoot?.querySelector('div');
      // Should be rendered as text, not as HTML
      expect(div?.textContent).toBe('<script>alert("xss")</script>');
      expect(div?.querySelector('script')).toBeFalsy();
    });
  });
});
