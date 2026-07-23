// @vitest-environment node
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const packageVersion: string = JSON.parse(
  readFileSync(join(process.cwd(), 'package.json'), 'utf8')
).version;

/**
 * A single long-lived MCP child multiplexed by JSON-RPC id keeps the suite fast
 * and guarantees no orphaned child processes: the server is spawned once, driven
 * over stdio, and torn down in afterAll. If the child errors, exits early, or
 * emits non-JSON output, every pending request rejects immediately instead of
 * hanging until its timeout.
 */
let child: ChildProcessWithoutNullStreams;
let stderr = '';
let nextId = 100;
let shuttingDown = false;
let childFailure: Error | null = null;
const pending = new Map<
  number,
  { resolve: (message: any) => void; reject: (reason: Error) => void; timer: NodeJS.Timeout }
>();
const received: any[] = [];

function failAllPending(reason: Error) {
  for (const entry of pending.values()) {
    clearTimeout(entry.timer);
    entry.reject(reason);
  }
  pending.clear();
}

function send(payload: Record<string, unknown>) {
  child.stdin.write(`${JSON.stringify(payload)}\n`);
}

function sendRaw(line: string) {
  child.stdin.write(`${line}\n`);
}

function request(method: string, params: Record<string, unknown> = {}): Promise<any> {
  if (childFailure) return Promise.reject(childFailure);
  const id = nextId++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`MCP timeout for ${method}\nstderr: ${stderr}`));
    }, 10_000);
    pending.set(id, { resolve, reject, timer });
    send({ jsonrpc: '2.0', id, method, params });
  });
}

/** Round-trip a harmless ping to prove the server is still responsive. */
async function ping() {
  const response = await request('ping');
  expect(response.result).toEqual({});
  return response;
}

async function call(name: string, args: Record<string, unknown> = {}) {
  return request('tools/call', { name, arguments: args });
}

/**
 * Send a payload the harness cannot route by id (malformed JSON, broken
 * envelope, id-less line) and assert it produced EXACTLY ONE response, which
 * must arrive before the trailing ping response because the server handles
 * stdin lines in order.
 */
async function exchange(payload: Record<string, unknown> | string): Promise<any> {
  const before = received.length;
  typeof payload === 'string' ? sendRaw(payload) : send(payload);
  await ping();
  const between = received.slice(before, received.length - 1);
  expect(between).toHaveLength(1);
  return between[0];
}

/** Send payloads that must produce ZERO responses, proven by an exact count. */
async function silence(...payloads: Array<Record<string, unknown> | string>) {
  const before = received.length;
  for (const payload of payloads) {
    typeof payload === 'string' ? sendRaw(payload) : send(payload);
  }
  const pong = await ping();
  expect(received.length).toBe(before + 1);
  expect(received.at(-1)).toBe(pong);
}

beforeAll(async () => {
  child = spawn(process.execPath, [join(process.cwd(), 'bin/mcp-server.js')], {
    stdio: ['pipe', 'pipe', 'pipe']
  }) as ChildProcessWithoutNullStreams;

  child.on('error', error => {
    childFailure = new Error(`MCP server failed to spawn: ${error.message}`);
    failAllPending(childFailure);
  });
  child.on('exit', (code, signal) => {
    if (shuttingDown) return;
    childFailure = new Error(
      `MCP server exited early (code ${code}, signal ${signal})\nstderr: ${stderr}`
    );
    failAllPending(childFailure);
  });

  let buffered = '';
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', chunk => {
    buffered += chunk;
    const lines = buffered.split('\n');
    buffered = lines.pop() ?? '';
    for (const line of lines) {
      if (!line) continue;
      let message: any;
      try {
        message = JSON.parse(line);
      } catch {
        childFailure = new Error(`MCP server emitted non-JSON output: ${line}`);
        failAllPending(childFailure);
        return;
      }
      received.push(message);
      const entry = message.id != null ? pending.get(message.id) : undefined;
      if (entry) {
        pending.delete(message.id);
        clearTimeout(entry.timer);
        entry.resolve(message);
      }
    }
  });
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', chunk => {
    stderr += chunk;
  });

  // Handshake, exactly as an MCP client would.
  await request('initialize');
  send({ jsonrpc: '2.0', method: 'notifications/initialized' });
});

