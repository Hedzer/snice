import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { element, on } from '../src/index';

describe('@on key modifiers', () => {
  let container: HTMLElement;
  let testId = 0;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    testId++;
  });

  afterEach(() => {
    container.remove();
  });

  describe('basic key modifiers', () => {
    it('should handle keydown:Enter (exact match by default)', async () => {
      let enterCalled = false;
      let enterEvent: KeyboardEvent | null = null;
      const tagName = `test-enter-${testId}`;

      @element(tagName)
      class TestEnter extends HTMLElement {
        html() {
          return `<input type="text" class="input">`;
        }

        @on('keydown:Enter', '.input')
        onEnter(e: KeyboardEvent) {
          enterCalled = true;
          enterEvent = e;
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      const input = el.shadowRoot.querySelector('.input');
      
      // Should trigger on plain Enter key
      const event1 = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      input.dispatchEvent(event1);
      expect(enterCalled).toBe(true);
      expect(enterEvent).toBe(event1);

      // Reset for next test
      enterCalled = false;
      enterEvent = null;

      // Should NOT trigger on Enter with modifiers
      const event2 = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true });
      input.dispatchEvent(event2);
      expect(enterCalled).toBe(false);
      expect(enterEvent).toBe(null);

      // Should NOT trigger on other keys
      const event3 = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      input.dispatchEvent(event3);
      expect(enterCalled).toBe(false);
      expect(enterEvent).toBe(null);
    });

    it('should handle keydown:Escape', async () => {
      let escapeCalled = false;
      const tagName = `test-escape-${testId}`;

      @element(tagName)
      class TestEscape extends HTMLElement {
        html() {
          return `<div class="modal" tabindex="0"></div>`;
        }

        @on('keydown:Escape', '.modal')
        onEscape() {
          escapeCalled = true;
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      const modal = el.shadowRoot.querySelector('.modal');
      
      // Should trigger on Escape key
      modal.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(escapeCalled).toBe(true);

      // Reset
      escapeCalled = false;

      // Should NOT trigger on Enter key
      modal.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(escapeCalled).toBe(false);
    });

    it('should handle arrow keys', async () => {
      let upCalled = false;
      let downCalled = false;
      let leftCalled = false;
      let rightCalled = false;
      const tagName = `test-arrows-${testId}`;

      @element(tagName)
      class TestArrows extends HTMLElement {
        html() {
          return `<div class="list" tabindex="0"></div>`;
        }

        @on('keydown:ArrowUp', '.list')
        onUp() { upCalled = true; }

        @on('keydown:ArrowDown', '.list')
        onDown() { downCalled = true; }

        @on('keydown:ArrowLeft', '.list')
        onLeft() { leftCalled = true; }

        @on('keydown:ArrowRight', '.list')
        onRight() { rightCalled = true; }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      const list = el.shadowRoot.querySelector('.list');
      
      list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
      expect(upCalled).toBe(true);
      expect(downCalled).toBe(false);

      list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(downCalled).toBe(true);

      list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
      expect(leftCalled).toBe(true);

      list.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      expect(rightCalled).toBe(true);
    });

    it('should handle space key with both " " and "Space" syntax', async () => {
      let spaceV1Called = false;
      let spaceV2Called = false;
      const tagName = `test-space-${testId}`;

      @element(tagName)
      class TestSpace extends HTMLElement {
        html() {
          return `
            <button class="btn1">Button 1</button>
            <button class="btn2">Button 2</button>
          `;
        }

        @on('keydown: ', '.btn1')  // Using actual space character
        onSpaceV1() {
          spaceV1Called = true;
        }

        @on('keydown:Space', '.btn2')  // Using "Space" string
        onSpaceV2() {
          spaceV2Called = true;
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      const btn1 = el.shadowRoot.querySelector('.btn1');
      const btn2 = el.shadowRoot.querySelector('.btn2');
      
      // Should trigger with actual space character
      btn1.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      expect(spaceV1Called).toBe(true);

      // Should trigger with "Space" mapping to space
      btn2.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      expect(spaceV2Called).toBe(true);

      // Reset
      spaceV1Called = false;
      spaceV2Called = false;

      // Should NOT trigger on Enter
      btn1.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      btn2.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(spaceV1Called).toBe(false);
      expect(spaceV2Called).toBe(false);
    });

    it('should handle Tab key', async () => {
      let tabCalled = false;
      let tabEvent: KeyboardEvent | null = null;
      const tagName = `test-tab-${testId}`;

      @element(tagName)
      class TestTab extends HTMLElement {
        html() {
          return `<input class="field">`;
        }

        @on('keydown:Tab', '.field')
        onTab(e: KeyboardEvent) {
          tabCalled = true;
          tabEvent = e;
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      const field = el.shadowRoot.querySelector('.field');
      
      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      field.dispatchEvent(event);
      expect(tabCalled).toBe(true);
      expect(tabEvent).toBe(event);
    });
  });

  describe('modifier key combinations', () => {
    it('should handle ctrl+Enter', async () => {
      let ctrlEnterCalled = 0;
      const tagName = `test-ctrl-enter-${testId}`;

      @element(tagName)
      class TestCtrlEnter extends HTMLElement {
        html() {
          return `<textarea class="editor"></textarea>`;
        }

        @on('keydown:ctrl+Enter', '.editor')
        onCtrlEnter() {
          ctrlEnterCalled++;
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      const editor = el.shadowRoot.querySelector('.editor');
      
      // Should trigger on Ctrl+Enter
      editor.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'Enter', 
        ctrlKey: true,
        bubbles: true 
      }));
      expect(ctrlEnterCalled).toBe(1);

      // Should NOT trigger on Enter alone
      editor.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'Enter', 
        ctrlKey: false,
        bubbles: true 
      }));
      expect(ctrlEnterCalled).toBe(1);

      // Should NOT trigger on Ctrl+Space
      editor.dispatchEvent(new KeyboardEvent('keydown', { 
        key: ' ', 
        ctrlKey: true,
        bubbles: true 
      }));
      expect(ctrlEnterCalled).toBe(1);
    });

    it('should handle shift+Tab', async () => {
      let shiftTabCalled = 0;
      const tagName = `test-shift-tab-${testId}`;

      @element(tagName)
      class TestShiftTab extends HTMLElement {
        html() {
          return `<input class="field">`;
        }

        @on('keydown:shift+Tab', '.field')
        onShiftTab() {
          shiftTabCalled++;
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      const field = el.shadowRoot.querySelector('.field');
      
      // Should trigger on Shift+Tab
      field.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'Tab', 
        shiftKey: true,
        bubbles: true 
      }));
      expect(shiftTabCalled).toBe(1);

      // Should NOT trigger on Tab alone
      field.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'Tab', 
        shiftKey: false,
        bubbles: true 
      }));
      expect(shiftTabCalled).toBe(1);
    });

    it('should handle alt+ArrowLeft', async () => {
      let altLeftCalled = 0;
      const tagName = `test-alt-left-${testId}`;

      @element(tagName)
      class TestAltLeft extends HTMLElement {
        html() {
          return `<div class="nav" tabindex="0"></div>`;
        }

        @on('keydown:alt+ArrowLeft', '.nav')
        onAltLeft() {
          altLeftCalled++;
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      const nav = el.shadowRoot.querySelector('.nav');
      
      // Should trigger on Alt+ArrowLeft
      nav.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'ArrowLeft', 
        altKey: true,
        bubbles: true 
      }));
      expect(altLeftCalled).toBe(1);

      // Should NOT trigger without Alt
      nav.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'ArrowLeft', 
        altKey: false,
        bubbles: true 
      }));
      expect(altLeftCalled).toBe(1);
    });

    it('should handle meta+k (Cmd+K on Mac)', async () => {
      let cmdKCalled = 0;
      const tagName = `test-cmd-k-${testId}`;

      @element(tagName)
      class TestCmdK extends HTMLElement {
        html() {
          return `<div class="app"></div>`;
        }

        @on('keydown:meta+k')
        onCmdK() {
          cmdKCalled++;
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      // Should trigger on Meta+K
      el.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'k', 
        metaKey: true,
        bubbles: true 
      }));
      expect(cmdKCalled).toBe(1);

      // Should NOT trigger on K alone
      el.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'k', 
        metaKey: false,
        bubbles: true 
      }));
      expect(cmdKCalled).toBe(1);
    });

    it('should handle cmd+s (alias for meta)', async () => {
      let saveCalled = 0;
      const tagName = `test-cmd-s-${testId}`;

      @element(tagName)
      class TestCmdS extends HTMLElement {
        html() {
          return `<div class="editor"></div>`;
        }

        @on('keydown:cmd+s', '.editor')
        onSave() {
          saveCalled++;
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      const editor = el.shadowRoot.querySelector('.editor');
      
      // Should trigger on Cmd+S (metaKey)
      editor.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 's', 
        metaKey: true,
        bubbles: true 
      }));
      expect(saveCalled).toBe(1);
    });

    it('should handle multiple modifiers ctrl+shift+p', async () => {
      let prefsCalled = 0;
      const tagName = `test-multi-mod-${testId}`;

      @element(tagName)
      class TestMultiMod extends HTMLElement {
        html() {
          return `<div class="app"></div>`;
        }

        @on('keydown:ctrl+shift+p', '.app')
        onPrefs() {
          prefsCalled++;
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      const app = el.shadowRoot.querySelector('.app');
      
      // Should trigger on Ctrl+Shift+P
      app.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'p', 
        ctrlKey: true,
        shiftKey: true,
        bubbles: true 
      }));
      expect(prefsCalled).toBe(1);

      // Should NOT trigger with only Ctrl+P
      app.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'p', 
        ctrlKey: true,
        shiftKey: false,
        bubbles: true 
      }));
      expect(prefsCalled).toBe(1);

      // Should NOT trigger with only Shift+P
      app.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'p', 
        ctrlKey: false,
        shiftKey: true,
        bubbles: true 
      }));
      expect(prefsCalled).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should work with keyup events', async () => {
      let keyupCalled = 0;
      const tagName = `test-keyup-${testId}`;

      @element(tagName)
      class TestKeyup extends HTMLElement {
        html() {
          return `<input class="input">`;
        }

        @on('keyup:Enter', '.input')
        onEnterUp() {
          keyupCalled++;
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      const input = el.shadowRoot.querySelector('.input');
      
      // Should work with keyup
      input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
      expect(keyupCalled).toBe(1);

      // Should NOT trigger on keydown
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(keyupCalled).toBe(1);
    });

    it('should be case sensitive for keys', async () => {
      let lowerACalled = 0;
      let upperACalled = 0;
      const tagName = `test-case-${testId}`;

      @element(tagName)
      class TestCase extends HTMLElement {
        html() {
          return `<input class="input">`;
        }

        @on('keydown:a', '.input')
        onLowerA() {
          lowerACalled++;
        }

        @on('keydown:A', '.input')
        onUpperA() {
          upperACalled++;
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      const input = el.shadowRoot.querySelector('.input');
      
      // Lowercase 'a'
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
      expect(lowerACalled).toBe(1);
      expect(upperACalled).toBe(0);

      // Uppercase 'A' (with Shift)
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'A', bubbles: true }));
      expect(lowerACalled).toBe(1);
      expect(upperACalled).toBe(1);
    });

    it('should not interfere with regular event handlers', async () => {
      let clickCalled = 0;
      let keydownCalled = 0;
      const tagName = `test-mixed-${testId}`;

      @element(tagName)
      class TestMixed extends HTMLElement {
        html() {
          return `<button class="btn">Click</button>`;
        }

        @on('click', '.btn')
        onClick() {
          clickCalled++;
        }

        @on('keydown', '.btn')
        onKeydown() {
          keydownCalled++;
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      const btn = el.shadowRoot.querySelector('.btn');
      
      // Click should work normally
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(clickCalled).toBe(1);

      // Regular keydown should work
      btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(keydownCalled).toBe(1);
    });

    it('should handle multiple handlers for same element', async () => {
      let enterCalled = 0;
      let escapeCalled = 0;
      let ctrlSCalled = 0;
      const tagName = `test-multiple-${testId}`;

      @element(tagName)
      class TestMultiple extends HTMLElement {
        html() {
          return `<textarea class="editor"></textarea>`;
        }

        @on('keydown:Enter', '.editor')
        onEnter() {
          enterCalled++;
        }

        @on('keydown:Escape', '.editor')
        onEscape() {
          escapeCalled++;
        }

        @on('keydown:ctrl+s', '.editor')
        onSave() {
          ctrlSCalled++;
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      const editor = el.shadowRoot.querySelector('.editor');
      
      // Each handler should work independently
      editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(enterCalled).toBe(1);
      expect(escapeCalled).toBe(0);
      expect(ctrlSCalled).toBe(0);

      editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(enterCalled).toBe(1);
      expect(escapeCalled).toBe(1);
      expect(ctrlSCalled).toBe(0);

      editor.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 's', 
        ctrlKey: true,
        bubbles: true 
      }));
      expect(enterCalled).toBe(1);
      expect(escapeCalled).toBe(1);
      expect(ctrlSCalled).toBe(1);
    });

    it('should work without selector (on host element)', async () => {
      let enterCalled = 0;
      const tagName = `test-host-${testId}`;

      @element(tagName)
      class TestHost extends HTMLElement {
        html() {
          return `<div>Content</div>`;
        }

        @on('keydown:Enter')
        onEnter() {
          enterCalled++;
        }
      }

      container.innerHTML = `<${tagName} tabindex="0"></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      // Should work on host element
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(enterCalled).toBe(1);
    });
  });

  describe('any modifiers matching with ~ prefix', () => {
    it('should trigger on key with or without modifiers when using ~', async () => {
      let exactEnterCalled = 0;
      let anyEnterCalled = 0;
      const tagName = `test-any-${testId}`;

      @element(tagName)
      class TestAny extends HTMLElement {
        html() {
          return `<input class="input">`;
        }

        @on('keydown:Enter', '.input')  // Default: exact match
        onExactEnter() {
          exactEnterCalled++;
        }

        @on('keydown:~Enter', '.input')  // With ~: any modifiers
        onAnyEnter() {
          anyEnterCalled++;
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      const input = el.shadowRoot.querySelector('.input');
      
      // Plain Enter - both should trigger
      input.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'Enter',
        bubbles: true 
      }));
      expect(exactEnterCalled).toBe(1);
      expect(anyEnterCalled).toBe(1);

      // Ctrl+Enter - only the ~ handler should trigger
      input.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'Enter',
        ctrlKey: true,
        bubbles: true 
      }));
      expect(exactEnterCalled).toBe(1); // Still 1
      expect(anyEnterCalled).toBe(2); // Now 2

      // Shift+Enter - only the ~ handler should trigger
      input.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'Enter',
        shiftKey: true,
        bubbles: true 
      }));
      expect(exactEnterCalled).toBe(1); // Still 1
      expect(anyEnterCalled).toBe(3); // Now 3
    });

    it('should work with ~ prefix for different keys', async () => {
      let anySpaceCalled = 0;
      let anyTabCalled = 0;
      const tagName = `test-any-keys-${testId}`;

      @element(tagName)
      class TestAnyKeys extends HTMLElement {
        html() {
          return `<input class="input">`;
        }

        @on('keydown:~ ', '.input')  // Space with any modifiers
        onAnySpace() {
          anySpaceCalled++;
        }

        @on('keydown:~Tab', '.input')
        onAnyTab() {
          anyTabCalled++;
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      const input = el.shadowRoot.querySelector('.input');
      
      // Plain space
      input.dispatchEvent(new KeyboardEvent('keydown', { 
        key: ' ',
        bubbles: true 
      }));
      expect(anySpaceCalled).toBe(1);

      // Ctrl+Space - should also trigger
      input.dispatchEvent(new KeyboardEvent('keydown', { 
        key: ' ',
        ctrlKey: true,
        bubbles: true 
      }));
      expect(anySpaceCalled).toBe(2); // Now 2

      // Plain Tab
      input.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'Tab',
        bubbles: true 
      }));
      expect(anyTabCalled).toBe(1);

      // Alt+Tab - should also trigger
      input.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'Tab',
        altKey: true,
        bubbles: true 
      }));
      expect(anyTabCalled).toBe(2); // Now 2
    });

    it('should allow combining exact, any, and modified handlers', async () => {
      let exactEnterCalled = 0;
      let anyEnterCalled = 0;
      let ctrlEnterCalled = 0;
      let shiftEnterCalled = 0;
      const tagName = `test-combined-${testId}`;

      @element(tagName)
      class TestCombined extends HTMLElement {
        html() {
          return `<textarea class="editor"></textarea>`;
        }

        @on('keydown:Enter', '.editor')  // Default: exact match
        onExactEnter() {
          exactEnterCalled++;
        }

        @on('keydown:~Enter', '.editor')  // Any modifiers
        onAnyEnter() {
          anyEnterCalled++;
        }

        @on('keydown:ctrl+Enter', '.editor')
        onCtrlEnter() {
          ctrlEnterCalled++;
        }

        @on('keydown:shift+Enter', '.editor')
        onShiftEnter() {
          shiftEnterCalled++;
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      const editor = el.shadowRoot.querySelector('.editor');
      
      // Plain Enter - exact and any handlers
      editor.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'Enter',
        bubbles: true 
      }));
      expect(exactEnterCalled).toBe(1);
      expect(anyEnterCalled).toBe(1);
      expect(ctrlEnterCalled).toBe(0);
      expect(shiftEnterCalled).toBe(0);

      // Ctrl+Enter - any and ctrl handlers
      editor.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'Enter',
        ctrlKey: true,
        bubbles: true 
      }));
      expect(exactEnterCalled).toBe(1); // No change
      expect(anyEnterCalled).toBe(2); // Incremented
      expect(ctrlEnterCalled).toBe(1);
      expect(shiftEnterCalled).toBe(0);

      // Shift+Enter - any and shift handlers
      editor.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'Enter',
        shiftKey: true,
        bubbles: true 
      }));
      expect(exactEnterCalled).toBe(1); // No change
      expect(anyEnterCalled).toBe(3); // Incremented
      expect(ctrlEnterCalled).toBe(1); // No change
      expect(shiftEnterCalled).toBe(1);

      // Ctrl+Shift+Enter - only any handler matches
      editor.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'Enter',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true 
      }));
      expect(exactEnterCalled).toBe(1); // No change
      expect(anyEnterCalled).toBe(4); // Incremented
      expect(ctrlEnterCalled).toBe(1); // No change
      expect(shiftEnterCalled).toBe(1); // No change
    });
  });

  describe('event object access', () => {
    it('should pass event object to handler', async () => {
      let receivedEvent: KeyboardEvent | null = null;
      const tagName = `test-event-${testId}`;

      @element(tagName)
      class TestEvent extends HTMLElement {
        html() {
          return `<input class="input">`;
        }

        @on('keydown:Enter', '.input')
        onEnter(e: KeyboardEvent) {
          receivedEvent = e;
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      const input = el.shadowRoot.querySelector('.input');
      const event = new KeyboardEvent('keydown', { 
        key: 'Enter',
        bubbles: true,
        cancelable: true
      });
      
      input.dispatchEvent(event);
      
      expect(receivedEvent).toBe(event);
      expect(receivedEvent?.key).toBe('Enter');
    });

    it('should allow preventDefault in handler', async () => {
      let submitCalled = false;
      const tagName = `test-prevent-${testId}`;

      @element(tagName)
      class TestPrevent extends HTMLElement {
        html() {
          return `<form><input class="input"></form>`;
        }

        @on('keydown:Enter', '.input')
        onEnter(e: KeyboardEvent) {
          e.preventDefault();
          submitCalled = true;
        }
      }

      container.innerHTML = `<${tagName}></${tagName}>`;
      const el = container.querySelector(tagName) as any;
      await el.ready;

      const input = el.shadowRoot.querySelector('.input');
      const event = new KeyboardEvent('keydown', { 
        key: 'Enter',
        bubbles: true,
        cancelable: true
      });
      
      input.dispatchEvent(event);
      
      expect(submitCalled).toBe(true);
      expect(event.defaultPrevented).toBe(true);
    });
  });
});