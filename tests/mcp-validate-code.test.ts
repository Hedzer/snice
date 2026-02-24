import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';
import { join } from 'path';

// Helper to call MCP server's validate_code tool
async function validateCode(code: string): Promise<{ issues: string[], text: string }> {
  return new Promise((resolve, reject) => {
    const mcp = spawn('node', [join(process.cwd(), 'bin/mcp-server.js')], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    mcp.stdout.on('data', (data) => {
      output += data.toString();
    });

    // Initialize
    mcp.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {}
    }) + '\n');

    // Call validate_code
    setTimeout(() => {
      mcp.stdin.write(JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'validate_code',
          arguments: { code }
        }
      }) + '\n');

      setTimeout(() => {
        mcp.kill();
        const lines = output.trim().split('\n');
        const lastResponse = JSON.parse(lines[lines.length - 1]);
        const text = lastResponse.result?.content?.[0]?.text || '';
        const issues = text.includes('No issues found') ? [] : text.split('\n').filter((l: string) => l.startsWith('['));
        resolve({ issues, text });
      }, 100);
    }, 100);

    mcp.on('error', reject);
  });
}

describe('MCP validate_code tool', () => {
  describe('@state() detection', () => {
    it('should warn against @state() usage', async () => {
      const { text } = await validateCode(`
        @element('my-el')
        class MyEl extends HTMLElement {
          @state() count = 0;
        }
      `);
      expect(text).toContain('@state() does not exist');
      expect(text).toContain('@property()');
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
    it('should warn against async guards in Router config', async () => {
      const { text } = await validateCode(`
        Router({
          type: 'hash',
          guards: [async (ctx) => ctx.isLoggedIn]
        });
      `);
      expect(text).toContain('Async guards');
      expect(text).toContain('NOT supported');
    });

    it('should warn against async function guards', async () => {
      const { text } = await validateCode(`
        async function isAuthenticated(ctx) {
          return ctx.isLoggedIn;
        }
      `);
      expect(text).toContain('Async guards');
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
    it('should warn against reflect: true', async () => {
      const { text } = await validateCode(`
        @property({ reflect: true }) active = false;
      `);
      expect(text).toContain('reflect');
      expect(text).toContain('Lit concept');
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
        import { SniceButton } from '../components/button/snice-button';

        @controller('my-ctrl')
        class MyController {}
      `);
      expect(text).toContain('.types.ts');
      expect(text).toContain('circular dependencies');
    });

    it('should pass when importing from .types.ts', async () => {
      const { text } = await validateCode(`
        import type { SniceButtonElement } from '../components/button/snice-button.types';

        @controller('my-ctrl')
        class MyController {}
      `);
      expect(text).not.toContain('circular dependencies');
    });

    it('should warn for Controller class pattern', async () => {
      const { text } = await validateCode(`
        import { SniceInput } from '../components/input/snice-input';

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
