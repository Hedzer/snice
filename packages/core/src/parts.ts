
import { TemplateResult, CSSResult, HTML_RESULT, CSS_RESULT, isTemplateResult, isUnsafeHTML, UnsafeHTML, nothing, Nothing } from './template';
import { isRepeatResult } from './repeat';
import { findRenderHost } from './render-root';
import { PRE_UPGRADE_PROPERTY_BINDINGS } from './symbols';

// Unique marker for dynamic parts
// This parses as a comment node but doesn't get escaped in attributes
const marker = `snice$${Math.random().toFixed(9).slice(2)}$`;
const markerMatch = '?' + marker;
// A true comment, not a processing instruction (<?...>): in HTML content both
// parse to the same comment node, but PIs are dropped inside foreign content
// (<svg>), which would silently kill any node binding inside an svg block.
const nodeMarker = `<!--${markerMatch}-->`;
// Escape the `$` chars — as a bare RegExp they'd be end anchors and the
// pattern would never match, so marker-bearing text/comments never split.
const markerRegex = new RegExp(marker.replace(/\$/g, '\\$'), 'g');

// Template cache - templates with same string array can be reused
const templateCache = new WeakMap<TemplateStringsArray, Template>();

// Sentinel for "not yet set" - distinct from undefined/null
const NOT_COMMITTED = Symbol('not-committed');

function markPreUpgradePropertyBinding(element: Element, propertyName: string): void {
  const tagName = element.localName;
  if (!tagName?.includes('-')) return;
  const registry = element.ownerDocument?.defaultView?.customElements ?? globalThis.customElements;
  if (registry?.get(tagName)) return;
  const target = element as any;
  if (!target[PRE_UPGRADE_PROPERTY_BINDINGS]) target[PRE_UPGRADE_PROPERTY_BINDINGS] = new Set<string>();
  target[PRE_UPGRADE_PROPERTY_BINDINGS].add(propertyName);
}

// noChange sentinel - preserves the currently committed value
export const noChange = Symbol.for('snice:no-change');
export type NoChange = typeof noChange;

// live() wrapper - marks a property binding value for comparison against the
// actual DOM property instead of the last committed value
const LIVE_MARKER = Symbol.for('snice:live');

interface LiveValue {
  readonly _$liveMarker$: typeof LIVE_MARKER;
  readonly value: unknown;
}

/**
 * Wrap a property binding value so the commit compares against the element's
 * CURRENT DOM property rather than the last committed value. Use for inputs
 * whose DOM state the user can change out from under the binding:
 *
 * ```typescript
 * html`<input .value=${live(this.text)} />`
 * ```
 *
 * Without live(), re-rendering with an unchanged bound value skips the DOM
 * write, leaving user-typed text in place.
 */
export function live(value: unknown): LiveValue {
  return { _$liveMarker$: LIVE_MARKER, value };
}

function isLive(value: any): value is LiveValue {
  return value && value._$liveMarker$ === LIVE_MARKER;
}

/**
 * Check if value is a primitive (can be compared with ===)
 */
const isPrimitive = (value: unknown): boolean =>
  value === null || (typeof value !== 'object' && typeof value !== 'function');

/**
 * Check if value is iterable (array or has Symbol.iterator)
 */
const isIterable = (value: unknown): value is Iterable<unknown> =>
  Array.isArray(value) || typeof (value as any)?.[Symbol.iterator] === 'function';

const isPromiseLike = (value: unknown): value is PromiseLike<unknown> =>
  !!value && typeof (value as PromiseLike<unknown>).then === 'function';

const isAsyncIterable = (value: unknown): value is AsyncIterable<unknown> =>
  !!value && typeof (value as AsyncIterable<unknown>)[Symbol.asyncIterator] === 'function';

/**
 * A prepared template ready for rendering
 */
class Template {
  parts: TemplatePart[] = [];
  element: HTMLTemplateElement;
  /**
   * Value index of a `key=${...}` binding in this template, or -1 if unkeyed.
   * Used by keyed list reconciliation in NodePart._commitIterable.
   */
  keyIndex = -1;

  constructor(result: TemplateResult, element: HTMLTemplateElement, attrNamesForParts: string[]) {
    this.element = element;
    const walker = document.createTreeWalker(
      element.content,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT
    );

    let partIndex = 0;
    const nodesToRemove: Node[] = [];
    let node: Node | null;

    while ((node = walker.nextNode()) !== null) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();
        const parentTag = element.parentElement?.tagName.toLowerCase();

        if ((tagName === 'else' || tagName === 'else-if') && parentTag !== 'if') {
          throw new Error(`snice: <${tagName}> must be a direct child of <if>.`);
        }
        if ((tagName === 'when' || tagName === 'default') && parentTag !== 'case') {
          throw new Error(`snice: <${tagName}> must be a direct child of <case>.`);
        }

        // Handle virtual elements: <if>, <else-if>, <case>, <when>
        // Keep them in the DOM with display:contents for now
        // Will optimize later with proper template extraction
        if (tagName === 'if') {
          // <if value="${condition}">children</if>
          const valueAttr = element.getAttribute('value');

          if (valueAttr && valueAttr.includes(marker)) {
            // Remove the value attribute
            element.removeAttribute('value');

            this.parts.push({
              type: 'conditional-if',
              index: partIndex++,
              element // Keep the <if> element
            });

            // Continue processing children normally
          } else {
            throw new Error('snice: <if> requires a condition expression.');
          }
          continue;
        }

        // Handle <case> element
        if (tagName === 'case') {
          // <case value="${value}">children</case>
          const valueAttr = element.getAttribute('value');

          if (valueAttr && valueAttr.includes(marker)) {
            for (const child of Array.from(element.childNodes)) {
              if (child.nodeType === Node.ELEMENT_NODE) {
                const branchTag = (child as Element).tagName.toLowerCase();
                if (branchTag !== 'when' && branchTag !== 'default') {
                  throw new Error('snice: <case> may contain only direct <when> and <default> branches.');
                }
              } else if (
                child.nodeType === Node.TEXT_NODE && child.textContent?.trim() ||
                child.nodeType === Node.COMMENT_NODE && (child as Comment).data.includes(marker)
              ) {
                throw new Error('snice: content inside <case> must be nested in a <when> or <default> branch.');
              }
            }
            // Remove the value attribute
            element.removeAttribute('value');

            this.parts.push({
              type: 'conditional-case',
              index: partIndex++,
              element // Keep the <case> element
            });

            // Continue processing children normally
          } else {
            throw new Error('snice: <case> requires a value expression.');
          }
          continue;
        }

        if (tagName === 'else-if') {
          const valueAttr = element.getAttribute('value');
          if (valueAttr && valueAttr.includes(marker)) {
            element.removeAttribute('value');
            this.parts.push({
              type: 'conditional-else-if',
              index: partIndex++,
              element
            });
          } else {
            throw new Error('snice: <else-if> requires a condition expression.');
          }
          continue;
        }

        if (tagName === 'when') {
          const valueAttr = element.getAttribute('value');
          if (valueAttr && valueAttr.includes(marker)) {
            element.removeAttribute('value');
            this.parts.push({
              type: 'conditional-when',
              index: partIndex++,
              element
            });
          }
          continue;
        }

        if (element.hasAttributes()) {
          const attributes = element.attributes;
          const attrsToRemove: Attr[] = [];

          for (let i = 0; i < attributes.length; i++) {
            const attr = attributes[i];
            const value = attr.value;

            // Check for attribute bindings
            if (value.includes(marker)) {
              attrsToRemove.push(attr);

              // Get original attribute name with preserved case
              const originalName = attrNamesForParts[partIndex] || attr.name;

              // Extract static string segments by splitting on marker
              const attrStrings = value.split(marker);

              // Number of expressions = number of markers = attrStrings.length - 1
              const expressionCount = attrStrings.length - 1;

              // Property/boolean/event bindings take a SINGLE expression — they
              // can't concatenate static text (a `.prop` is an object, not a
              // string). They consume the first expression; any static text or
              // extra expressions are ignored. But the value index must still
              // advance by the true marker count, or every later binding shifts.
              const isSingleExpressionBinding =
                /^@@?|^[.?]/.test(originalName) ||
                originalName.startsWith('...') ||
                originalName.startsWith('class:') ||
                originalName.startsWith('style:');
              if (isSingleExpressionBinding) {
                const hasStaticText = attrStrings.some((s) => s !== '');
                if (expressionCount > 1 || hasStaticText) {
                  console.warn(
                    `snice: binding "${originalName}" takes a single expression; ` +
                    `static text and extra interpolations are ignored. ` +
                    `Use a plain attribute for string interpolation.`
                  );
                }
              }

              if (originalName.startsWith('...')) {
                const spreadName = originalName.slice(3).toLowerCase();
                if (!['props', 'properties', 'attrs', 'attributes', 'events'].includes(spreadName)) {
                  throw new Error(
                    `snice: unknown spread binding "${originalName}". ` +
                    'Use ...props, ...attrs, or ...events.'
                  );
                }
                this.parts.push({
                  type: 'spread',
                  index: partIndex,
                  name: spreadName,
                  element
                });
                partIndex += expressionCount;
              } else if (originalName.startsWith('class:')) {
                if (!originalName.slice(6)) throw new Error('snice: class: binding requires a class name.');
                this.parts.push({
                  type: 'class',
                  index: partIndex,
                  name: originalName.slice(6),
                  element
                });
                partIndex += expressionCount;
              } else if (originalName.startsWith('style:')) {
                if (!originalName.slice(6)) throw new Error('snice: style: binding requires a CSS property name.');
                this.parts.push({
                  type: 'style',
                  index: partIndex,
                  name: originalName.slice(6),
                  element
                });
                partIndex += expressionCount;
              } else if (originalName.startsWith('@@')) {
                if (!originalName.slice(2).split('|')[0]) throw new Error('snice: event binding requires an event name.');
                // Escaped event binding for events with @ in the name (e.g., @@snice/event -> @snice/event)
                this.parts.push({
                  type: 'event',
                  index: partIndex,
                  name: originalName.slice(1), // Keep the @ in the event name
                  element
                });
                partIndex += expressionCount;
              } else if (originalName.startsWith('@')) {
                if (!originalName.slice(1).split('|')[0]) throw new Error('snice: event binding requires an event name.');
                // Event binding (single value only)
                this.parts.push({
                  type: 'event',
                  index: partIndex,
                  name: originalName.slice(1),
                  element
                });
                partIndex += expressionCount;
              } else if (originalName.startsWith('.')) {
                if (!originalName.slice(1)) throw new Error('snice: property binding requires a property name.');
                // Property binding (single value only)
                this.parts.push({
                  type: 'property',
                  index: partIndex,
                  name: originalName.slice(1),
                  element
                });
                partIndex += expressionCount;
              } else if (originalName.startsWith('?')) {
                if (!originalName.slice(1)) throw new Error('snice: boolean binding requires an attribute name.');
                // Boolean attribute (single value only)
                this.parts.push({
                  type: 'boolean-attribute',
                  index: partIndex,
                  name: originalName.slice(1),
                  element
                });
                partIndex += expressionCount;
              } else {
                // Regular attribute - supports multiple interpolations
                // Store static string segments for interpolation
                this.parts.push({
                  type: 'attribute',
                  index: partIndex,
                  name: attr.name,
                  element,
                  attrStrings
                });
                // Increment by number of expressions consumed
                partIndex += expressionCount;
              }
            }
          }

          // Remove marker attributes
          for (const attr of attrsToRemove) {
            element.removeAttribute(attr.name);
          }
        }
      } else if (node.nodeType === Node.COMMENT_NODE) {
        const comment = node as Comment;
        // Check for marker match (processing instruction becomes comment)
        if (comment.data === markerMatch) {
          // Node part
          const parent = comment.parentNode!;
          const endNode = document.createComment('');
          parent.insertBefore(endNode, comment.nextSibling);

          this.parts.push({
            type: 'node',
            index: partIndex++,
            startNode: comment,
            endNode
          });
        } else if (comment.data.includes(marker)) {
          // Binding(s) inside an authored HTML comment (<!-- ${x} -->).
          // Render values into the comment text; critically, consume the
          // right number of value indices so later parts stay aligned.
          const commentStrings = comment.data.split(markerRegex);

          this.parts.push({
            type: 'comment',
            index: partIndex,
            startNode: comment,
            attrStrings: commentStrings
          });
          partIndex += commentStrings.length - 1;
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        const text = node as Text;
        const data = text.data;

        if (data.includes(marker)) {
          // Split text node at markers
          const parent = text.parentNode!;
          const parts = data.split(markerRegex);
          const lastIndex = parts.length - 1;

          for (let i = 0; i < lastIndex; i++) {
            parent.insertBefore(document.createTextNode(parts[i]), text);
            const comment = document.createComment('');
            const endNode = document.createComment('');
            parent.insertBefore(comment, text);
            parent.insertBefore(endNode, text);

            this.parts.push({
              type: 'node',
              index: partIndex++,
              startNode: comment,
              endNode
            });
          }

          // Last part
          if (parts[lastIndex] !== '') {
            text.data = parts[lastIndex];
          } else {
            nodesToRemove.push(text);
          }
        }
      }
    }

