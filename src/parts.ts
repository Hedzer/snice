
import { TemplateResult, CSSResult, HTML_RESULT, CSS_RESULT, isTemplateResult, isUnsafeHTML, UnsafeHTML, nothing, Nothing } from './template';

// Unique marker for dynamic parts
// This parses as a comment node but doesn't get escaped in attributes
const marker = `snice$${Math.random().toFixed(9).slice(2)}$`;
const markerMatch = '?' + marker;
const nodeMarker = `<${markerMatch}>`;
const markerRegex = new RegExp(marker, 'g');

// Template cache - templates with same string array can be reused
const templateCache = new WeakMap<TemplateStringsArray, Template>();

// Sentinel for "not yet set" - distinct from undefined/null
const NOT_COMMITTED = Symbol('not-committed');

// noChange sentinel - signals a directive handled the value
export const noChange = Symbol.for('snice:no-change');
export type NoChange = typeof noChange;

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

/**
 * A prepared template ready for rendering
 */
class Template {
  parts: TemplatePart[] = [];
  element: HTMLTemplateElement;

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

        // Handle virtual elements: <if>, <case>
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
          }
          continue;
        }

        // Handle <case> element
        if (tagName === 'case') {
          // <case value="${value}">children</case>
          const valueAttr = element.getAttribute('value');

          if (valueAttr && valueAttr.includes(marker)) {
            // Remove the value attribute
            element.removeAttribute('value');

            this.parts.push({
              type: 'conditional-case',
              index: partIndex++,
              element // Keep the <case> element
            });

            // Continue processing children normally
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

              if (originalName.startsWith('@@')) {
                // Escaped event binding for events with @ in the name (e.g., @@snice/event -> @snice/event)
                this.parts.push({
                  type: 'event',
                  index: partIndex,
                  name: originalName.slice(1), // Keep the @ in the event name
                  element
                });
                partIndex += 1;
              } else if (originalName.startsWith('@')) {
                // Event binding (single value only)
                this.parts.push({
                  type: 'event',
                  index: partIndex,
                  name: originalName.slice(1),
                  element
                });
                partIndex += 1;
              } else if (originalName.startsWith('.')) {
                // Property binding (single value only)
                this.parts.push({
                  type: 'property',
                  index: partIndex,
                  name: originalName.slice(1),
                  element
                });
                partIndex += 1;
              } else if (originalName.startsWith('?')) {
                // Boolean attribute (single value only)
                this.parts.push({
                  type: 'boolean-attribute',
                  index: partIndex,
                  name: originalName.slice(1),
                  element
                });
                partIndex += 1;
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
  }
}

interface TemplatePart {
  type: 'node' | 'attribute' | 'property' | 'boolean-attribute' | 'event' | 'conditional-if' | 'conditional-case';
  index: number;
  name?: string;
  element?: Element;
  startNode?: Comment;
  endNode?: Comment;
  attrStrings?: string[]; // Static string segments for attributes with interpolation
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
  let attrQuoteChar = '';      // The quote character (' or ")
  let currentAttrName = '';    // The current attribute name

  for (let i = 0; i < strings.length; i++) {
    const str = strings[i];
    htmlParts.push(str);

    if (i < strings.length - 1) {
      // Update state by scanning the string
      for (let j = 0; j < str.length; j++) {
        const char = str[j];

        if (!inTag) {
          // Looking for tag start
          if (char === '<') {
            inTag = true;
          }
        } else if (!inAttrValue) {
          // Inside tag, but not in attribute value
          if (char === '>') {
            inTag = false;
          } else if (char === '"' || char === "'") {
            inAttrValue = true;
            attrQuoteChar = char;
          } else if (char === '=') {
            // Extract attribute name (look backwards for it)
            let attrStart = j - 1;
            while (attrStart >= 0 && /[\w\-\.@\?]/.test(str[attrStart])) {
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
      if (inAttrValue) {
        // We're inside a quoted attribute value - this is an attribute binding
        // For subsequent interpolations in same attribute, keep using same attr name
        attrNamesForParts.push(currentAttrName);
        htmlParts.push(marker);
      } else if (inTag) {
        // Inside tag but not in attr value - check for special cases
        // Check if this is start of attribute value (= at end of string)
        const trimmed = str.trimEnd();
        if (trimmed.endsWith('=')) {
          // Extract attribute name
          let attrStart = trimmed.length - 2;
          while (attrStart >= 0 && /[\w\-\.@\?\/]/.test(trimmed[attrStart])) {
            attrStart--;
          }
          currentAttrName = trimmed.substring(attrStart + 1, trimmed.length - 1).trim();
          attrNamesForParts.push(currentAttrName);
          htmlParts.push(marker);
        } else {
          // Check if this is a meta element (<if> or <case>)
          const metaElementMatch = str.match(/<(if|case)\s*$/);
          if (metaElementMatch) {
            currentAttrName = 'value';
            attrNamesForParts.push('value');
            htmlParts.push(`value="${marker}"`);
          } else {
            // Element binding or error
            attrNamesForParts.push('');
            htmlParts.push(marker);
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
  template.innerHTML = html;

  const tmpl = new Template(result, template, attrNamesForParts);
  // Cache the template for reuse
  templateCache.set(strings, tmpl);
  return tmpl;
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
          case 'conditional-if':
            const conditionalIfElement = nodeMap.get(partDef.element!) as Element;
            part = new ConditionalIfPart(conditionalIfElement);
            break;
          case 'conditional-case':
            const conditionalCaseElement = nodeMap.get(partDef.element!) as Element;
            part = new ConditionalCasePart(conditionalCaseElement);
            break;
          default:
            throw new Error(`Unknown part type: ${(partDef as any).type}`);
        }

        this.parts.push(part);

        // Separate conditional parts from regular parts for optimized update
        // Use partDef.index (the VALUE index) not i (the part array index)
        if (part instanceof ConditionalIfPart || part instanceof ConditionalCasePart) {
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

    // Then process regular parts
    let i = 0;
    for (const {part, index} of this.regularParts) {
      // AttributeParts with interpolation consume multiple values
      if (part instanceof AttributePart && part.strings !== undefined) {
        // Pass full values array and starting index for interpolation
        part.commit(values, index);
        // The part consumes (strings.length - 1) values
        // But since we're iterating by template part index, this is handled by the Template
      } else {
        part.commit(values[index]);
      }
    }
  }

  clear(): void {
    for (const part of this.parts) {
      part.clear();
    }
  }
}

/**
 * Base class for all parts
 */
export abstract class Part {
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
  private startNode: Comment;
  private endNode: Comment;
  private _committedValue: any = NOT_COMMITTED;

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

    // Handle nothing/null/undefined/empty - clear content
    if (value === nothing || value == null || value === '') {
      if (this._committedValue !== nothing) {
        this._clear();
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

    this._clear();
    this._insertBefore(document.createTextNode(String(value)));
    this._committedValue = value;
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

    // Different template or first render - create new instance
    this._clear();
    const instance = new TemplateInstance(result);
    const fragment = instance.renderFragment();
    this._insertBefore(fragment);
    instance.update(result.values);
    this._committedValue = instance;
  }

  /**
   * Commit an iterable (array, Set, etc.)
   * OPTIMIZATION: Reuses existing NodeParts for items
   */
  private _commitIterable(value: Iterable<unknown>): void {
    // If previous value wasn't an array of parts, start fresh
    if (!Array.isArray(this._committedValue) ||
        !(this._committedValue[0] instanceof NodePart)) {
      this._clear();
      this._committedValue = [];
    }

    const itemParts = this._committedValue as NodePart[];
    let partIndex = 0;

    for (const item of value) {
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
        // Remove the part's content and markers
        part._clear();
        // Remove the markers themselves
        part.startNode.remove();
        part.endNode.remove();
      }
      // Truncate array
      itemParts.length = partIndex;
    }
  }

  /**
   * Commit a DOM node directly
   */
  private _commitNode(node: Node): void {
    if (this._committedValue !== node) {
      this._clear();
      this._insertBefore(node);
      this._committedValue = node;
    }
  }

  /**
   * Commit unsafe HTML string
   */
  private _commitUnsafeHTML(value: UnsafeHTML): void {
    // Always recreate for unsafe HTML (can't diff arbitrary HTML)
    this._clear();
    const temp = document.createElement('template');
    temp.innerHTML = value.html;
    this._insertBefore(temp.content);
    this._committedValue = value;
  }

  private _insertBefore(node: Node): void {
    this.endNode.parentNode?.insertBefore(node, this.endNode);
  }

  _clear(): void {
    const parent = this.startNode.parentNode;
    if (!parent) return;

    let node = this.startNode.nextSibling;
    while (node && node !== this.endNode) {
      const next = node.nextSibling;
      parent.removeChild(node);
      node = next;
    }
    this._committedValue = nothing;
  }

  clear(): void {
    this._clear();
  }
}

/**
 * AttributePart handles regular attribute updates
 *
 * Supports multiple interpolations: class="a ${b} c ${d} e"
 * Lit-HTML style: tracks each value separately for dirty checking
 */
export class AttributePart extends Part {
  readonly element: Element;
  readonly name: string;
  readonly strings?: readonly string[];  // Static strings for interpolation
  private _committedValue: unknown | unknown[] = NOT_COMMITTED;

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
      const committedValues = this._committedValue as unknown[];
      finalValue = this.strings[0];

      for (let i = 0; i < this.strings.length - 1; i++) {
        let v = values[valueIndex + i];

        // Handle noChange sentinel
        if (v === noChange) {
          v = committedValues[i];
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
    if (value === nothing || value === null || value === undefined) {
      this.element.removeAttribute(this.name);
    } else {
      this.element.setAttribute(this.name, String(value));
    }
  }

  clear(): void {
    this.element.removeAttribute(this.name);
  }
}

/**
 * PropertyPart handles property bindings (.property=${value})
 */
export class PropertyPart extends Part {
  readonly element: Element;
  readonly name: string;
  private _committedValue: unknown = NOT_COMMITTED;

  constructor(element: Element, name: string) {
    super();
    this.element = element;
    this.name = name;
  }

  commit(value: unknown): void {
    if (value === noChange) return;

    // Dirty check - skip if same value
    if (value === this._committedValue) return;

    this._committedValue = value;
    (this.element as any)[this.name] = value === nothing ? undefined : value;
  }

  clear(): void {
    (this.element as any)[this.name] = undefined;
    this._committedValue = NOT_COMMITTED;
  }
}

/**
 * BooleanAttributePart handles boolean attributes (?attribute=${value})
 */
export class BooleanAttributePart extends Part {
  readonly element: Element;
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
  readonly element: Element;
  readonly eventName: string;
  private listener: EventListener | null = null;
  private value: any = undefined;
  private keyFilter: KeyboardFilter | null = null;
  private host: Element | null = null; // Cache host element

  constructor(element: Element, eventName: string) {
    super();
    this.element = element;

    // Parse keyboard shortcuts:
    // Supports both dot notation (@keydown.enter) and colon notation (@keydown:Enter) to match @on decorator
    // Only parse colons for keyboard events, not custom events
    const isKeyboardEvent = ['keydown', 'keyup', 'keypress'].includes(eventName.split('.')[0].split(':')[0]);
    const dotIndex = eventName.indexOf('.');
    const colonIndex = isKeyboardEvent ? eventName.indexOf(':') : -1;

    // Use whichever delimiter comes first (dot or colon)
    const delimiterIndex = dotIndex > 0 && colonIndex > 0
      ? Math.min(dotIndex, colonIndex)
      : Math.max(dotIndex, colonIndex);

    if (delimiterIndex > 0) {
      const baseEvent = eventName.substring(0, delimiterIndex);
      const keySpec = eventName.substring(delimiterIndex + 1);
      this.eventName = baseEvent;
      this.keyFilter = parseKeyboardFilter(keySpec);
    } else {
      this.eventName = eventName;
    }
  }

  commit(value: any): void {
    // Handle noChange sentinel
    if (value === noChange) return;

    // Handle nothing sentinel - remove listener
    if (value === nothing) {
      value = null;
    }

    // Skip if same value (but null/undefined always triggers update for cleanup)
    if (value === this.value && value !== null && value !== undefined) return;

    // Remove old listener
    if (this.listener) {
      this.element.removeEventListener(this.eventName, this.listener);
      this.listener = null;
    }

    this.value = value;

    // Add new listener
    if (value === null || value === undefined) {
      return;
    }

    if (typeof value !== 'function') return;

    // Auto-bind to host element (the custom element with shadow root)
    if (!this.host) {
      const rootNode = this.element.getRootNode();
      this.host = (rootNode as ShadowRoot).host || null;
    }

    const context = this.host || null;
    const keyFilter = this.keyFilter;
    this.listener = ((event: Event) => {
      if (keyFilter && !matchesKeyboardFilter(event as KeyboardEvent, keyFilter)) return;
      value.call(context, event);
    }) as EventListener;

    this.element.addEventListener(this.eventName, this.listener);
  }

  clear(): void {
    if (this.listener) {
      this.element.removeEventListener(this.eventName, this.listener);
      this.listener = null;
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
  private ifElement: HTMLElement;
  private value: any = NOT_SET;
  private fragment: DocumentFragment | null = null;

  constructor(ifElement: Element) {
    super();
    this.ifElement = ifElement as HTMLElement;
    this.ifElement.style.display = 'contents';
  }

  commit(value: any): void {
    const condition = Boolean(value);
    if (this.value === value) return;
    this.value = value;

    if (condition) {
      // Show: restore children from fragment
      if (this.fragment && this.fragment.hasChildNodes()) {
        this.ifElement.appendChild(this.fragment);
      }
    } else {
      // Hide: move children to fragment
      if (!this.fragment) {
        this.fragment = document.createDocumentFragment();
      }
      while (this.ifElement.firstChild) {
        this.fragment.appendChild(this.ifElement.firstChild);
      }
    }
  }

  clear(): void {
    if (!this.fragment) {
      this.fragment = document.createDocumentFragment();
    }
    while (this.ifElement.firstChild) {
      this.fragment.appendChild(this.ifElement.firstChild);
    }
  }
}

/**
 * ConditionalCasePart handles <case>/<when>/<default> conditional rendering
 * Removes/inserts matching branch based on value
 */
export class ConditionalCasePart extends Part {
  private caseElement: Element;
  private value: any = NOT_SET;
  private childrenMap: Map<string, Element> = new Map();
  private fragments: Map<Element, DocumentFragment> = new Map();
  private defaultChild: Element | null = null;
  private currentChild: Element | null = null;

  constructor(caseElement: Element) {
    super();
    this.caseElement = caseElement;
    (this.caseElement as HTMLElement).style.display = 'contents';

    // Build map and store children in fragments initially
    for (const child of Array.from(this.caseElement.children)) {
      const childTag = child.tagName.toLowerCase();
      if (childTag === 'when') {
        (child as HTMLElement).style.display = 'contents';
        const whenValue = child.getAttribute('value') || '';
        this.childrenMap.set(whenValue, child);
        const fragment = document.createDocumentFragment();
        fragment.appendChild(child);
        this.fragments.set(child, fragment);
      } else if (childTag === 'default') {
        (child as HTMLElement).style.display = 'contents';
        this.defaultChild = child;
        const fragment = document.createDocumentFragment();
        fragment.appendChild(child);
        this.fragments.set(child, fragment);
      }
    }
  }

  commit(value: any): void {
    if (this.value === value) return;
    this.value = value;

    const valueStr = String(value);

    // Remove current child
    if (this.currentChild) {
      const fragment = this.fragments.get(this.currentChild);
      if (fragment && !fragment.hasChildNodes()) {
        fragment.appendChild(this.currentChild);
      }
    }

    // Insert matching child
    const matchingChild = this.childrenMap.get(valueStr) || this.defaultChild;
    if (matchingChild) {
      const fragment = this.fragments.get(matchingChild);
      if (fragment && fragment.hasChildNodes()) {
        this.caseElement.appendChild(fragment);
      }
      this.currentChild = matchingChild;
    }
  }

  clear(): void {
    if (this.currentChild) {
      const fragment = this.fragments.get(this.currentChild);
      if (fragment && !fragment.hasChildNodes()) {
        fragment.appendChild(this.currentChild);
      }
      this.currentChild = null;
    }
  }
}

