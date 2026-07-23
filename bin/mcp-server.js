#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateComponentSource } from './component-scaffold.js';
import { analyzeSource } from './project-analyzer.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(__dirname, '..');
const packageJson = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
const docsRoot = join(packageRoot, 'docs', 'ai');

const JSONRPC_PARSE_ERROR = -32700;
const JSONRPC_INVALID_REQUEST = -32600;
const JSONRPC_METHOD_NOT_FOUND = -32601;
const JSONRPC_INVALID_PARAMS = -32602;

function text(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function builtComponentNames() {
  const manifest = JSON.parse(text(join(packageRoot, 'custom-elements.json')) || '{"modules":[]}');
  const names = new Set();
  for (const module of manifest.modules ?? []) {
    for (const declaration of module.declarations ?? []) {
      if (declaration.tagName?.startsWith('snice-')) names.add(declaration.tagName.slice(6));
    }
  }
  names.add('icons');
  return names;
}

function loadComponentDocs() {
  const directory = join(docsRoot, 'components');
  const allowed = builtComponentNames();
  return Object.fromEntries(
    readdirSync(directory)
      .filter(filename => filename.endsWith('.md'))
      .map(filename => filename.slice(0, -3))
      .filter(name => allowed.has(name))
      .sort()
      .map(name => [name, text(join(directory, `${name}.md`))])
  );
}

const componentDocs = loadComponentDocs();
const overview = text(join(docsRoot, 'README.md'));
const decoratorDocs = text(join(docsRoot, 'decorators.md'));

const readOnly = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };
const tools = [
  {
    name: 'list_components',
    description: 'List released Snice UI components. WIP components are excluded.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: readOnly
  },
  {
    name: 'get_component_docs',
    description: 'Get version-matched documentation for one released Snice component.',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', description: 'Name with or without the snice- prefix.' } },
      required: ['name'],
      additionalProperties: false
    },
    annotations: readOnly
  },
  {
    name: 'get_decorator_docs',
    description: 'Get the version-matched Snice decorator reference.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: readOnly
  },
  {
    name: 'get_overview',
    description: 'Get the version-matched Snice framework and documentation overview.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: readOnly
  },
  {
    name: 'search_docs',
    description: 'Search released component and core AI documentation.',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string', minLength: 2 } },
      required: ['query'],
      additionalProperties: false
    },
    annotations: readOnly
  },
  {
    name: 'validate_code',
    description: 'Return structured, conservative diagnostics for common Snice authoring mistakes.',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        filename: { type: 'string' }
      },
      required: ['code'],
      additionalProperties: false
    },
    annotations: readOnly
  },
  {
    name: 'generate_component',
    description: 'Return a current Snice custom-element scaffold without writing files.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', pattern: '^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$' },
        properties: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { enum: ['string', 'number', 'boolean', 'array', 'object'] },
              default: { type: 'string' }
            },
            required: ['name'],
            additionalProperties: false
          }
        },
        withStyles: { type: 'boolean', default: true },
        withEvents: { type: 'array', items: { type: 'string' } }
      },
      required: ['name'],
      additionalProperties: false
    },
    annotations: readOnly
  }
];
const toolsByName = new Map(tools.map(tool => [tool.name, tool]));

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function schemaTypeOf(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/**
 * Minimal validator covering exactly the JSON Schema subset the published tool
 * input schemas use: type, properties, required, additionalProperties: false,
 * items, enum, pattern, minLength. Returns a problem string or null.
 */
function validateValue(schema, value, path) {
  if (schema.enum !== undefined) {
    return schema.enum.includes(value)
      ? null
      : `${path} must be one of: ${schema.enum.join(', ')}`;
  }
  if (schema.type !== undefined && schemaTypeOf(value) !== schema.type) {
    return `${path} must be of type ${schema.type}, got ${schemaTypeOf(value)}`;
  }
  if (schema.type === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      return `${path} must contain at least ${schema.minLength} characters`;
    }
    if (schema.pattern !== undefined && !new RegExp(schema.pattern).test(value)) {
      return `${path} must match pattern ${schema.pattern}`;
    }
  }
  if (schema.type === 'array' && schema.items !== undefined) {
    for (let index = 0; index < value.length; index++) {
      const problem = validateValue(schema.items, value[index], `${path}[${index}]`);
      if (problem) return problem;
    }
  }
  if (schema.type === 'object') {
    const properties = schema.properties ?? {};
    for (const required of schema.required ?? []) {
      if (!(required in value)) return `${path}.${required} is required`;
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!(key in properties)) return `${path}.${key} is not an accepted property`;
      }
    }
    for (const [key, propertySchema] of Object.entries(properties)) {
      if (key in value) {
        const problem = validateValue(propertySchema, value[key], `${path}.${key}`);
        if (problem) return problem;
      }
    }
  }
  return null;
}

