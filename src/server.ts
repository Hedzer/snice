import {
  DirectiveServerContext,
  DirectiveServerResult,
  isDirectiveResult,
  isDirectiveServerResult
} from './directive';
import { noChange } from './parts';
import { isRepeatResult } from './repeat';
import {
  CSSResult,
  TemplateResult,
  isCSSResult,
  isTemplateResult,
  isUnsafeHTML,
  nothing
} from './template';

type Segment = string | { expression: number };
type ServerNode =
  | { kind: 'root'; children: ServerNode[] }
  | { kind: 'text'; segments: Segment[] }
  | { kind: 'comment'; segments: Segment[] }
  | { kind: 'raw'; value: string }
  | {
      kind: 'element';
      tag: string;
      attributes: ServerAttribute[];
      children: ServerNode[];
      selfClosing: boolean;
      namespace: 'html' | 'svg' | 'mathml';
    };

interface ServerAttribute {
  name: string;
  value: Segment[] | null;
}

interface AttributeState {
  values: Map<string, string | null>;
  /** Values already contain authored HTML/entity text plus escaped dynamics. */
  serialized: Set<string>;
  classToggles: Map<string, boolean>;
  styleValues: Map<string, string | null>;
}

export interface ServerRenderOptions {
  /** Include empty boundary comments required by hydrate(). Defaults to true. */
  hydratable?: boolean;
}

export interface ServerElementOptions extends ServerRenderOptions {
  /** Render into declarative shadow DOM or directly into light DOM. */
  renderRoot?: 'shadow' | 'light';
  /** Declarative shadow-root mode, or false as light-DOM shorthand. */
  shadow?: ShadowRootMode | false;
  attributes?: Readonly<Record<string, unknown>>;
  styles?: CSSResult | string | readonly (CSSResult | string)[];
  delegatesFocus?: boolean;
}

