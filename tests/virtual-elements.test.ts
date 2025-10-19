import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { element, render, html, property } from '../src/index';

describe('Virtual Elements', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('<if> virtual element', () => {
    it('should render content when condition is true', async () => {
      @element('test-if-true')
      class TestIfTrue extends HTMLElement {
        showContent = true;

        @render()
        renderContent() {
          return html`
            <div>
              <if ${this.showContent}>
                <span>Visible</span>
              </if>
            </div>
          `;
        }
      }

      const el = document.createElement('test-if-true') as TestIfTrue;
      container.appendChild(el);
      await el.ready;

      const span = el.shadowRoot?.querySelector('span');
      expect(span).toBeTruthy();
      expect(span?.textContent).toBe('Visible');
    });

    it('should not render content when condition is false', async () => {
      @element('test-if-false')
      class TestIfFalse extends HTMLElement {
        showContent = false;

        @render()
        renderContent() {
          return html`
            <div>
              <if ${this.showContent}>
                <span>Hidden</span>
              </if>
            </div>
          `;
        }
      }

      const el = document.createElement('test-if-false') as TestIfFalse;
      container.appendChild(el);
      await el.ready;

      const span = el.shadowRoot?.querySelector('span');
      expect(span).toBeNull();
    });

    it('should toggle content when condition changes', async () => {
      @element('test-if-toggle')
      class TestIfToggle extends HTMLElement {
        @property()
        showContent = false;

        @render()
        renderContent() {
          return html`
            <div>
              <if ${this.showContent}>
                <span>Toggle</span>
              </if>
            </div>
          `;
        }
      }

      const el = document.createElement('test-if-toggle') as TestIfToggle;
      container.appendChild(el);
      await el.ready;

      // Initially false
      let span = el.shadowRoot?.querySelector('span');
      expect(span).toBeNull();

      // Toggle to true
      el.showContent = true;
      await new Promise(resolve => setTimeout(resolve, 10));

      span = el.shadowRoot?.querySelector('span');
      expect(span).toBeTruthy();
      expect(span?.textContent).toBe('Toggle');

      // Toggle back to false
      el.showContent = false;
      await new Promise(resolve => setTimeout(resolve, 10));

      span = el.shadowRoot?.querySelector('span');
      expect(span).toBeNull();
    });

    it('should handle multiple <if> elements', async () => {
      @element('test-if-multiple')
      class TestIfMultiple extends HTMLElement {
        showFirst = true;
        showSecond = false;

        @render()
        renderContent() {
          return html`
            <div>
              <if ${this.showFirst}>
                <span id="first">First</span>
              </if>
              <if ${this.showSecond}>
                <span id="second">Second</span>
              </if>
            </div>
          `;
        }
      }

      const el = document.createElement('test-if-multiple') as TestIfMultiple;
      container.appendChild(el);
      await el.ready;

      const first = el.shadowRoot?.querySelector('#first');
      const second = el.shadowRoot?.querySelector('#second');

      expect(first).toBeTruthy();
      expect(first?.textContent).toBe('First');
      expect(second).toBeNull();
    });

    it('should handle nested <if> elements', async () => {
      @element('test-if-nested')
      class TestIfNested extends HTMLElement {
        showOuter = true;
        showInner = true;

        @render()
        renderContent() {
          return html`
            <div>
              <if ${this.showOuter}>
                <div class="outer">
                  <if ${this.showInner}>
                    <span class="inner">Nested</span>
                  </if>
                </div>
              </if>
            </div>
          `;
        }
      }

      const el = document.createElement('test-if-nested') as TestIfNested;
      container.appendChild(el);
      await el.ready;

      const outer = el.shadowRoot?.querySelector('.outer');
      const inner = el.shadowRoot?.querySelector('.inner');

      expect(outer).toBeTruthy();
      expect(inner).toBeTruthy();
      expect(inner?.textContent).toBe('Nested');
    });

    it('should handle complex content inside <if>', async () => {
      @element('test-if-complex')
      class TestIfComplex extends HTMLElement {
        showContent = true;
        value = 42;

        @render()
        renderContent() {
          return html`
            <div>
              <if ${this.showContent}>
                <h1>Title</h1>
                <p>Value: ${this.value}</p>
                <button>Click me</button>
              </if>
            </div>
          `;
        }
      }

      const el = document.createElement('test-if-complex') as TestIfComplex;
      container.appendChild(el);
      await el.ready;

      const h1 = el.shadowRoot?.querySelector('h1');
      const p = el.shadowRoot?.querySelector('p');
      const button = el.shadowRoot?.querySelector('button');

      expect(h1).toBeTruthy();
      expect(h1?.textContent).toBe('Title');
      expect(p).toBeTruthy();
      expect(p?.textContent).toBe('Value: 42');
      expect(button).toBeTruthy();
    });
  });

  describe('<case> virtual element', () => {
    it('should render matching <when> branch', async () => {
      @element('test-case-match')
      class TestCaseMatch extends HTMLElement {
        status = 'success';

        @render()
        renderContent() {
          return html`
            <div>
              <case ${this.status}>
                <when value="success">
                  <span class="success">Success!</span>
                </when>
                <when value="error">
                  <span class="error">Error!</span>
                </when>
                <default>
                  <span class="default">Unknown</span>
                </default>
              </case>
            </div>
          `;
        }
      }

      const el = document.createElement('test-case-match') as TestCaseMatch;
      container.appendChild(el);
      await el.ready;

      const success = el.shadowRoot?.querySelector('.success');
      const error = el.shadowRoot?.querySelector('.error');
      const defaultSpan = el.shadowRoot?.querySelector('.default');

      expect(success).toBeTruthy();
      expect(success?.textContent).toBe('Success!');
      expect(error).toBeNull();
      expect(defaultSpan).toBeNull();
    });

    it('should render <default> when no match', async () => {
      @element('test-case-default')
      class TestCaseDefault extends HTMLElement {
        status = 'unknown';

        @render()
        renderContent() {
          return html`
            <div>
              <case ${this.status}>
                <when value="success">
                  <span class="success">Success!</span>
                </when>
                <when value="error">
                  <span class="error">Error!</span>
                </when>
                <default>
                  <span class="default">Unknown status</span>
                </default>
              </case>
            </div>
          `;
        }
      }

      const el = document.createElement('test-case-default') as TestCaseDefault;
      container.appendChild(el);
      await el.ready;

      const success = el.shadowRoot?.querySelector('.success');
      const error = el.shadowRoot?.querySelector('.error');
      const defaultSpan = el.shadowRoot?.querySelector('.default');

      expect(success).toBeNull();
      expect(error).toBeNull();
      expect(defaultSpan).toBeTruthy();
      expect(defaultSpan?.textContent).toBe('Unknown status');
    });

    it('should switch between branches when value changes', async () => {
      @element('test-case-switch')
      class TestCaseSwitch extends HTMLElement {
        @property()
        status = 'loading';

        @render()
        renderContent() {
          return html`
            <div>
              <case ${this.status}>
                <when value="loading">
                  <span class="loading">Loading...</span>
                </when>
                <when value="success">
                  <span class="success">Complete!</span>
                </when>
                <when value="error">
                  <span class="error">Failed!</span>
                </when>
              </case>
            </div>
          `;
        }
      }

      const el = document.createElement('test-case-switch') as TestCaseSwitch;
      container.appendChild(el);
      await el.ready;

      // Initially loading
      let loading = el.shadowRoot?.querySelector('.loading');
      expect(loading).toBeTruthy();
      expect(loading?.textContent).toBe('Loading...');

      // Switch to success
      el.status = 'success';
      await new Promise(resolve => setTimeout(resolve, 10));

      loading = el.shadowRoot?.querySelector('.loading');
      let success = el.shadowRoot?.querySelector('.success');
      expect(loading).toBeNull();
      expect(success).toBeTruthy();
      expect(success?.textContent).toBe('Complete!');

      // Switch to error
      el.status = 'error';
      await new Promise(resolve => setTimeout(resolve, 10));

      success = el.shadowRoot?.querySelector('.success');
      let error = el.shadowRoot?.querySelector('.error');
      expect(success).toBeNull();
      expect(error).toBeTruthy();
      expect(error?.textContent).toBe('Failed!');
    });

    it('should handle numeric values', async () => {
      @element('test-case-numeric')
      class TestCaseNumeric extends HTMLElement {
        count = 1;

        @render()
        renderContent() {
          return html`
            <div>
              <case ${this.count}>
                <when value="0">
                  <span>Zero</span>
                </when>
                <when value="1">
                  <span>One</span>
                </when>
                <when value="2">
                  <span>Two</span>
                </when>
                <default>
                  <span>Many</span>
                </default>
              </case>
            </div>
          `;
        }
      }

      const el = document.createElement('test-case-numeric') as TestCaseNumeric;
      container.appendChild(el);
      await el.ready;

      const span = el.shadowRoot?.querySelector('span');
      expect(span?.textContent).toBe('One');
    });

    it('should handle complex content in branches', async () => {
      @element('test-case-complex')
      class TestCaseComplex extends HTMLElement {
        view = 'list';

        @render()
        renderContent() {
          return html`
            <div>
              <case ${this.view}>
                <when value="list">
                  <ul>
                    <li>Item 1</li>
                    <li>Item 2</li>
                  </ul>
                </when>
                <when value="grid">
                  <div class="grid">
                    <div>Card 1</div>
                    <div>Card 2</div>
                  </div>
                </when>
              </case>
            </div>
          `;
        }
      }

      const el = document.createElement('test-case-complex') as TestCaseComplex;
      container.appendChild(el);
      await el.ready;

      const ul = el.shadowRoot?.querySelector('ul');
      const li = el.shadowRoot?.querySelectorAll('li');

      expect(ul).toBeTruthy();
      expect(li.length).toBe(2);
      expect(li[0].textContent).toBe('Item 1');
      expect(li[1].textContent).toBe('Item 2');
    });
  });

  describe('Combined virtual elements', () => {
    it('should combine <if> and <case> elements', async () => {
      @element('test-combined')
      class TestCombined extends HTMLElement {
        showStatus = true;
        status = 'success';

        @render()
        renderContent() {
          return html`
            <div>
              <if ${this.showStatus}>
                <case ${this.status}>
                  <when value="success">
                    <span class="success">All good!</span>
                  </when>
                  <when value="error">
                    <span class="error">Something went wrong</span>
                  </when>
                </case>
              </if>
            </div>
          `;
        }
      }

      const el = document.createElement('test-combined') as TestCombined;
      container.appendChild(el);
      await el.ready;

      const success = el.shadowRoot?.querySelector('.success');
      expect(success).toBeTruthy();
      expect(success?.textContent).toBe('All good!');
    });

    it('should hide <case> when <if> is false', async () => {
      @element('test-combined-hidden')
      class TestCombinedHidden extends HTMLElement {
        showStatus = false;
        status = 'success';

        @render()
        renderContent() {
          return html`
            <div>
              <if ${this.showStatus}>
                <case ${this.status}>
                  <when value="success">
                    <span class="success">All good!</span>
                  </when>
                </case>
              </if>
            </div>
          `;
        }
      }

      const el = document.createElement('test-combined-hidden') as TestCombinedHidden;
      container.appendChild(el);
      await el.ready;

      const success = el.shadowRoot?.querySelector('.success');
      expect(success).toBeNull();
    });
  });
});
