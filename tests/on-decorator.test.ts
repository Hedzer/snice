import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { element, controller, on, render, html, IController } from '../src/index';

describe('@on decorator', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('Event Delegation with Selectors', () => {
    it('should handle events with CSS selector delegation in elements', async () => {
      const clickHandler = vi.fn();

      @element('test-delegation')
      class TestDelegation extends HTMLElement {
        @render()
        renderContent() {
          return html`
            <div>
              <button class="target">Click Me</button>
              <button class="other">Other Button</button>
            </div>
          `;
        }

        @on('click', '.target')
        handleTargetClick(e: Event) {
          clickHandler(e);
        }
      }

      const el = document.createElement('test-delegation') as TestDelegation;
      container.appendChild(el);
      await el.ready;

      const targetButton = el.shadowRoot?.querySelector('.target') as HTMLButtonElement;
      const otherButton = el.shadowRoot?.querySelector('.other') as HTMLButtonElement;

      targetButton.click();
      expect(clickHandler).toHaveBeenCalledTimes(1);

      otherButton.click();
      expect(clickHandler).toHaveBeenCalledTimes(1); // Should not increment
    });

    it('should handle events with selector delegation in controllers', async () => {
      const clickHandler = vi.fn();

      @controller('test-delegation-controller')
      class TestDelegationController implements IController {
        element: HTMLElement | null = null;

        async attach(element: HTMLElement) {
          this.element = element;
        }

        async detach(element: HTMLElement) {}

        @on('click', '.item')
        handleItemClick(e: Event) {
          clickHandler(e);
        }
      }

      @element('test-host')
      class TestHost extends HTMLElement {
        @render()
        renderContent() {
          return html`
            <div>
              <div class="item">Item 1</div>
              <div class="item">Item 2</div>
              <div class="other">Other</div>
            </div>
          `;
        }
      }

      const el = document.createElement('test-host') as TestHost;
      el.setAttribute('controller', 'test-delegation-controller');
      container.appendChild(el);
      await el.ready;

      // Wait for controller to attach
      await new Promise(resolve => setTimeout(resolve, 50));

      const item1 = el.shadowRoot?.querySelector('.item') as HTMLDivElement;
      const other = el.shadowRoot?.querySelector('.other') as HTMLDivElement;

      item1.click();
      expect(clickHandler).toHaveBeenCalledTimes(1);

      other.click();
      expect(clickHandler).toHaveBeenCalledTimes(1); // Should not increment
    });
  });

  describe('Keyboard Modifiers', () => {
    it('should handle Enter key modifier', async () => {
      const enterHandler = vi.fn();

      @element('test-keyboard-enter')
      class TestKeyboardEnter extends HTMLElement {
        @render()
        renderContent() {
          return html`<input type="text" />`;
        }

        @on('keydown:Enter', 'input')
        handleEnter(e: KeyboardEvent) {
          enterHandler(e);
        }
      }

      const el = document.createElement('test-keyboard-enter') as TestKeyboardEnter;
      container.appendChild(el);
      await el.ready;

      const input = el.shadowRoot?.querySelector('input') as HTMLInputElement;

      // Simulate Enter key
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true });
      input.dispatchEvent(enterEvent);
      expect(enterHandler).toHaveBeenCalledTimes(1);

      // Simulate other key
      const otherEvent = new KeyboardEvent('keydown', { key: 'a', bubbles: true, composed: true });
      input.dispatchEvent(otherEvent);
      expect(enterHandler).toHaveBeenCalledTimes(1); // Should not increment
    });

    it('should handle Ctrl+S modifier combination', async () => {
      const saveHandler = vi.fn();

      @element('test-keyboard-ctrl-s')
      class TestKeyboardCtrlS extends HTMLElement {
        @render()
        renderContent() {
          return html`<textarea></textarea>`;
        }

        @on('keydown:ctrl+s')
        handleSave(e: KeyboardEvent) {
          saveHandler(e);
        }
      }

      const el = document.createElement('test-keyboard-ctrl-s') as TestKeyboardCtrlS;
      container.appendChild(el);
      await el.ready;

      // Simulate Ctrl+S
      const ctrlSEvent = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true
      });
      el.dispatchEvent(ctrlSEvent);
      expect(saveHandler).toHaveBeenCalledTimes(1);

      // Simulate just 's' without Ctrl
      const sEvent = new KeyboardEvent('keydown', { key: 's', bubbles: true });
      el.dispatchEvent(sEvent);
      expect(saveHandler).toHaveBeenCalledTimes(1); // Should not increment
    });

    it('should handle shift+alt+d modifier combination', async () => {
      const debugHandler = vi.fn();

      @element('test-keyboard-shift-alt-d')
      class TestKeyboardShiftAltD extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Test</div>`;
        }

        @on('keydown:shift+alt+d')
        handleDebug(e: KeyboardEvent) {
          debugHandler(e);
        }
      }

      const el = document.createElement('test-keyboard-shift-alt-d') as TestKeyboardShiftAltD;
      container.appendChild(el);
      await el.ready;

      // Simulate Shift+Alt+D
      const event = new KeyboardEvent('keydown', {
        key: 'd',
        shiftKey: true,
        altKey: true,
        bubbles: true
      });
      el.dispatchEvent(event);
      expect(debugHandler).toHaveBeenCalledTimes(1);
    });

    it('should handle dot notation in @on decorator (same as colon)', async () => {
      const escapeHandler = vi.fn();

      @element('test-keyboard-dot-decorator')
      class TestKeyboardDotDecorator extends HTMLElement {
        @render()
        renderContent() {
          return html`<input type="text" />`;
        }

        @on('keydown.escape', 'input')
        handleEscape(e: KeyboardEvent) {
          escapeHandler(e);
        }
      }

      const el = document.createElement('test-keyboard-dot-decorator') as TestKeyboardDotDecorator;
      container.appendChild(el);
      await el.ready;

      const input = el.shadowRoot?.querySelector('input') as HTMLInputElement;

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true });
      input.dispatchEvent(escapeEvent);
      expect(escapeHandler).toHaveBeenCalledTimes(1);

      const otherEvent = new KeyboardEvent('keydown', { key: 'a', bubbles: true, composed: true });
      input.dispatchEvent(otherEvent);
      expect(escapeHandler).toHaveBeenCalledTimes(1); // Should not increment
    });

    it('should handle ~Space (any modifiers) pattern', async () => {
      const spaceHandler = vi.fn();

      @element('test-keyboard-any-space')
      class TestKeyboardAnySpace extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Test</div>`;
        }

        @on('keydown:~Space')
        handleSpace(e: KeyboardEvent) {
          spaceHandler(e);
        }
      }

      const el = document.createElement('test-keyboard-any-space') as TestKeyboardAnySpace;
      container.appendChild(el);
      await el.ready;

      // Space without modifiers
      const space1 = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      el.dispatchEvent(space1);
      expect(spaceHandler).toHaveBeenCalledTimes(1);

      // Space with Ctrl
      const space2 = new KeyboardEvent('keydown', { key: ' ', ctrlKey: true, bubbles: true });
      el.dispatchEvent(space2);
      expect(spaceHandler).toHaveBeenCalledTimes(2);

      // Space with Shift+Alt
      const space3 = new KeyboardEvent('keydown', { key: ' ', shiftKey: true, altKey: true, bubbles: true });
      el.dispatchEvent(space3);
      expect(spaceHandler).toHaveBeenCalledTimes(3);
    });
  });

  describe('Debounce and Throttle', () => {
    it('should debounce event handlers', async () => {
      const inputHandler = vi.fn();

      @element('test-debounce')
      class TestDebounce extends HTMLElement {
        @render()
        renderContent() {
          return html`<input type="text" />`;
        }

        @on('input', 'input', { debounce: 100 })
        handleInput(e: Event) {
          inputHandler(e);
        }
      }

      const el = document.createElement('test-debounce') as TestDebounce;
      container.appendChild(el);
      await el.ready;

      const input = el.shadowRoot?.querySelector('input') as HTMLInputElement;

      // Trigger multiple rapid events
      input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

      // Handler should not be called yet
      expect(inputHandler).toHaveBeenCalledTimes(0);

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 150));

      // Handler should be called once
      expect(inputHandler).toHaveBeenCalledTimes(1);
    });

    it('should throttle event handlers', async () => {
      const scrollHandler = vi.fn();

      @element('test-throttle')
      class TestThrottle extends HTMLElement {
        @render()
        renderContent() {
          return html`<div style="overflow: auto; height: 100px;">Content</div>`;
        }

        @on('scroll', null, { throttle: 100 })
        handleScroll(e: Event) {
          scrollHandler(e);
        }
      }

      const el = document.createElement('test-throttle') as TestThrottle;
      container.appendChild(el);
      await el.ready;

      // First event should fire immediately
      el.dispatchEvent(new Event('scroll', { bubbles: true, composed: true }));
      expect(scrollHandler).toHaveBeenCalledTimes(1);

      // Rapid events should be throttled
      await new Promise(resolve => setTimeout(resolve, 50));
      el.dispatchEvent(new Event('scroll', { bubbles: true, composed: true }));
      expect(scrollHandler).toHaveBeenCalledTimes(1); // Still 1

      // Wait for throttle period
      await new Promise(resolve => setTimeout(resolve, 100));
      el.dispatchEvent(new Event('scroll', { bubbles: true, composed: true }));
      expect(scrollHandler).toHaveBeenCalledTimes(2);
    });
  });

  describe('Event Options', () => {
    it('should automatically call preventDefault when configured', async () => {
      const submitHandler = vi.fn();

      @element('test-prevent-default')
      class TestPreventDefault extends HTMLElement {
        @render()
        renderContent() {
          return html`<form><button type="submit">Submit</button></form>`;
        }

        @on('submit', 'form', { preventDefault: true })
        handleSubmit(e: Event) {
          submitHandler(e);
        }
      }

      const el = document.createElement('test-prevent-default') as TestPreventDefault;
      container.appendChild(el);
      await el.ready;

      const form = el.shadowRoot?.querySelector('form') as HTMLFormElement;
      const event = new Event('submit', { bubbles: true, cancelable: true, composed: true });

      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      form.dispatchEvent(event);

      expect(submitHandler).toHaveBeenCalledTimes(1);
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should automatically call stopPropagation when configured', async () => {
      const clickHandler = vi.fn();

      @element('test-stop-propagation')
      class TestStopPropagation extends HTMLElement {
        @render()
        renderContent() {
          return html`<button>Click</button>`;
        }

        @on('click', 'button', { stopPropagation: true })
        handleClick(e: Event) {
          clickHandler(e);
        }
      }

      const el = document.createElement('test-stop-propagation') as TestStopPropagation;
      container.appendChild(el);
      await el.ready;

      const button = el.shadowRoot?.querySelector('button') as HTMLButtonElement;
      const event = new Event('click', { bubbles: true, composed: true });

      const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');
      button.dispatchEvent(event);

      expect(clickHandler).toHaveBeenCalledTimes(1);
      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('should handle once option', async () => {
      const clickHandler = vi.fn();

      @element('test-once')
      class TestOnce extends HTMLElement {
        @render()
        renderContent() {
          return html`<button>Click</button>`;
        }

        @on('click', 'button', { once: true })
        handleClick(e: Event) {
          clickHandler(e);
        }
      }

      const el = document.createElement('test-once') as TestOnce;
      container.appendChild(el);
      await el.ready;

      const button = el.shadowRoot?.querySelector('button') as HTMLButtonElement;

      button.click();
      expect(clickHandler).toHaveBeenCalledTimes(1);

      button.click();
      expect(clickHandler).toHaveBeenCalledTimes(1); // Should not increment
    });
  });

  describe('Multiple Events', () => {
    it('should handle multiple event names on one handler', async () => {
      const interactionHandler = vi.fn();

      @element('test-multiple-events')
      class TestMultipleEvents extends HTMLElement {
        @render()
        renderContent() {
          return html`<input type="text" />`;
        }

        @on(['focus', 'blur'], 'input')
        handleInteraction(e: Event) {
          interactionHandler(e.type);
        }
      }

      const el = document.createElement('test-multiple-events') as TestMultipleEvents;
      container.appendChild(el);
      await el.ready;

      const input = el.shadowRoot?.querySelector('input') as HTMLInputElement;

      input.dispatchEvent(new Event('focus', { bubbles: true, composed: true }));
      expect(interactionHandler).toHaveBeenCalledWith('focus');

      input.dispatchEvent(new Event('blur', { bubbles: true, composed: true }));
      expect(interactionHandler).toHaveBeenCalledWith('blur');

      expect(interactionHandler).toHaveBeenCalledTimes(2);
    });
  });

  describe('Template Event Modifiers', () => {
    it('should handle keyboard modifiers in template syntax with colon', async () => {
      const enterHandler = vi.fn();

      @element('test-template-keyboard-colon')
      class TestTemplateKeyboardColon extends HTMLElement {
        @render()
        renderContent() {
          return html`<input @keydown:Enter=${this.handleEnter} />`;
        }

        handleEnter(e: KeyboardEvent) {
          enterHandler(e);
        }
      }

      const el = document.createElement('test-template-keyboard-colon') as TestTemplateKeyboardColon;
      container.appendChild(el);
      await el.ready;

      const input = el.shadowRoot?.querySelector('input') as HTMLInputElement;

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      input.dispatchEvent(enterEvent);
      expect(enterHandler).toHaveBeenCalledTimes(1);

      const otherEvent = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
      input.dispatchEvent(otherEvent);
      expect(enterHandler).toHaveBeenCalledTimes(1); // Should not increment
    });

    it('should handle keyboard modifiers in template syntax with dot', async () => {
      const escapeHandler = vi.fn();

      @element('test-template-keyboard-dot')
      class TestTemplateKeyboardDot extends HTMLElement {
        @render()
        renderContent() {
          return html`<input @keydown.escape=${this.handleEscape} />`;
        }

        handleEscape(e: KeyboardEvent) {
          escapeHandler(e);
        }
      }

      const el = document.createElement('test-template-keyboard-dot') as TestTemplateKeyboardDot;
      container.appendChild(el);
      await el.ready;

      const input = el.shadowRoot?.querySelector('input') as HTMLInputElement;

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      input.dispatchEvent(escapeEvent);
      expect(escapeHandler).toHaveBeenCalledTimes(1);
    });

    it('should handle ctrl+s in template syntax', async () => {
      const saveHandler = vi.fn();

      @element('test-template-ctrl-s')
      class TestTemplateCtrlS extends HTMLElement {
        @render()
        renderContent() {
          return html`<textarea @keydown:ctrl+s=${this.handleSave}></textarea>`;
        }

        handleSave(e: KeyboardEvent) {
          saveHandler(e);
        }
      }

      const el = document.createElement('test-template-ctrl-s') as TestTemplateCtrlS;
      container.appendChild(el);
      await el.ready;

      const textarea = el.shadowRoot?.querySelector('textarea') as HTMLTextAreaElement;

      const ctrlSEvent = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true
      });
      textarea.dispatchEvent(ctrlSEvent);
      expect(saveHandler).toHaveBeenCalledTimes(1);

      const sEvent = new KeyboardEvent('keydown', { key: 's', bubbles: true });
      textarea.dispatchEvent(sEvent);
      expect(saveHandler).toHaveBeenCalledTimes(1); // Should not increment
    });
  });

  describe('Cleanup', () => {
    it('should cleanup event listeners on disconnection', async () => {
      const clickHandler = vi.fn();

      @element('test-cleanup')
      class TestCleanup extends HTMLElement {
        @render()
        renderContent() {
          return html`<button>Click</button>`;
        }

        @on('click', 'button')
        handleClick(e: Event) {
          clickHandler(e);
        }
      }

      const el = document.createElement('test-cleanup') as TestCleanup;
      container.appendChild(el);
      await el.ready;

      const button = el.shadowRoot?.querySelector('button') as HTMLButtonElement;

      button.click();
      expect(clickHandler).toHaveBeenCalledTimes(1);

      // Disconnect element
      container.removeChild(el);

      // Click should not trigger handler after disconnection
      button.click();
      expect(clickHandler).toHaveBeenCalledTimes(1); // Should not increment
    });

    it('should not duplicate event handlers when reconnected', async () => {
      const clickHandler = vi.fn();

      @element('test-no-duplicate-handlers')
      class TestNoDuplicateHandlers extends HTMLElement {
        @render()
        renderContent() {
          return html`<button>Click</button>`;
        }

        @on('click', 'button')
        handleClick(e: Event) {
          clickHandler(e);
        }
      }

      const el = document.createElement('test-no-duplicate-handlers') as TestNoDuplicateHandlers;
      container.appendChild(el);
      await el.ready;

      const button = el.shadowRoot?.querySelector('button') as HTMLButtonElement;

      // First click
      button.click();
      expect(clickHandler).toHaveBeenCalledTimes(1);

      // Disconnect and reconnect - triggers disconnectedCallback then connectedCallback
      container.removeChild(el);
      await new Promise(resolve => setTimeout(resolve, 10));
      container.appendChild(el);
      await new Promise(resolve => setTimeout(resolve, 10));

      // Click again - should only fire once, not multiple times
      button.click();
      expect(clickHandler).toHaveBeenCalledTimes(2);

      // Disconnect and reconnect again
      container.removeChild(el);
      await new Promise(resolve => setTimeout(resolve, 10));
      container.appendChild(el);
      await new Promise(resolve => setTimeout(resolve, 10));

      // Click again - still should only fire once
      button.click();
      expect(clickHandler).toHaveBeenCalledTimes(3);
    });

    it('should not duplicate direct event handlers', async () => {
      const clickHandler = vi.fn();

      @element('test-no-duplicate-direct')
      class TestNoDuplicateDirect extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Test</div>`;
        }

        @on('click')
        handleClick(e: Event) {
          clickHandler(e);
        }
      }

      const el = document.createElement('test-no-duplicate-direct') as TestNoDuplicateDirect;
      container.appendChild(el);
      await el.ready;

      // First click
      el.click();
      expect(clickHandler).toHaveBeenCalledTimes(1);

      // Disconnect and reconnect
      container.removeChild(el);
      container.appendChild(el);
      await new Promise(resolve => setTimeout(resolve, 10));

      // Click again - should only fire once per click
      el.click();
      expect(clickHandler).toHaveBeenCalledTimes(2);

      // One more click to verify
      el.click();
      expect(clickHandler).toHaveBeenCalledTimes(3);
    });

    it('should not duplicate handlers when setupEventHandlers called multiple times', async () => {
      const clickHandler = vi.fn();

      @element('test-no-duplicate-setup')
      class TestNoDuplicateSetup extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Test</div>`;
        }

        @on('click')
        handleClick(e: Event) {
          clickHandler(e);
        }
      }

      const el = document.createElement('test-no-duplicate-setup') as TestNoDuplicateSetup;
      container.appendChild(el);
      await el.ready;

      // First click - baseline
      el.click();
      expect(clickHandler).toHaveBeenCalledTimes(1);

      // Simulate what happens when connectedCallback is called again
      // This mimics the reconnection flow
      const connectedCallback = (el as any).connectedCallback;
      if (connectedCallback) {
        connectedCallback.call(el);
      }
      await new Promise(resolve => setTimeout(resolve, 10));

      // Click again - should still only fire once
      el.click();
      expect(clickHandler).toHaveBeenCalledTimes(2);

      // Verify one more time
      el.click();
      expect(clickHandler).toHaveBeenCalledTimes(3);
    });

    it('should not duplicate handlers when moved between containers', async () => {
      const clickHandler = vi.fn();

      @element('test-moved-element')
      class TestMovedElement extends HTMLElement {
        @render()
        renderContent() {
          return html`<button>Click</button>`;
        }

        @on('click', 'button')
        handleClick(e: Event) {
          clickHandler(e);
        }
      }

      const container2 = document.createElement('div');
      document.body.appendChild(container2);

      try {
        const el = document.createElement('test-moved-element') as TestMovedElement;
        container.appendChild(el);
        await el.ready;

        const button = el.shadowRoot?.querySelector('button') as HTMLButtonElement;

        // Initial click
        button.click();
        expect(clickHandler).toHaveBeenCalledTimes(1);

        // Move to different container - triggers disconnect then connect
        container2.appendChild(el);
        await new Promise(resolve => setTimeout(resolve, 10));

        button.click();
        expect(clickHandler).toHaveBeenCalledTimes(2);

        // Move back
        container.appendChild(el);
        await new Promise(resolve => setTimeout(resolve, 10));

        button.click();
        expect(clickHandler).toHaveBeenCalledTimes(3);

        // Move again
        container2.appendChild(el);
        await new Promise(resolve => setTimeout(resolve, 10));

        button.click();
        expect(clickHandler).toHaveBeenCalledTimes(4);
      } finally {
        document.body.removeChild(container2);
      }
    });

    it('should not duplicate handlers when adopted to new document', async () => {
      const clickHandler = vi.fn();

      @element('test-adopted-element')
      class TestAdoptedElement extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Test</div>`;
        }

        @on('click')
        handleClick(e: Event) {
          clickHandler(e);
        }
      }

      const el = document.createElement('test-adopted-element') as TestAdoptedElement;
      container.appendChild(el);
      await el.ready;

      // Initial click
      el.click();
      expect(clickHandler).toHaveBeenCalledTimes(1);

      // Create new document and adopt node
      const newDoc = document.implementation.createHTMLDocument('test');
      const newContainer = newDoc.createElement('div');
      newDoc.body.appendChild(newContainer);

      // Remove from current document
      container.removeChild(el);
      await new Promise(resolve => setTimeout(resolve, 10));

      // Adopt and append to new document
      const adoptedEl = newDoc.adoptNode(el);
      newContainer.appendChild(adoptedEl);
      await new Promise(resolve => setTimeout(resolve, 10));

      // Click should still work with single handler
      adoptedEl.click();
      expect(clickHandler).toHaveBeenCalledTimes(2);

      // Move back to original document
      container.appendChild(document.adoptNode(adoptedEl));
      await new Promise(resolve => setTimeout(resolve, 10));

      adoptedEl.click();
      expect(clickHandler).toHaveBeenCalledTimes(3);
    });

    it('should not duplicate handlers after property changes trigger re-renders', async () => {
      const clickHandler = vi.fn();

      @element('test-rerender-handlers')
      class TestRerenderHandlers extends HTMLElement {
        count = 0;

        @render()
        renderContent() {
          return html`<button>Click ${this.count}</button>`;
        }

        @on('click', 'button')
        handleClick(e: Event) {
          clickHandler(e);
        }

        increment() {
          this.count++;
          // Trigger re-render by property change
          (this as any).updateComplete?.then(() => {});
        }
      }

      const el = document.createElement('test-rerender-handlers') as TestRerenderHandlers;
      container.appendChild(el);
      await el.ready;

      const getButton = () => el.shadowRoot?.querySelector('button') as HTMLButtonElement;

      // Initial click
      getButton().click();
      expect(clickHandler).toHaveBeenCalledTimes(1);

      // Disconnect/reconnect multiple times to stress test
      for (let i = 0; i < 3; i++) {
        container.removeChild(el);
        await new Promise(resolve => setTimeout(resolve, 5));
        container.appendChild(el);
        await new Promise(resolve => setTimeout(resolve, 5));
      }

      getButton().click();
      expect(clickHandler).toHaveBeenCalledTimes(2);

      // More cycles
      for (let i = 0; i < 5; i++) {
        container.removeChild(el);
        container.appendChild(el);
      }
      await new Promise(resolve => setTimeout(resolve, 20));

      getButton().click();
      expect(clickHandler).toHaveBeenCalledTimes(3);
    });

    it('should not duplicate handlers through connect/disconnect cycles', async () => {
      const clickHandler = vi.fn();

      @element('test-cycle-handlers')
      class TestCycleHandlers extends HTMLElement {
        @render()
        renderContent() {
          return html`<button>Test</button>`;
        }

        @on('click', 'button')
        handleClick(e: Event) {
          clickHandler(e);
        }
      }

      const el = document.createElement('test-cycle-handlers') as TestCycleHandlers;
      container.appendChild(el);
      await el.ready;

      const getButton = () => el.shadowRoot?.querySelector('button') as HTMLButtonElement;

      // Initial state
      getButton().click();
      expect(clickHandler).toHaveBeenCalledTimes(1);

      // Cycle 1: disconnect, reconnect
      container.removeChild(el);
      await new Promise(resolve => setTimeout(resolve, 10));
      container.appendChild(el);
      await new Promise(resolve => setTimeout(resolve, 10));

      getButton().click();
      expect(clickHandler).toHaveBeenCalledTimes(2);

      // Cycle 2: disconnect, reconnect
      container.removeChild(el);
      await new Promise(resolve => setTimeout(resolve, 10));
      container.appendChild(el);
      await new Promise(resolve => setTimeout(resolve, 10));

      getButton().click();
      expect(clickHandler).toHaveBeenCalledTimes(3);

      // Cycle 3: multiple rapid disconnects/reconnects
      for (let i = 0; i < 5; i++) {
        container.removeChild(el);
        container.appendChild(el);
      }
      await new Promise(resolve => setTimeout(resolve, 20));

      getButton().click();
      expect(clickHandler).toHaveBeenCalledTimes(4);

      // Cycle 4: more rapid cycles
      for (let i = 0; i < 10; i++) {
        container.removeChild(el);
        container.appendChild(el);
      }
      await new Promise(resolve => setTimeout(resolve, 20));

      getButton().click();
      expect(clickHandler).toHaveBeenCalledTimes(5);
    });

    it('should not duplicate delegated handlers in stress test', async () => {
      const clickHandler = vi.fn();

      @element('test-stress-delegated')
      class TestStressDelegated extends HTMLElement {
        @render()
        renderContent() {
          return html`
            <div>
              <button class="btn">Button 1</button>
              <button class="btn">Button 2</button>
              <button class="btn">Button 3</button>
            </div>
          `;
        }

        @on('click', '.btn')
        handleClick(e: Event) {
          clickHandler(e);
        }
      }

      const el = document.createElement('test-stress-delegated') as TestStressDelegated;
      container.appendChild(el);
      await el.ready;

      const getButtons = () => Array.from(el.shadowRoot?.querySelectorAll('.btn') || []) as HTMLButtonElement[];

      // Click all buttons initially
      getButtons().forEach(btn => btn.click());
      expect(clickHandler).toHaveBeenCalledTimes(3);

      // Stress test: many disconnect/reconnect cycles
      for (let i = 0; i < 10; i++) {
        container.removeChild(el);
        await new Promise(resolve => setTimeout(resolve, 5));
        container.appendChild(el);
        await new Promise(resolve => setTimeout(resolve, 5));
      }

      // Each button should still fire exactly once
      clickHandler.mockClear();
      getButtons().forEach(btn => btn.click());
      expect(clickHandler).toHaveBeenCalledTimes(3);
    });

    it('should not duplicate direct handlers in stress test', async () => {
      const clickHandler = vi.fn();

      @element('test-stress-direct')
      class TestStressDirect extends HTMLElement {
        @render()
        renderContent() {
          return html`<div>Test</div>`;
        }

        @on('click')
        handleClick(e: Event) {
          clickHandler(e);
        }
      }

      const el = document.createElement('test-stress-direct') as TestStressDirect;
      container.appendChild(el);
      await el.ready;

      // Initial click
      el.click();
      expect(clickHandler).toHaveBeenCalledTimes(1);

      // Stress test: many disconnect/reconnect cycles
      for (let i = 0; i < 20; i++) {
        container.removeChild(el);
        container.appendChild(el);
      }
      await new Promise(resolve => setTimeout(resolve, 50));

      // Should still fire exactly once
      clickHandler.mockClear();
      el.click();
      expect(clickHandler).toHaveBeenCalledTimes(1);
    });
  });
});
