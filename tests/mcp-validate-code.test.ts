import { describe, it, expect, vi } from 'vitest';
import { spawn } from 'child_process';

// Each test spawns a node MCP-server process; under full-suite CPU
// saturation the default 5s deadline flakes. Generous ceiling, same
// philosophy as the repo-wide -timeout guidance.
vi.setConfig({ testTimeout: 30_000 });
import { join } from 'path';

// Helper to call MCP server's validate_code tool
async function validateCode(code: string): Promise<{ issues: string[], text: string }> {
  return new Promise((resolve, reject) => {
    const mcp = spawn('node', [join(process.cwd(), 'bin/mcp-server.js')], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let settled = false;
    const finish = (error?: Error, response?: any) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      mcp.kill();
      if (error) {
        reject(error);
        return;
      }
      const text = response?.result?.content?.[0]?.text || '';
      const issues = text.includes('No issues found') ? [] : text.split('\n').filter((l: string) => l.startsWith('['));
      resolve({ issues, text });
    };

    const deadline = setTimeout(() => {
      finish(new Error(`MCP validate_code did not respond. stdout: ${output}`));
    }, 10_000);

    mcp.stdout.on('data', (data) => {
      output += data.toString();
      const lines = output.split('\n');
      output = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const response = JSON.parse(line);
          if (response.id === 2) finish(undefined, response);
        } catch (error) {
          finish(error as Error);
        }
      }
    });

    // Initialize
    mcp.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {}
    }) + '\n');

    // The stdio protocol is ordered, so this request can follow initialization
    // immediately. Resolve from the response itself instead of a timing guess.
    mcp.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'validate_code',
        arguments: { code }
      }
    }) + '\n');

    mcp.on('error', error => finish(error));
    mcp.on('exit', code => {
      if (!settled && code !== null) finish(new Error(`MCP server exited with code ${code}`));
    });
  });
}