const TOKEN_START = '\u{f0000}';
const TOKEN_END = '\u{f0001}';
const tokenPattern = new RegExp(`${TOKEN_START}(\\d+)${TOKEN_END}`, 'gu');
const astCache = new WeakMap<TemplateStringsArray, ServerNode>();
const voidElements = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
  'meta', 'param', 'source', 'track', 'wbr'
]);
const rawTextElements = new Set(['script', 'style', 'textarea', 'title']);
const attributeNamePattern = /^[^\s"'<>/=]+$/;
const boundaryNamePattern = /^[a-z][a-z0-9._:-]*$/i;

function token(index: number): string {
  return `${TOKEN_START}${index}${TOKEN_END}`;
}

function segments(value: string): Segment[] {
  const result: Segment[] = [];
  let last = 0;
  for (const match of value.matchAll(tokenPattern)) {
    if (match.index! > last) result.push(value.slice(last, match.index));
    result.push({ expression: Number(match[1]) });
    last = match.index! + match[0].length;
  }
  if (last < value.length) result.push(value.slice(last));
  return result;
}

function expressionIndex(attribute: ServerAttribute): number | undefined {
  if (!attribute.value || attribute.value.length !== 1) return undefined;
  const value = attribute.value[0];
  return typeof value === 'string' ? undefined : value.expression;
}

function spreadKind(name: string): Exclude<DirectiveServerResult['kind'], 'boundary'> {
  switch (name.toLowerCase()) {
    case 'props':
    case 'properties':
      return 'properties';
    case 'attrs':
    case 'attributes':
      return 'attributes';
    case 'events':
      return 'events';
    default:
      throw new Error(
        `snice: unknown spread binding "...${name}". Use ...props, ...attrs, or ...events.`
      );
  }
}

class TemplateParser {
  private position = 0;
  private readonly root: ServerNode = { kind: 'root', children: [] };
  private readonly stack: Array<Extract<ServerNode, { kind: 'root' | 'element' }>> = [this.root as any];

  constructor(private readonly source: string) {}

  parse(): ServerNode {
    while (this.position < this.source.length) {
      const current = this.stack[this.stack.length - 1];
      const currentTag = current.kind === 'element' ? current.tag.toLowerCase() : '';
      if (rawTextElements.has(currentTag) && !this.isRawTextClose(currentTag)) {
        this.parseRawText(currentTag);
      } else if (this.source.startsWith('<!--', this.position)) this.parseComment();
      else if (this.source.startsWith('</', this.position)) this.parseClosingTag();
      else if (this.source[this.position] === '<' && /[A-Za-z!/?]/.test(this.source[this.position + 1] || '')) this.parseTag();
      else this.parseText();
    }
    if (this.stack.length !== 1) {
      const open = this.stack[this.stack.length - 1];
      throw new Error(`snice: SSR template has an unclosed <${open.kind === 'element' ? open.tag : 'root'}> tag.`);
    }
    return this.root;
  }

  private parseRawText(tag: string): void {
    const closing = new RegExp(`</${tag}(?=[\\s>])`, 'ig');
    closing.lastIndex = this.position;
    const match = closing.exec(this.source);
    const next = match?.index ?? this.source.length;
    const value = this.source.slice(this.position, next);
    if (value) this.children().push({ kind: 'text', segments: segments(value) });
    this.position = next;
  }

  private isRawTextClose(tag: string): boolean {
    return new RegExp(`^</${tag}(?=[\\s>])`, 'i').test(this.source.slice(this.position));
  }

  private children(): ServerNode[] {
    return this.stack[this.stack.length - 1].children;
  }

  private parseComment(): void {
    const end = this.source.indexOf('-->', this.position + 4);
    if (end === -1) throw new Error('snice: SSR template contains an unclosed HTML comment.');
    const value = this.source.slice(this.position + 4, end);
    this.children().push({ kind: 'comment', segments: segments(value) });
    this.position = end + 3;
  }

  private parseClosingTag(): void {
    const end = this.source.indexOf('>', this.position + 2);
    if (end === -1) throw new Error('snice: SSR template contains an unclosed closing tag.');
    const name = this.source.slice(this.position + 2, end).trim().toLowerCase();
    const current = this.stack[this.stack.length - 1];
    if (current.kind !== 'element' || current.tag.toLowerCase() !== name) {
      throw new Error(`snice: SSR template expected </${current.kind === 'element' ? current.tag : 'root'}>, found </${name}>.`);
    }
    this.stack.pop();
    this.position = end + 1;
  }

  private parseTag(): void {
    let end = this.position + 1;
    let quote = '';
    while (end < this.source.length) {
      const character = this.source[end];
      if (quote) {
        if (character === quote) quote = '';
      } else if (character === '"' || character === "'") quote = character;
      else if (character === '>') break;
      end++;
    }
    if (end >= this.source.length) throw new Error('snice: SSR template contains an unclosed start tag.');
    const raw = this.source.slice(this.position + 1, end);
    if (/^!|^\?/.test(raw.trim())) {
      this.children().push({ kind: 'raw', value: `<${raw}>` });
      this.position = end + 1;
      return;
    }

    const selfClosing = /\/\s*$/.test(raw);
    const content = raw.replace(/\/\s*$/, '');
    const tagMatch = content.match(/^\s*([^\s/>]+)/);
    if (!tagMatch) throw new Error('snice: SSR template contains a start tag without a name.');
    const tag = tagMatch[1];
    if (tag.includes(TOKEN_START)) throw new Error('snice: expressions cannot be used directly as tag names; use <component ${tag}>.');
    const attributes = this.parseAttributes(content.slice(tagMatch[0].length));
    const namespace = this.elementNamespace(tag);
    const element: Extract<ServerNode, { kind: 'element' }> = {
      kind: 'element', tag, attributes, children: [], selfClosing, namespace
    };
    this.children().push(element);
    this.position = end + 1;
    if (!selfClosing && (namespace !== 'html' || !voidElements.has(tag.toLowerCase()))) this.stack.push(element);
  }

  private elementNamespace(tag: string): 'html' | 'svg' | 'mathml' {
    const parent = this.stack[this.stack.length - 1];
    let namespace: 'html' | 'svg' | 'mathml' = parent.kind === 'element' ? parent.namespace : 'html';
    if (parent.kind === 'element') {
      const parentTag = parent.tag.toLowerCase();
      if (namespace === 'svg' && ['foreignobject', 'desc', 'title'].includes(parentTag)) {
        namespace = 'html';
      } else if (
        namespace === 'mathml' &&
        ['mi', 'mo', 'mn', 'ms', 'mtext'].includes(parentTag) &&
        !['mglyph', 'malignmark'].includes(tag.toLowerCase())
      ) {
        namespace = 'html';
      } else if (namespace === 'mathml' && parentTag === 'annotation-xml') {
        const encoding = parent.attributes.find(attribute => attribute.name.toLowerCase() === 'encoding');
        const value = encoding?.value?.map(segment => typeof segment === 'string' ? segment : '').join('').toLowerCase();
        if (value === 'text/html' || value === 'application/xhtml+xml') namespace = 'html';
      }
    }
    if (namespace === 'html' && tag.toLowerCase() === 'svg') return 'svg';
    if (namespace === 'html' && tag.toLowerCase() === 'math') return 'mathml';
    return namespace;
  }

  private parseAttributes(source: string): ServerAttribute[] {
    const attributes: ServerAttribute[] = [];
    let position = 0;
    while (position < source.length) {
      while (/\s/.test(source[position] || '')) position++;
      if (position >= source.length) break;
      const start = position;
      while (position < source.length && !/[\s=]/.test(source[position])) position++;
      const name = source.slice(start, position);
      while (/\s/.test(source[position] || '')) position++;
      if (source[position] !== '=') {
        attributes.push({ name, value: null });
        continue;
      }
      position++;
      while (/\s/.test(source[position] || '')) position++;
      let value = '';
      const quote = source[position] === '"' || source[position] === "'" ? source[position++] : '';
      if (quote) {
        const startValue = position;
        while (position < source.length && source[position] !== quote) position++;
        if (position >= source.length) throw new Error(`snice: SSR attribute "${name}" has an unclosed quote.`);
        value = source.slice(startValue, position++);
      } else {
        const startValue = position;
        while (position < source.length && !/\s/.test(source[position])) position++;
        value = source.slice(startValue, position);
      }
      attributes.push({ name, value: segments(value) });
    }
    return attributes;
  }

  private parseText(): void {
    let end = this.source.indexOf('<', this.position);
    if (end === -1) end = this.source.length;
    // A literal '<' which is not a tag opener belongs to the text.
    if (end === this.position) end++;
    const value = this.source.slice(this.position, end);
    this.children().push({ kind: 'text', segments: segments(value) });
    this.position = end;
  }
}

function templateAst(result: TemplateResult): ServerNode {
  const cached = astCache.get(result.strings);
  if (cached) return cached;
  let source = result.strings[0];
  for (let index = 0; index < result.values.length; index++) {
    source += token(index) + result.strings[index + 1];
  }
  const root = new TemplateParser(source).parse();
  astCache.set(result.strings, root);
  return root;
}

function escapeText(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttribute(value: unknown): string {
  return escapeText(value).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function isIterable(value: unknown): value is Iterable<unknown> {
  return !!value && typeof value !== 'string' && typeof (value as Iterable<unknown>)[Symbol.iterator] === 'function';
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return !!value && typeof (value as PromiseLike<unknown>).then === 'function';
}

function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
  return !!value && typeof (value as AsyncIterable<unknown>)[Symbol.asyncIterator] === 'function';
}

function serverTruthy(value: unknown): boolean {
  return value !== noChange && value !== nothing && Boolean(value);
}

function serverDirectiveValue(value: unknown, context: DirectiveServerContext): unknown {
  let result = value;
  if (isDirectiveResult(value)) {
    const renderer = value.directive.renderToString;
    result = renderer
      ? renderer(value.values, context)
      : new value.directive(context).render(...value.values);
  }
  // Synchronous SSR has no value to preserve while asynchronous work is
  // pending. Treat it like noChange instead of serializing [object Promise]
  // or accidentally taking a truthy control-flow branch.
  if (!context.async && (isPromiseLike(result) || isAsyncIterable(result))) return noChange;
  return result;
}

async function resolveServerValueAsync(
  value: unknown,
  context: DirectiveServerContext
): Promise<unknown> {
  value = await serverDirectiveValue(value, { ...context, async: true });
  if (!isAsyncIterable(value)) return value;

  let emitted = false;
  let latest: unknown = noChange;
  for await (const item of value) {
    emitted = true;
    latest = item;
  }
  return emitted ? resolveServerValueAsync(latest, context) : noChange;
}

class ServerRenderer {
  private readonly hydratable: boolean;

  constructor(options: ServerRenderOptions) {
    this.hydratable = options.hydratable !== false;
  }

  render(result: TemplateResult): string {
    return this.renderNodes((templateAst(result) as Extract<ServerNode, { kind: 'root' }>).children, result.values);
  }

  async renderAsync(result: TemplateResult): Promise<string> {
    return this.renderNodesAsync(
      (templateAst(result) as Extract<ServerNode, { kind: 'root' }>).children,
      result.values
    );
  }

  private boundary(name: string, content: string): string {
    if (!boundaryNamePattern.test(name)) {
      throw new TypeError(`snice: invalid SSR directive boundary name "${name}".`);
    }
    return this.hydratable ? `<!--${name}-->${content}<!--/${name}-->` : content;
  }

  private nodeBoundary(content: string): string {
    return this.hydratable ? `<!---->${content}<!---->` : content;
  }

  private renderNodes(nodes: readonly ServerNode[], values: readonly unknown[]): string {
    return nodes.map(node => this.renderNode(node, values)).join('');
  }

  private async renderNodesAsync(nodes: readonly ServerNode[], values: readonly unknown[]): Promise<string> {
    let output = '';
    for (const node of nodes) output += await this.renderNodeAsync(node, values);
    return output;
  }

  private renderNode(node: ServerNode, values: readonly unknown[]): string {
    if (node.kind === 'raw') return node.value;
    if (node.kind === 'root') return this.renderNodes(node.children, values);
    if (node.kind === 'text') {
      return node.segments.map(segment => typeof segment === 'string'
        ? segment
        : this.nodeBoundary(this.renderValue(values[segment.expression], { type: 'node', async: false }))).join('');
    }
    if (node.kind === 'comment') {
      const value = node.segments.map(segment => typeof segment === 'string'
        ? segment
        : (() => {
            const resolved = serverDirectiveValue(values[segment.expression], { type: 'node', async: false });
            return resolved === noChange || resolved === nothing ? '' : String(resolved ?? '');
          })()).join('');
      if (value.includes('--') || value.endsWith('-')) {
        throw new Error('snice: SSR comment expressions cannot produce "--" or end with "-".');
      }
      return `<!--${value}-->`;
    }
    return this.renderElement(node, values);
  }

  private async renderNodeAsync(node: ServerNode, values: readonly unknown[]): Promise<string> {
    if (node.kind === 'raw') return node.value;
    if (node.kind === 'root') return this.renderNodesAsync(node.children, values);
    if (node.kind === 'text') {
      let output = '';
      for (const segment of node.segments) {
        output += typeof segment === 'string'
          ? segment
          : this.nodeBoundary(await this.renderValueAsync(
              values[segment.expression],
              { type: 'node', async: true }
            ));
      }
      return output;
    }
    if (node.kind === 'comment') {
      let value = '';
      for (const segment of node.segments) {
        if (typeof segment === 'string') {
          value += segment;
        } else {
          const resolved = await resolveServerValueAsync(
            values[segment.expression],
            { type: 'node', async: true }
          );
          value += resolved === noChange || resolved === nothing ? '' : String(resolved ?? '');
        }
      }
      if (value.includes('--') || value.endsWith('-')) {
        throw new Error('snice: SSR comment expressions cannot produce "--" or end with "-".');
      }
      return `<!--${value}-->`;
    }
    return this.renderElementAsync(node, values);
  }

  private renderValue(value: unknown, context: DirectiveServerContext): string {
    value = serverDirectiveValue(value, context);
    if (isDirectiveServerResult(value)) {
      if (value.kind === 'boundary') {
        return this.boundary(value.name || 'directive', this.renderValue(value.value, context));
      }
      return '';
    }
    if (value === nothing || value === noChange || value == null || value === '') return '';
    if (isTemplateResult(value)) return this.render(value);
    if (isRepeatResult(value)) {
      if (!value.values.length) return this.renderValue(value.empty, context);
      return value.values.map(item => this.nodeBoundary(this.renderValue(item, context))).join('');
    }
    if (isUnsafeHTML(value)) return value.html;
    if (isIterable(value)) {
      return Array.from(value, item => this.nodeBoundary(this.renderValue(item, context))).join('');
    }
    if (typeof (value as PromiseLike<unknown>)?.then === 'function' ||
        typeof (value as AsyncIterable<unknown>)?.[Symbol.asyncIterator] === 'function') {
      return '';
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
      return escapeText(value);
    }
    throw new TypeError(`snice: renderToString() cannot serialize ${Object.prototype.toString.call(value)} in a node expression.`);
  }

  private async renderValueAsync(value: unknown, context: DirectiveServerContext): Promise<string> {
    value = await resolveServerValueAsync(value, { ...context, async: true });
    if (isDirectiveServerResult(value)) {
      if (value.kind === 'boundary') {
        return this.boundary(
          value.name || 'directive',
          await this.renderValueAsync(value.value, context)
        );
      }
      return '';
    }
    if (value === nothing || value === noChange || value == null || value === '') return '';
    if (isTemplateResult(value)) return this.renderAsync(value);
    if (isRepeatResult(value)) {
      if (!value.values.length) return this.renderValueAsync(value.empty, context);
      let output = '';
      for (const item of value.values) {
        output += this.nodeBoundary(await this.renderValueAsync(item, context));
      }
      return output;
    }
    if (isUnsafeHTML(value)) return value.html;
    if (typeof (value as PromiseLike<unknown>)?.then === 'function') {
      return this.renderValueAsync(await value, context);
    }
    if (typeof (value as AsyncIterable<unknown>)?.[Symbol.asyncIterator] === 'function') {
      let emitted = false;
      let latest: unknown;
      for await (const item of value as AsyncIterable<unknown>) {
        emitted = true;
        latest = item;
      }
      return emitted ? this.renderValueAsync(latest, context) : '';
    }
    if (isIterable(value)) {
      let output = '';
      for (const item of value) {
        output += this.nodeBoundary(await this.renderValueAsync(item, context));
      }
      return output;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
      return escapeText(value);
    }
    throw new TypeError(`snice: renderToStringAsync() cannot serialize ${Object.prototype.toString.call(value)} in a node expression.`);
  }

  private renderElement(node: Extract<ServerNode, { kind: 'element' }>, values: readonly unknown[]): string {
    const tag = node.tag.toLowerCase();
    if (tag === 'if') return this.renderIf(node, values);
    if (tag === 'case') return this.renderCase(node, values);
    if (tag === 'component') return this.renderComponent(node, values);
    if (tag === 'else' || tag === 'else-if' || tag === 'when' || tag === 'default') {
      throw new Error(`snice: <${tag}> must be nested in its matching virtual control-flow element.`);
    }

    const attributes = this.renderAttributes(node.attributes, values);
    const children = this.renderNodes(node.children, values);
    const start = `<${node.tag}${attributes}>`;
    if (node.selfClosing) return `<${node.tag}${attributes}/>`;
    if (node.namespace === 'html' && voidElements.has(tag)) return start;
    return `${start}${children}</${node.tag}>`;
  }

  private async renderElementAsync(
    node: Extract<ServerNode, { kind: 'element' }>,
    values: readonly unknown[]
  ): Promise<string> {
    const tag = node.tag.toLowerCase();
    if (tag === 'if') return this.renderIfAsync(node, values);
    if (tag === 'case') return this.renderCaseAsync(node, values);
    if (tag === 'component') return this.renderComponentAsync(node, values);
    if (tag === 'else' || tag === 'else-if' || tag === 'when' || tag === 'default') {
      throw new Error(`snice: <${tag}> must be nested in its matching virtual control-flow element.`);
    }

    const attributes = await this.renderAttributesAsync(node.attributes, values);
    const children = await this.renderNodesAsync(node.children, values);
    const start = `<${node.tag}${attributes}>`;
    if (node.selfClosing) return `<${node.tag}${attributes}/>`;
    if (node.namespace === 'html' && voidElements.has(tag)) return start;
    return `${start}${children}</${node.tag}>`;
  }

  private bareExpression(node: Extract<ServerNode, { kind: 'element' }>): number | undefined {
    for (const attribute of node.attributes) {
      if (attribute.value !== null) continue;
      if (attribute.name.startsWith(TOKEN_START) && attribute.name.endsWith(TOKEN_END)) {
        const index = Number(attribute.name.slice(TOKEN_START.length, -TOKEN_END.length));
        if (Number.isInteger(index)) return index;
      }
    }
    return undefined;
  }

  private ifBranches(node: Extract<ServerNode, { kind: 'element' }>): {
    primary: ServerNode[];
    alternatives: Array<{
      node: Extract<ServerNode, { kind: 'element' }>;
      children: ServerNode[];
    }>;
  } {
    const primary: ServerNode[] = [];
    const alternatives: Array<{
      node: Extract<ServerNode, { kind: 'element' }>;
      children: ServerNode[];
    }> = [];
    let current = primary;
    let sawAlternative = false;
    let sawElse = false;

    for (const child of node.children) {
      if (child.kind === 'element' && (child.tag.toLowerCase() === 'else-if' || child.tag.toLowerCase() === 'else')) {
        const tag = child.tag.toLowerCase();
        if (tag === 'else') {
          if (sawElse) throw new Error('snice: <if> may contain only one <else> branch.');
          sawElse = true;
        } else if (sawElse) {
          throw new Error('snice: <else> must be the final branch inside <if>.');
        }
        sawAlternative = true;
        current = [...child.children];
        alternatives.push({ node: child, children: current });
        continue;
      }

      if (
        sawAlternative &&
        child.kind === 'text' &&
        child.segments.every(segment => typeof segment === 'string' && !segment.trim())
      ) continue;
      current.push(child);
    }

    return { primary, alternatives };
  }

  private renderIf(node: Extract<ServerNode, { kind: 'element' }>, values: readonly unknown[]): string {
    const primaryIndex = this.bareExpression(node);
    if (primaryIndex === undefined) throw new Error('snice: <if> requires a condition expression.');
    let selected: readonly ServerNode[] = [];
    const { primary, alternatives } = this.ifBranches(node);
    if (serverTruthy(serverDirectiveValue(values[primaryIndex], { type: 'node', async: false }))) selected = primary;
    else {
      for (const alternative of alternatives) {
        if (alternative.node.tag.toLowerCase() === 'else') {
          selected = alternative.children;
          break;
        }
        const index = this.bareExpression(alternative.node);
        if (index === undefined) throw new Error('snice: <else-if> requires a condition expression.');
        if (serverTruthy(serverDirectiveValue(values[index], { type: 'node', async: false }))) {
          selected = alternative.children;
          break;
        }
      }
    }
    return this.boundary('if', this.renderNodes(selected, values));
  }

  private async renderIfAsync(
    node: Extract<ServerNode, { kind: 'element' }>,
    values: readonly unknown[]
  ): Promise<string> {
    const primaryIndex = this.bareExpression(node);
    if (primaryIndex === undefined) throw new Error('snice: <if> requires a condition expression.');
    let selected: readonly ServerNode[] = [];
    const { primary, alternatives } = this.ifBranches(node);
    const condition = await resolveServerValueAsync(
      values[primaryIndex],
      { type: 'node', async: true }
    );
    if (serverTruthy(condition)) selected = primary;
    else {
      for (const alternative of alternatives) {
        if (alternative.node.tag.toLowerCase() === 'else') {
          selected = alternative.children;
          break;
        }
        const index = this.bareExpression(alternative.node);
        if (index === undefined) throw new Error('snice: <else-if> requires a condition expression.');
        const alternativeCondition = await resolveServerValueAsync(
          values[index],
          { type: 'node', async: true }
        );
        if (serverTruthy(alternativeCondition)) {
          selected = alternative.children;
          break;
        }
      }
    }
    return this.boundary('if', await this.renderNodesAsync(selected, values));
  }

  private renderCase(node: Extract<ServerNode, { kind: 'element' }>, values: readonly unknown[]): string {
    const valueIndex = this.bareExpression(node);
    if (valueIndex === undefined) throw new Error('snice: <case> requires a value expression.');
    const value = serverDirectiveValue(values[valueIndex], { type: 'node', async: false });
    let fallback: readonly ServerNode[] = [];
    let selected: readonly ServerNode[] | undefined;
    const defaultCount = node.children.filter(child =>
      child.kind === 'element' && child.tag.toLowerCase() === 'default'
    ).length;
    if (defaultCount > 1) throw new Error('snice: <case> may contain only one <default> branch.');
    this.validateCaseChildren(node.children);
    for (const child of node.children) {
      if (child.kind !== 'element') continue;
      const tag = child.tag.toLowerCase();
      if (tag === 'default') {
        fallback = child.children;
        continue;
      }
      if (tag !== 'when') continue;
      const dynamicIndex = this.bareExpression(child);
      if (dynamicIndex !== undefined) {
        const expected = serverDirectiveValue(values[dynamicIndex], { type: 'node', async: false });
        if (value !== noChange && expected !== noChange && Object.is(value, expected)) selected = child.children;
      } else {
        const staticValue = child.attributes.find(attribute => attribute.name.toLowerCase() === 'value');
        const expected = staticValue?.value?.map(segment => typeof segment === 'string' ? segment : '').join('') ?? '';
        if (String(value) === expected) selected = child.children;
      }
      if (selected) break;
    }
    return this.boundary('case', this.renderNodes(selected || fallback, values));
  }

  private async renderCaseAsync(
    node: Extract<ServerNode, { kind: 'element' }>,
    values: readonly unknown[]
  ): Promise<string> {
    const valueIndex = this.bareExpression(node);
    if (valueIndex === undefined) throw new Error('snice: <case> requires a value expression.');
    const value = await resolveServerValueAsync(values[valueIndex], { type: 'node', async: true });
    let fallback: readonly ServerNode[] = [];
    let selected: readonly ServerNode[] | undefined;
    const defaultCount = node.children.filter(child =>
      child.kind === 'element' && child.tag.toLowerCase() === 'default'
    ).length;
    if (defaultCount > 1) throw new Error('snice: <case> may contain only one <default> branch.');
    this.validateCaseChildren(node.children);
    for (const child of node.children) {
      if (child.kind !== 'element') continue;
      const tag = child.tag.toLowerCase();
      if (tag === 'default') {
        fallback = child.children;
        continue;
      }
      if (tag !== 'when') continue;
      const dynamicIndex = this.bareExpression(child);
      if (dynamicIndex !== undefined) {
        const expected = await resolveServerValueAsync(
          values[dynamicIndex],
          { type: 'node', async: true }
        );
        if (value !== noChange && expected !== noChange && Object.is(value, expected)) selected = child.children;
      } else {
        const staticValue = child.attributes.find(attribute => attribute.name.toLowerCase() === 'value');
        const expected = staticValue?.value?.map(segment => typeof segment === 'string' ? segment : '').join('') ?? '';
        if (String(value) === expected) selected = child.children;
      }
      if (selected) break;
    }
    return this.boundary('case', await this.renderNodesAsync(selected || fallback, values));
  }

  private validateCaseChildren(children: readonly ServerNode[]): void {
    for (const child of children) {
      if (
        child.kind === 'comment' &&
        child.segments.every(segment => typeof segment === 'string')
      ) continue;
      if (
        child.kind === 'text' &&
        child.segments.every(segment => typeof segment === 'string' && !segment.trim())
      ) continue;
      if (child.kind === 'element') {
        const tag = child.tag.toLowerCase();
        if (tag === 'when' || tag === 'default') continue;
        throw new Error('snice: <case> may contain only direct <when> and <default> branches.');
      }
      throw new Error('snice: content inside <case> must be nested in a <when> or <default> branch.');
    }
  }

  private renderComponent(node: Extract<ServerNode, { kind: 'element' }>, values: readonly unknown[]): string {
    const index = this.bareExpression(node);
    if (index === undefined) throw new Error('snice: <component> requires a tag expression.');
    const value = serverDirectiveValue(values[index], { type: 'node', async: false });
    if (value === nothing || value === noChange || value == null || value === false) return this.boundary('component', '');
    if (typeof value !== 'string' || !/^[a-z][a-z0-9._-]*$/i.test(value) || value.toLowerCase() === 'component') {
      throw new TypeError('snice: <component> expects a valid non-virtual element tag name string.');
    }
    const attributes = node.attributes.filter(attribute => this.bareExpression({ ...node, attributes: [attribute] }) === undefined);
    const start = `<${value}${this.renderAttributes(attributes, values)}>`;
    const rendered = node.namespace === 'html' && voidElements.has(value.toLowerCase())
      ? start
      : `${start}${this.renderNodes(node.children, values)}</${value}>`;
    return this.boundary('component', rendered);
  }

  private async renderComponentAsync(
    node: Extract<ServerNode, { kind: 'element' }>,
    values: readonly unknown[]
  ): Promise<string> {
    const index = this.bareExpression(node);
    if (index === undefined) throw new Error('snice: <component> requires a tag expression.');
    const value = await resolveServerValueAsync(values[index], { type: 'node', async: true });
    if (value === nothing || value === noChange || value == null || value === false) return this.boundary('component', '');
    if (typeof value !== 'string' || !/^[a-z][a-z0-9._-]*$/i.test(value) || value.toLowerCase() === 'component') {
      throw new TypeError('snice: <component> expects a valid non-virtual element tag name string.');
    }
    const attributes = node.attributes.filter(attribute => this.bareExpression({ ...node, attributes: [attribute] }) === undefined);
    const start = `<${value}${await this.renderAttributesAsync(attributes, values)}>`;
    const rendered = node.namespace === 'html' && voidElements.has(value.toLowerCase())
      ? start
      : `${start}${await this.renderNodesAsync(node.children, values)}</${value}>`;
    return this.boundary('component', rendered);
  }

  private renderAttributes(attributes: readonly ServerAttribute[], values: readonly unknown[]): string {
    const state: AttributeState = { values: new Map(), serialized: new Set(), classToggles: new Map(), styleValues: new Map() };
    for (const attribute of attributes) this.applyAttribute(attribute, values, state);

    return this.serializeAttributeState(state);
  }

  private async renderAttributesAsync(
    attributes: readonly ServerAttribute[],
    values: readonly unknown[]
  ): Promise<string> {
    const state: AttributeState = { values: new Map(), serialized: new Set(), classToggles: new Map(), styleValues: new Map() };
    for (const attribute of attributes) await this.applyAttributeAsync(attribute, values, state);
    return this.serializeAttributeState(state);
  }

  private serializeAttributeState(state: AttributeState): string {
    const existingClass = state.values.get('class');
    const classes = new Set((existingClass || '').split(/\s+/).filter(Boolean));
    for (const [name, enabled] of state.classToggles) enabled ? classes.add(name) : classes.delete(name);
    if (classes.size) state.values.set('class', [...classes].join(' '));
    else if (existingClass !== undefined) state.values.set('class', '');
    state.serialized.delete('class');

    let style = state.values.get('style') || '';
    for (const [name, value] of state.styleValues) {
      style = style.replace(new RegExp(`(?:^|;)\\s*${name.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\s*:[^;]*;?`, 'g'), '');
      if (value !== null) style += `${style.trim() && !style.trimEnd().endsWith(';') ? ';' : ''}${name}:${value};`;
    }
    if (style || state.values.has('style')) state.values.set('style', style);
    state.serialized.delete('style');

    let output = '';
    for (const [name, value] of state.values) {
      if (value === null) output += ` ${name}`;
      else output += ` ${name}="${state.serialized.has(name) ? value : escapeAttribute(value)}"`;
    }
    return output;
  }

  private applyAttribute(attribute: ServerAttribute, values: readonly unknown[], state: AttributeState): void {
    const bareIndex = attribute.value === null && attribute.name.includes(TOKEN_START)
      ? Number(attribute.name.slice(TOKEN_START.length, -TOKEN_END.length))
      : undefined;
    if (bareIndex !== undefined && Number.isInteger(bareIndex)) {
      const result = serverDirectiveValue(values[bareIndex], { type: 'element', async: false });
      if (isDirectiveServerResult(result)) this.applySpread(result, state);
      else if (result !== nothing && result !== noChange && result != null) {
        throw new TypeError(
          'snice: an SSR expression in an opening tag must be an element directive ' +
          '(for example ref(), use(), props(), attrs(), or events()).'
        );
      }
      return;
    }

    const name = attribute.name;
    const lower = name.toLowerCase();
    if (name.startsWith('@')) return;
    const single = expressionIndex(attribute);
    if (name.startsWith('.') && !lower.startsWith('...')) {
      if (single !== undefined) this.applyProperty(name.slice(1), serverDirectiveValue(values[single], { type: 'property', name: name.slice(1), async: false }), state);
      return;
    }
    if (name.startsWith('?')) {
      const value = single === undefined ? false : serverDirectiveValue(values[single], { type: 'boolean-attribute', name: name.slice(1), async: false });
      if (value === noChange) return;
      if (value && value !== nothing) state.values.set(name.slice(1), '');
      else state.values.delete(name.slice(1));
      return;
    }
    if (lower.startsWith('class:')) {
      const value = single === undefined ? false : serverDirectiveValue(values[single], { type: 'class', name: name.slice(6), async: false });
      if (value === noChange) return;
      state.classToggles.set(name.slice(6), value !== nothing && Boolean(value));
      return;
    }
    if (lower.startsWith('style:')) {
      const value = single === undefined ? null : serverDirectiveValue(values[single], { type: 'style', name: name.slice(6), async: false });
      if (value === noChange) return;
      state.styleValues.set(name.slice(6), value === nothing || value == null || value === false ? null : String(value));
      return;
    }
    if (lower.startsWith('...')) {
      const value = single === undefined ? undefined : serverDirectiveValue(values[single], { type: 'spread', name: name.slice(3), async: false });
      const kind = spreadKind(name.slice(3));
      this.applySpread({ _$serverDirective$: Symbol.for('snice:directive-server-result'), kind, value } as DirectiveServerResult, state);
      return;
    }

    if (attribute.value === null) {
      state.values.set(name, null);
      state.serialized.add(name);
      return;
    }
    let result = '';
    let remove = false;
    for (const segment of attribute.value) {
      if (typeof segment === 'string') result += segment;
      else {
        const value = serverDirectiveValue(values[segment.expression], { type: 'attribute', name, async: false });
        if (value === nothing) remove = true;
        else if (value === noChange && single !== undefined) return;
        else if (value !== noChange) result += escapeAttribute(value ?? '');
      }
    }
    if (remove) {
      state.values.delete(name);
      state.serialized.delete(name);
    } else {
      state.values.set(name, result);
      state.serialized.add(name);
    }
  }

  private async applyAttributeAsync(
    attribute: ServerAttribute,
    values: readonly unknown[],
    state: AttributeState
  ): Promise<void> {
    const bareIndex = attribute.value === null && attribute.name.includes(TOKEN_START)
      ? Number(attribute.name.slice(TOKEN_START.length, -TOKEN_END.length))
      : undefined;
    if (bareIndex !== undefined && Number.isInteger(bareIndex)) {
      const result = await resolveServerValueAsync(values[bareIndex], { type: 'element', async: true });
      if (isDirectiveServerResult(result)) this.applySpread(result, state);
      else if (result !== nothing && result !== noChange && result != null) {
        throw new TypeError(
          'snice: an SSR expression in an opening tag must be an element directive ' +
          '(for example ref(), use(), props(), attrs(), or events()).'
        );
      }
      return;
    }

    const name = attribute.name;
    const lower = name.toLowerCase();
    if (name.startsWith('@')) return;
    const single = expressionIndex(attribute);
    if (name.startsWith('.') && !lower.startsWith('...')) {
      if (single !== undefined) {
        this.applyProperty(
          name.slice(1),
          await resolveServerValueAsync(
            values[single],
            { type: 'property', name: name.slice(1), async: true }
          ),
          state
        );
      }
      return;
    }
    if (name.startsWith('?')) {
      const value = single === undefined
        ? false
        : await resolveServerValueAsync(
            values[single],
            { type: 'boolean-attribute', name: name.slice(1), async: true }
          );
      if (value === noChange) return;
      if (value && value !== nothing) state.values.set(name.slice(1), '');
      else state.values.delete(name.slice(1));
      return;
    }
    if (lower.startsWith('class:')) {
      const value = single === undefined
        ? false
        : await resolveServerValueAsync(
            values[single],
            { type: 'class', name: name.slice(6), async: true }
          );
      if (value === noChange) return;
      state.classToggles.set(name.slice(6), value !== nothing && Boolean(value));
      return;
    }
    if (lower.startsWith('style:')) {
      const value = single === undefined
        ? null
        : await resolveServerValueAsync(
            values[single],
            { type: 'style', name: name.slice(6), async: true }
          );
      if (value === noChange) return;
      state.styleValues.set(name.slice(6), value === nothing || value == null || value === false ? null : String(value));
      return;
    }
    if (lower.startsWith('...')) {
      const value = single === undefined
        ? undefined
        : await resolveServerValueAsync(
            values[single],
            { type: 'spread', name: name.slice(3), async: true }
          );
      const kind = spreadKind(name.slice(3));
      this.applySpread({ _$serverDirective$: Symbol.for('snice:directive-server-result'), kind, value } as DirectiveServerResult, state);
      return;
    }

    if (attribute.value === null) {
      state.values.set(name, null);
      state.serialized.add(name);
      return;
    }
    let result = '';
    let remove = false;
    for (const segment of attribute.value) {
      if (typeof segment === 'string') result += segment;
      else {
        const value = await resolveServerValueAsync(
          values[segment.expression],
          { type: 'attribute', name, async: true }
        );
        if (value === nothing) remove = true;
        else if (value === noChange && single !== undefined) return;
        else if (value !== noChange) result += escapeAttribute(value ?? '');
      }
    }
    if (remove) {
      state.values.delete(name);
      state.serialized.delete(name);
    } else {
      state.values.set(name, result);
      state.serialized.add(name);
    }
  }

  private applyProperty(name: string, value: unknown, state: AttributeState): void {
    if (isDirectiveServerResult(value)) {
      this.applySpread(value, state);
      return;
    }
    if (value === nothing || value === noChange || value == null || value === false) return;
    state.serialized.delete(name);
    if (['value', 'name', 'type', 'placeholder', 'title'].includes(name)) state.values.set(name, String(value));
    else if (['checked', 'selected', 'disabled', 'readonly', 'multiple', 'required'].includes(name) && value) state.values.set(name, '');
  }

  private applySpread(result: DirectiveServerResult, state: AttributeState): void {
    if (result.kind === 'boundary') return;
    const value = result.value;
    if (value == null || value === nothing || value === noChange) return;
    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new TypeError(`snice: SSR ${result.kind} spread expects an object.`);
    }
    if (result.kind === 'events') return;
    for (const [name, entry] of Object.entries(value as Record<string, unknown>)) {
      if (result.kind === 'attributes' && !attributeNamePattern.test(name)) {
        throw new TypeError(`snice: invalid SSR spread attribute name "${name}".`);
      }
      if (result.kind === 'properties') this.applyProperty(name, entry, state);
      else if (entry === nothing || entry == null || entry === false) {
        state.values.delete(name);
        state.serialized.delete(name);
      } else {
        state.values.set(name, entry === true ? '' : String(entry));
        state.serialized.delete(name);
      }
    }
  }
}

/** Render a synchronous template value without requiring a DOM implementation. */
export function renderToString(value: TemplateResult, options: ServerRenderOptions = {}): string {
  if (!isTemplateResult(value)) throw new TypeError('snice: renderToString() expects an html`` or svg`` template result.');
  return new ServerRenderer(options).render(value);
}

/** Resolve promises, async iterables, and async-capable directives during SSR. */
export async function renderToStringAsync(
  value: TemplateResult,
  options: ServerRenderOptions = {}
): Promise<string> {
  if (!isTemplateResult(value)) {
    throw new TypeError('snice: renderToStringAsync() expects an html`` or svg`` template result.');
  }
  return new ServerRenderer(options).renderAsync(value);
}

function renderStyles(styles: ServerElementOptions['styles']): string {
  if (styles == null) return '';
  const values = Array.isArray(styles) ? styles : [styles];
  return values.map(value => {
    const cssText = isCSSResult(value) ? value.cssText : String(value);
    return `<style data-snice-style>${cssText.replace(/<\/style/gi, '<\\/style')}</style>`;
  }).join('');
}

function validateElementOptions(options: ServerElementOptions): void {
  if (options.renderRoot !== undefined && options.renderRoot !== 'shadow' && options.renderRoot !== 'light') {
    throw new TypeError('snice: SSR renderRoot must be "shadow" or "light".');
  }
  if (
    options.shadow !== undefined && options.shadow !== false &&
    options.shadow !== 'open' && options.shadow !== 'closed'
  ) {
    throw new TypeError('snice: SSR shadow must be "open", "closed", or false.');
  }
  if (
    options.renderRoot === 'light' && typeof options.shadow === 'string' ||
    options.renderRoot === 'shadow' && options.shadow === false
  ) {
    throw new TypeError('snice: SSR renderRoot and shadow options select conflicting render roots.');
  }
}

/**
 * Render a hydratable custom-element host, optionally with declarative shadow
 * DOM. Fetch data before calling this function; resource() renders its pending
 * branch during synchronous SSR.
 */
export function renderElementToString(
  tagName: string,
  value: TemplateResult,
  options: ServerElementOptions = {}
): string {
  if (!/^[a-z][a-z0-9._-]*-[a-z0-9._-]+$/i.test(tagName)) {
    throw new TypeError('snice: renderElementToString() expects a valid custom-element tag name.');
  }
  validateElementOptions(options);
  const attributes = new Map<string, string | null>();
  for (const [name, entry] of Object.entries(options.attributes || {})) {
    if (!attributeNamePattern.test(name)) throw new TypeError(`snice: invalid SSR attribute name "${name}".`);
    if (entry === nothing || entry == null || entry === false) continue;
    attributes.set(name, entry === true ? null : String(entry));
  }
  if (options.hydratable !== false) attributes.set('data-snice-hydrate', null);
  const renderedAttributes = [...attributes].map(([name, entry]) =>
    entry === null ? ` ${name}` : ` ${name}="${escapeAttribute(entry)}"`
  ).join('');
  const content = renderStyles(options.styles) + renderToString(value, options);
  if (options.renderRoot === 'light' || options.shadow === false) {
    return `<${tagName}${renderedAttributes}>${content}</${tagName}>`;
  }
  const shadowMode = typeof options.shadow === 'string' ? options.shadow : 'open';
  const delegatesFocus = options.delegatesFocus ? ' shadowrootdelegatesfocus' : '';
  return `<${tagName}${renderedAttributes}><template shadowrootmode="${shadowMode}"${delegatesFocus}>${content}</template></${tagName}>`;
}

/** Async counterpart to renderElementToString(). */
export async function renderElementToStringAsync(
  tagName: string,
  value: TemplateResult,
  options: ServerElementOptions = {}
): Promise<string> {
  if (!/^[a-z][a-z0-9._-]*-[a-z0-9._-]+$/i.test(tagName)) {
    throw new TypeError('snice: renderElementToStringAsync() expects a valid custom-element tag name.');
  }
  validateElementOptions(options);
  const attributes = new Map<string, string | null>();
  for (const [name, entry] of Object.entries(options.attributes || {})) {
    if (!attributeNamePattern.test(name)) throw new TypeError(`snice: invalid SSR attribute name "${name}".`);
    if (entry === nothing || entry == null || entry === false) continue;
    attributes.set(name, entry === true ? null : String(entry));
  }
  if (options.hydratable !== false) attributes.set('data-snice-hydrate', null);
  const renderedAttributes = [...attributes].map(([name, entry]) =>
    entry === null ? ` ${name}` : ` ${name}="${escapeAttribute(entry)}"`
  ).join('');
  const content = renderStyles(options.styles) + await renderToStringAsync(value, options);
  if (options.renderRoot === 'light' || options.shadow === false) {
    return `<${tagName}${renderedAttributes}>${content}</${tagName}>`;
  }
  const shadowMode = typeof options.shadow === 'string' ? options.shadow : 'open';
  const delegatesFocus = options.delegatesFocus ? ' shadowrootdelegatesfocus' : '';
  return `<${tagName}${renderedAttributes}><template shadowrootmode="${shadowMode}"${delegatesFocus}>${content}</template></${tagName}>`;
}