afterAll(async () => {
  shuttingDown = true;
  failAllPending(new Error('suite teardown'));
  if (!child) return;
  await new Promise<void>(resolve => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve();
      return;
    }
    const force = setTimeout(() => child.kill('SIGKILL'), 2_000);
    child.once('exit', () => {
      clearTimeout(force);
      resolve();
    });
    child.stdin.end();
    child.kill();
  });
});

describe('Snice MCP server: protocol', () => {
  it('derives initialize metadata from the package version', async () => {
    const response = await request('initialize');
    expect(response.result.protocolVersion).toBe('2024-11-05');
    expect(response.result.serverInfo).toEqual({ name: 'snice-mcp', version: packageVersion });
    expect(response.result.capabilities).toEqual({ tools: {}, resources: {} });
  });

  it('keeps the skill-as-workflow / server-as-lookup distinction in instructions', async () => {
    const response = await request('initialize');
    const instructions: string = response.result.instructions;
    expect(instructions).toMatch(/skill.*workflow/i);
    expect(instructions).toMatch(/lookup|validation/i);
  });

  it('answers ping with an empty result', async () => {
    await ping();
  });

  it('returns -32601 for an unknown method', async () => {
    const response = await request('does/not/exist');
    expect(response.error).toMatchObject({ code: -32601 });
    expect(response.error.message).toContain('does/not/exist');
    expect(response.result).toBeUndefined();
  });
});

describe('Snice MCP server: notifications', () => {
  it('emits exactly zero responses for well-formed notifications', async () => {
    await silence(
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      { jsonrpc: '2.0', method: 'notifications/cancelled', params: { requestId: 1 } }
    );
  });

  it('never answers an id-less unknown method', async () => {
    await silence({ jsonrpc: '2.0', method: 'does/not/exist' });
  });

  it('never answers an id-less tools/call even when its params are invalid', async () => {
    await silence({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: { name: 'get_component_docs', arguments: {} }
    });
    expect(stderr).toContain('Snice MCP error');
  });
});

describe('Snice MCP server: malformed JSON and bad envelopes', () => {
  it('answers malformed JSON with -32700 and a null id — it is not a notification', async () => {
    const response = await exchange('{ this is not json');
    expect(response.id).toBeNull();
    expect(response.error).toMatchObject({ code: -32700 });
  });

  it('ignores blank lines without answering', async () => {
    await silence('', '   ');
  });

  it.each([
    ['JSON array', '[1,2,3]'],
    ['JSON string', '"hello"'],
    ['JSON number', '42'],
    ['JSON null', 'null']
  ])('answers a non-object message (%s) with -32600 and a null id', async (_label, raw) => {
    const response = await exchange(raw);
    expect(response.id).toBeNull();
    expect(response.error).toMatchObject({ code: -32600 });
  });

  it('answers a missing jsonrpc member with -32600 echoing the id', async () => {
    const response = await exchange({ id: 9001, method: 'ping' });
    expect(response.id).toBe(9001);
    expect(response.error).toMatchObject({ code: -32600 });
  });

  it('answers a wrong jsonrpc version with -32600', async () => {
    const response = await exchange({ jsonrpc: '1.0', id: 9002, method: 'ping' });
    expect(response.id).toBe(9002);
    expect(response.error).toMatchObject({ code: -32600 });
  });

  it('answers a missing or non-string method with -32600', async () => {
    const missing = await exchange({ jsonrpc: '2.0', id: 9003 });
    expect(missing.error).toMatchObject({ code: -32600 });
    const nonString = await exchange({ jsonrpc: '2.0', id: 9004, method: 5 });
    expect(nonString.error).toMatchObject({ code: -32600 });
  });

  it('answers a structurally invalid id with -32600 and a null id', async () => {
    const response = await exchange({ jsonrpc: '2.0', id: { nested: true }, method: 'ping' });
    expect(response.id).toBeNull();
    expect(response.error).toMatchObject({ code: -32600 });
  });

  it('answers non-object params with -32602', async () => {
    const response = await exchange({ jsonrpc: '2.0', id: 9005, method: 'ping', params: [] });
    expect(response.id).toBe(9005);
    expect(response.error).toMatchObject({ code: -32602 });
  });

  it('stays responsive after an error barrage', async () => {
    sendRaw('{ broken');
    sendRaw('[]');
    send({ id: 9006, method: 'nope' });
    await ping();
  });
});

