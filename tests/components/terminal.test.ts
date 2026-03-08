import { describe, it, expect, afterEach, vi } from 'vitest';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../components/terminal/snice-terminal';
import type { SniceTerminalElement } from '../../components/terminal/snice-terminal.types';

describe('snice-terminal', () => {
  let terminal: SniceTerminalElement;

  afterEach(() => {
    if (terminal) {
      removeComponent(terminal as HTMLElement);
    }
  });

  describe('basic functionality', () => {
    it('should render terminal element', async () => {
      terminal = await createComponent<SniceTerminalElement>('snice-terminal');
      expect(terminal).toBeTruthy();
      expect(terminal.tagName).toBe('SNICE-TERMINAL');
    });

    it('should have default properties', async () => {
      terminal = await createComponent<SniceTerminalElement>('snice-terminal');
      expect(terminal.prompt).toBe('$ ');
      expect(terminal.cwd).toBe('~');
      expect(terminal.readonly).toBe(false);
      expect(terminal.maxLines).toBe(1000);
      expect(terminal.showTimestamps).toBe(false);
    });

    it('should render terminal container in shadow DOM', async () => {
      terminal = await createComponent<SniceTerminalElement>('snice-terminal');
      await wait(10);
      const container = queryShadow(terminal as HTMLElement, '.terminal-container');
      expect(container).toBeTruthy();
    });

    it('should render input when not readonly', async () => {
      terminal = await createComponent<SniceTerminalElement>('snice-terminal');
      await wait(10);
      const input = queryShadow(terminal as HTMLElement, '.terminal-input');
      expect(input).toBeTruthy();
    });

    it('should not render input when readonly', async () => {
      terminal = await createComponent<SniceTerminalElement>('snice-terminal', { readonly: true });
      await wait(10);
      const input = queryShadow(terminal as HTMLElement, '.terminal-input');
      expect(input).toBeFalsy();
    });
  });

  describe('terminal-ready event (@ready lifecycle)', () => {
    it('should dispatch terminal-ready event after initial render', async () => {
      const readyPromise = new Promise<CustomEvent>(resolve => {
        document.addEventListener('terminal-ready', (e) => resolve(e as CustomEvent), { once: true });
      });

      terminal = await createComponent<SniceTerminalElement>('snice-terminal');
      const event = await readyPromise;
      expect(event).toBeTruthy();
      expect(event.type).toBe('terminal-ready');
    });
  });

  describe('write methods', () => {
    it('should write output lines', async () => {
      terminal = await createComponent<SniceTerminalElement>('snice-terminal');
      await wait(10);

      terminal.writeln('Hello, World!');
      await wait(10);

      const lines = (terminal as HTMLElement).shadowRoot!.querySelectorAll('.terminal-line');
      expect(lines.length).toBe(1);
      expect(lines[0].classList.contains('output')).toBe(true);
    });

    it('should write error lines', async () => {
      terminal = await createComponent<SniceTerminalElement>('snice-terminal');
      await wait(10);

      terminal.writeError('Something went wrong');
      await wait(10);

      const lines = (terminal as HTMLElement).shadowRoot!.querySelectorAll('.terminal-line');
      expect(lines.length).toBe(1);
      expect(lines[0].classList.contains('error')).toBe(true);
    });

    it('should write multiple lines', async () => {
      terminal = await createComponent<SniceTerminalElement>('snice-terminal');
      await wait(10);

      terminal.writeLines([
        { content: 'Line 1' },
        { content: 'Line 2', type: 'info' },
        { content: 'Line 3', type: 'error' }
      ]);
      await wait(10);

      const lines = (terminal as HTMLElement).shadowRoot!.querySelectorAll('.terminal-line');
      expect(lines.length).toBe(3);
    });

    it('should clear all lines', async () => {
      terminal = await createComponent<SniceTerminalElement>('snice-terminal');
      await wait(10);

      terminal.writeln('Line 1');
      terminal.writeln('Line 2');
      await wait(10);

      terminal.clear();
      await wait(10);

      const lines = (terminal as HTMLElement).shadowRoot!.querySelectorAll('.terminal-line');
      expect(lines.length).toBe(0);
    });

    it('should enforce maxLines limit', async () => {
      terminal = await createComponent<SniceTerminalElement>('snice-terminal', { 'max-lines': 3 });
      await wait(10);

      for (let i = 0; i < 5; i++) {
        terminal.writeln(`Line ${i}`);
      }
      await wait(10);

      const lines = (terminal as HTMLElement).shadowRoot!.querySelectorAll('.terminal-line');
      expect(lines.length).toBeLessThanOrEqual(3);
    });
  });

  describe('command history', () => {
    it('should return empty history initially', async () => {
      terminal = await createComponent<SniceTerminalElement>('snice-terminal');
      expect(terminal.getHistory()).toEqual([]);
    });

    it('should clear history', async () => {
      terminal = await createComponent<SniceTerminalElement>('snice-terminal');
      terminal.clearHistory();
      expect(terminal.getHistory()).toEqual([]);
    });
  });

  describe('scroll behavior (rAF for scroll-to-bottom)', () => {
    it('should scroll output to bottom after writing', async () => {
      terminal = await createComponent<SniceTerminalElement>('snice-terminal');
      await wait(10);

      // Write enough lines to cause scrolling
      for (let i = 0; i < 50; i++) {
        terminal.writeln(`Line ${i}`);
      }

      // Wait for rAF to fire and scroll
      await new Promise(resolve => requestAnimationFrame(resolve));
      await wait(10);

      const output = queryShadow(terminal as HTMLElement, '.terminal-output') as HTMLDivElement;
      if (output && output.scrollHeight > output.clientHeight) {
        // scrollTop should be near the bottom
        expect(output.scrollTop).toBeGreaterThan(0);
      }
    });
  });

  describe('prompt customization', () => {
    it('should accept custom prompt', async () => {
      terminal = await createComponent<SniceTerminalElement>('snice-terminal', { prompt: '> ' });
      await wait(10);

      const prompt = queryShadow(terminal as HTMLElement, '.terminal-prompt');
      expect(prompt?.textContent).toBe('> ');
    });
  });
});
