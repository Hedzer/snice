#!/usr/bin/env node
/**
 * Snice MCP Server
 * Local Model Context Protocol server for AI-assisted snice development
 *
 * Usage: npx snice mcp
 *
 * Connect in Claude Code via: claude mcp add snice -- npx snice mcp
 */

import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync, readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load component docs from docs/ai/components
function loadComponentDocs() {
  const docsDir = join(__dirname, '..', 'docs', 'ai', 'components');
  const components = {};

  if (existsSync(docsDir)) {
    for (const file of readdirSync(docsDir)) {
      if (file.endsWith('.md')) {
        const name = file.replace('.md', '');
        const content = readFileSync(join(docsDir, file), 'utf-8');
        components[name] = content;
      }
    }
  }
  return components;
}

// Load decorator docs
function loadDecoratorDocs() {
  const docsPath = join(__dirname, '..', 'docs', 'ai', 'decorators.md');
  if (existsSync(docsPath)) {
    return readFileSync(docsPath, 'utf-8');
  }
  return null;
}

// Load README
function loadReadme() {
  const readmePath = join(__dirname, '..', 'docs', 'ai', 'README.md');
  if (existsSync(readmePath)) {
    return readFileSync(readmePath, 'utf-8');
  }
  return null;
}

const COMPONENT_DOCS = loadComponentDocs();
const DECORATOR_DOCS = loadDecoratorDocs();
const README = loadReadme();

// MCP Tools
const TOOLS = [
  {
    name: 'list_components',
    description: 'List all available snice UI components with brief descriptions',
    inputSchema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'get_component_docs',
    description: 'Get full documentation for a specific snice component including properties, methods, events, and examples',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Component name (e.g., button, input, modal, alert, card)' }
      },
      required: ['name']
    }
  },
  {
    name: 'get_decorator_docs',
    description: 'Get documentation for snice decorators (@element, @property, @render, @on, etc.)',
    inputSchema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'get_overview',
    description: 'Get an overview of the snice framework - what it is, how it works, key concepts',
    inputSchema: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'generate_component',
    description: 'Generate a snice component scaffold with the specified name and properties',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Component name in kebab-case (e.g., user-card, product-list)' },
        properties: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['string', 'number', 'boolean', 'array', 'object'] },
              default: { type: 'string' }
            },
            required: ['name']
          },
          description: 'Component properties'
        },
        withStyles: { type: 'boolean', description: 'Include @styles decorator', default: true },
        withEvents: { type: 'array', items: { type: 'string' }, description: 'Custom events to dispatch' }
      },
      required: ['name']
    }
  },
  {
    name: 'search_docs',
    description: 'Search snice documentation for a keyword or concept',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' }
      },
      required: ['query']
    }
  },
  {
    name: 'validate_code',
    description: 'Validate snice component code for common mistakes and pitfalls',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'TypeScript/JavaScript component code to validate' }
      },
      required: ['code']
    }
  }
];