describe('Snice MCP server: tools list', () => {
  it('publishes read-only tools with closed schemas in a stable order', async () => {
    const response = await request('tools/list');
    const tools = response.result.tools;
    expect(tools.map((tool: any) => tool.name)).toEqual([
      'list_components',
      'get_component_docs',
      'get_decorator_docs',
      'get_overview',
      'search_docs',
      'validate_code',
      'generate_component'
    ]);
    for (const tool of tools) {
      expect(tool.annotations).toMatchObject({
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false
      });
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.additionalProperties).toBe(false);
    }
  });

  it('publishes the validation keywords the server enforces', async () => {
    const response = await request('tools/list');
    const byName = Object.fromEntries(
      response.result.tools.map((tool: any) => [tool.name, tool])
    );
    expect(byName.get_component_docs.inputSchema.required).toEqual(['name']);
    expect(byName.search_docs.inputSchema.required).toEqual(['query']);
    expect(byName.search_docs.inputSchema.properties.query.minLength).toBe(2);
    expect(byName.validate_code.inputSchema.required).toEqual(['code']);
    const generate = byName.generate_component.inputSchema;
    expect(generate.required).toEqual(['name']);
    expect(generate.properties.name.pattern).toBe('^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$');
    expect(generate.properties.properties.items.required).toEqual(['name']);
    expect(generate.properties.properties.items.additionalProperties).toBe(false);
    expect(generate.properties.properties.items.properties.type.enum).toEqual([
      'string',
      'number',
      'boolean',
      'array',
      'object'
    ]);
  });
});

describe('Snice MCP server: input validation', () => {
  it('rejects tools/call with a non-string tool name', async () => {
    const response = await request('tools/call', { name: 5 });
    expect(response.error).toMatchObject({ code: -32602 });
  });

  it('rejects tools/call with non-object arguments', async () => {
    const response = await request('tools/call', { name: 'list_components', arguments: [] });
    expect(response.error).toMatchObject({ code: -32602 });
  });

  it.each([
    ['list_components', { extra: 1 }],
    ['get_decorator_docs', { extra: 1 }],
    ['get_overview', { extra: 1 }],
    ['get_component_docs', { name: 'button', extra: true }],
    ['search_docs', { query: 'button', extra: true }],
    ['validate_code', { code: '', extra: true }],
    ['generate_component', { name: 'user-card', extra: true }]
  ])('rejects additional properties on %s', async (name, args) => {
    const response = await call(name, args as Record<string, unknown>);
    expect(response.error).toMatchObject({ code: -32602 });
    expect(response.error.message).toContain('extra');
  });

  it.each([
    ['get_component_docs', {}, 'name'],
    ['search_docs', {}, 'query'],
    ['validate_code', {}, 'code'],
    ['generate_component', {}, 'name']
  ])('rejects %s when required fields are missing', async (name, args, field) => {
    const response = await call(name, args);
    expect(response.error).toMatchObject({ code: -32602 });
    expect(response.error.message).toContain(field);
  });

  it.each([
    ['get_component_docs', { name: 5 }],
    ['search_docs', { query: 7 }],
    ['validate_code', { code: 42 }],
    ['validate_code', { code: '', filename: 3 }],
    ['generate_component', { name: 12 }],
    ['generate_component', { name: 'user-card', withStyles: 'yes' }],
    ['generate_component', { name: 'user-card', withEvents: 'select' }],
    ['generate_component', { name: 'user-card', properties: 'nope' }]
  ])('rejects %s with wrong-typed values %j', async (name, args) => {
    const response = await call(name, args as Record<string, unknown>);
    expect(response.error).toMatchObject({ code: -32602 });
  });

  it('enforces minLength on search_docs.query', async () => {
    const response = await call('search_docs', { query: 'a' });
    expect(response.error).toMatchObject({ code: -32602 });
  });

  it('enforces the name pattern on generate_component', async () => {
    for (const name of ['NoHyphen', 'nohyphen', '-leading', 'has space', 'Upper-Case']) {
      const response = await call('generate_component', { name });
      expect(response.error).toMatchObject({ code: -32602 });
    }
  });

  it('validates generate_component array items as closed objects', async () => {
    const nonObjectItem = await call('generate_component', {
      name: 'user-card',
      properties: ['user']
    });
    expect(nonObjectItem.error).toMatchObject({ code: -32602 });

    const missingItemName = await call('generate_component', {
      name: 'user-card',
      properties: [{ type: 'string' }]
    });
    expect(missingItemName.error).toMatchObject({ code: -32602 });

    const badEnum = await call('generate_component', {
      name: 'user-card',
      properties: [{ name: 'user', type: 'weird' }]
    });
    expect(badEnum.error).toMatchObject({ code: -32602 });

    const extraItemProp = await call('generate_component', {
      name: 'user-card',
      properties: [{ name: 'user', bogus: true }]
    });
    expect(extraItemProp.error).toMatchObject({ code: -32602 });

    const badEventItem = await call('generate_component', {
      name: 'user-card',
      withEvents: [1]
    });
    expect(badEventItem.error).toMatchObject({ code: -32602 });
  });
});

