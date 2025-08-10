import { describe, it, expect, beforeEach, vi } from 'vitest';
import { element, on, query } from '../src';

describe('shadow DOM event handling', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should handle events from shadow DOM with composed events', () => {
    const clickHandler = vi.fn();
    
    @element('shadow-host')
    class ShadowHost extends HTMLElement {
      constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.innerHTML = '<button>Shadow Button</button>';
      }
      
      @on('click')
      handleClick(e: Event) {
        clickHandler(e);
      }
    }
    
    const el = document.createElement('shadow-host');
    document.body.appendChild(el);
    
    const shadowButton = el.shadowRoot?.querySelector('button');
    shadowButton?.click();
    
    // Click events are composed by default, so they should bubble through
    expect(clickHandler).toHaveBeenCalled();
  });

  it('should handle shadow DOM selector matching (happy-dom limitation)', () => {
    const clickHandler = vi.fn();
    
    @element('shadow-selector')
    class ShadowSelector extends HTMLElement {
      constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.innerHTML = '<button class="shadow-btn">Shadow Button</button>';
      }
      
      @on('click', '.shadow-btn')
      handleClick(e: Event) {
        clickHandler(e);
      }
    }
    
    const el = document.createElement('shadow-selector');
    document.body.appendChild(el);
    
    const shadowButton = el.shadowRoot?.querySelector('.shadow-btn') as HTMLElement;
    shadowButton?.click();
    
    // NOTE: In real browsers, event.target would be retargeted to the shadow host
    // when crossing the shadow boundary, so the selector wouldn't match.
    // However, happy-dom doesn't implement proper event retargeting,
    // so the event.target is still the button inside shadow DOM.
    // This means our selector DOES match in tests, but wouldn't in real browsers.
    
    // For snice, we recommend using regular DOM (innerHTML) instead of shadow DOM
    // to avoid these cross-boundary complications.
    expect(clickHandler).toHaveBeenCalled(); // Works in happy-dom, not in browsers
  });

  it('should handle events in light DOM even with shadow DOM present', () => {
    const lightClick = vi.fn();
    const shadowClick = vi.fn();
    
    @element('mixed-dom')
    class MixedDom extends HTMLElement {
      connectedCallback() {
        // Add light DOM content
        this.innerHTML = '<button class="light-btn">Light Button</button>';
        
        // Also add shadow DOM
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.innerHTML = '<button class="shadow-btn">Shadow Button</button>';
      }
      
      @on('click', '.light-btn')
      handleLightClick(e: Event) {
        lightClick(e);
      }
      
      @on('click')
      handleAnyClick(e: Event) {
        shadowClick(e);
      }
    }
    
    const el = document.createElement('mixed-dom');
    document.body.appendChild(el);
    
    // Light DOM button should work with selector
    const lightButton = el.querySelector('.light-btn') as HTMLElement;
    lightButton?.click();
    expect(lightClick).toHaveBeenCalled();
    
    // Shadow DOM button click should bubble to host
    const shadowButton = el.shadowRoot?.querySelector('.shadow-btn') as HTMLElement;
    shadowButton?.click();
    expect(shadowClick).toHaveBeenCalled();
  });

  it('should handle non-composed events correctly', () => {
    const focusHandler = vi.fn();
    
    @element('shadow-focus')
    class ShadowFocus extends HTMLElement {
      constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.innerHTML = '<input type="text" />';
      }
      
      @on('focus')
      handleFocus(e: Event) {
        focusHandler(e);
      }
    }
    
    const el = document.createElement('shadow-focus');
    document.body.appendChild(el);
    
    const input = el.shadowRoot?.querySelector('input');
    input?.focus();
    
    // Focus events are NOT composed by default, won't bubble through shadow boundary
    expect(focusHandler).not.toHaveBeenCalled();
  });

  it('should query within shadow DOM using @query decorator', () => {
    @element('shadow-query')
    class ShadowQuery extends HTMLElement {
      @query('.shadow-el')
      shadowEl?: HTMLElement;
      
      constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.innerHTML = '<div class="shadow-el">Shadow Content</div>';
      }
    }
    
    const el = document.createElement('shadow-query') as any;
    document.body.appendChild(el);
    
    // @query should find elements in shadow DOM
    expect(el.shadowEl).toBeDefined();
    expect(el.shadowEl?.textContent).toBe('Shadow Content');
  });

  it('should demonstrate why innerHTML approach is simpler', () => {
    const clickHandler = vi.fn();
    
    @element('regular-dom')
    class RegularDom extends HTMLElement {
      html() {
        return '<button class="btn">Regular Button</button>';
      }
      
      @on('click', '.btn')
      handleClick(e: Event) {
        clickHandler(e);
      }
    }
    
    const el = document.createElement('regular-dom');
    document.body.appendChild(el);
    
    const button = el.querySelector('.btn') as HTMLElement;
    button?.click();
    
    // With regular DOM, everything just works
    expect(clickHandler).toHaveBeenCalled();
  });
});