    // Remove marker nodes
    for (const node of nodesToRemove) {
      node.parentNode?.removeChild(node);
    }

    // Record the value index of a `key=${...}` binding (first one wins) so
    // list rendering can associate DOM with keys instead of indices.
    for (const part of this.parts) {
      if (part.type === 'attribute' && part.name === 'key') {
        this.keyIndex = part.index;
        break;
      }
    }
  }
}

interface TemplatePart {
  type: 'node' | 'attribute' | 'property' | 'boolean-attribute' | 'event' | 'class' | 'style' | 'spread' | 'conditional-if' | 'conditional-else-if' | 'conditional-case' | 'conditional-when' | 'comment';
  index: number;
  name?: string;
  element?: Element;
  startNode?: Comment;
  endNode?: Comment;
  attrStrings?: string[]; // Static string segments for attribute/comment interpolation
}

/**
 * Prepare a template for rendering
 *
 * Uses state tracking to correctly handle multi-interpolation in attributes.
 * Tracks whether we're inside a tag and inside a quoted attribute value.
 */
function prepareTemplate(result: TemplateResult): Template {
  // Check cache first
  const { strings } = result;
  const cached = templateCache.get(strings);
  if (cached) {
    return cached;
  }

  // Build HTML with markers and extract original attribute names
  const htmlParts: string[] = [];
  const attrNamesForParts: string[] = [];

  // State tracking for multi-interpolation support
  let inTag = false;           // Inside a tag (between < and >)
  let inAttrValue = false;     // Inside a quoted attribute value
  let inComment = false;       // Inside an HTML comment (<!-- ... -->)
  let attrQuoteChar = '';      // The quote character (' or ")
  let currentAttrName = '';    // The current attribute name

  for (let i = 0; i < strings.length; i++) {
    const str = strings[i];
    htmlParts.push(str);

    if (i < strings.length - 1) {
      // Update state by scanning the string
      for (let j = 0; j < str.length; j++) {
        const char = str[j];

        if (inComment) {
          // Only the closing --> matters inside a comment
          if (char === '-' && str.startsWith('-->', j)) {
            inComment = false;
            j += 2;
          }
        } else if (!inTag) {
          // Looking for tag start (or comment start)
          if (char === '<') {
            if (str.startsWith('<!--', j)) {
              inComment = true;
              j += 3;
            } else if (/[A-Za-z!/?]/.test(str[j + 1] || '')) {
              inTag = true;
            }
          }
        } else if (!inAttrValue) {
          // Inside tag, but not in attribute value
          if (char === '>') {
            inTag = false;
          } else if (char === '"' || char === "'") {
            inAttrValue = true;
            attrQuoteChar = char;
          } else if (char === '=') {
            // Extract attribute name (look backwards for it).
            // Includes `~` for the "any-modifier" keyboard prefix
            // (e.g. `@keydown.~enter`) so it isn't truncated to `.enter`.
            let attrStart = j - 1;
            while (attrStart >= 0 && /[\w\-\.@\?/:\+~|]/.test(str[attrStart])) {
              attrStart--;
            }
            currentAttrName = str.substring(attrStart + 1, j).trim();
          }
        } else {
          // Inside quoted attribute value
          if (char === attrQuoteChar) {
            inAttrValue = false;
            attrQuoteChar = '';
          }
        }
      }

      // Now determine what kind of marker to insert based on current state
      if (inComment) {
        // Binding inside an HTML comment — insert a plain marker into the
        // comment text. The Template scanner turns it into a CommentPart so
        // the value index stays aligned (a swallowed marker would shift every
        // binding after the comment).
        attrNamesForParts.push('');
        htmlParts.push(marker);
      } else if (inAttrValue) {
        // We're inside a quoted attribute value - this is an attribute binding
        // For subsequent interpolations in same attribute, keep using same attr name
        attrNamesForParts.push(currentAttrName);
        htmlParts.push(marker);
      } else if (inTag) {
        // Inside tag but not in attr value - check for special cases
        // Check if this is start of attribute value (= at end of string)
        const trimmed = str.trimEnd();
        if (trimmed.endsWith('=')) {
          // Extract attribute name (same `~` inclusion as the in-tag branch
          // above — supports `@keydown.~enter` keyboard modifier prefix).
          let attrStart = trimmed.length - 2;
          while (attrStart >= 0 && /[\w\-\.@\?\/:\+~|]/.test(trimmed[attrStart])) {
            attrStart--;
          }
          currentAttrName = trimmed.substring(attrStart + 1, trimmed.length - 1).trim();
          attrNamesForParts.push(currentAttrName);
          htmlParts.push(marker);
        } else {
          // Check if this is a meta element (<if> or <case>)
          const metaElementMatch = str.match(/<(if|else-if|case|when)\s*$/);
          if (metaElementMatch) {
            currentAttrName = 'value';
            attrNamesForParts.push('value');
            htmlParts.push(`value="${marker}"`);
          } else {
            throw new Error(
              'snice: expressions directly in opening tags are not supported; ' +
              'use an explicit attribute, property, event, class, style, or named spread binding.'
            );
          }
        }
      } else {
        // Outside any tag - this is node content
        attrNamesForParts.push('');
        htmlParts.push(nodeMarker);
      }
    }
  }

  const html = htmlParts.join('');

  const template = document.createElement('template');
  if (result.svg) {
    // Parse in the SVG namespace by wrapping, then unwrap: the parsed nodes
    // keep their namespace when moved out of the temporary <svg> element.
    template.innerHTML = `<svg>${html}</svg>`;
    const wrapper = template.content.firstElementChild!;
    while (wrapper.firstChild) {
      template.content.insertBefore(wrapper.firstChild, wrapper);
    }
    template.content.removeChild(wrapper);
  } else {
    template.innerHTML = html;
  }

  const tmpl = new Template(result, template, attrNamesForParts);
  // Cache the template for reuse
  templateCache.set(strings, tmpl);
  return tmpl;
}

/**
 * Extract the key of a list item rendered from a template with a
 * `key=${...}` binding. Returns undefined for unkeyed items.
 */
function getItemKey(item: unknown): unknown {
  if (!isTemplateResult(item)) return undefined;
  const tmpl = prepareTemplate(item as TemplateResult);
  return tmpl.keyIndex === -1 ? undefined : (item as TemplateResult).values[tmpl.keyIndex];
}

/**
 * Instance of a rendered template
 */
export class TemplateInstance {
  template: Template;
  strings: TemplateStringsArray;
  parts: Part[] = [];
  fragment: DocumentFragment | null = null;
  private conditionalParts: Array<{part: Part; index: number}> = []; // if/case parts with their indices
  private regularParts: Array<{part: Part; index: number}> = []; // all other parts with their indices

