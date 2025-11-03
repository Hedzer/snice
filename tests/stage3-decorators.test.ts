import { describe, it, expect, beforeEach } from 'vitest';
import { element, property, render, html } from '../src/index';

/**
 * Tests for Stage 3 decorator compatibility
 * Ensures decorators work correctly with TypeScript's default Stage 3 decorator implementation
 */
describe('Stage 3 Decorators', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should have property descriptors set up before first render', async () => {
    @element('test-stage3-properties')
    class TestStage3Properties extends HTMLElement {
      @property() message = 'Hello';
      @property({ type: Boolean }) enabled = true;
      @property({ type: Number }) count = 0;

      @render()
      renderContent() {
        return html`
          <div class="message">${this.message}</div>
          <div class="enabled">${this.enabled}</div>
          <div class="count">${this.count}</div>
        `;
      }
    }

    const el = document.createElement('test-stage3-properties') as TestStage3Properties;
    document.body.appendChild(el);
    await el.ready;

    // Properties should be accessible immediately after connection
    expect(el.message).toBe('Hello');
    expect(el.enabled).toBe(true);
    expect(el.count).toBe(0);

    // Properties should render correctly on first render
    const messageDiv = el.shadowRoot?.querySelector('.message');
    const enabledDiv = el.shadowRoot?.querySelector('.enabled');
    const countDiv = el.shadowRoot?.querySelector('.count');

    expect(messageDiv?.textContent).toBe('Hello');
    expect(enabledDiv?.textContent).toBe('true');
    expect(countDiv?.textContent).toBe('0');
  });

  it('should handle boolean properties correctly in templates', async () => {
    @element('test-stage3-boolean')
    class TestStage3Boolean extends HTMLElement {
      @property({ type: Boolean }) showError = false;
      @property({ type: Boolean }) isActive = true;

      @render()
      renderContent() {
        return html`
          <if ${this.showError}>
            <div class="error">Error message</div>
          </if>
          <if ${this.isActive}>
            <div class="active">Active content</div>
          </if>
          <if ${!this.isActive}>
            <div class="inactive">Inactive content</div>
          </if>
        `;
      }
    }

    const el = document.createElement('test-stage3-boolean') as TestStage3Boolean;
    document.body.appendChild(el);
    await el.ready;

    // Error should not be visible (showError = false)
    const errorDiv = el.shadowRoot?.querySelector('.error');
    expect(errorDiv).toBeNull();

    // Active should be visible (isActive = true)
    const activeDiv = el.shadowRoot?.querySelector('.active');
    expect(activeDiv).toBeTruthy();
    expect(activeDiv?.textContent).toBe('Active content');

    // Inactive should not be visible (isActive = true)
    const inactiveDiv = el.shadowRoot?.querySelector('.inactive');
    expect(inactiveDiv).toBeNull();

    // Change properties
    el.showError = true;
    el.isActive = false;
    await new Promise(resolve => setTimeout(resolve, 0));

    // Error should now be visible
    const errorDivAfter = el.shadowRoot?.querySelector('.error');
    expect(errorDivAfter).toBeTruthy();
    expect(errorDivAfter?.textContent).toBe('Error message');

    // Active should not be visible
    const activeDivAfter = el.shadowRoot?.querySelector('.active');
    expect(activeDivAfter).toBeNull();

    // Inactive should be visible
    const inactiveDivAfter = el.shadowRoot?.querySelector('.inactive');
    expect(inactiveDivAfter).toBeTruthy();
    expect(inactiveDivAfter?.textContent).toBe('Inactive content');
  });

  it('should render content on first connection', async () => {
    @element('test-stage3-render-timing')
    class TestStage3RenderTiming extends HTMLElement {
      @property() message = 'Initial content';

      @render()
      renderContent() {
        return html`<div class="content">${this.message}</div>`;
      }
    }

    const el = document.createElement('test-stage3-render-timing') as TestStage3RenderTiming;
    document.body.appendChild(el);
    await el.ready;

    // Content should be rendered on first connection
    const content = el.shadowRoot?.querySelector('.content');
    expect(content).toBeTruthy();
    expect(content?.textContent).toBe('Initial content');
  });

  it('should render property interpolations correctly on first render', async () => {
    @element('test-stage3-interpolation')
    class TestStage3Interpolation extends HTMLElement {
      @property() title = 'Test Title';
      @property() description = 'Test Description';
      @property({ type: Number }) value = 42;
      @property({ type: Boolean }) flag = true;

      @render()
      renderContent() {
        return html`
          <h1>${this.title}</h1>
          <p>${this.description}</p>
          <span>${this.value}</span>
          <div>${this.flag ? 'yes' : 'no'}</div>
        `;
      }
    }

    const el = document.createElement('test-stage3-interpolation') as TestStage3Interpolation;
    document.body.appendChild(el);
    await el.ready;

    const h1 = el.shadowRoot?.querySelector('h1');
    const p = el.shadowRoot?.querySelector('p');
    const span = el.shadowRoot?.querySelector('span');
    const div = el.shadowRoot?.querySelector('div');

    // All interpolations should work on first render
    expect(h1?.textContent).toBe('Test Title');
    expect(p?.textContent).toBe('Test Description');
    expect(span?.textContent).toBe('42');
    expect(div?.textContent).toBe('yes');
  });

  it('should handle property defaults and HTML attributes correctly', async () => {
    @element('test-stage3-defaults')
    class TestStage3Defaults extends HTMLElement {
      @property() name = 'default-name';
      @property({ type: Number }) age = 0;
      @property({ type: Boolean }) active = false;

      @render()
      renderContent() {
        return html`
          <div class="name">${this.name}</div>
          <div class="age">${this.age}</div>
          <div class="active">${this.active}</div>
        `;
      }
    }

    // Test with default values (no attributes)
    const el1 = document.createElement('test-stage3-defaults') as TestStage3Defaults;
    document.body.appendChild(el1);
    await el1.ready;

    expect(el1.shadowRoot?.querySelector('.name')?.textContent).toBe('default-name');
    expect(el1.shadowRoot?.querySelector('.age')?.textContent).toBe('0');
    expect(el1.shadowRoot?.querySelector('.active')?.textContent).toBe('false');

    // Test with HTML attributes (should override defaults)
    const el2 = document.createElement('test-stage3-defaults') as TestStage3Defaults;
    el2.setAttribute('name', 'custom-name');
    el2.setAttribute('age', '25');
    el2.setAttribute('active', 'true');
    document.body.appendChild(el2);
    await el2.ready;

    expect(el2.shadowRoot?.querySelector('.name')?.textContent).toBe('custom-name');
    expect(el2.shadowRoot?.querySelector('.age')?.textContent).toBe('25');
    expect(el2.shadowRoot?.querySelector('.active')?.textContent).toBe('true');
  });


  it('should handle optional properties without initializers correctly', async () => {
    // This tests the exact pattern from scan-page that was failing
    @element('test-stage3-optional')
    class TestStage3Optional extends HTMLElement {
      @property() error?: string; // No initializer - this is the tricky case

      @render()
      renderContent() {
        return html`
          <if ${this.error}>
            <div class="has-error">Error: ${this.error}</div>
          </if>
          <if ${!this.error}>
            <div class="no-error">No error</div>
          </if>
        `;
      }
    }

    const el = document.createElement('test-stage3-optional') as TestStage3Optional;
    document.body.appendChild(el);
    await el.ready;

    // When property has no initializer, it should return undefined
    expect(el.error).toBeUndefined();

    // The "no error" state should show
    // Note: This may fail if descriptors aren't set up before initial render
    const noErrorDiv = el.shadowRoot?.querySelector('.no-error');
    const hasErrorDiv = el.shadowRoot?.querySelector('.has-error');

    // If this fails, it means properties without initializers don't work on first render
    if (hasErrorDiv) {
      console.warn('WARNING: <if ${this.error}> showing despite error being undefined');
      console.warn('This indicates property descriptor not set before initial render');
    }

    expect(hasErrorDiv).toBeNull();
    expect(noErrorDiv).toBeTruthy();
    expect(noErrorDiv?.textContent).toBe('No error');
  });

  it('should handle properties with explicit undefined initializers', async () => {
    @element('test-stage3-explicit-undefined')
    class TestStage3ExplicitUndefined extends HTMLElement {
      @property() error: string | undefined = undefined; // Explicit initializer
      @property({ type: Boolean }) autoStart = false;
      @property({ type: Boolean }) tapStart = false;
      @property({ type: Boolean }) pickFirst = false;
      @property() camera = 'back';

      @render()
      renderContent() {
        return html`
          <if ${this.error}>
            <div class="error-container">
              <strong>${this.error}</strong>
            </div>
          </if>

          <if ${!this.error}>
            <div class="scanner-container">
              <p>Camera: ${this.camera}</p>
              <p>Auto-start: ${this.autoStart}</p>
              <p>Tap-start: ${this.tapStart}</p>
              <p>Pick-first: ${this.pickFirst}</p>
            </div>
          </if>
        `;
      }
    }

    const el = document.createElement('test-stage3-explicit-undefined') as TestStage3ExplicitUndefined;
    document.body.appendChild(el);
    await el.ready;

    // No error initially, scanner should be visible
    expect(el.error).toBe(undefined);
    expect(el.shadowRoot?.querySelector('.error-container')).toBeNull();
    expect(el.shadowRoot?.querySelector('.scanner-container')).toBeTruthy();

    // Check property values rendered correctly
    const scannerContainer = el.shadowRoot?.querySelector('.scanner-container');
    expect(scannerContainer?.textContent).toContain('Camera: back');
    expect(scannerContainer?.textContent).toContain('Auto-start: false');
    expect(scannerContainer?.textContent).toContain('Tap-start: false');
    expect(scannerContainer?.textContent).toContain('Pick-first: false');

    // Set error
    el.error = 'Scanner error occurred';
    await new Promise(resolve => setTimeout(resolve, 0));

    // Error should be visible, scanner should be hidden
    expect(el.shadowRoot?.querySelector('.error-container')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('.scanner-container')).toBeNull();
    expect(el.shadowRoot?.querySelector('.error-container strong')?.textContent).toBe('Scanner error occurred');
  });
});