const toolText = (value, structuredContent) => ({
  content: [{ type: 'text', text: value }],
  ...(structuredContent ? { structuredContent } : {})
});

function normalizeName(value) {
  return String(value ?? '').toLowerCase().replace(/^snice-/, '');
}

function summary(name, doc) {
  const line = doc.split('\n').find(value => value.trim() && !value.startsWith('#'));
  return { name, tagName: name === 'icons' ? null : `snice-${name}`, summary: line?.trim() ?? '' };
}

function callTool(name, args = {}) {
  const tool = toolsByName.get(name);
  if (!tool) throw new RangeError(`unknown tool: ${name}`);
  const problem = validateValue(tool.inputSchema, args, 'arguments');
  if (problem) throw new TypeError(`invalid arguments for ${name}: ${problem}`);

  if (name === 'list_components') {
    const components = Object.entries(componentDocs).map(([component, doc]) => summary(component, doc));
    return toolText(components.map(item => `- ${item.tagName ?? item.name}: ${item.summary}`).join('\n'), { components });
  }
  if (name === 'get_component_docs') {
    const component = normalizeName(args.name);
    const documentation = componentDocs[component];
    if (!documentation) throw new RangeError(`released component not found: ${component}`);
    return toolText(documentation, { name: component, tagName: component === 'icons' ? null : `snice-${component}` });
  }
  if (name === 'get_decorator_docs') return toolText(decoratorDocs, { version: packageJson.version });
  if (name === 'get_overview') return toolText(overview, { version: packageJson.version });
  if (name === 'search_docs') {
    const query = String(args.query ?? '').trim();
    if (query.length < 2) throw new TypeError('query must contain at least two characters');
    const matches = [];
    for (const [component, documentation] of Object.entries(componentDocs)) {
      const lines = documentation.split('\n')
        .map((line, index) => ({ line: index + 1, text: line }))
        .filter(item => item.text.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3);
      if (lines.length) matches.push({ document: `components/${component}.md`, lines });
    }
    for (const [document, documentation] of [['README.md', overview], ['decorators.md', decoratorDocs]]) {
      const lines = documentation.split('\n')
        .map((line, index) => ({ line: index + 1, text: line }))
        .filter(item => item.text.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5);
      if (lines.length) matches.push({ document, lines });
    }
    const rendered = matches.flatMap(match => [
      `## ${match.document}`,
      ...match.lines.map(line => `${line.line}: ${line.text}`)
    ]).join('\n');
    return toolText(rendered || `No results found for "${query}".`, { query, matches });
  }
  if (name === 'validate_code') {
    const issues = analyzeSource(String(args.code ?? ''), String(args.filename ?? ''));
    const rendered = issues.length
      ? issues.map(issue =>
        `[${issue.severity.toUpperCase()}] ${issue.ruleId} (${issue.line}:${issue.column}): ${issue.message}\n  ${issue.fix}`
      ).join('\n\n')
      : 'No Snice authoring issues found.';
    return toolText(rendered, { valid: !issues.some(issue => issue.severity === 'error'), issues });
  }
  if (name === 'generate_component') {
    const code = generateComponentSource(args);
    return toolText(code, { name: args.name, code });
  }
  throw new RangeError(`unknown tool: ${name}`);
}