  constructor(result: TemplateResult) {
    this.template = prepareTemplate(result);
    this.strings = result.strings;
  }

  /**
   * Check if this instance uses the same template strings
   * (template identity is based on the strings array reference)
   */
  isSameTemplate(strings: TemplateStringsArray): boolean {
    return this.strings === strings;
  }

  renderFragment(): DocumentFragment {
    if (!this.fragment) {
      // First render - clone template and create parts
      this.fragment = this.template.element.content.cloneNode(true) as DocumentFragment;

      // Build a map of nodes from template to cloned fragment
      const walker = document.createTreeWalker(
        this.template.element.content,
        NodeFilter.SHOW_ALL
      );
      const clonedWalker = document.createTreeWalker(
        this.fragment,
        NodeFilter.SHOW_ALL
      );

      const nodeMap = new Map<Node, Node>();
      let templateNode = walker.currentNode;
      let clonedNode = clonedWalker.currentNode;

      while (templateNode && clonedNode) {
        nodeMap.set(templateNode, clonedNode);
        templateNode = walker.nextNode()!;
        clonedNode = clonedWalker.nextNode()!;
      }

      const dynamicWhenElements = new Set<Element>();
      for (const definition of this.template.parts) {
        if (definition.type === 'conditional-when') {
          dynamicWhenElements.add(nodeMap.get(definition.element!) as Element);
        }
      }

      for (let i = 0; i < this.template.parts.length; i++) {
        const partDef = this.template.parts[i];
        let part: Part;

        switch (partDef.type) {
          case 'node':
            const startNode = nodeMap.get(partDef.startNode!) as Comment;
            const endNode = nodeMap.get(partDef.endNode!) as Comment;
            part = new NodePart(startNode, endNode);
            break;
          case 'attribute':
            const attrElement = nodeMap.get(partDef.element!) as Element;
            part = new AttributePart(attrElement, partDef.name!, partDef.attrStrings);
            break;
          case 'property':
            const propElement = nodeMap.get(partDef.element!) as Element;
            part = new PropertyPart(propElement, partDef.name!);
            break;
          case 'boolean-attribute':
            const boolElement = nodeMap.get(partDef.element!) as Element;
            part = new BooleanAttributePart(boolElement, partDef.name!);
            break;
          case 'event':
            const eventElement = nodeMap.get(partDef.element!) as Element;
            part = new EventPart(eventElement, partDef.name!);
            break;
          case 'class':
            const classElement = nodeMap.get(partDef.element!) as Element;
            part = new ClassPart(classElement, partDef.name!);
            break;
          case 'style':
            const styleElement = nodeMap.get(partDef.element!) as HTMLElement;
            part = new StylePart(styleElement, partDef.name!);
            break;
          case 'spread':
            const spreadElement = nodeMap.get(partDef.element!) as Element;
            part = new SpreadPart(spreadElement, partDef.name!);
            break;
          case 'conditional-if':
            const conditionalIfElement = nodeMap.get(partDef.element!) as Element;
            part = new ConditionalIfPart(conditionalIfElement);
            break;
          case 'conditional-else-if':
            const conditionalElseIfElement = nodeMap.get(partDef.element!) as Element;
            part = new ConditionalElseIfPart(conditionalElseIfElement);
            break;
          case 'conditional-case':
            const conditionalCaseElement = nodeMap.get(partDef.element!) as Element;
            part = new ConditionalCasePart(conditionalCaseElement, dynamicWhenElements);
            break;
          case 'conditional-when':
            const conditionalWhenElement = nodeMap.get(partDef.element!) as Element;
            part = new ConditionalWhenPart(conditionalWhenElement);
            break;
          case 'comment':
            const commentNode = nodeMap.get(partDef.startNode!) as Comment;
            part = new CommentPart(commentNode, partDef.attrStrings!);
            break;
          default:
            throw new Error(`Unknown part type: ${(partDef as any).type}`);
        }

        this.parts.push(part);

        // Separate conditional parts from regular parts for optimized update
        // Use partDef.index (the VALUE index) not i (the part array index)
        if (
          part instanceof ConditionalIfPart ||
          part instanceof ConditionalElseIfPart ||
          part instanceof ConditionalCasePart ||
          part instanceof ConditionalWhenPart
        ) {
          this.conditionalParts.push({part, index: partDef.index});
        } else {
          this.regularParts.push({part, index: partDef.index});
        }
      }

    }

    return this.fragment;
  }

  render(values: readonly any[]): DocumentFragment {
    const fragment = this.renderFragment();
    // Commit values to parts
    this.update(values);
    return fragment;
  }

  update(values: readonly any[]): void {
    // Optimized: Process conditional parts first (if any), then regular parts
    // Using pre-separated arrays with cached indices avoids instanceof and indexOf calls

    // Process conditional parts first (they control visibility)
    for (const {part, index} of this.conditionalParts) {
      part.commit(values[index]);
    }

    // Conditions are staged above, then flushed once. This avoids transiently
    // mounting an else/default branch while later else-if/when expressions in
    // the same update are still being committed.
    const flushed = new Set<Part>();
    for (const {part} of this.conditionalParts) {
      const coordinator = part instanceof ConditionalElseIfPart
        ? part.coordinator
        : part instanceof ConditionalWhenPart
          ? part.coordinator
          : part;
      if (flushed.has(coordinator)) continue;
      flushed.add(coordinator);
      if (coordinator instanceof ConditionalIfPart || coordinator instanceof ConditionalCasePart) {
        coordinator.flush();
      }
    }

    // Then process regular parts
    let i = 0;
    for (const {part, index} of this.regularParts) {
      // AttributeParts with interpolation consume multiple values
      if (part instanceof AttributePart && part.strings !== undefined) {
        // Pass full values array and starting index for interpolation
        part.commit(values, index);
        // The part consumes (strings.length - 1) values
        // But since we're iterating by template part index, this is handled by the Template
      } else if (part instanceof CommentPart) {
        // CommentParts also consume (strings.length - 1) values
        part.commit(values, index);
      } else {
        part.commit(values[index]);
      }
    }

    // Branch switches can move event-bearing nodes between the live DOM and
    // parked fragments. Reconcile connection state after every update so
    // listeners detach while parked and reattach when their branch returns.
    let lifecycleError: unknown;
    for (const part of this.parts) {
      try {
        if (part.isConnected) part.reconnected();
        else part.disconnected();
      } catch (error) {
        lifecycleError ??= error;
      }
    }
    if (lifecycleError) throw lifecycleError;
  }

  clear(): void {
    let lifecycleError: unknown;
    for (const part of this.parts) {
      try {
        part.destroy();
      } catch (error) {
        lifecycleError ??= error;
      }
    }
    if (lifecycleError) throw lifecycleError;
  }

  disconnected(preserveEventListeners = false): void {
    let lifecycleError: unknown;
    for (const part of this.parts) {
      try {
        part.disconnected(preserveEventListeners);
      } catch (error) {
        lifecycleError ??= error;
      }
    }
    if (lifecycleError) throw lifecycleError;
  }

  reconnected(): void {
    let lifecycleError: unknown;
    for (const part of this.parts) {
      try {
        part.reconnected();
      } catch (error) {
        lifecycleError ??= error;
      }
    }
    if (lifecycleError) throw lifecycleError;
  }

}

/**
 * Base class for all parts
 */
export abstract class Part {
  abstract readonly type: string;

  get isConnected(): boolean {
    return (this as any).element?.isConnected ?? false;
  }

  disconnected(_preserveEventListeners = false): void {}

  reconnected(): void {}

  destroy(): void {
    let lifecycleError: unknown;
    try {
      this.clear();
    } catch (error) {
      lifecycleError = error;
    }
    if (lifecycleError) throw lifecycleError;
  }

  abstract commit(value: any): void;
  abstract clear(): void;
}

/**
 * NodePart handles text content and nested templates
 *
 * Lit-HTML style optimizations:
 * - Reuses TemplateInstance when same template strings are rendered
 * - Reuses text nodes when updating primitive → primitive
 * - Reuses child NodeParts when rendering arrays
 */
export class NodePart extends Part {
  readonly type = 'node' as const;
  private startNode: Comment;
  private endNode: Comment;
  private _committedValue: any = NOT_COMMITTED;
  private _itemKeys: unknown[] | null = null; // keys of the last committed iterable, when fully keyed
  private _asyncSource: PromiseLike<unknown> | AsyncIterable<unknown> | null = null;
  private _asyncVersion = 0;
  private _asyncIterator: AsyncIterator<unknown> | null = null;
  private _asyncRunning = false;
  private _asyncStarted = false;
  private _asyncCompleted = false;
  private _asyncPaused = false;
  private _committingAsyncValue = false;

  constructor(startNode: Comment, endNode: Comment) {
    super();
    this.startNode = startNode;
    this.endNode = endNode;
  }

  commit(value: any): void {
    // Handle noChange sentinel
    if (value === noChange) {
      return;
    }

    if (isPromiseLike(value) || isAsyncIterable(value)) {
      this._commitAsync(value);
      return;
    }
    if (!this._committingAsyncValue && this._asyncSource) this._cancelAsync(true);

    // Handle nothing/null/undefined/empty - clear content
    if (value === nothing || value == null || value === '') {
      if (this._committedValue !== nothing) {
        const cleanupError = this._clear();
        this._committedValue = nothing;
        if (cleanupError) throw cleanupError;
      }
      this._committedValue = nothing;
      return;
    }

    // Handle primitives (string, number, boolean, bigint, symbol)
    if (isPrimitive(value)) {
      if (value !== this._committedValue) {
        this._commitText(value);
      }
      return;
    }

    // Handle nested templates
    if (isTemplateResult(value)) {
      this._commitTemplateResult(value);
      return;
    }

    // Explicit keyed repeat() result. It feeds keys directly into the list
    // reconciler, so rendered roots do not need a synthetic key attribute or
    // wrapper element.
    if (isRepeatResult(value)) {
      if (value.values.length === 0) {
        this.commit(value.empty ?? nothing);
      } else {
        this._commitIterable(value.values, value.keys);
      }
      return;
    }

    // Handle unsafe HTML
    if (isUnsafeHTML(value)) {
      this._commitUnsafeHTML(value);
      return;
    }

    // Handle DOM nodes
    if ((value as Node).nodeType !== undefined) {
      this._commitNode(value as Node);
      return;
    }

    // Handle iterables (arrays, etc.)
    if (isIterable(value)) {
      this._commitIterable(value);
      return;
    }

    // Fallback: convert to string
    this._commitText(value);
  }

