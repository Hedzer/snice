import { beforeEach, describe, it, expect } from 'vitest';
import { element, part } from '../src/element';
import type { SniceElement } from '../src/element';

describe('@part decorator', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should render parts on initial connection', async () => {
    @element('test-part-basic-2024')
    class TestPartsBasic extends HTMLElement {
      user = {
        name: 'John Doe',
        bio: 'Software developer'
      };

      html() {
        return `
          <section>
            <h1 part="title"></h1>
            <div part="bio"></div>
          </section>
        `;
      }

      @part('title')
      renderTitle() {
        return `<span>${this.user.name}</span>`;
      }

      @part('bio')
      renderBio() {
        return `<p>${this.user.bio}</p>`;
      }
    }

    const el = document.createElement('test-part-basic-2024') as TestPartsBasic & SniceElement;
    document.body.appendChild(el);

    // Wait for the element to be ready
    await el.ready;

    // Check that parts were rendered
    const titleElement = el.shadowRoot!.querySelector('[part="title"]');
    const bioElement = el.shadowRoot!.querySelector('[part="bio"]');

    expect(titleElement!.innerHTML).toBe('<span>John Doe</span>');
    expect(bioElement!.innerHTML).toBe('<p>Software developer</p>');
  });

  it('should support async part methods', async () => {
    @element('test-parts-async-unique')
    class TestPartsAsync extends HTMLElement {
      data = 'async content';

      html() {
        return `<div part="content"></div>`;
      }

      @part('content')
      async renderContent() {
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 10));
        return `<span>${this.data}</span>`;
      }
    }

    const el = document.createElement('test-parts-async-unique') as TestPartsAsync & SniceElement;
    document.body.appendChild(el);

    // Wait for the element to be ready
    await el.ready;

    const contentElement = el.shadowRoot!.querySelector('[part="content"]');
    expect(contentElement!.innerHTML).toBe('<span>async content</span>');
  });

  it('should re-render individual parts with renderPart method', async () => {
    @element('test-parts-rerender-unique')
    class TestPartsRerender extends HTMLElement {
      count = 0;

      html() {
        return `
          <div>
            <span part="counter"></span>
            <button id="increment">Increment</button>
          </div>
        `;
      }

      @part('counter')
      renderCounter() {
        return `Count: ${this.count}`;
      }

      increment() {
        this.count++;
        this.renderCounter(); // Call the @part decorated method directly
      }
    }

    const el = document.createElement('test-parts-rerender-unique') as TestPartsRerender & SniceElement;
    document.body.appendChild(el);

    // Wait for the element to be ready
    await el.ready;

    const counterElement = el.shadowRoot!.querySelector('[part="counter"]');
    expect(counterElement!.innerHTML).toBe('Count: 0');

    // Update and re-render
    el.increment();
    await new Promise(resolve => setTimeout(resolve, 0)); // Wait for re-render

    expect(counterElement!.innerHTML).toBe('Count: 1');
  });

  it('should handle missing part elements gracefully', async () => {
    @element('test-parts-missing-unique')
    class TestPartsMissing extends HTMLElement {
      html() {
        return `<div>No parts here</div>`;
      }

      @part('missing')
      renderMissing() {
        return 'This should not render';
      }
    }

    const el = document.createElement('test-parts-missing-unique') as TestPartsMissing & SniceElement;
    document.body.appendChild(el);

    // Wait for the element to be ready
    await el.ready;

    // This test just verifies the element connects properly
    // Missing parts are handled gracefully during initial render
  });

  it('should handle multiple parts', async () => {
    @element('test-parts-multiple-unique')
    class TestPartsMultiple extends HTMLElement {
      items = ['Item 1', 'Item 2', 'Item 3'];

      html() {
        return `
          <div>
            <h2 part="header"></h2>
            <ul part="list"></ul>
            <footer part="footer"></footer>
          </div>
        `;
      }

      @part('header')
      renderHeader() {
        return `Items (${this.items.length})`;
      }

      @part('list')
      renderList() {
        return this.items.map(item => `<li>${item}</li>`).join('');
      }

      @part('footer')
      renderFooter() {
        return `Total: ${this.items.length} items`;
      }
    }

    const el = document.createElement('test-parts-multiple-unique') as TestPartsMultiple & SniceElement;
    document.body.appendChild(el);

    // Wait for the element to be ready
    await el.ready;

    const headerElement = el.shadowRoot!.querySelector('[part="header"]');
    const listElement = el.shadowRoot!.querySelector('[part="list"]');
    const footerElement = el.shadowRoot!.querySelector('[part="footer"]');

    expect(headerElement!.innerHTML).toBe('Items (3)');
    expect(listElement!.innerHTML).toBe('<li>Item 1</li><li>Item 2</li><li>Item 3</li>');
    expect(footerElement!.innerHTML).toBe('Total: 3 items');
  });

  it('should handle part methods that return undefined', async () => {
    @element('test-parts-undefined-unique')
    class TestPartsUndefined extends HTMLElement {
      showContent = false;

      html() {
        return `<div part="conditional"></div>`;
      }

      @part('conditional')
      renderConditional() {
        return this.showContent ? 'Content shown' : undefined;
      }
    }

    const el = document.createElement('test-parts-undefined-unique') as TestPartsUndefined & SniceElement;
    document.body.appendChild(el);

    // Wait for the element to be ready
    await el.ready;

    const conditionalElement = el.shadowRoot!.querySelector('[part="conditional"]');
    expect(conditionalElement!.innerHTML).toBe(''); // Should remain empty

    // Now show content and call the part method to re-render
    el.showContent = true;
    await el.renderConditional(); // Call the @part decorated method directly
    
    expect(conditionalElement!.innerHTML).toBe('Content shown');
  });

  it('should support throttle option to limit render frequency', async () => {
    let renderCount = 0;
    
    @element('test-parts-throttle-unique')
    class TestPartsThrottle extends HTMLElement {
      count = 0;

      html() {
        return `<div part="counter"></div>`;
      }

      @part('counter', { throttle: 100 })
      renderCounter() {
        renderCount++;
        return `Count: ${this.count} (renders: ${renderCount})`;
      }

      increment() {
        this.count++;
        this.renderCounter();
      }
    }

    const el = document.createElement('test-parts-throttle-unique') as TestPartsThrottle & SniceElement;
    document.body.appendChild(el);
    await el.ready;

    const counterElement = el.shadowRoot!.querySelector('[part="counter"]');
    
    // Initial render during connection
    expect(counterElement!.innerHTML).toContain('Count: 0');
    const initialRenderCount = renderCount;

    // Reset the timer to start fresh for throttling test
    await new Promise(resolve => setTimeout(resolve, 10));

    // Rapid calls - should be throttled
    el.increment(); // Should render immediately (first call after throttle period)
    el.increment(); // Should be throttled
    el.increment(); // Should be throttled
    
    // Should only have 1 additional render beyond initial
    expect(renderCount).toBe(initialRenderCount + 1);
    
    // Wait for throttle period to pass
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Should have caught up with one more render from the scheduled throttle
    expect(renderCount).toBe(initialRenderCount + 2);
  });

  it('should support debounce option to delay renders', async () => {
    let renderCount = 0;
    
    @element('test-parts-debounce-unique')
    class TestPartsDebounce extends HTMLElement {
      text = '';

      html() {
        return `<div part="content"></div>`;
      }

      @part('content', { debounce: 50 })
      renderContent() {
        renderCount++;
        return `Text: ${this.text} (renders: ${renderCount})`;
      }

      updateText(newText: string) {
        this.text = newText;
        this.renderContent();
      }
    }

    const el = document.createElement('test-parts-debounce-unique') as TestPartsDebounce & SniceElement;
    document.body.appendChild(el);
    await el.ready;
    
    // Initial render
    expect(renderCount).toBe(1);

    // Rapid updates - should be debounced
    el.updateText('a');
    el.updateText('ab'); 
    el.updateText('abc');
    
    // No additional renders yet due to debouncing
    expect(renderCount).toBe(1);
    
    // Wait for debounce period
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should have rendered once after debounce period
    expect(renderCount).toBe(2);
    
    const contentElement = el.shadowRoot!.querySelector('[part="content"]');
    expect(contentElement!.innerHTML).toContain('Text: abc');
  });

  it('should handle conflicting throttle and debounce options (debounce takes precedence)', async () => {
    let renderCount = 0;
    
    @element('test-parts-throttle-debounce-unique')
    class TestPartsThrottleDebounce extends HTMLElement {
      text = '';

      html() {
        return `<div part="content"></div>`;
      }

      @part('content', { throttle: 100, debounce: 50 })
      renderContent() {
        renderCount++;
        return `Text: ${this.text} (renders: ${renderCount})`;
      }

      updateText(newText: string) {
        this.text = newText;
        this.renderContent();
      }
    }

    const el = document.createElement('test-parts-throttle-debounce-unique') as TestPartsThrottleDebounce & SniceElement;
    document.body.appendChild(el);
    await el.ready;
    
    // Initial render
    expect(renderCount).toBe(1);

    // Rapid updates - debounce should take precedence over throttle
    el.updateText('a');
    el.updateText('ab'); 
    el.updateText('abc');
    
    // No additional renders yet due to debouncing (throttle is ignored)
    expect(renderCount).toBe(1);
    
    // Wait for debounce period (debounce wins over throttle)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Should have rendered once after debounce period
    expect(renderCount).toBe(2);
    
    const contentElement = el.shadowRoot!.querySelector('[part="content"]');
    expect(contentElement!.innerHTML).toContain('Text: abc');
  });

  it('should handle zero/negative values gracefully', async () => {
    let renderCount = 0;
    
    @element('test-parts-invalid-options-unique')
    class TestPartsInvalidOptions extends HTMLElement {
      text = '';

      html() {
        return `<div part="content"></div>`;
      }

      @part('content', { throttle: 0, debounce: -10 })
      renderContent() {
        renderCount++;
        return `Text: ${this.text} (renders: ${renderCount})`;
      }

      updateText(newText: string) {
        this.text = newText;
        this.renderContent();
      }
    }

    const el = document.createElement('test-parts-invalid-options-unique') as TestPartsInvalidOptions & SniceElement;
    document.body.appendChild(el);
    await el.ready;
    
    // Initial render
    expect(renderCount).toBe(1);

    // Should render immediately since invalid debounce value
    el.updateText('test');
    expect(renderCount).toBe(2);
    
    const contentElement = el.shadowRoot!.querySelector('[part="content"]');
    expect(contentElement!.innerHTML).toContain('Text: test');
  });
});