function resources() {
  return [
    { uri: 'snice://overview', name: 'Snice overview', mimeType: 'text/markdown' },
    { uri: 'snice://decorators', name: 'Snice decorators', mimeType: 'text/markdown' },
    ...Object.keys(componentDocs).map(name => ({
      uri: `snice://components/${name}`,
      name: `snice-${name}`,
      mimeType: 'text/markdown'
    }))
  ];
}

function readResource(uri) {
  if (uri === 'snice://overview') return overview;
  if (uri === 'snice://decorators') return decoratorDocs;
  const match = /^snice:\/\/components\/([a-z0-9-]+)$/.exec(uri);
  if (match && componentDocs[match[1]]) return componentDocs[match[1]];
  throw new RangeError(`unknown resource: ${uri}`);
}

/**
 * A message is a valid JSON-RPC 2.0 envelope when it is an object with
 * jsonrpc "2.0", a non-empty string method, and (if present) a string,
 * number, or null id. Anything else is an Invalid Request, not a notification.
 */
function envelopeProblem(message) {
  if (!isPlainObject(message)) return 'request must be a JSON object';
  if (message.jsonrpc !== '2.0') return 'jsonrpc must be the string "2.0"';
  if (typeof message.method !== 'string' || message.method.length === 0) {
    return 'method must be a non-empty string';
  }
  if ('id' in message
    && typeof message.id !== 'string'
    && typeof message.id !== 'number'
    && message.id !== null) {
    return 'id must be a string, number, or null';
  }
  return null;
}

async function run() {
  const readline = await import('node:readline');
  const input = readline.createInterface({ input: process.stdin, terminal: false });
  const write = message => process.stdout.write(`${JSON.stringify(message)}\n`);

  input.on('line', line => {
    if (!line.trim()) return;

    let message;
    try {
      message = JSON.parse(line);
    } catch (error) {
      // Malformed JSON is never a notification: always answer with id null.
      write({ jsonrpc: '2.0', id: null, error: { code: JSONRPC_PARSE_ERROR, message: `Parse error: ${error.message}` } });
      return;
    }

    const badEnvelope = envelopeProblem(message);
    if (badEnvelope) {
      const id = isPlainObject(message)
        && (typeof message.id === 'string' || typeof message.id === 'number')
        ? message.id
        : null;
      write({ jsonrpc: '2.0', id, error: { code: JSONRPC_INVALID_REQUEST, message: `Invalid Request: ${badEnvelope}` } });
      return;
    }

    const { id, method } = message;
    const isNotification = !('id' in message);
    const respond = payload => {
      if (!isNotification) write({ jsonrpc: '2.0', id, ...payload });
    };

    if (method.startsWith('notifications/')) return;

    try {
      if ('params' in message && !isPlainObject(message.params)) {
        throw new TypeError('params must be an object');
      }
      const params = message.params ?? {};

      let result;
      if (method === 'initialize') {
        result = {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {}, resources: {} },
          serverInfo: { name: 'snice-mcp', version: packageJson.version },
          instructions: 'Use the Snice skill for workflows. Use this server for version-matched structured lookup and conservative validation.'
        };
      } else if (method === 'ping') result = {};
      else if (method === 'tools/list') result = { tools };
      else if (method === 'tools/call') {
        if (typeof params.name !== 'string') throw new TypeError('params.name must be a string');
        if ('arguments' in params && params.arguments !== undefined && !isPlainObject(params.arguments)) {
          throw new TypeError('params.arguments must be an object');
        }
        result = callTool(params.name, params.arguments ?? {});
      } else if (method === 'resources/list') result = { resources: resources() };
      else if (method === 'resources/read') {
        if (typeof params.uri !== 'string') throw new TypeError('params.uri must be a string');
        result = { contents: [{ uri: params.uri, mimeType: 'text/markdown', text: readResource(params.uri) }] };
      } else {
        respond({ error: { code: JSONRPC_METHOD_NOT_FOUND, message: `Method not found: ${method}` } });
        return;
      }
      respond({ result });
    } catch (error) {
      respond({ error: { code: JSONRPC_INVALID_PARAMS, message: error.message } });
      if (isNotification) process.stderr.write(`Snice MCP error: ${error.message}\n`);
    }
  });
  process.stderr.write(`Snice MCP ${packageJson.version} running on stdio\n`);
}

await run();