describe('Snice MCP server: tools', () => {
  it('answers every published tool with minimal valid arguments', async () => {
    const minimalArgs: Record<string, Record<string, unknown>> = {
      list_components: {},
      get_component_docs: { name: 'button' },
      get_decorator_docs: {},
      get_overview: {},
      search_docs: { query: 'button' },
      validate_code: { code: '' },
      generate_component: { name: 'demo-card' }
    };
    const listed = await request('tools/list');
    for (const tool of listed.result.tools) {
      expect(minimalArgs).toHaveProperty(tool.name);
      const response = await call(tool.name, minimalArgs[tool.name]);
      expect(response.error).toBeUndefined();
      expect(Array.isArray(response.result.content)).toBe(true);
      expect(response.result.content[0].type).toBe('text');
    }
  });

  it('lists released components and excludes WIP docs', async () => {
    const response = await call('list_components');
    const components = response.result.structuredContent.components;
    const names = components.map((item: any) => item.name);
    expect(names).toContain('button');
    expect(names).not.toContain('spreadsheet');
    expect(response.result.content[0].text).not.toContain('snice-spreadsheet');
    // structuredContent is stable across calls.
    const again = await call('list_components');
    expect(again.result.structuredContent).toEqual(response.result.structuredContent);
    // Every summary carries a snice-prefixed tag except icons.
    for (const item of components) {
      if (item.name === 'icons') expect(item.tagName).toBeNull();
      else expect(item.tagName).toBe(`snice-${item.name}`);
    }
  });

  it('serves version-matched component docs and normalizes the name', async () => {
    const prefixed = await call('get_component_docs', { name: 'snice-button' });
    expect(prefixed.result.content[0].text).toContain('# snice-button');
    expect(prefixed.result.structuredContent).toEqual({ name: 'button', tagName: 'snice-button' });

    const bare = await call('get_component_docs', { name: 'button' });
    expect(bare.result.content[0].text).toEqual(prefixed.result.content[0].text);
  });

  it('rejects docs requests for unreleased components as a JSON-RPC error', async () => {
    const response = await call('get_component_docs', { name: 'spreadsheet' });
    expect(response.error).toMatchObject({ code: -32602 });
    expect(response.error.message).toContain('spreadsheet');
  });

  it('returns decorator and overview docs stamped with the package version', async () => {
    const decorators = await call('get_decorator_docs');
    expect(decorators.result.structuredContent).toEqual({ version: packageVersion });
    expect(decorators.result.content[0].text.length).toBeGreaterThan(0);

    const overview = await call('get_overview');
    expect(overview.result.structuredContent).toEqual({ version: packageVersion });
    expect(overview.result.content[0].text.length).toBeGreaterThan(0);
  });

  it('searches released docs and reports structured matches', async () => {
    const response = await call('search_docs', { query: 'button' });
    const { query, matches } = response.result.structuredContent;
    expect(query).toBe('button');
    expect(Array.isArray(matches)).toBe(true);
    expect(matches.length).toBeGreaterThan(0);
    expect(response.result.content[0].text).toContain('##');
  });

  it('reports an empty search cleanly', async () => {
    const response = await call('search_docs', { query: 'zzzznotfoundzzzz' });
    expect(response.result.structuredContent.matches).toEqual([]);
    expect(response.result.content[0].text).toContain('No results');
  });
});