  /**
   * Commit a primitive value as text
   * OPTIMIZATION: Reuses existing text node if previous value was also primitive
   */
  private _commitText(value: any): void {
    // Try to reuse existing text node
    const canReuse =
      this._committedValue !== NOT_COMMITTED &&
      this._committedValue !== nothing &&
      isPrimitive(this._committedValue) &&
      !Array.isArray(this._committedValue);

    if (canReuse) {
      const textNode = this.startNode.nextSibling as Text;
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        textNode.data = String(value);
        this._committedValue = value;
        return;
      }
    }

    const cleanupError = this._clear();
    this._insertBefore(document.createTextNode(String(value)));
    this._committedValue = value;
    if (cleanupError) throw cleanupError;
  }

  /**
   * Commit a TemplateResult
   * OPTIMIZATION: Reuses TemplateInstance if same template strings
   */
  private _commitTemplateResult(result: TemplateResult): void {
    // Check if we can reuse the existing TemplateInstance
    const committedInstance = this._committedValue as TemplateInstance;

    if (committedInstance instanceof TemplateInstance) {
      // Check if same template by comparing strings reference
      const cachedTemplate = templateCache.get(result.strings);
      if (cachedTemplate && committedInstance.template === cachedTemplate) {
        // SAME TEMPLATE - just update values (efficient path!)
        committedInstance.update(result.values);
        return;
      }
    }

    // Different template or first render: prepare and validate the replacement
    // while it is detached. If a binding throws, the currently
    // committed range remains intact and its lifecycle stays connected.
    const instance = new TemplateInstance(result);
    const fragment = instance.renderFragment();
    try {
      instance.update(result.values);
    } catch (error) {
      instance.clear();
      throw error;
    }

    const previousValue = this._committedValue;
    const previousKeys = this._itemKeys;
    const previousFragment = this.endNode.ownerDocument.createDocumentFragment();
    let previousNode = this.startNode.nextSibling;
    while (previousNode && previousNode !== this.endNode) {
      const next = previousNode.nextSibling;
      previousFragment.appendChild(previousNode);
      previousNode = next;
    }

    this._insertBefore(fragment);
    this._committedValue = instance;
    this._itemKeys = null;
    try {
      if (this.isConnected) instance.reconnected();
    } catch (error) {
      try {
        instance.clear();
      } catch (cleanupError) {
        console.error('snice: failed to clean up a rejected nested template:', cleanupError);
      }
      let node = this.startNode.nextSibling;
      while (node && node !== this.endNode) {
        const next = node.nextSibling;
        node.remove();
        node = next;
      }
      this._insertBefore(previousFragment);
      this._committedValue = previousValue;
      this._itemKeys = previousKeys;
      throw error;
    }

    this._disposeCommitted(previousValue);
  }

  /**
   * Commit an iterable (array, Set, etc.)
   * OPTIMIZATION: Reuses existing NodeParts for items
   */
  private _commitIterable(value: Iterable<unknown>, explicitKeys?: readonly unknown[]): void {
    const items = Array.isArray(value) ? (value as unknown[]) : Array.from(value);
    const newKeys = explicitKeys ? Array.from(explicitKeys) : items.map(getItemKey);
    if (newKeys.length !== items.length) {
      throw new Error('snice: keyed iterable produced a different number of keys and values.');
    }
    const definedKeys = newKeys.filter(key => key !== undefined);
    if (definedKeys.length > 0 && definedKeys.length !== newKeys.length) {
      console.warn(
        'snice: a list mixes keyed and unkeyed items. Identity falls back to position; ' +
        'use repeat(items, { key, render }) for deterministic updates.'
      );
    }
    if (definedKeys.length > 0 && new Set(definedKeys).size !== definedKeys.length) {
      throw new Error('snice: a keyed list contains duplicate keys.');
    }

    let cleanupError: unknown;
    // If previous value wasn't an array of parts, start fresh
    if (!Array.isArray(this._committedValue) ||
        !(this._committedValue[0] instanceof NodePart)) {
      cleanupError = this._clear();
      this._committedValue = [];
      this._itemKeys = null;
    }
    const allKeyed = items.length > 0 && newKeys.every(k => k !== undefined);
    const oldKeys = this._itemKeys;

    // Keyed reconciliation: when every item carries a key=${...} binding and
    // the key order changed, DOM (and its state) follows the key, not the
    // index. Unchanged key order falls through to the cheap index path.
    if (allKeyed && oldKeys && (this._committedValue as NodePart[]).length > 0) {
      const sameOrder =
        oldKeys.length === newKeys.length &&
        newKeys.every((k, i) => k === oldKeys[i]);

      if (!sameOrder) {
        cleanupError ??= this._reconcileKeyed(
          items,
          newKeys,
          this._committedValue as NodePart[],
          oldKeys
        );
        this._itemKeys = newKeys;
        if (cleanupError) throw cleanupError;
        return;
      }
    }

    const itemParts = this._committedValue as NodePart[];
    let partIndex = 0;

    for (const item of items) {
      let itemPart: NodePart;

      if (partIndex >= itemParts.length) {
        // Need new NodePart - create with markers
        const startMarker = document.createComment('');
        const endMarker = document.createComment('');
        this._insertBefore(startMarker);
        this._insertBefore(endMarker);
        itemPart = new NodePart(startMarker, endMarker);
        itemParts.push(itemPart);
      } else {
        // Reuse existing NodePart
        itemPart = itemParts[partIndex];
      }

      // Set value on this part (recursively handles templates, text, etc.)
      itemPart.commit(item);
      partIndex++;
    }

    // Cleanup excess parts from previous render
    if (partIndex < itemParts.length) {
      // Clear DOM for removed items
      for (let i = partIndex; i < itemParts.length; i++) {
        const part = itemParts[i];
        // Dispose async state as well as removing the content. These item parts
        // are leaving the list permanently, not merely being moved.
        try {
          part.destroy();
        } catch (error) {
          cleanupError ??= error;
        }
        // Remove the markers themselves
        part.startNode.remove();
        part.endNode.remove();
      }
      // Truncate array
      itemParts.length = partIndex;
    }

    // Remember keys so the next commit can reconcile by key
    this._itemKeys = allKeyed ? newKeys : null;
    if (cleanupError) throw cleanupError;
  }

  /**
   * Reorder/reuse item parts so each key keeps its DOM.
   * Old parts whose keys disappeared are removed; new keys get fresh parts.
   */
  private _reconcileKeyed(
    items: unknown[],
    newKeys: unknown[],
    oldParts: NodePart[],
    oldKeys: unknown[]
  ): unknown {
    const parent = this.endNode.parentNode!;
    let cleanupError: unknown;

    // Map old parts by key (first occurrence wins on duplicate keys)
    const oldByKey = new Map<unknown, NodePart>();
    for (let i = 0; i < oldParts.length; i++) {
      if (!oldByKey.has(oldKeys[i])) oldByKey.set(oldKeys[i], oldParts[i]);
    }

    // Choose a part for each new item: reuse by key, or create during placement
    const reused = new Set<NodePart>();
    const newParts: (NodePart | null)[] = new Array(items.length).fill(null);
    for (let i = 0; i < items.length; i++) {
      const candidate = oldByKey.get(newKeys[i]);
      if (candidate && !reused.has(candidate)) {
        reused.add(candidate);
        newParts[i] = candidate;
      }
    }

    // Remove parts whose keys are gone (before placement, so the DOM walk
    // below only ever sees surviving nodes)
    for (const part of oldParts) {
      if (!reused.has(part)) {
        try {
          part.destroy();
        } catch (error) {
          cleanupError ??= error;
        }
        part.startNode.remove();
        part.endNode.remove();
      }
    }

    // Place parts in order. `ref` walks the surviving DOM; a part already
    // sitting at `ref` is skipped, anything else is moved (or created) there.
    let ref: Node = this.startNode.nextSibling!;
    for (let i = 0; i < newParts.length; i++) {
      let part = newParts[i];

      if (part) {
        if (part.startNode === ref) {
          // Already in position — advance past its range
          ref = part.endNode.nextSibling!;
        } else {
          // Move the part's whole range [startNode..endNode] before ref.
          // Detach into a fragment first, then insert in one operation —
          // node identity (and any state inside) is preserved either way.
          const range = document.createDocumentFragment();
          let node: Node | null = part.startNode;
          const stop: Node | null = part.endNode.nextSibling;
          while (node && node !== stop) {
            const next: Node | null = node.nextSibling;
            range.appendChild(node);
            node = next;
          }
          parent.insertBefore(range, ref);
        }
      } else {
        // New key — fresh part inserted at the current position
        const startMarker = document.createComment('');
        const endMarker = document.createComment('');
        parent.insertBefore(startMarker, ref);
        parent.insertBefore(endMarker, ref);
        part = new NodePart(startMarker, endMarker);
        newParts[i] = part;
      }

      part.commit(items[i]);
    }

    this._committedValue = newParts as NodePart[];
    return cleanupError;
  }

  /**
   * Commit a DOM node directly
   */
  private _commitNode(node: Node): void {
    if (this._committedValue !== node) {
      const cleanupError = this._clear();
      this._insertBefore(node);
      this._committedValue = node;
      if (cleanupError) throw cleanupError;
    }
  }

  /**
   * Commit unsafe HTML string
   */
  private _commitUnsafeHTML(value: UnsafeHTML): void {
    // Can't diff arbitrary HTML, but when the STRING is unchanged the DOM is
    // already correct — skip the clear+reparse so live state (typed input
    // values, focus, scroll) inside the block survives unrelated re-renders.
    const prev = this._committedValue;
    if (isUnsafeHTML(prev) && (prev as UnsafeHTML).html === value.html) {
      return;
    }

    const cleanupError = this._clear();
    const temp = document.createElement('template');
    temp.innerHTML = value.html;
    this._insertBefore(temp.content);
    this._committedValue = value;
    if (cleanupError) throw cleanupError;
  }

  private _commitAsync(source: PromiseLike<unknown> | AsyncIterable<unknown>): void {
    // A Promise/stream object is the identity of the async operation. Once it
    // settles, unrelated parent renders must keep the committed result rather
    // than clearing it and subscribing to the same source again.
    if (source === this._asyncSource) return;
    this._cancelAsync(false);
    this._asyncSource = source;
    this._asyncStarted = false;
    this._asyncCompleted = false;
    this._asyncPaused = false;
    const cleanupError = this._clear();
    this._committedValue = nothing;
    this._startAsyncSource();
    if (cleanupError) throw cleanupError;
  }

  private _startAsyncSource(forceConnected = false): void {
    const source = this._asyncSource;
    if (
      !source || this._asyncRunning || this._asyncCompleted ||
      (!forceConnected && !this.isConnected)
    ) return;
    this._asyncRunning = true;
    this._asyncStarted = true;
    this._asyncPaused = false;
    const version = ++this._asyncVersion;

    if (isAsyncIterable(source)) {
      try {
        this._asyncIterator = source[Symbol.asyncIterator]();
      } catch (error) {
        this._asyncRunning = false;
        this._asyncCompleted = true;
        console.error('snice: async iterable template value failed:', error);
        return;
      }
      void (async () => {
        try {
          while (this._asyncIterator) {
            const result = await this._asyncIterator.next();
            if (result.done || version !== this._asyncVersion) break;
            this._commitAsyncValue(result.value);
          }
        } catch (error) {
          if (version === this._asyncVersion) console.error('snice: async iterable template value failed:', error);
        } finally {
          if (version === this._asyncVersion) {
            this._asyncIterator = null;
            this._asyncRunning = false;
            this._asyncCompleted = true;
          }
        }
      })();
      return;
    }

    Promise.resolve(source).then(
      value => {
        if (version !== this._asyncVersion) return;
        this._asyncRunning = false;
        this._asyncCompleted = true;
        try {
          this._commitAsyncValue(value);
        } catch (error) {
          console.error('snice: promise template value failed:', error);
        }
      },
      error => {
        if (version !== this._asyncVersion) return;
        this._asyncRunning = false;
        this._asyncCompleted = true;
        console.error('snice: promise template value failed:', error);
      }
    );
  }

  private _commitAsyncValue(value: unknown): void {
    this._committingAsyncValue = true;
    try {
      this.commit(value);
    } finally {
      this._committingAsyncValue = false;
    }
  }

  private _cancelAsync(clearSource: boolean): void {
    this._asyncVersion++;
    const iterator = this._asyncIterator;
    this._asyncIterator = null;
    this._asyncRunning = false;
    if (clearSource) {
      this._asyncSource = null;
      this._asyncStarted = false;
      this._asyncCompleted = false;
      this._asyncPaused = false;
    }
    if (iterator?.return) {
      try {
        void Promise.resolve(iterator.return()).catch(() => {});
      } catch {
        // Cancellation is best-effort; internal state is already detached.
      }
    }
  }

  private _insertBefore(node: Node): void {
    this.endNode.parentNode?.insertBefore(node, this.endNode);
  }

  _clear(): unknown {
    const parent = this.startNode.parentNode;
    const committed = this._committedValue;
    let cleanupError: unknown;
    try {
      this._disposeCommitted(committed);
    } catch (error) {
      cleanupError = error;
    }
    if (!parent) {
      this._committedValue = nothing;
      return cleanupError;
    }

    let node = this.startNode.nextSibling;
    while (node && node !== this.endNode) {
      const next = node.nextSibling;
      parent.removeChild(node);
      node = next;
    }
    this._committedValue = nothing;
    return cleanupError;
  }

  private _disposeCommitted(committed: unknown): void {
    let lifecycleError: unknown;
    if (committed instanceof TemplateInstance) {
      try {
        committed.clear();
      } catch (error) {
        lifecycleError = error;
      }
    } else if (Array.isArray(committed)) {
      for (const item of committed) {
        if (!(item instanceof NodePart)) continue;
        try {
          item.destroy();
        } catch (error) {
          lifecycleError ??= error;
        }
      }
    }
    if (lifecycleError) throw lifecycleError;
  }

  clear(): void {
    this._cancelAsync(true);
    const cleanupError = this._clear();
    if (cleanupError) throw cleanupError;
  }

  get isConnected(): boolean {
    return this.startNode.isConnected;
  }

  disconnected(preserveEventListeners = false): void {
    let lifecycleError: unknown;
    if (this._committedValue instanceof TemplateInstance) {
      try {
        this._committedValue.disconnected(preserveEventListeners);
      } catch (error) {
        lifecycleError ??= error;
      }
    } else if (Array.isArray(this._committedValue)) {
      for (const part of this._committedValue) {
        if (!(part instanceof NodePart)) continue;
        try {
          part.disconnected(preserveEventListeners);
        } catch (error) {
          lifecycleError ??= error;
        }
      }
    }
    if (this._asyncSource && this._asyncRunning) {
      this._cancelAsync(false);
      this._asyncPaused = true;
    }
    if (lifecycleError) throw lifecycleError;
  }

  reconnected(): void {
    let lifecycleError: unknown;
    if (this._committedValue instanceof TemplateInstance) {
      try {
        this._committedValue.reconnected();
      } catch (error) {
        lifecycleError ??= error;
      }
    } else if (Array.isArray(this._committedValue)) {
      for (const part of this._committedValue) {
        if (!(part instanceof NodePart)) continue;
        try {
          part.reconnected();
        } catch (error) {
          lifecycleError ??= error;
        }
      }
    }
    if (this._asyncSource && (!this._asyncStarted || this._asyncPaused)) {
      this._startAsyncSource(true);
    }
    if (lifecycleError) throw lifecycleError;
  }
}

