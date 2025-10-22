/**
 * Simplified lit-html-style template system
 * Based on lit-html's approach but simplified
 */

import { TemplateResult, CSSResult, HTML_RESULT, CSS_RESULT, isTemplateResult } from './template';

// Unique marker for dynamic parts
const marker = `{{snice-${String(Math.random()).slice(2)}}}`;
const nodeMarker = `<!--${marker}-->`;
const markerRegex = new RegExp(marker, 'g');

// Template cache removed - negligible performance benefit (~0.00004ms per template)

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
        // These elements stay in the DOM but are styled with display:contents
        // to be transparent wrappers that don't affect layout
        if (tagName === 'if') {
          // <if value="${condition}">children</if>
          const valueAttr = element.getAttribute('value');

          if (valueAttr && valueAttr.includes(marker)) {
            // Remove the value attribute
            element.removeAttribute('value');

            this.parts.push({
              type: 'if',
              index: partIndex++,
              element // Keep the <if> element, will show/hide via display property
            });

            // Continue processing children normally
          }
          continue;
        }

        // Handle <case> element
        // Like <if>, <case> stays in DOM styled with display:contents
        if (tagName === 'case') {
          // <case value="${value}">children</case>
          const valueAttr = element.getAttribute('value');

          if (valueAttr && valueAttr.includes(marker)) {
            // Remove the value attribute
            element.removeAttribute('value');

            this.parts.push({
              type: 'case',
              index: partIndex++,
              caseElement: element // Keep the <case> element for when/default processing
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
        if (comment.data === marker) {
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
  type: 'node' | 'attribute' | 'property' | 'boolean-attribute' | 'event' | 'if' | 'case';
  index: number;
  name?: string;
  element?: Element;
  startNode?: Comment;
  endNode?: Comment;
  caseElement?: Element; // For case/when matching
  attrStrings?: string[]; // Static string segments for attributes with interpolation
}

/**
 * Prepare a template for rendering
 */
function prepareTemplate(result: TemplateResult): Template {
  // Build HTML with markers and extract original attribute names
  const { strings } = result;
  let html = '';
  const attrNamesForParts: string[] = [];

  for (let i = 0; i < strings.length; i++) {
    const str = strings[i];
    html += str;

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
        html += marker;
      } else {
        // Check if this is a meta element (<if> or <case>) by looking backwards
        // Match pattern: <if or <case followed by whitespace or >
        const metaElementMatch = str.match(/<(if|case)\s*$/);

        if (metaElementMatch) {
          // This is a meta element - add value attribute
          attrNamesForParts.push('value');
          html += `value="${marker}"`;
        } else {
          // We're in node content
          attrNamesForParts.push(''); // Empty string for node parts
          html += nodeMarker;
        }
      }
    }
  }

  const template = document.createElement('template');
  template.innerHTML = html;

  return new Template(result, template, attrNamesForParts);
}

/**
 * Instance of a rendered template
 */
export class TemplateInstance {
  template: Template;
  parts: Part[] = [];
  fragment: DocumentFragment | null = null;

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

      for (const partDef of this.template.parts) {
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
          case 'if':
            const ifElement = nodeMap.get(partDef.element!) as Element;
            part = new IfPart(ifElement);
            break;
          case 'case':
            const caseElement = nodeMap.get(partDef.caseElement!) as Element;
            part = new CasePart(caseElement);
            break;
          default:
            throw new Error(`Unknown part type: ${(partDef as any).type}`);
        }

        this.parts.push(part);
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
    // Process virtual elements (if/case) first
    for (let i = 0; i < this.parts.length; i++) {
      const part = this.parts[i];
      if (part instanceof IfPart || part instanceof CasePart) {
        part.commit(values[i]);
      }
    }

    // Then process all other parts
    for (let i = 0; i < this.parts.length; i++) {
      const part = this.parts[i];
      if (!(part instanceof IfPart || part instanceof CasePart)) {
        part.commit(values[i]);
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
      // Data-oriented: compute final value from strings + value
      const finalValue = computeAttributeValue(this.attrStrings, value);
      this.element.setAttribute(this.name, finalValue);
    }
  }

  clear(): void {
    this.element.removeAttribute(this.name);
  }
}

/**
 * Data-oriented function to compute attribute value from static strings and dynamic value
 */
function computeAttributeValue(attrStrings: string[] | undefined, value: any): string {
  if (!attrStrings || attrStrings.length === 0) {
    // No template strings, just use the value
    return String(value);
  }

  if (attrStrings.length === 1) {
    // Single string segment, no interpolation (shouldn't happen but handle it)
    return attrStrings[0];
  }

  // Multiple segments: "prefix" + value + "suffix"
  // For aria-label="Remove ${label}", attrStrings = ["Remove ", ""]
  return attrStrings[0] + String(value) + attrStrings[1];
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
      // This allows @click=${this.handleClick} to work without manual binding
      const rootNode = this.element.getRootNode();
      const host = (rootNode as ShadowRoot).host;

      // Create a wrapper that calls the handler with the host as context
      // This ensures consistent function reference for proper cleanup
      if (host) {
        this.listener = ((event: Event) => {
          // If keyboard filter is specified, check if event matches
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
 * IfPart handles <if> conditional rendering
 * Uses document fragments to actually remove/insert nodes from the DOM
 * instead of just hiding them with CSS
 */
export class IfPart extends Part {
  private ifElement: HTMLElement;
  private value: any = undefined;
  private fragment: DocumentFragment | null = null;
  private childNodes: Node[] = [];

  constructor(ifElement: Element) {
    super();
    this.ifElement = ifElement as HTMLElement;

    // Set display to contents so the wrapper is transparent
    // display:contents makes the element invisible but renders its children
    this.ifElement.style.display = 'contents';

    // Store initial child nodes
    this.childNodes = Array.from(this.ifElement.childNodes);
  }

  commit(value: any): void {
    const condition = Boolean(value);

    // If condition hasn't changed, do nothing
    if (this.value !== undefined && Boolean(this.value) === condition) {
      return;
    }

    this.value = value;

    if (condition) {
      // Show: restore children from fragment if they were removed
      if (this.fragment && this.fragment.hasChildNodes()) {
        this.ifElement.appendChild(this.fragment);
        this.fragment = null;
      }
    } else {
      // Hide: move children to document fragment
      this.fragment = document.createDocumentFragment();
      while (this.ifElement.firstChild) {
        this.fragment.appendChild(this.ifElement.firstChild);
      }
    }
  }

  clear(): void {
    // Move all children to fragment
    this.fragment = document.createDocumentFragment();
    while (this.ifElement.firstChild) {
      this.fragment.appendChild(this.ifElement.firstChild);
    }
  }
}

/**
 * CasePart handles <case>/<when>/<default> conditional rendering
 * Uses document fragments to remove/insert <when> and <default> children
 */
export class CasePart extends Part {
  private caseElement: Element;
  private value: any = undefined;
  private childrenList: Element[]; // Store all children in original order
  private fragments: Map<Element, DocumentFragment> = new Map(); // Store removed children in fragments
  private attachedChildren: Map<Element, boolean> = new Map(); // Track which children are in DOM

  constructor(caseElement: Element) {
    super();
    this.caseElement = caseElement;

    // Store children in original order
    this.childrenList = Array.from(this.caseElement.children);

    // Initialize all children as attached
    this.childrenList.forEach(child => {
      this.attachedChildren.set(child, true);
      // Create a fragment for each child to hold it when detached
      this.fragments.set(child, document.createDocumentFragment());
    });
  }

  commit(value: any): void {
    // If value hasn't changed, do nothing
    if (this.value === value) return;

    this.value = value;

    // Find matching <when> or <default> and remove/insert appropriately
    let hasMatch = false;

    // First pass: check if any <when> matches
    for (const child of this.childrenList) {
      if (child.tagName.toLowerCase() === 'when') {
        const whenValue = child.getAttribute('value');
        if (whenValue === String(value)) {
          hasMatch = true;
          break;
        }
      }
    }

    // Second pass: remove/insert children based on match
    for (const child of this.childrenList) {
      const tagName = child.tagName.toLowerCase();
      const isAttached = this.attachedChildren.get(child) ?? true;
      let shouldBeAttached = false;

      if (tagName === 'when') {
        const whenValue = child.getAttribute('value');
        shouldBeAttached = (whenValue === String(value));
      } else if (tagName === 'default') {
        shouldBeAttached = !hasMatch;
      }

      // Update DOM if state changed
      if (shouldBeAttached && !isAttached) {
        // Re-insert from fragment in correct position
        // Find next sibling that is still attached
        const childIndex = this.childrenList.indexOf(child);
        let insertBefore: Element | null = null;

        for (let i = childIndex + 1; i < this.childrenList.length; i++) {
          if (this.attachedChildren.get(this.childrenList[i])) {
            insertBefore = this.childrenList[i];
            break;
          }
        }

        // Get child from fragment
        const fragment = this.fragments.get(child);
        if (fragment && fragment.firstChild) {
          if (insertBefore) {
            this.caseElement.insertBefore(fragment.firstChild, insertBefore);
          } else {
            this.caseElement.appendChild(fragment.firstChild);
          }
        }
        this.attachedChildren.set(child, true);
      } else if (!shouldBeAttached && isAttached) {
        // Move to fragment
        const fragment = this.fragments.get(child);
        if (fragment) {
          fragment.appendChild(child);
        }
        this.attachedChildren.set(child, false);
      }
    }
  }

  clear(): void {
    // Move all children to fragments
    for (const child of this.childrenList) {
      if (this.attachedChildren.get(child)) {
        const fragment = this.fragments.get(child);
        if (fragment) {
          fragment.appendChild(child);
        }
        this.attachedChildren.set(child, false);
      }
    }
  }
}
