import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { element, property, render, html } from '../src/index';

// Test component with keyboard shortcuts
@element('keyboard-test')
class KeyboardTest extends HTMLElement {
  @property()
  lastKey = '';

  @render()
  renderContent() {
    return html`
      <input
        class="plain-enter"
        @keydown.enter=${this.handlePlainEnter}
      />
      <input
        class="ctrl-s"
        @keydown.ctrl+s=${this.handleCtrlS}
      />
      <input
        class="ctrl-shift-s"
        @keydown.ctrl+shift+s=${this.handleCtrlShiftS}
      />
      <input
        class="any-enter"
        @keydown.~enter=${this.handleAnyEnter}
      />
      <input
        class="escape"
        @keydown.escape=${this.handleEscape}
      />
      <input
        class="arrow-down"
        @keydown.down=${this.handleArrowDown}
      />
      <div class="result">${this.lastKey}</div>
    `;
  }

  handlePlainEnter() {
    this.lastKey = 'plain-enter';
  }

  handleCtrlS(e: KeyboardEvent) {
    e.preventDefault();
    this.lastKey = 'ctrl-s';
  }

  handleCtrlShiftS(e: KeyboardEvent) {
    e.preventDefault();
    this.lastKey = 'ctrl-shift-s';
  }

  handleAnyEnter() {
    this.lastKey = 'any-enter';
  }

  handleEscape() {
    this.lastKey = 'escape';
  }

  handleArrowDown() {
    this.lastKey = 'arrow-down';
  }
}

describe('Keyboard Shortcuts', () => {
  let el: KeyboardTest;

  beforeEach(async () => {
    el = document.createElement('keyboard-test') as KeyboardTest;
    document.body.appendChild(el);
    await (el as any).ready;
  });

  afterEach(() => {
    el.remove();
  });

  it('should handle plain enter key (no modifiers)', async () => {
    const input = el.shadowRoot?.querySelector('.plain-enter') as HTMLInputElement;

    // Plain Enter should trigger
    input.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true
    }));
    expect(el.lastKey).toBe('plain-enter');

    // Enter with Ctrl should NOT trigger
    el.lastKey = '';
    input.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter',
      ctrlKey: true,
      bubbles: true
    }));
    expect(el.lastKey).toBe('');

    // Enter with Shift should NOT trigger
    el.lastKey = '';
    input.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter',
      shiftKey: true,
      bubbles: true
    }));
    expect(el.lastKey).toBe('');
  });

  it('should handle ctrl+s keyboard shortcut', async () => {
    const input = el.shadowRoot?.querySelector('.ctrl-s') as HTMLInputElement;

    // Ctrl+S should trigger
    input.dispatchEvent(new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true
    }));
    expect(el.lastKey).toBe('ctrl-s');

    // Plain S should NOT trigger
    el.lastKey = '';
    input.dispatchEvent(new KeyboardEvent('keydown', {
      key: 's',
      bubbles: true
    }));
    expect(el.lastKey).toBe('');

    // Ctrl+Shift+S should NOT trigger (different combination)
    el.lastKey = '';
    input.dispatchEvent(new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true
    }));
    expect(el.lastKey).toBe('');
  });

  it('should handle ctrl+shift+s keyboard shortcut', async () => {
    const input = el.shadowRoot?.querySelector('.ctrl-shift-s') as HTMLInputElement;

    // Ctrl+Shift+S should trigger
    input.dispatchEvent(new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true
    }));
    expect(el.lastKey).toBe('ctrl-shift-s');

    // Ctrl+S should NOT trigger
    el.lastKey = '';
    input.dispatchEvent(new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true
    }));
    expect(el.lastKey).toBe('');
  });

  it('should handle enter with any modifiers using ~ prefix', async () => {
    const input = el.shadowRoot?.querySelector('.any-enter') as HTMLInputElement;

    // Plain Enter should trigger
    input.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true
    }));
    expect(el.lastKey).toBe('any-enter');

    // Enter with Ctrl should also trigger
    el.lastKey = '';
    input.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter',
      ctrlKey: true,
      bubbles: true
    }));
    expect(el.lastKey).toBe('any-enter');

    // Enter with any modifiers should trigger
    el.lastKey = '';
    input.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter',
      ctrlKey: true,
      shiftKey: true,
      altKey: true,
      bubbles: true
    }));
    expect(el.lastKey).toBe('any-enter');
  });

  it('should handle escape key', async () => {
    const input = el.shadowRoot?.querySelector('.escape') as HTMLInputElement;

    input.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true
    }));
    expect(el.lastKey).toBe('escape');
  });

  it('should handle arrow keys', async () => {
    const input = el.shadowRoot?.querySelector('.arrow-down') as HTMLInputElement;

    input.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true
    }));
    expect(el.lastKey).toBe('arrow-down');
  });

  it('should normalize key aliases', async () => {
    // Test that 'down' normalizes to 'ArrowDown'
    const input = el.shadowRoot?.querySelector('.arrow-down') as HTMLInputElement;

    input.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true
    }));
    expect(el.lastKey).toBe('arrow-down');
  });
});