/**
 * AttributePart handles regular attribute updates
 *
 * Supports multiple interpolations: class="a ${b} c ${d} e"
 * Lit-HTML style: tracks each value separately for dirty checking
 */
export class AttributePart extends Part {
  readonly type = 'attribute' as const;
  element: Element;
  readonly name: string;
  readonly strings?: readonly string[];  // Static strings for interpolation
  private _committedValue: unknown | unknown[] = NOT_COMMITTED;
  private lastValues: unknown[] | null = null;
  private lastValueIndex = 0;

  constructor(element: Element, name: string, strings?: string[]) {
    super();
    this.element = element;
    this.name = name;

    // Determine if this is interpolation or single-value binding
    if (strings && (strings.length > 2 || strings[0] !== '' || strings[1] !== '')) {
      // Interpolation case: class="foo ${x} bar ${y}"
      // strings = ["foo ", " bar ", ""]
      this._committedValue = new Array(strings.length - 1).fill(NOT_COMMITTED);
      this.strings = strings;
    } else {
      // Single-value case: class="${x}"
      this._committedValue = NOT_COMMITTED;
    }
  }

  /**
   * Commit value(s) to the attribute
   *
   * For single-value binding: commit(value)
   * For interpolation: commit(values, startIndex) where values is full template values array
   */
  commit(value: unknown, valueIndex: number = 0): void {
    let change = false;
    let finalValue: unknown;

    // === SINGLE-VALUE BINDING ===
    if (this.strings === undefined) {
      if (value === noChange) return;

      change = !isPrimitive(value) ||
               (value !== this._committedValue && value !== noChange);

      if (change) {
        this._committedValue = value;
        finalValue = value;
      } else {
        return; // No change, skip DOM update
      }
    }
    // === INTERPOLATION BINDING ===
    else {
      const values = value as unknown[];
      this.lastValues = [...values];
      this.lastValueIndex = valueIndex;
      const committedValues = this._committedValue as unknown[];
      finalValue = this.strings[0];

      for (let i = 0; i < this.strings.length - 1; i++) {
        let v = values[valueIndex + i];

        // Handle noChange sentinel
        if (v === noChange) {
          v = committedValues[i];
          // First-ever commit: there is no previous value to keep — resolve
          // to empty. Without this, the NOT_COMMITTED symbol would be
          // string-concatenated below and throw.
          if (v === NOT_COMMITTED) v = '';
        }

        // Track if any value changed
        change = change || !isPrimitive(v) || v !== committedValues[i];

        // Handle nothing sentinel - removes entire attribute
        if (v === nothing) {
          finalValue = nothing;
        } else if (finalValue !== nothing) {
          finalValue = (finalValue as string) + (v ?? '') + this.strings[i + 1];
        }

        // Always record each value for future comparison
        committedValues[i] = v;
      }

      if (!change) {
        return; // No change, skip DOM update
      }
    }

    // Commit to DOM
    this._commitValue(finalValue);
  }

  private _commitValue(value: unknown): void {
    // Only the `nothing` sentinel removes the attribute. null/undefined
    // commit an empty attribute value, consistent with the interpolated
    // path above (which renders them as '').
    if (value === nothing) {
      this.element.removeAttribute(this.name);
    } else {
      this.element.setAttribute(this.name, String(value ?? ''));
    }
  }

  clear(): void {
    this.element.removeAttribute(this.name);
  }

}

/**
 * CommentPart renders binding values into an authored HTML comment's text
 * (<!-- debug: ${x} -->). Its real job is index alignment: each binding in a
 * comment consumes one value slot, so bindings after the comment stay bound
 * to their own values.
 */
export class CommentPart extends Part {
  readonly type = 'node' as const;
  node: Comment;
  readonly strings: readonly string[];
  private _committedValues: unknown[];
  private lastValues: unknown[] | null = null;
  private lastValueIndex = 0;