// Tool handlers
function handleTool(name, args) {
  switch (name) {
    case 'list_components': {
      const list = Object.keys(COMPONENT_DOCS).map(name => {
        const doc = COMPONENT_DOCS[name];
        const firstLine = doc.split('\n').find(l => l.startsWith('#'))?.replace(/^#+\s*/, '') || name;
        return `- snice-${name}: ${firstLine}`;
      }).join('\n');
      return { content: [{ type: 'text', text: `# Available Snice Components\n\n${list}\n\nUse get_component_docs to get full documentation for any component.` }] };
    }

    case 'get_component_docs': {
      const name = args.name?.toLowerCase().replace('snice-', '');
      const doc = COMPONENT_DOCS[name];
      if (!doc) {
        const available = Object.keys(COMPONENT_DOCS).join(', ');
        return { content: [{ type: 'text', text: `Component "${name}" not found.\n\nAvailable: ${available}` }] };
      }
      return { content: [{ type: 'text', text: doc }] };
    }

    case 'get_decorator_docs': {
      if (!DECORATOR_DOCS) {
        return { content: [{ type: 'text', text: 'Decorator documentation not found.' }] };
      }
      return { content: [{ type: 'text', text: DECORATOR_DOCS }] };
    }

    case 'get_overview': {
      if (!README) {
        return { content: [{ type: 'text', text: 'Overview documentation not found.' }] };
      }
      return { content: [{ type: 'text', text: README }] };
    }

    case 'generate_component': {
      const { name, properties = [], withStyles = true, withEvents = [] } = args;
      const className = name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('');

      const propLines = properties.map(p => {
        const type = p.type || 'string';
        const typeMap = { string: 'String', number: 'Number', boolean: 'Boolean', array: 'Array', object: 'Object' };
        const defaultVal = p.default ?? (type === 'string' ? "''" : type === 'number' ? '0' : type === 'boolean' ? 'false' : type === 'array' ? '[]' : '{}');
        return `  @property({ type: ${typeMap[type] || 'String'} }) ${p.name} = ${defaultVal};`;
      }).join('\n');

      const eventMethods = withEvents.map(event => {
        const methodName = 'emit' + event.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('');
        return `
  @dispatch('${event}')
  ${methodName}(data?: unknown) {
    return data;
  }`;
      }).join('\n');

      const code = `import { element, property, render, html${withStyles ? ', css, styles' : ''}${withEvents.length ? ', dispatch' : ''} } from 'snice';

@element('${name}')
export class ${className} extends HTMLElement {
${propLines}
${withStyles ? `
  @styles()
  componentStyles() {
    return css\`
      :host {
        display: block;
      }

      .${name} {
        /* Component styles */
      }
    \`;
  }
` : ''}
  @render()
  template() {
    return html\`
      <div class="${name}">
        <!-- Component template -->
      </div>
    \`;
  }${eventMethods}
}`;
      return { content: [{ type: 'text', text: code }] };
    }

    case 'search_docs': {
      const query = args.query.toLowerCase();
      const results = [];

      // Search components
      for (const [name, doc] of Object.entries(COMPONENT_DOCS)) {
        if (doc.toLowerCase().includes(query)) {
          const lines = doc.split('\n');
          const matchingLines = lines.filter(l => l.toLowerCase().includes(query)).slice(0, 3);
          results.push(`## snice-${name}\n${matchingLines.join('\n')}`);
        }
      }

      // Search decorators
      if (DECORATOR_DOCS?.toLowerCase().includes(query)) {
        const lines = DECORATOR_DOCS.split('\n');
        const matchingLines = lines.filter(l => l.toLowerCase().includes(query)).slice(0, 5);
        results.push(`## Decorators\n${matchingLines.join('\n')}`);
      }

      if (results.length === 0) {
        return { content: [{ type: 'text', text: `No results found for "${args.query}"` }] };
      }
      return { content: [{ type: 'text', text: `# Search Results for "${args.query}"\n\n${results.join('\n\n')}` }] };
    }

    case 'validate_code': {
      const code = args.code;
      const issues = [];

      // Check for @state() - doesn't exist
      if (/@state\s*\(/.test(code)) {
        issues.push({
          severity: 'error',
          message: '@state() does not exist in snice. Use @property() for all reactive state.',
          fix: 'Replace @state() with @property()'
        });
      }

      // Check for camelCase event names in @dispatch
      const dispatchMatch = code.match(/@dispatch\s*\(\s*['"]([^'"]+)['"]\s*\)/g);
      if (dispatchMatch) {
        for (const match of dispatchMatch) {
          const eventName = match.match(/['"]([^'"]+)['"]/)?.[1];
          if (eventName && /[A-Z]/.test(eventName)) {
            issues.push({
              severity: 'warning',
              message: `Event "${eventName}" uses camelCase. Use kebab-case instead.`,
              fix: `Change to "${eventName.replace(/([A-Z])/g, '-$1').toLowerCase()}"`
            });
          }
        }
      }

      // Check for wrong import syntax
      if (/import\s*\{\s*\w+\s*\}\s*from\s*['"]snice\/components/.test(code)) {
        issues.push({
          severity: 'error',
          message: 'Wrong import syntax for built-in components. Use side-effect import.',
          fix: "Use: import 'snice/components/button/snice-button' (no curly braces)"
        });
      }

      // Check for experimentalDecorators in tsconfig reference
      if (/experimentalDecorators.*true/.test(code)) {
        issues.push({
          severity: 'error',
          message: 'experimentalDecorators must be false. Snice uses TC39 stage 3 decorators.',
          fix: 'Set experimentalDecorators: false in tsconfig.json'
        });
      }

      // Check for missing type in @property for non-strings
      const propMatches = code.match(/@property\s*\(\s*\)\s*\w+\s*[=:]\s*(\d+|true|false|\[|\{)/g);
      if (propMatches) {
        issues.push({
          severity: 'warning',
          message: 'Non-string property without type hint. Add { type: Number/Boolean/Array/Object }.',
          fix: '@property({ type: Number }) count = 0'
        });
      }

      // Check for direct DOM manipulation that should use templates
      if (/this\.innerHTML\s*=/.test(code) || /this\.shadowRoot\.innerHTML\s*=/.test(code)) {
        issues.push({
          severity: 'warning',
          message: 'Avoid direct innerHTML assignment. Use @render() with html`` template.',
          fix: 'Use @render() template() { return html`...`; }'
        });
      }

      // Check for connectedCallback without super
      if (/connectedCallback\s*\(\s*\)\s*\{(?![^}]*super\.connectedCallback)/.test(code)) {
        issues.push({
          severity: 'warning',
          message: 'connectedCallback should call super.connectedCallback() or use @ready() instead.',
          fix: 'Use @ready() decorator for initialization logic'
        });
      }

      // Check for .addEventListener instead of @on
      if (/this\.addEventListener\s*\(/.test(code)) {
        issues.push({
          severity: 'info',
          message: 'Consider using @on() decorator for event delegation instead of addEventListener.',
          fix: "@on('click', 'button') handleClick(e) {}"
        });
      }

      // Check for Event type instead of CustomEvent in handlers
      if (/:\s*Event\s*\)/.test(code) && /@on|@event|handle|Handler/.test(code)) {
        issues.push({
          severity: 'warning',
          message: 'Use CustomEvent type for snice event handlers, not Event.',
          fix: 'Change (e: Event) to (e: CustomEvent) to access e.detail'
        });
      }

      // Check for @customElement (Lit syntax)
      if (/@customElement\s*\(/.test(code)) {
        issues.push({
          severity: 'error',
          message: '@customElement() is Lit syntax. Use @element() in snice.',
          fix: "Replace @customElement('my-el') with @element('my-el')"
        });
      }

      // Check for LitElement extends
      if (/extends\s+LitElement/.test(code)) {
        issues.push({
          severity: 'error',
          message: 'Do not extend LitElement. Snice components extend HTMLElement.',
          fix: 'Change extends LitElement to extends HTMLElement'
        });
      }

      // Check for imports from 'lit'
      if (/from\s+['"]lit['"]/.test(code) || /from\s+['"]lit\//.test(code)) {
        issues.push({
          severity: 'error',
          message: 'Do not import from lit. Snice is NOT Lit.',
          fix: "Import from 'snice' instead: import { element, property, render, html, css } from 'snice'"
        });
      }

      // Check for importing page from 'snice'
      if (/import\s*\{[^}]*\bpage\b[^}]*\}\s*from\s*['"]snice['"]/.test(code)) {
        issues.push({
          severity: 'error',
          message: "page decorator is NOT exported from 'snice'. It comes from Router().",
          fix: "Create router.ts with: export const { page } = Router({...}); then import { page } from './router'"
        });
      }

      // Check for Router() without type property
      if (/Router\s*\(\s*\{/.test(code) && !/type\s*:\s*['"](?:hash|pushstate)['"]/.test(code)) {
        issues.push({
          severity: 'warning',
          message: "Router() requires type: 'hash' | 'pushstate' property.",
          fix: "Add type: 'hash' or type: 'pushstate' to Router config"
        });
      }

      // Check for async guards (not supported)
      if (/guards\s*:.*async/.test(code) || /async\s+function\s+\w+Guard/.test(code)) {
        issues.push({
          severity: 'error',
          message: 'Async guards are NOT supported. Guards must be synchronous.',
          fix: 'Remove async from guard function - return boolean, not Promise<boolean>'
        });
      }

      // Check for Context<T> generic usage (Context is not generic)
      if (/Context\s*</.test(code)) {
        issues.push({
          severity: 'error',
          message: 'Context class is NOT generic. Use type casting instead.',
          fix: 'Change Context<MyApp> to Context, then cast: ctx.application as MyApp'
        });
      }

      // Check for @property({ reflect: true }) - doesn't exist
      if (/@property\s*\(\s*\{[^}]*reflect\s*:/.test(code)) {
        issues.push({
          severity: 'error',
          message: '@property() does not have a reflect option. This is a Lit concept.',
          fix: 'Remove reflect option. Attributes sync automatically for :host([attr]) styling.'
        });
      }

      // Check for function-based @observe syntax (old/wrong)
      if (/@observe\s*\(\s*\(\s*\)\s*=>/.test(code)) {
        issues.push({
          severity: 'error',
          message: '@observe uses string-based targets, not function syntax.',
          fix: "@observe('mutation:childList', '.content') not @observe(() => this.content, {...})"
        });
      }

      // Check for importing Context from router file (Router doesn't export Context)
      if (/import\s*\{[^}]*\bContext\b[^}]*\}\s*from\s*['"]\.\/router['"]/.test(code)) {
        issues.push({
          severity: 'error',
          message: 'Router() does not export Context. Context is received via @context() decorator.',
          fix: "import type { Context } from 'snice'; then use @context() handleContext(ctx: Context) {}"
        });
      }

      // Check for fetch() in @element (elements should be purely visual)
      if (/@element\s*\(/.test(code) && /\bfetch\s*\(/.test(code) && !/@page\s*\(/.test(code)) {
        issues.push({
          severity: 'warning',
          message: 'Elements should be purely visual. Avoid fetch() in @element components.',
          fix: 'Move API calls to pages, controllers, or services. Elements receive data via properties.'
        });
      }

      // Check for property() without @ (Lit syntax)
      if (/\bproperty\s*\(\s*\{/.test(code) && !/@property/.test(code)) {
        issues.push({
          severity: 'warning',
          message: 'Missing @ on property decorator.',
          fix: 'Use @property({ type: ... }) not property({ type: ... })'
        });
      }

      // Check for icon property with plain text that looks like a Material icon name
      // icon="home" renders as plain text, NOT as a Material icon. Use a slot instead.
      const iconAttrPattern = /\b(?:icon|prefix-icon|suffix-icon|prefixIcon|suffixIcon)\s*(?:=\s*["']|:\s*["']|=\s*\{?\s*["'])([^"']+)["']/g;
      let iconMatch;
      const materialIconNames = [
        'home', 'search', 'settings', 'menu', 'close', 'delete', 'edit', 'add',
        'check', 'arrow_back', 'arrow_forward', 'favorite', 'star', 'person',
        'visibility', 'lock', 'mail', 'phone', 'save', 'share', 'download',
        'upload', 'refresh', 'info', 'warning', 'error', 'help', 'logout',
        'login', 'notifications', 'shopping_cart', 'account_circle', 'more_vert',
        'more_horiz', 'filter_list', 'sort', 'expand_more', 'expand_less',
        'chevron_right', 'chevron_left', 'calendar_today', 'schedule', 'place',
        'attach_file', 'link', 'image', 'camera', 'mic', 'send', 'print',
        'content_copy', 'content_paste', 'undo', 'redo', 'format_bold',
        'dashboard', 'inventory', 'folder', 'description', 'cloud'
      ];
      while ((iconMatch = iconAttrPattern.exec(code)) !== null) {
        const value = iconMatch[1].trim();
        // Skip URLs, file paths, emojis, scheme overrides, and single characters
        if (/^(https?:\/\/|\/|\.\/|\.\.\/|data:|img:\/\/|text:\/\/)/.test(value)) continue;
        if (/\.\w{2,4}$/.test(value)) continue; // file extension
        if (value.length <= 2) continue; // emoji or single char like "×" or "→"
        // Check if it matches a known Material icon name or looks like one (snake_case word)
        if (materialIconNames.includes(value) || /^[a-z][a-z0-9]*(_[a-z0-9]+)+$/.test(value)) {
          issues.push({
            severity: 'error',
            message: `icon="${value}" renders as plain text, not a Material icon. Snice does not bundle Material Symbols. Use a slot instead.`,
            fix: `<span slot="icon" class="material-symbols-outlined">${value}</span>\n  Or use an emoji: icon="🏠", a URL: icon="/icons/${value}.svg", or scheme override: icon="img://${value}.svg"\n  See component docs for slot examples.`
          });
        }
      }

      // Check for controller importing from component file instead of .types.ts
      if (/@controller\s*\(/.test(code) || /class\s+\w+Controller/.test(code)) {
        const importMatches = code.match(/from\s+['"].*\/components\/[^'"]+\/snice-[^'"]+(?<!\.types)['"]/g);
        if (importMatches) {
          for (const match of importMatches) {
            if (!match.includes('.types')) {
              issues.push({
                severity: 'warning',
                message: `Controller imports from component file instead of .types.ts: ${match}`,
                fix: 'Import types from .types.ts to avoid circular dependencies. E.g., import type { ... } from "./snice-comp.types"'
              });
            }
          }
        }
      }

      if (issues.length === 0) {
        return { content: [{ type: 'text', text: '✓ No issues found. Code looks good!' }] };
      }

      const report = issues.map(i => `[${i.severity.toUpperCase()}] ${i.message}\n  Fix: ${i.fix}`).join('\n\n');
      return { content: [{ type: 'text', text: `# Validation Results\n\nFound ${issues.length} issue(s):\n\n${report}` }] };
    }

    default:
      return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  }
}

// MCP Protocol Handler (stdio)
async function runStdioServer() {
  const readline = await import('readline');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  const write = (obj) => {
    process.stdout.write(JSON.stringify(obj) + '\n');
  };

  rl.on('line', (line) => {
    try {
      const msg = JSON.parse(line);
      const { id, method, params } = msg;

      if (method === 'initialize') {
        write({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: { name: 'snice-mcp', version: '1.0.0' }
          }
        });
      } else if (method === 'notifications/initialized') {
        // No response needed
      } else if (method === 'tools/list') {
        write({
          jsonrpc: '2.0',
          id,
          result: { tools: TOOLS }
        });
      } else if (method === 'tools/call') {
        const result = handleTool(params.name, params.arguments || {});
        write({
          jsonrpc: '2.0',
          id,
          result
        });
      } else {
        write({
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${method}` }
        });
      }
    } catch (e) {
      process.stderr.write(`Error: ${e.message}\n`);
    }
  });

  process.stderr.write('Snice MCP Server running on stdio\n');
}

// Start server
runStdioServer();
