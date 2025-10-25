/**
 * Simplified lit-html-style template system
 * Based on lit-html's approach but simplified
 */

import { TemplateResult, CSSResult, HTML_RESULT, CSS_RESULT, isTemplateResult, isUnsafeHTML, UnsafeHTML } from './template';

// Unique marker for dynamic parts
// Using processing instruction syntax like lit-html for better compatibility
// This parses as a comment node but doesn't get escaped in attributes
const marker = `snice$${Math.random().toFixed(9).slice(2)}$`;
const markerMatch = '?' + marker;
const nodeMarker = `<${markerMatch}>`;
const markerRegex = new RegExp(marker, 'g');

// Template cache - templates with same string array can be reused
const templateCache = new WeakMap<TemplateStringsArray, Template>();

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

              if (originalName.startsWith('@')) {
                // Event binding
                this.parts.push({
                  type: 'event',
                  index: partIndex++,
                  name: originalName.slice(1),
                  element
                });
              } else if (originalName.startsWith('.')) {
                // Property binding - preserve original case for JavaScript properties
                this.parts.push({
                  type: 'property',
                  index: partIndex++,
                  name: originalName.slice(1),
                  element
                });
              } else if (originalName.startsWith('?')) {
                // Boolean attribute
                this.parts.push({
                  type: 'boolean-attribute',
                  index: partIndex++,
                  name: originalName.slice(1),
                  element
                });
              } else {
                // Regular attribute - use lowercased name from DOM
                // Store static string segments for interpolation
                this.parts.push({
                  type: 'attribute',
                  index: partIndex++,
                  name: attr.name,
                  element,
                  attrStrings
                });
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

  for (let i = 0; i < strings.length; i++) {
    const str = strings[i];
    htmlParts.push(str);

    if (i < strings.length - 1) {
      // Check if we're in an attribute context
      // Look backwards for = sign
      const lastEquals = str.lastIndexOf('=');
      const lastCloseTag = str.lastIndexOf('>');

      if (lastEquals > lastCloseTag) {
        // We're in an attribute value - extract and preserve the original attribute name
        let attrStart = lastEquals - 1;
        while (attrStart >= 0 && /\S/.test(str[attrStart])) {
          attrStart--;
        }
        const attrName = str.substring(attrStart + 1, lastEquals).trim();
        attrNamesForParts.push(attrName);
        htmlParts.push(marker);
      } else {
        // Check if this is a meta element (<if> or <case>) by looking backwards
        // Match pattern: <if or <case followed by whitespace or >
        const metaElementMatch = str.match(/<(if|case)\s*$/);

        if (metaElementMatch) {
          // This is a meta element - add value attribute
          attrNamesForParts.push('value');
          htmlParts.push(`value="${marker}"`);
        } else {
          // We're in node content
          attrNamesForParts.push(''); // Empty string for node parts
          htmlParts.push(nodeMarker);
        }
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
  parts: Part[] = [];
  fragment: DocumentFragment | null = null;
  private conditionalParts: Array<{part: Part; index: number}> = []; // if/case parts with their indices
  private regularParts: Array<{part: Part; index: number}> = []; // all other parts with their indices

  constructor(result: TemplateResult) {
    this.template = prepareTemplate(result);
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
        if (part instanceof ConditionalIfPart || part instanceof ConditionalCasePart) {
          this.conditionalParts.push({part, index: i});
        } else {
          this.regularParts.push({part, index: i});
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
    for (const {part, index} of this.regularParts) {
      part.commit(values[index]);
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
 */
export class NodePart extends Part {
  private startNode: Comment;
  private endNode: Comment;
  private value: any = undefined;

  constructor(startNode: Comment, endNode: Comment) {
    super();
    this.startNode = startNode;
    this.endNode = endNode;
  }

  commit(value: any): void {
    if (value === this.value) return;
    this.value = value;

    // Handle arrays
    if (Array.isArray(value)) {
      this.commitArray(value);
      return;
    }

    // Handle nested templates
    if (isTemplateResult(value)) {
      this.commitTemplate(value);
      return;
    }

    // Handle unsafe HTML
    if (isUnsafeHTML(value)) {
      this.commitUnsafeHTML(value);
      return;
    }

    // Handle primitives
    this.commitPrimitive(value);
  }

  private commitPrimitive(value: any): void {
    this.clear();
    const text = value === null || value === undefined ? '' : String(value);
    const textNode = document.createTextNode(text);
    this.insertBefore(textNode);
  }

  private commitTemplate(template: TemplateResult): void {
    this.clear();
    const instance = new TemplateInstance(template);
    const fragment = instance.render(template.values);
    this.insertBefore(fragment);
  }

  private commitArray(values: any[]): void {
    this.clear();
    // Template caching (via prepareTemplate) still provides significant performance benefit
    for (const value of values) {
      if (isTemplateResult(value)) {
        const instance = new TemplateInstance(value);
        const fragment = instance.render(value.values);
        this.insertBefore(fragment);
      } else {
        const text = value === null || value === undefined ? '' : String(value);
        const textNode = document.createTextNode(text);
        this.insertBefore(textNode);
      }
    }
  }

  private commitUnsafeHTML(value: UnsafeHTML): void {
    this.clear();
    // Create a temporary container to parse the HTML
    const temp = document.createElement('template');
    temp.innerHTML = value.html;
    // Insert all parsed nodes
    const fragment = temp.content;
    this.insertBefore(fragment);
  }

  private insertBefore(node: Node): void {
    this.endNode.parentNode?.insertBefore(node, this.endNode);
  }

  clear(): void {
    const parent = this.startNode.parentNode;
    if (!parent) return;

    let node = this.startNode.nextSibling;
    while (node && node !== this.endNode) {
      const next = node.nextSibling;
      parent.removeChild(node);
      node = next;
    }
  }
}

/**
 * AttributePart handles regular attribute updates
 */
export class AttributePart extends Part {
  readonly element: Element;
  readonly name: string;
  readonly attrStrings?: string[];
  private value: any = undefined;

  constructor(element: Element, name: string, attrStrings?: string[]) {
    super();
    this.element = element;
    this.name = name;
    this.attrStrings = attrStrings;
  }

  commit(value: any): void {
    if (value === this.value) return;
    this.value = value;

    if (value === null || value === undefined) {
      this.element.removeAttribute(this.name);
    } else {
      // Inline attribute value computation for performance
      let finalValue: string;
      if (!this.attrStrings || this.attrStrings.length === 0) {
        finalValue = String(value);
      } else if (this.attrStrings.length === 1) {
        finalValue = this.attrStrings[0];
      } else {
        // Multiple segments: "prefix" + value + "suffix"
        finalValue = this.attrStrings[0] + String(value) + this.attrStrings[1];
      }
      this.element.setAttribute(this.name, finalValue);
    }
  }

  clear(): void {
    this.element.removeAttribute(this.name);
  }
}

/**
 * PropertyPart handles property bindings
 */
export class PropertyPart extends Part {
  readonly element: Element;
  readonly name: string;
  private value: any = undefined;

  constructor(element: Element, name: string) {
    super();
    this.element = element;
    this.name = name;
  }

  commit(value: any): void {
    if (value === this.value) return;
    this.value = value;
    (this.element as any)[this.name] = value;
  }

  clear(): void {
    (this.element as any)[this.name] = undefined;
  }
}

/**
 * BooleanAttributePart handles boolean attributes
 */
export class BooleanAttributePart extends Part {
  readonly element: Element;
  readonly name: string;
  private value: any = undefined;

  constructor(element: Element, name: string) {
    super();
    this.element = element;
    this.name = name;
  }

  commit(value: any): void {
    if (value === this.value) return;
    this.value = value;

    if (value) {
      this.element.setAttribute(this.name, '');
    } else {
      this.element.removeAttribute(this.name);
    }
  }

  clear(): void {
    this.element.removeAttribute(this.name);
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
    const dotIndex = eventName.indexOf('.');
    const colonIndex = eventName.indexOf(':');

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
    // Skip if same value (but null/undefined always triggers update)
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

    if (typeof value === 'function') {
      // Auto-bind to host element (the custom element with shadow root)
      // Cache host lookup for performance
      if (!this.host) {
        const rootNode = this.element.getRootNode();
        this.host = (rootNode as ShadowRoot).host || null;
      }

      // Create a wrapper that calls the handler with the host as context
      if (this.host) {
        const host = this.host; // Capture for closure
        this.listener = ((event: Event) => {
          if (this.keyFilter && !matchesKeyboardFilter(event as KeyboardEvent, this.keyFilter)) {
            return;
          }
          value.call(host, event);
        }) as EventListener;
      } else {
        this.listener = ((event: Event) => {
          if (this.keyFilter && !matchesKeyboardFilter(event as KeyboardEvent, this.keyFilter)) {
            return;
          }
          value.call(null, event);
        }) as EventListener;
      }

      this.element.addEventListener(this.eventName, this.listener);
    }
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
export class ConditionalIfPart extends Part {
  private ifElement: HTMLElement;
  private value: any = undefined;
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
  private value: any = undefined;
  private childrenMap: Map<string, Element> = new Map();
  private fragments: Map<Element, DocumentFragment> = new Map();
  private defaultChild: Element | null = null;
  private currentChild: Element | null = null;

  constructor(caseElement: Element) {
    super();
    this.caseElement = caseElement;

    // Build map and store children in fragments initially
    for (const child of Array.from(this.caseElement.children)) {
      const childTag = child.tagName.toLowerCase();
      if (childTag === 'when') {
        const whenValue = child.getAttribute('value') || '';
        this.childrenMap.set(whenValue, child);
        const fragment = document.createDocumentFragment();
        fragment.appendChild(child);
        this.fragments.set(child, fragment);
      } else if (childTag === 'default') {
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