describe('Snice MCP server: validate_code', () => {
  it('accepts current property, state, native-event, and decorator contracts', async () => {
    const response = await call('validate_code', {
      filename: 'good.ts',
      code: `
        @element('good-view')
        class GoodView extends HTMLElement {
          @property() count = 0;
          @property({ reflect: true }) active = false;
          @state() pending = false;
          @on('click', 'button') click(event: MouseEvent) {}
          @observe('resize', '.panel') resize(entries: ResizeObserverEntry[]) {}
        }
      `
    });
    expect(response.result.structuredContent).toEqual({ valid: true, issues: [] });
  });

  it('emits diagnostics keyed by ruleId with location and recommendation-free fixes', async () => {
    const response = await call('validate_code', {
      filename: 'bad.ts',
      code: `
        import { page } from 'snice';
        import { Button } from 'snice/components/button';
        import { html } from 'lit';
        @customElement('bad-view')
        class BadView extends HTMLElement {
          connectedCallback() { super.connectedCallback(); }
          @dispatch('valueChanged') emit() {}
          @observe(() => this) observe() {}
        }
        Router({ target: '#app' });
      `
    });
    const { valid, issues } = response.result.structuredContent;
    expect(valid).toBe(false);
    const ruleIds = issues.map((issue: any) => issue.ruleId);
    expect(ruleIds).toEqual(expect.arrayContaining([
      'snice/event-kebab-case',
      'snice/component-import-path',
      'snice/no-nonexistent-lifecycle-super',
      'snice/no-lit-api',
      'snice/router-page-source',
      'snice/observe-target'
    ]));
    for (const issue of issues) {
      expect(typeof issue.ruleId).toBe('string');
      expect(typeof issue.message).toBe('string');
      expect(typeof issue.fix).toBe('string');
      expect(issue.line).toBeGreaterThan(0);
      expect(issue.column).toBeGreaterThan(0);
      expect(issue.file).toBe('bad.ts');
    }
    // Rendered text uses ruleId + location, per the lookup contract.
    expect(response.result.content[0].text).toContain('snice/no-lit-api');
    expect(response.result.content[0].text).toMatch(/\(\d+:\d+\)/);
  });

  it('surfaces component recommendations with a structured recommendation payload', async () => {
    const response = await call('validate_code', {
      filename: 'legacy.html',
      code: '<dialog><p>Are you sure?</p></dialog>'
    });
    const issue = response.result.structuredContent.issues.find(
      (item: any) => item.ruleId === 'snice/recommend-modal'
    );
    expect(issue).toBeDefined();
    expect(issue.severity).toBe('suggestion');
    expect(issue.recommendation).toEqual({
      component: 'modal',
      tag: 'snice-modal',
      import: "import 'snice/components/modal/snice-modal';",
      docsPath: 'docs/ai/components/modal.md'
    });
    // Suggestions do not fail validity.
    expect(response.result.structuredContent.valid).toBe(true);
  });

  it('flags invented icon usage as a hallucination with an icons recommendation', async () => {
    const response = await call('validate_code', {
      filename: 'icons.ts',
      code: 'const view = html`<snice-icon name="home"></snice-icon>`;'
    });
    const issue = response.result.structuredContent.issues.find(
      (item: any) => item.ruleId === 'snice/icon-contract'
    );
    expect(issue).toBeDefined();
    expect(issue.recommendation.component).toBe('icons');
    expect(issue.recommendation.tag).toBeNull();
  });

  it('reports no issues for empty code', async () => {
    const response = await call('validate_code', { code: '' });
    expect(response.result.structuredContent).toEqual({ valid: true, issues: [] });
    expect(response.result.content[0].text).toContain('No Snice authoring issues');
  });
});