  constructor(node: Comment, strings: readonly string[]) {
    super();
    this.node = node;
    this.strings = strings;
    this._committedValues = new Array(strings.length - 1).fill(NOT_COMMITTED);
  }

  /**
   * Commit values into the comment text.
   * commit(values, startIndex) — like interpolated AttributePart, this part
   * consumes (strings.length - 1) values from the template values array.
   */
  commit(values: unknown, startIndex: number = 0): void {
    const vals = values as unknown[];
    this.lastValues = [...vals];
    this.lastValueIndex = startIndex;
    let change = false;
    let text = this.strings[0];

    for (let i = 0; i < this.strings.length - 1; i++) {
      let v = vals[startIndex + i];

      if (v === noChange) {
        v = this._committedValues[i];
        if (v === NOT_COMMITTED) v = '';
      }

      change = change || !isPrimitive(v) || v !== this._committedValues[i];
      this._committedValues[i] = v;

      text += String(v === nothing ? '' : (v ?? '')) + this.strings[i + 1];
    }

    if (change) {
      if (text.includes('--') || text.endsWith('-')) {
        throw new Error('snice: comment expressions cannot produce "--" or end with "-".');
      }
      this.node.data = text;
    }
  }

  clear(): void {}

}

/** Toggle one class without rebuilding the element's full class string. */
export class ClassPart extends Part {
  readonly type = 'class' as const;
  element: Element;
  readonly name: string;
  private committed: unknown = NOT_COMMITTED;

  constructor(element: Element, name: string) {
    super();
    this.element = element;
    this.name = name;
  }

  commit(value: unknown): void {
    if (value === noChange) return;
    const enabled = value !== nothing && Boolean(value);
    if (enabled === this.committed) return;
    this.committed = enabled;
    this.element.classList.toggle(this.name, enabled);
  }

  clear(): void {
    this.element.classList.remove(this.name);
    this.committed = NOT_COMMITTED;
  }

}

/** Set one CSS property, including custom properties, declaratively. */
export class StylePart extends Part {
  readonly type = 'style' as const;
  element: Element;
  readonly name: string;
  private committed: unknown = NOT_COMMITTED;

  constructor(element: Element, name: string) {
    super();
    this.element = element;
    this.name = name;
  }

  commit(value: unknown): void {
    if (value === noChange || Object.is(value, this.committed)) return;
    this.committed = value;
    const style = (this.element as HTMLElement).style;
    if (value === nothing || value == null || value === false) {
      style.removeProperty(this.name);
    } else {
      style.setProperty(this.name, String(value));
    }
  }

  clear(): void {
    (this.element as HTMLElement).style.removeProperty(this.name);
    this.committed = NOT_COMMITTED;
  }

}

type SpreadListener = {
  value: unknown;
  listener: EventListener;
  options?: AddEventListenerOptions;
};

function validateSpreadEvents(next: Record<string, unknown>, label: string): void {
  const names = new Set<string>();
  for (const [rawName, value] of Object.entries(next)) {
    const name = rawName.startsWith('@') ? rawName.slice(1) : rawName;
    if (!name) throw new TypeError(`snice: ${label} contains an empty event name.`);
    if (names.has(name)) {
      throw new TypeError(`snice: ${label} contains duplicate event name "${name}".`);
    }
    names.add(name);
    const listenerObject = !!value && typeof value === 'object' &&
      typeof (value as EventListenerObject).handleEvent === 'function';
    if (
      value !== nothing && value != null && value !== false &&
      typeof value !== 'function' && !listenerObject
    ) {
      throw new TypeError(`snice: ${label} event "${name}" expects a function, EventListenerObject, or null.`);
    }
  }
}

/** Named spreads: ...props, ...attrs, and ...events. */
export class SpreadPart extends Part {
  readonly type = 'spread' as const;
  element: Element;
  readonly name: string;
  private committed: Record<string, unknown> = {};
  private listeners = new Map<string, SpreadListener>();
  private consumedOnce = new Map<string, unknown>();

  constructor(element: Element, name: string) {
    super();
    this.element = element;
    this.name = name;
  }

  commit(value: unknown): void {
    if (value === noChange) return;
    if (value === nothing || value == null) value = {};
    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new TypeError(`snice: ...${this.name} expects an object.`);
    }
    const next = value as Record<string, unknown>;
    if (this.name === 'events') this.commitEvents(next);
    else if (this.name === 'props' || this.name === 'properties') this.commitProperties(next);
    else this.commitAttributes(next);
    this.committed = { ...next };
  }

  private commitProperties(next: Record<string, unknown>): void {
    for (const key of Object.keys(this.committed)) {
      if (!Object.prototype.hasOwnProperty.call(next, key)) {
        markPreUpgradePropertyBinding(this.element, key);
        (this.element as any)[key] = undefined;
      }
    }
    for (const [key, value] of Object.entries(next)) {
      if (Object.is(this.committed[key], value)) continue;
      markPreUpgradePropertyBinding(this.element, key);
      (this.element as any)[key] = value === nothing ? undefined : value;
    }
  }

  private commitAttributes(next: Record<string, unknown>): void {
    for (const key of Object.keys(this.committed)) {
      if (!Object.prototype.hasOwnProperty.call(next, key)) this.element.removeAttribute(key);
    }
    for (const [key, value] of Object.entries(next)) {
      if (Object.is(this.committed[key], value)) continue;
      if (value === nothing || value == null || value === false) this.element.removeAttribute(key);
      else this.element.setAttribute(key, value === true ? '' : String(value));
    }
  }

  private commitEvents(next: Record<string, unknown>): void {
    validateSpreadEvents(next, `...${this.name}`);
    for (const [name, value] of this.consumedOnce) {
      const rawName = Object.keys(next).find(key => this.eventName(key) === name);
      if (!rawName || !Object.is(next[rawName], value)) this.consumedOnce.delete(name);
    }
    for (const [name, entry] of this.listeners) {
      const rawName = Object.keys(next).find(key => this.eventName(key) === name);
      if (rawName && Object.is(next[rawName], entry.value)) continue;
      this.element.removeEventListener(name, entry.listener, entry.options);
      this.listeners.delete(name);
    }

    for (const [rawName, value] of Object.entries(next)) {
      const name = this.eventName(rawName);
      if (this.listeners.has(name)) continue;
      const listenerObject = !!value && typeof value === 'object' &&
        typeof (value as EventListenerObject).handleEvent === 'function';
      if (value === nothing || value == null || value === false) continue;
      if (this.consumedOnce.has(name) && Object.is(this.consumedOnce.get(name), value)) continue;
      this.consumedOnce.delete(name);
      const options = listenerObject ? value as AddEventListenerOptions : undefined;
      const listener = ((event: Event) => {
        if (options?.once) this.consumedOnce.set(name, value);
        if (listenerObject) (value as EventListenerObject).handleEvent(event);
        else (value as EventListener).call(this.resolveHost(), event);
      }) as EventListener;
      this.element.addEventListener(name, listener, options);
      this.listeners.set(name, { value, listener, options });
    }
  }

  private eventName(name: string): string {
    return name.startsWith('@') ? name.slice(1) : name;
  }

  private resolveHost(): Element | null {
    return findRenderHost(this.element) || this.element;
  }

  clear(): void {
    if (this.name === 'events') {
      for (const [name, entry] of this.listeners) {
        this.element.removeEventListener(name, entry.listener, entry.options);
      }
      this.listeners.clear();
      this.consumedOnce.clear();
    } else if (this.name !== 'props' && this.name !== 'properties') {
      for (const key of Object.keys(this.committed)) this.element.removeAttribute(key);
    }
    // A property spread is being destroyed with the element that owns it.
    // Resetting native/custom properties here is unnecessary and can throw for
    // setters that reject undefined (textarea.value is a common example).
    // Stale keys are still removed during an ordinary live spread update.
    this.committed = {};
  }

  disconnected(preserveEventListeners = false): void {
    if (this.name === 'events' && !preserveEventListeners) this.detachListeners();
  }

  reconnected(): void {
    if (this.name === 'events' && this.listeners.size === 0) this.commitEvents(this.committed);
  }

  private detachListeners(): void {
    for (const [name, entry] of this.listeners) {
      this.element.removeEventListener(name, entry.listener, entry.options);
    }
    this.listeners.clear();
  }

}

/**
 * PropertyPart handles property bindings (.property=${value})
 */
export class PropertyPart extends Part {
  readonly type = 'property' as const;
  element: Element;
  readonly name: string;
  private _committedValue: unknown = NOT_COMMITTED;

  constructor(element: Element, name: string) {
    super();
    this.element = element;
    this.name = name;
  }

  commit(value: unknown): void {
    if (value === noChange) return;

    // live(): compare against the element's actual DOM property, so state
    // the user changed (typed text, toggled checkbox) is reset even when the
    // bound value itself is unchanged.
    if (isLive(value)) {
      value = value.value;
      if (value === noChange) return;
      const domValue = (this.element as any)[this.name];
      if (value === domValue) {
        this._committedValue = value;
        return;
      }
    } else {
      // Dirty check - skip if same value
      if (value === this._committedValue) return;
    }

    this._committedValue = value;
    markPreUpgradePropertyBinding(this.element, this.name);
    (this.element as any)[this.name] = value === nothing ? undefined : value;
  }

  clear(): void {
    // This part is being destroyed with its owning template. The element is
    // about to leave the tree, so writing `undefined` is both unnecessary and
    // unsafe for native setters such as HTMLTextAreaElement.value.
    this._committedValue = NOT_COMMITTED;
  }

}

/**
 * BooleanAttributePart handles boolean attributes (?attribute=${value})
 */
export class BooleanAttributePart extends Part {
  readonly type = 'boolean-attribute' as const;
  element: Element;
  readonly name: string;
  private _committedValue: unknown = NOT_COMMITTED;

  constructor(element: Element, name: string) {
    super();
    this.element = element;
    this.name = name;
  }