describe('MCP validate_code tool', () => {
  describe('@state() support', () => {
    it('accepts @state() for reactive internal fields', async () => {
      const { text } = await validateCode(`
        @element('my-el')
        class MyEl extends HTMLElement {
          @state() count = 0;
        }
      `);
      expect(text).not.toContain('@state() does not exist');
      expect(text).toContain('No issues found');
    });

    it('should pass when using @property()', async () => {
      const { text } = await validateCode(`
        @element('my-el')
        class MyEl extends HTMLElement {
          @property() count = 0;
        }
      `);
      expect(text).not.toContain('@state()');
    });
  });

  describe('camelCase event names', () => {
    it('should warn against camelCase in @dispatch', async () => {
      const { text } = await validateCode(`
        @dispatch('statusChanged')
        updateStatus() {}
      `);
      expect(text).toContain('camelCase');
      expect(text).toContain('kebab-case');
    });

    it('should pass kebab-case events', async () => {
      const { text } = await validateCode(`
        @dispatch('status-changed')
        updateStatus() {}
      `);
      expect(text).not.toContain('camelCase');
    });
  });

  describe('component import syntax', () => {
    it('should warn against curly brace imports from snice/components', async () => {
      const { text } = await validateCode(`
        import { Button } from 'snice/components/button';
      `);
      expect(text).toContain('Wrong import syntax');
      expect(text).toContain('side-effect import');
    });
  });

  describe('experimentalDecorators', () => {
    it('should warn when experimentalDecorators is true', async () => {
      const { text } = await validateCode(`
        // tsconfig: experimentalDecorators: true
      `);
      expect(text).toContain('experimentalDecorators must be false');
    });
  });

  describe('property type hints', () => {
    it('should warn about non-string properties without type', async () => {
      const { text } = await validateCode(`
        @property() count = 0;
      `);
      expect(text).toContain('type hint');
    });

    it('should pass typed properties', async () => {
      const { text } = await validateCode(`
        @property({ type: Number }) count = 0;
      `);
      expect(text).not.toContain('type hint');
    });
  });

  describe('innerHTML assignment', () => {
    it('should warn against direct innerHTML', async () => {
      const { text } = await validateCode(`
        this.innerHTML = '<div>test</div>';
      `);
      expect(text).toContain('innerHTML');
      expect(text).toContain('@render()');
    });

    it('should warn against shadowRoot.innerHTML', async () => {
      const { text } = await validateCode(`
        this.shadowRoot.innerHTML = '<div>test</div>';
      `);
      expect(text).toContain('innerHTML');
    });
  });

  describe('connectedCallback', () => {
    it('should warn about connectedCallback without super', async () => {
      const { text } = await validateCode(`
        connectedCallback() {
          this.init();
        }
      `);
      expect(text).toContain('connectedCallback');
      expect(text).toContain('@ready()');
    });
  });

  describe('addEventListener', () => {
    it('should suggest @on() decorator', async () => {
      const { text } = await validateCode(`
        this.addEventListener('click', handler);
      `);
      expect(text).toContain('@on()');
    });
  });

  describe('Event type in handlers', () => {
    it('should warn about Event instead of CustomEvent', async () => {
      const { text } = await validateCode(`
        @on('click', 'button')
        handleClick(e: Event) {}
      `);
      expect(text).toContain('CustomEvent');
    });
  });

  describe('Lit syntax detection', () => {
    it('should warn against @customElement', async () => {
      const { text } = await validateCode(`
        @customElement('my-el')
        class MyEl extends LitElement {}
      `);
      expect(text).toContain('@customElement()');
      expect(text).toContain('@element()');
    });

    it('should warn against extending LitElement', async () => {
      const { text } = await validateCode(`
        class MyEl extends LitElement {}
      `);
      expect(text).toContain('LitElement');
      expect(text).toContain('HTMLElement');
    });

    it('should warn against lit imports', async () => {
      const { text } = await validateCode(`
        import { html } from 'lit';
      `);
      expect(text).toContain('lit');
      expect(text).toContain('snice');
    });
  });

  describe('page import', () => {
    it('should warn against importing page from snice', async () => {
      const { text } = await validateCode(`
        import { page } from 'snice';
      `);
      expect(text).toContain('page');
      expect(text).toContain('Router()');
    });
  });

  describe('Router config', () => {
    it('should warn when Router lacks type property', async () => {
      const { text } = await validateCode(`
        const router = Router({
          outlet: '#app'
        });
      `);
      expect(text).toContain('type');
      expect(text).toContain('hash');
    });

    it('should pass when Router has type', async () => {
      const { text } = await validateCode(`
        const router = Router({
          type: 'hash',
          outlet: '#app'
        });
      `);
      expect(text).not.toContain("requires type:");
    });
  });

  describe('async guards', () => {
    it('accepts async guards in Router config', async () => {
      const { text } = await validateCode(`
        Router({
          type: 'hash',
          guards: [async (ctx) => ctx.isLoggedIn]
        });
      `);
      expect(text).not.toContain('Async guards');
    });

    it('accepts async function guards', async () => {
      const { text } = await validateCode(`
        async function isAuthenticated(ctx) {
          return ctx.isLoggedIn;
        }
      `);
      expect(text).not.toContain('Async guards');
    });
  });

  describe('Context generic', () => {
    it('should warn against Context<T> generic usage', async () => {
      const { text } = await validateCode(`
        function handleCtx(ctx: Context<MyApp>) {}
      `);
      expect(text).toContain('NOT generic');
    });
  });

  describe('property reflect option', () => {
    it('accepts reflect options', async () => {
      const { text } = await validateCode(`
        @property({ reflect: true }) active = false;
      `);
      expect(text).not.toContain('does not have a reflect option');
      expect(text).toContain('No issues found');
    });
  });

  describe('@observe syntax', () => {
    it('should warn against function-based @observe', async () => {
      const { text } = await validateCode(`
        @observe(() => this.items, { })
        onItemsChange() {}
      `);
      expect(text).toContain('@observe');
      expect(text).toContain('string-based');
    });
  });

  describe('Context import from router', () => {
    it('should warn against importing Context from router file', async () => {
      const { text } = await validateCode(`
        import { Context } from './router';
      `);
      expect(text).toContain('Context');
      expect(text).toContain('@context()');
    });
  });

  describe('fetch in elements', () => {
    it('should warn against fetch() in @element', async () => {
      const { text } = await validateCode(`
        @element('my-el')
        class MyEl extends HTMLElement {
          async load() {
            const data = await fetch('/api/data');
          }
        }
      `);
      expect(text).toContain('fetch');
      expect(text).toContain('pages');
    });

    it('should not warn about fetch in @page', async () => {
      const { text } = await validateCode(`
        @page({ routes: ['/'] })
        class HomePage extends HTMLElement {
          async load() {
            const data = await fetch('/api/data');
          }
        }
      `);
      expect(text).not.toContain('Elements should be purely visual');
    });
  });

  describe('property decorator without @', () => {
    it('should warn about missing @ on property', async () => {
      const { text } = await validateCode(`
        property({ type: Number }) count = 0;
      `);
      expect(text).toContain('Missing @');
    });
  });

  describe('controller imports from .types.ts', () => {
    it('should warn when controller imports from component file', async () => {
      const { text } = await validateCode(`
        import { SniceButton } from '../packages/components/src/button/snice-button';

        @controller('my-ctrl')
        class MyController {}
      `);
      expect(text).toContain('.types.ts');
      expect(text).toContain('circular dependencies');
    });

    it('should pass when importing from .types.ts', async () => {
      const { text } = await validateCode(`
        import type { SniceButtonElement } from '../packages/components/src/button/snice-button.types';

        @controller('my-ctrl')
        class MyController {}
      `);
      expect(text).not.toContain('circular dependencies');
    });

    it('should warn for Controller class pattern', async () => {
      const { text } = await validateCode(`
        import { SniceInput } from '../packages/components/src/input/snice-input';

        class FormController {
          validate() {}
        }
      `);
      expect(text).toContain('.types.ts');
    });
  });

  describe('valid code', () => {
    it('should pass valid snice code', async () => {
      const { text } = await validateCode(`
        import { element, property, render, html, css, styles } from 'snice';

        @element('user-card')
        class UserCard extends HTMLElement {
          @property() name = '';
          @property({ type: Number }) age = 0;

          @styles()
          styles() {
            return css\`:host { display: block; }\`;
          }

          @render()
          template() {
            return html\`<div>\${this.name}</div>\`;
          }
        }
      `);
      expect(text).toContain('No issues found');
    });
  });
});