describe('Snice MCP server: generate_component', () => {
  it('generates a current stage-3 decorator scaffold', async () => {
    const response = await call('generate_component', {
      name: 'user-card',
      properties: [{ name: 'user', type: 'object' }],
      withEvents: ['user-selected']
    });
    const { name, code } = response.result.structuredContent;
    expect(name).toBe('user-card');
    expect(code).toContain("@element('user-card')");
    expect(code).toContain('class UserCard extends HTMLElement');
    expect(code).toContain('@property({ type: Object }) user = {};');
    expect(code).toContain("@dispatch('user-selected')");
    expect(code).not.toContain('LitElement');
    expect(code).not.toContain('experimentalDecorators');
    // Text content mirrors the structured code exactly.
    expect(response.result.content[0].text).toEqual(code);
  });

  it('omits styles when withStyles is false', async () => {
    const response = await call('generate_component', {
      name: 'plain-box',
      withStyles: false
    });
    expect(response.result.structuredContent.code).not.toContain('@styles()');
  });

  it('turns an invalid component name into a JSON-RPC error', async () => {
    const response = await call('generate_component', { name: 'NoHyphen' });
    // Schema pattern rejects it before the scaffold guard — either way -32602.
    expect(response.error).toMatchObject({ code: -32602 });
  });
});

describe('Snice MCP server: resources', () => {
  it('lists overview, decorators, and released component resources', async () => {
    const response = await request('resources/list');
    const uris = response.result.resources.map((resource: any) => resource.uri);
    expect(uris).toContain('snice://overview');
    expect(uris).toContain('snice://decorators');
    expect(uris).toContain('snice://components/button');
    expect(uris).not.toContain('snice://components/spreadsheet');
    for (const resource of response.result.resources) {
      expect(resource.mimeType).toBe('text/markdown');
    }
  });

  it('reads every listed resource successfully', async () => {
    const listed = await request('resources/list');
    for (const resource of listed.result.resources) {
      const response = await request('resources/read', { uri: resource.uri });
      expect(response.error).toBeUndefined();
      expect(response.result.contents[0]).toMatchObject({
        uri: resource.uri,
        mimeType: 'text/markdown'
      });
      expect(typeof response.result.contents[0].text).toBe('string');
    }
  });

  it('reads overview, decorator, and component resources', async () => {
    const overview = await request('resources/read', { uri: 'snice://overview' });
    expect(overview.result.contents[0]).toMatchObject({
      uri: 'snice://overview',
      mimeType: 'text/markdown'
    });
    expect(overview.result.contents[0].text.length).toBeGreaterThan(0);

    const component = await request('resources/read', { uri: 'snice://components/button' });
    expect(component.result.contents[0].text).toContain('# snice-button');
  });

  it('returns a JSON-RPC error for unknown resources', async () => {
    const unknown = await request('resources/read', { uri: 'snice://components/spreadsheet' });
    expect(unknown.error).toMatchObject({ code: -32602 });

    const garbage = await request('resources/read', { uri: 'not-a-snice-uri' });
    expect(garbage.error).toMatchObject({ code: -32602 });
  });

  it('rejects a non-string resource uri', async () => {
    const response = await request('resources/read', { uri: 5 as unknown as string });
    expect(response.error).toMatchObject({ code: -32602 });
  });
});

describe('Snice MCP server: dispatch errors', () => {
  it('returns a JSON-RPC error for an unknown tool', async () => {
    const response = await call('missing_tool');
    expect(response.error).toMatchObject({ code: -32602 });
    expect(response.error.message).toContain('missing_tool');
  });
});