  commit(value: unknown): void {
    if (value === noChange) return;

    // Coerce to boolean
    const boolValue = !!value && value !== nothing;

    // Dirty check - skip if same boolean value
    if (boolValue === this._committedValue) return;

    this._committedValue = boolValue;

    if (boolValue) {
      this.element.setAttribute(this.name, '');
    } else {
      this.element.removeAttribute(this.name);
    }
  }

  clear(): void {
    this.element.removeAttribute(this.name);
    this._committedValue = NOT_COMMITTED;
  }

}

/**
 * EventPart handles event listener bindings with keyboard shortcut support
 */
export class EventPart extends Part {
  readonly type = 'event' as const;
  element: Element;
  readonly eventName: string;
  private listener: EventListener | null = null;
  private listenerOptions: AddEventListenerOptions | undefined = undefined;
  private value: any = undefined;
  private keyFilter: KeyboardFilter | null = null;
  private host: Element | null = null; // Cache host element
  private modifiers = new Set<string>();
  private once = false;
  private onceConsumed = false;

  constructor(element: Element, eventName: string) {
    super();
    this.element = element;

    const [eventSpec, ...modifierSpecs] = eventName.split('|');
    const aliases: Record<string, string> = {
      preventdefault: 'prevent',
      stoppropagation: 'stop',
      stopimmediatepropagation: 'immediate'
    };
    const allowed = new Set(['prevent', 'stop', 'immediate', 'once', 'capture', 'passive', 'self']);
    for (const raw of modifierSpecs) {
      const normalized = aliases[raw.toLowerCase()] || raw.toLowerCase();
      if (!allowed.has(normalized)) {
        throw new Error(
          `snice: unknown event modifier "${raw}" in @${eventName}. ` +
          'Supported modifiers: prevent, stop, immediate, once, capture, passive, self.'
        );
      }
      this.modifiers.add(normalized);
    }
    if (this.modifiers.has('passive') && this.modifiers.has('prevent')) {
      throw new Error(`snice: @${eventName} cannot combine passive and prevent.`);
    }

    // Parse keyboard shortcuts:
    // Supports both dot notation (@keydown.enter) and colon notation (@keydown:Enter) to match @on decorator
    // Only parse colons for keyboard events, not custom events
    const isKeyboardEvent = ['keydown', 'keyup', 'keypress'].includes(eventSpec.split('.')[0].split(':')[0]);
    // Only keyboard events split on `.`/`:` into a key filter — a custom event
    // name may legitimately contain a dot (e.g. `app.ready`) and must be kept whole.
    const dotIndex = isKeyboardEvent ? eventSpec.indexOf('.') : -1;
    const colonIndex = isKeyboardEvent ? eventSpec.indexOf(':') : -1;

    // Use whichever delimiter comes first (dot or colon)
    const delimiterIndex = dotIndex > 0 && colonIndex > 0
      ? Math.min(dotIndex, colonIndex)
      : Math.max(dotIndex, colonIndex);

    if (delimiterIndex > 0) {
      const baseEvent = eventSpec.substring(0, delimiterIndex);
      const keySpec = eventSpec.substring(delimiterIndex + 1);
      this.eventName = baseEvent;
      this.keyFilter = parseKeyboardFilter(keySpec);
    } else {
      this.eventName = eventSpec;
      warnIfModifierMisuse(eventSpec);
    }
  }

  commit(value: any): void {
    // Handle noChange sentinel
    if (value === noChange) return;

    // Handle nothing sentinel - remove listener
    if (value === nothing) {
      value = null;
    }

    const isListenerObject = !!value &&
      typeof value === 'object' &&
      typeof (value as EventListenerObject).handleEvent === 'function';
    if (
      value !== null && value !== undefined && value !== false &&
      typeof value !== 'function' && !isListenerObject
    ) {
      throw new TypeError(`snice: @${this.eventName} expects a function, EventListenerObject, or null.`);
    }
    if (isListenerObject && this.modifiers.has('prevent') && !!(value as AddEventListenerOptions).passive) {
      throw new Error(`snice: @${this.eventName} cannot combine a passive listener object with prevent.`);
    }

    // Skip if same value (but null/undefined always triggers update for cleanup)
    if (value === this.value && value !== null && value !== undefined) return;

    // Remove old listener (with the same capture option it was added with)
    if (this.listener) {
      this.element.removeEventListener(this.eventName, this.listener, this.listenerOptions);
      this.listener = null;
      this.listenerOptions = undefined;
    }

    // Add new listener
    if (value === null || value === undefined || value === false) {
      this.value = value;
      this.onceConsumed = false;
      return;
    }

    this.onceConsumed = false;
    try {
      this.attachListener(value, isListenerObject);
      this.value = value;
    } catch (error) {
      this.value = undefined;
      throw error;
    }
  }

  private attachListener(value: EventListener | (EventListenerObject & AddEventListenerOptions), isListenerObject: boolean): void {
    // Accept plain functions AND EventListenerObject ({ handleEvent }). For
    // listener objects, the object itself doubles as the options bag.

    const keyFilter = this.keyFilter;
    const listener = ((event: Event) => {
      if (this.modifiers.has('self') && event.target !== this.element) return;
      if (keyFilter && !matchesKeyboardFilter(event as KeyboardEvent, keyFilter)) return;
      if (this.once) {
        this.onceConsumed = true;
        this.element.removeEventListener(this.eventName, listener, listenerOptions);
        this.listener = null;
        this.listenerOptions = undefined;
      }
      if (this.modifiers.has('prevent')) event.preventDefault();
      if (this.modifiers.has('immediate')) event.stopImmediatePropagation();
      else if (this.modifiers.has('stop')) event.stopPropagation();
      if (isListenerObject) {
        // DOM spec: `this` inside handleEvent is the listener object itself
        (value as EventListenerObject).handleEvent(event);
        return;
      }
      // Resolve the host (the custom element owning the shadow root) at dispatch
      // time, not bind time: a binding inside an initially-hidden <if>/<case>
      // branch commits while off-DOM, where getRootNode() has no host — caching
      // that null permanently would call the handler with `this = null` once the
      // branch is shown. By the time an event fires, the element is in the DOM.
      if (!this.host) {
        this.host = findRenderHost(this.element);
      }
      (value as EventListener).call(this.host || this.element, event);
    }) as EventListener;

    const valueOptions = isListenerObject ? value as AddEventListenerOptions : {};
    this.once = this.modifiers.has('once') || !!valueOptions.once;
    const listenerOptions: AddEventListenerOptions = {
      capture: this.modifiers.has('capture') || valueOptions.capture,
      passive: this.modifiers.has('passive') || valueOptions.passive,
      signal: valueOptions.signal
    };
    this.element.addEventListener(this.eventName, listener, listenerOptions);
    this.listener = listener;
    this.listenerOptions = listenerOptions;
  }

  clear(): void {
    this.detachListener();
    this.value = undefined;
    this.host = null;
    this.onceConsumed = false;
  }

  private detachListener(): void {
    if (this.listener) {
      this.element.removeEventListener(this.eventName, this.listener, this.listenerOptions);
      this.listener = null;
      this.listenerOptions = undefined;
    }
  }

  disconnected(preserveEventListeners = false): void {
    if (!preserveEventListeners) this.detachListener();
    this.host = null;
  }

  reconnected(): void {
    if (!this.listener && !this.onceConsumed && this.value != null && this.value !== false) {
      const isListenerObject = typeof this.value === 'object';
      this.attachListener(this.value, isListenerObject);
    }
  }

}

/**
 * Keyboard filter for matching specific keys and modifiers
 */
export interface KeyboardFilter {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  anyModifiers?: boolean; // true if prefixed with ~
}

/**
 * Parse keyboard shortcut specification
 * Examples:
 *   "enter" -> { key: "Enter" }
 *   "ctrl+s" -> { key: "s", ctrl: true }
 *   "ctrl+shift+s" -> { key: "s", ctrl: true, shift: true }
 *   "~enter" -> { key: "Enter", anyModifiers: true }
 */
// once/preventDefault/stopPropagation/capture/passive are @on() OPTIONS, not
// template modifiers. A dotted non-keyboard event whose suffix is one of these
// is almost certainly a mistake (e.g. `@click.once`) — it binds a listener for
// an event type the DOM never dispatches. Warn instead of failing silently. A
// legitimate custom event name like `app.ready` won't match and stays quiet.
const MODIFIER_WORDS = new Set([
  'once', 'prevent', 'preventdefault', 'stop', 'stoppropagation', 'capture', 'passive',
]);

export function warnIfModifierMisuse(eventName: string): void {
  const dot = eventName.lastIndexOf('.');
  if (dot < 0) return;

  const suffix = eventName.slice(dot + 1).toLowerCase();
  if (!MODIFIER_WORDS.has(suffix)) return;

  console.warn(
    `snice: "@${eventName}" is not a valid modifier — once/preventDefault/` +
    `stopPropagation/capture are @on() options, not template modifiers. ` +
    `This registers a listener for event "${eventName}", which never fires.`
  );
}

export function parseKeyboardFilter(spec: string): KeyboardFilter {
  // Handle ~ prefix for matching regardless of modifiers
  const anyModifiers = spec.startsWith('~');
  if (anyModifiers) {
    spec = spec.substring(1);
  }

  const parts = spec.split('+');
  const filter: KeyboardFilter = {
    key: '',
    anyModifiers
  };

  for (const part of parts) {
    const lower = part.toLowerCase();
    if (lower === 'ctrl' || lower === 'control') {
      filter.ctrl = true;
    } else if (lower === 'alt') {
      filter.alt = true;
    } else if (lower === 'shift') {
      filter.shift = true;
    } else if (lower === 'meta' || lower === 'cmd' || lower === 'command') {
      filter.meta = true;
    } else {
      // This is the key itself - normalize common keys
      filter.key = normalizeKey(part);
    }
  }

  return filter;
}

/**
 * Normalize key names to match KeyboardEvent.key
 */
