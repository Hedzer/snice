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
