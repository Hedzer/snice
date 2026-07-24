import { describe, it, expect, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createComponent, removeComponent, queryShadow, wait } from './test-utils';
import '../../packages/components/src/terminal/snice-terminal';
import type { SniceTerminalElement } from '../../packages/components/src/terminal/snice-terminal.types';

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

  describe('streaming API (appendChunk / pipeFrom)', () => {
    it('appendChunk holds tail without newline as a single live line', async () => {
      terminal = await createComponent<SniceTerminalElement>('snice-terminal');
      await wait(10);
      terminal.appendChunk('hello');
      await wait(10);
      const lines = (terminal as HTMLElement).shadowRoot!.querySelectorAll('.terminal-line');
      expect(lines.length).toBe(1);
      expect(lines[0].textContent?.trim()).toContain('hello');
    });

    it('subsequent appendChunk updates the same live line until newline arrives', async () => {
      terminal = await createComponent<SniceTerminalElement>('snice-terminal');
      await wait(10);
      terminal.appendChunk('hel');
      terminal.appendChunk('lo wor');
      terminal.appendChunk('ld');
      await wait(10);
      const lines = (terminal as HTMLElement).shadowRoot!.querySelectorAll('.terminal-line');
      expect(lines.length).toBe(1);
      expect(lines[0].textContent?.trim()).toContain('hello world');
    });

    it('newline in chunk commits the live line and starts a new one', async () => {
      terminal = await createComponent<SniceTerminalElement>('snice-terminal');
      await wait(10);
      terminal.appendChunk('first\n');
      terminal.appendChunk('second');
      await wait(10);
      const lines = (terminal as HTMLElement).shadowRoot!.querySelectorAll('.terminal-line');
      expect(lines.length).toBe(2);
      expect(lines[0].textContent?.trim()).toContain('first');
      expect(lines[1].textContent?.trim()).toContain('second');
    });

    it('multi-newline chunks split into one line each', async () => {
      terminal = await createComponent<SniceTerminalElement>('snice-terminal');
      await wait(10);
      terminal.appendChunk('a\nb\nc\n');
      await wait(10);
      const lines = (terminal as HTMLElement).shadowRoot!.querySelectorAll('.terminal-line');
      expect(lines.length).toBe(3);
    });

    it('pipeFrom consumes an AsyncIterable<string>', async () => {
      terminal = await createComponent<SniceTerminalElement>('snice-terminal');
      await wait(10);
      async function* gen() {
        yield 'one\n';
        yield 'two';
        yield ' tail\n';
      }
      await terminal.pipeFrom(gen());
      await wait(10);
      const lines = (terminal as HTMLElement).shadowRoot!.querySelectorAll('.terminal-line');
      expect(lines.length).toBe(2);
      expect(lines[0].textContent?.trim()).toContain('one');
      expect(lines[1].textContent?.trim()).toContain('two tail');
    });

    it('pipeFrom consumes a ReadableStream<string>', async () => {
      terminal = await createComponent<SniceTerminalElement>('snice-terminal');
      await wait(10);
      const stream = new ReadableStream<string>({
        start(controller) {
          controller.enqueue('alpha\n');
          controller.enqueue('beta\n');
          controller.close();
        }
      });
      await terminal.pipeFrom(stream);
      await wait(10);
      const lines = (terminal as HTMLElement).shadowRoot!.querySelectorAll('.terminal-line');
      expect(lines.length).toBe(2);
    });

    it('appendChunk does not allocate a new lines array per call (perf guard)', async () => {
      terminal = await createComponent<SniceTerminalElement>('snice-terminal');
      await wait(10);
      // Internally `lines` is a private field; we just sanity-check that
      // pushing many chunks does not regress beyond a reasonable budget.
      const start = performance.now();
      for (let i = 0; i < 1000; i++) terminal.appendChunk(`line ${i}\n`);
      const elapsed = performance.now() - start;
      // Generous bound — happy-dom is slow but this should still finish well
      // under a second; the previous spread-copy implementation regressed here.
      expect(elapsed).toBeLessThan(2000);
    });

    it('clear() resets live-line state', async () => {
      terminal = await createComponent<SniceTerminalElement>('snice-terminal');
      await wait(10);
      terminal.appendChunk('partial without newline');
      terminal.clear();
      terminal.appendChunk('fresh\n');
      await wait(10);
      const lines = (terminal as HTMLElement).shadowRoot!.querySelectorAll('.terminal-line');
      expect(lines.length).toBe(1);
      expect(lines[0].textContent?.trim()).toContain('fresh');
    });
  });
  describe('stylesheet contracts', () => {
    const cssPath = resolve(process.cwd(), 'packages/components/src/terminal/snice-terminal.css');

    it('should provide a fallback for every --snice-* variable reference', () => {
      const css = readFileSync(cssPath, 'utf8');
      const missing = css.match(/var\(\s*--snice-[a-z0-9-]+\s*\)/g) ?? [];
      expect(missing).toEqual([]);
    });

    it('should handle prefers-reduced-motion without the theme loaded', () => {
      const css = readFileSync(cssPath, 'utf8');
      expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    });
  });
});