function normalizeKey(key: string): string {
  const keyMap: Record<string, string> = {
    'esc': 'Escape',
    'escape': 'Escape',
    'enter': 'Enter',
    'return': 'Enter',
    'space': ' ',
    'spacebar': ' ',
    'up': 'ArrowUp',
    'down': 'ArrowDown',
    'left': 'ArrowLeft',
    'right': 'ArrowRight',
    'arrowup': 'ArrowUp',
    'arrowdown': 'ArrowDown',
    'arrowleft': 'ArrowLeft',
    'arrowright': 'ArrowRight',
    'delete': 'Delete',
    'del': 'Delete',
    'backspace': 'Backspace',
    'tab': 'Tab',
    'home': 'Home',
    'end': 'End',
    'pageup': 'PageUp',
    'pagedown': 'PageDown'
  };

  const lower = key.toLowerCase();
  return keyMap[lower] || key;
}

/**
 * Check if keyboard event matches the filter
 */
export function matchesKeyboardFilter(event: KeyboardEvent, filter: KeyboardFilter): boolean {
  // Check key match
  if (event.key !== filter.key) {
    return false;
  }

  // If anyModifiers is true, we don't care about modifiers
  if (filter.anyModifiers) {
    return true;
  }

  // Check modifiers - by default, exact match
  // If filter specifies ctrl: true, event must have ctrlKey
  // If filter doesn't specify ctrl, event must NOT have ctrlKey
  const ctrlMatch = filter.ctrl ? event.ctrlKey : !event.ctrlKey;
  const altMatch = filter.alt ? event.altKey : !event.altKey;
  const shiftMatch = filter.shift ? event.shiftKey : !event.shiftKey;
  const metaMatch = filter.meta ? event.metaKey : !event.metaKey;

  return ctrlMatch && altMatch && shiftMatch && metaMatch;
}

/**
 * ConditionalIfPart handles <if> conditional rendering
 * Removes/inserts DOM nodes based on condition
 */
// Sentinel value to distinguish "not yet set" from undefined
const NOT_SET = Symbol('not-set');

export class ConditionalIfPart extends Part {
  readonly type = 'node' as const;
  private startNode: Comment;
  private endNode: Comment;
  private conditions: unknown[] = [NOT_SET];
  private branches: DocumentFragment[] = [];
  private defaultBranch = -1;
  private currentBranch = -1;

  constructor(ifElement: Element) {
    super();
    const parent = ifElement.parentNode!;

    // Create comment boundary markers
    this.startNode = document.createComment('if');
    this.endNode = document.createComment('/if');

    // Insert markers where <if> is
    parent.insertBefore(this.startNode, ifElement);
    parent.insertBefore(this.endNode, ifElement.nextSibling);

    const primary = document.createDocumentFragment();
    this.branches.push(primary);
    let sawAlternative = false;
    let lastBranch = primary;

    for (const child of Array.from(ifElement.childNodes)) {
      const tag = child.nodeType === Node.ELEMENT_NODE
        ? (child as Element).tagName.toLowerCase()
        : '';

      if (tag === 'else-if' || tag === 'else') {
        sawAlternative = true;
        const wrapper = child as Element;
        const fragment = document.createDocumentFragment();
        while (wrapper.firstChild) fragment.appendChild(wrapper.firstChild);
        const index = this.branches.push(fragment) - 1;
        lastBranch = fragment;

        if (tag === 'else-if') {
          if (this.defaultBranch !== -1) {
            throw new Error('snice: <else> must be the final branch inside <if>.');
          }
          this.conditions[index] = NOT_SET;
          conditionalElseIfOwners.set(wrapper, { coordinator: this, index });
        } else {
          if (this.defaultBranch !== -1) {
            throw new Error('snice: <if> may contain only one <else> branch.');
          }
          this.defaultBranch = index;
        }
        wrapper.remove();
        continue;
      }

      if (!sawAlternative) {
        primary.appendChild(child);
      } else if (child.nodeType === Node.TEXT_NODE && !child.textContent?.trim()) {
        child.remove();
      } else {
        lastBranch.appendChild(child);
      }
    }

    parent.removeChild(ifElement);
  }

  commit(value: any): void {
    if (value !== noChange) this.conditions[0] = value;
  }

  setAlternative(index: number, value: unknown): void {
    if (value !== noChange) this.conditions[index] = value;
  }

  flush(): void {
    let next = -1;
    for (let i = 0; i < this.conditions.length; i++) {
      if (
        this.conditions[i] !== NOT_SET &&
        this.conditions[i] !== nothing &&
        Boolean(this.conditions[i])
      ) {
        next = i;
        break;
      }
    }
    if (next === -1) next = this.defaultBranch;
    if (next === this.currentBranch) return;

    this.collectCurrent();
    this.currentBranch = next;
    if (next !== -1 && this.branches[next].hasChildNodes()) {
      this.startNode.parentNode?.insertBefore(this.branches[next], this.endNode);
    }
  }

  private collectCurrent(): void {
    if (this.currentBranch === -1) return;
    const fragment = this.branches[this.currentBranch];
    let node = this.startNode.nextSibling;
    while (node && node !== this.endNode) {
      const next = node.nextSibling;
      fragment.appendChild(node);
      node = next;
    }
  }

  clear(): void {
    this.collectCurrent();
    this.currentBranch = -1;
  }

  get isConnected(): boolean {
    return this.startNode.isConnected;
  }
}

const conditionalElseIfOwners = new WeakMap<Element, {
  coordinator: ConditionalIfPart;
  index: number;
}>();

export class ConditionalElseIfPart extends Part {
  readonly type = 'node' as const;
  readonly coordinator: ConditionalIfPart;
  private readonly index: number;

  constructor(element: Element) {
    super();
    const owner = conditionalElseIfOwners.get(element);
    if (!owner) throw new Error('snice: <else-if> must be a direct child of <if>.');
    this.coordinator = owner.coordinator;
    this.index = owner.index;
  }

  commit(value: unknown): void {
    this.coordinator.setAlternative(this.index, value);
  }

  clear(): void {}

  get isConnected(): boolean {
    return this.coordinator.isConnected;
  }
}

/**
 * ConditionalCasePart handles <case>/<when>/<default> conditional rendering
 * Removes/inserts matching branch based on value
 */
export class ConditionalCasePart extends Part {
  readonly type = 'node' as const;
  private startNode: Comment;
  private endNode: Comment;
  private value: any = NOT_SET;
  private branches: Array<{
    fragment: DocumentFragment;
    dynamic: boolean;
    expected: unknown;
  }> = [];
  private defaultBranch = -1;
  private currentBranch = -1;

  constructor(caseElement: Element, dynamicWhenElements: ReadonlySet<Element>) {
    super();
    const parent = caseElement.parentNode!;

    // Create comment boundary markers
    this.startNode = document.createComment('case');
    this.endNode = document.createComment('/case');

    // Insert markers where <case> is
    parent.insertBefore(this.startNode, caseElement);
    parent.insertBefore(this.endNode, caseElement.nextSibling);

    // Extract branches from <when> and <default> children
    for (const child of Array.from(caseElement.children)) {
      const childTag = child.tagName.toLowerCase();
      if (childTag === 'when') {
        const fragment = document.createDocumentFragment();
        while (child.firstChild) {
          fragment.appendChild(child.firstChild);
        }
        const dynamic = dynamicWhenElements.has(child);
        const index = this.branches.push({
          fragment,
          dynamic,
          expected: dynamic ? NOT_SET : (child.getAttribute('value') ?? '')
        }) - 1;
        if (dynamic) conditionalWhenOwners.set(child, { coordinator: this, index });
      } else if (childTag === 'default') {
        if (this.defaultBranch !== -1) {
          throw new Error('snice: <case> may contain only one <default> branch.');
        }
        const fragment = document.createDocumentFragment();
        while (child.firstChild) {
          fragment.appendChild(child.firstChild);
        }
        this.defaultBranch = this.branches.push({
          fragment,
          dynamic: false,
          expected: NOT_SET
        }) - 1;
      }
    }

    // Remove the <case> element from DOM
    parent.removeChild(caseElement);
  }

  commit(value: any): void {
    if (value !== noChange) this.value = value;
  }

  setExpected(index: number, value: unknown): void {
    if (value !== noChange) this.branches[index].expected = value;
  }

  flush(): void {
    let next = this.branches.findIndex((branch, index) => {
      if (index === this.defaultBranch) return false;
      return branch.dynamic
        ? Object.is(this.value, branch.expected)
        : String(this.value) === branch.expected;
    });
    if (next === -1) next = this.defaultBranch;
    if (next === this.currentBranch) return;

    this.collectCurrent();
    this.currentBranch = next;
    if (next !== -1 && this.branches[next].fragment.hasChildNodes()) {
      this.startNode.parentNode?.insertBefore(this.branches[next].fragment, this.endNode);
    }
  }

  private collectCurrent(): void {
    if (this.currentBranch === -1) return;
    const fragment = this.branches[this.currentBranch].fragment;

    let node = this.startNode.nextSibling;
    while (node && node !== this.endNode) {
      const next = node.nextSibling;
      fragment.appendChild(node);
      node = next;
    }
  }

  clear(): void {
    this.collectCurrent();
    this.currentBranch = -1;
  }

  get isConnected(): boolean {
    return this.startNode.isConnected;
  }
}

const conditionalWhenOwners = new WeakMap<Element, {
  coordinator: ConditionalCasePart;
  index: number;
}>();

export class ConditionalWhenPart extends Part {
  readonly type = 'node' as const;
  readonly coordinator: ConditionalCasePart;
  private readonly index: number;

  constructor(element: Element) {
    super();
    const owner = conditionalWhenOwners.get(element);
    if (!owner) throw new Error('snice: dynamic <when> must be a direct child of <case>.');
    this.coordinator = owner.coordinator;
    this.index = owner.index;
  }

  commit(value: unknown): void {
    this.coordinator.setExpected(this.index, value);
  }

  clear(): void {}

  get isConnected(): boolean {
    return this.coordinator.isConnected;
  }
}
