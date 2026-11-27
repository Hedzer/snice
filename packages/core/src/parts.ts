import { HTML_RESULT, TemplateResult } from './template';
import { contextualizeRenderError, type RenderHostIdentity } from './render-errors';
import {
  templateMarker as marker,
  templateMarkerMatch as markerMatch,
  templateMarkerRegex as markerRegex,
  templateNodeMarker as nodeMarker
} from './template-marker';
import {
  Part,
  TEMPLATE_INSTANCE_BRAND,
  noChange,
  live,
  type NoChange,
  type PropertyBindingRegistry,
  type TemplateInstanceLike,
} from './part-base';
import { NodePart } from './part-node';
import {
  AttributePart,
  CommentPart,
  ClassPart,
  StylePart,
  PropertyPart,
  BooleanAttributePart,
} from './part-basic';
import { EventPart } from './part-event';
import { KEYBOARD_FILTER_TOOLS } from './part-key-event';
import { SpreadPart } from './part-spread';
import { ControllerPart } from './part-controller';
import {
  ConditionalIfPart,
  ConditionalElseIfPart,
  ConditionalCasePart,
  ConditionalWhenPart,
} from './part-conditional';

export {
  Part,
  noChange,
  live,
  NodePart,
  AttributePart,
  CommentPart,
  ClassPart,
  StylePart,
  PropertyPart,
  BooleanAttributePart,
  EventPart,
  SpreadPart,
  ControllerPart,
  ConditionalIfPart,
  ConditionalElseIfPart,
  ConditionalCasePart,
  ConditionalWhenPart,
};
export type { NoChange };

// Template cache - templates with same string array can be reused
const templateCache = /*#__PURE__*/ new WeakMap<TemplateStringsArray, Template>();

function contextualizeTemplatePreparationError(error: unknown, strings: TemplateStringsArray): Error {
  if (error instanceof Error && /\bNear "[\s\S]*"\.$/.test(error.message)) return error;
  const message = error instanceof Error ? error.message : String(error);
  const source = Array.from(strings).join('${…}').replace(/\s+/g, ' ').trim();
  const tag = /<([a-z][a-z0-9-]*)>/i.exec(message)?.[1];
  const binding = /binding "([^"]+)"/i.exec(message)?.[1];
  const clue = tag ? `<${tag}` : binding ?? '';
  const clueIndex = clue ? source.indexOf(clue) : -1;
  const center = clueIndex >= 0 ? clueIndex : 0;
  const start = Math.max(0, center - 40);
  const end = Math.min(source.length, center + 80);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < source.length ? '…' : '';
  return new Error(`${message} Near "${prefix}${source.slice(start, end)}${suffix}".`, {
    cause: error
  });
}

/**
 * A prepared template ready for rendering
 */
class Template {
  parts: TemplatePart[] = [];
  element: HTMLTemplateElement;
  keyIndex = -1;

  constructor(_result: TemplateResult, element: HTMLTemplateElement, attrNamesForParts: string[]) {
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

        if (tagName === 'if') {
          const valueAttr = element.getAttribute('value');
          if (valueAttr && valueAttr.includes(marker)) {
            element.removeAttribute('value');
            this.parts.push({
              type: 'conditional-if',
              index: partIndex++,
              element
            });
          } else {
            throw new Error('snice: <if> requires a condition expression.');
          }
          continue;
        }

        if (tagName === 'case') {
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
            element.removeAttribute('value');
            this.parts.push({
              type: 'conditional-case',
              index: partIndex++,
              element
            });
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

            if (value.includes(marker)) {
              attrsToRemove.push(attr);
              const originalName = attrNamesForParts[partIndex] || attr.name;
              const attrStrings = value.split(marker);
              const expressionCount = attrStrings.length - 1;

              const isSingleExpressionBinding =
                /^@@?|^[.?]/.test(originalName) ||
                originalName.startsWith('...') ||
                originalName.startsWith('class:') ||
                originalName.startsWith('style:');
              if (isSingleExpressionBinding) {
                const hasStaticText = attrStrings.some((s) => s !== '');
                if (expressionCount > 1 || hasStaticText) {
                  if ((typeof __SNICE_DEV__ === 'undefined' || __SNICE_DEV__) && (typeof process === 'undefined' || !process.env || process.env.NODE_ENV !== 'production')) {
                    console.warn(
                      `snice: binding "${originalName}" takes a single expression; ` +
                      `static text and extra interpolations are ignored. ` +
                      `Use a plain attribute for string interpolation.`
                    );
                  }
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
                this.parts.push({
                  type: 'event',
                  index: partIndex,
                  name: originalName.slice(1),
                  element
                });
                partIndex += expressionCount;
              } else if (originalName.startsWith('@')) {
                if (!originalName.slice(1).split('|')[0]) throw new Error('snice: event binding requires an event name.');
                this.parts.push({
                  type: 'event',
                  index: partIndex,
                  name: originalName.slice(1),
                  element
                });
                partIndex += expressionCount;
              } else if (originalName.startsWith('.')) {
                if (!originalName.slice(1)) throw new Error('snice: property binding requires a property name.');
                this.parts.push({
                  type: 'property',
                  index: partIndex,
                  name: originalName.slice(1),
                  element
                });
                partIndex += expressionCount;
              } else if (originalName.startsWith('?')) {
                if (!originalName.slice(1)) throw new Error('snice: boolean binding requires an attribute name.');
                this.parts.push({
                  type: 'boolean-attribute',
                  index: partIndex,
                  name: originalName.slice(1),
                  element
                });
                partIndex += expressionCount;
              } else if (
                attr.name === 'controller' &&
                attrStrings.length === 2 && attrStrings[0] === '' && attrStrings[1] === ''
              ) {
                this.parts.push({
                  type: 'controller',
                  index: partIndex,
                  element
                });
                partIndex += expressionCount;
              } else {
                this.parts.push({
                  type: 'attribute',
                  index: partIndex,
                  name: attr.name,
                  element,
                  attrStrings
                });
                partIndex += expressionCount;
              }
            }
          }

          for (const attr of attrsToRemove) {
            element.removeAttribute(attr.name);
          }
        }
      } else if (node.nodeType === Node.COMMENT_NODE) {
        const comment = node as Comment;
        if (comment.data === markerMatch) {
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

          if (parts[lastIndex] !== '') {
            text.data = parts[lastIndex];
          } else {
            nodesToRemove.push(text);
          }
        }
      }
    }

    for (const node of nodesToRemove) {
      node.parentNode?.removeChild(node);
    }

    for (const part of this.parts) {
      if (part.type === 'attribute' && part.name === 'key') {
        this.keyIndex = part.index;
        break;
      }
    }
  }
}

interface TemplatePart {
  type: 'node' | 'attribute' | 'property' | 'boolean-attribute' | 'event' | 'class' | 'style' | 'spread' | 'controller' | 'conditional-if' | 'conditional-else-if' | 'conditional-case' | 'conditional-when' | 'comment';
  index: number;
  name?: string;
  element?: Element;
  startNode?: Comment;
  endNode?: Comment;
  attrStrings?: string[];
}

let _quasiScanCount = 0;

/** @internal Count of runtime char-by-char quasi scans (for pre-compilation verification). */
export function _getQuasiScanCount(): number {
  return _quasiScanCount;
}

function scanTemplateQuasis(strings: TemplateStringsArray): { html: string; attrNamesForParts: string[] } {
  _quasiScanCount++;
  const htmlParts: string[] = [];
  const attrNamesForParts: string[] = [];

  let inTag = false;
  let inAttrValue = false;
  let inComment = false;
  let attrQuoteChar = '';
  let currentAttrName = '';

  for (let i = 0; i < strings.length; i++) {
    const str = strings[i];
    htmlParts.push(str);

    if (i < strings.length - 1) {
      for (let j = 0; j < str.length; j++) {
        const char = str[j];

        if (inComment) {
          if (char === '-' && str.startsWith('-->', j)) {
            inComment = false;
            j += 2;
          }
        } else if (!inTag) {
          if (char === '<') {
            if (str.startsWith('<!--', j)) {
              inComment = true;
              j += 3;
            } else if (/[A-Za-z!/?]/.test(str[j + 1] || '')) {
              inTag = true;
            }
          }
        } else if (!inAttrValue) {
          if (char === '>') {
            inTag = false;
          } else if (char === '"' || char === "'") {
            inAttrValue = true;
            attrQuoteChar = char;
          } else if (char === '=') {
            let attrStart = j - 1;
            while (attrStart >= 0 && /[\w\-\.@\?/:\+~|]/.test(str[attrStart])) {
              attrStart--;
            }
            currentAttrName = str.substring(attrStart + 1, j).trim();
          }
        } else {
          if (char === attrQuoteChar) {
            inAttrValue = false;
            attrQuoteChar = '';
          }
        }
      }

      if (inComment) {
        attrNamesForParts.push('');
        htmlParts.push(marker);
      } else if (inAttrValue) {
        attrNamesForParts.push(currentAttrName);
        htmlParts.push(marker);
      } else if (inTag) {
        const trimmed = str.trimEnd();
        if (trimmed.endsWith('=')) {
          let attrStart = trimmed.length - 2;
          while (attrStart >= 0 && /[\w\-\.@\?\/:\+~|]/.test(trimmed[attrStart])) {
            attrStart--;
          }
          currentAttrName = trimmed.substring(attrStart + 1, trimmed.length - 1).trim();
          attrNamesForParts.push(currentAttrName);
          htmlParts.push(marker);
        } else {
          const metaElementMatch = str.match(/<(if|else-if|case|when)\s*$/);
          if (metaElementMatch) {
            currentAttrName = 'value';
            attrNamesForParts.push('value');
            htmlParts.push(`value="${marker}"`);
          } else {
            let message =
              'snice: expressions directly in opening tags are not supported; ' +
              'use an explicit attribute, property, event, class, style, or named spread binding.';
            if ((typeof __SNICE_DEV__ === 'undefined' || __SNICE_DEV__) && (typeof process === 'undefined' || !process.env || process.env.NODE_ENV !== 'production')) {
              const nearbyTemplate = (
                str.slice(-40) + '${…}' + (strings[i + 1] ?? '').slice(0, 40)
              ).replace(/\s+/g, ' ').trim();
              message += ` Near "${nearbyTemplate}".`;
            }
            throw new Error(message);
          }
        }
      } else {
        attrNamesForParts.push('');
        htmlParts.push(nodeMarker);
      }
    }
  }

  return { html: htmlParts.join(''), attrNamesForParts };
}

function prepareTemplate(result: TemplateResult): Template {
  const { strings } = result;
  const cached = templateCache.get(strings);
  if (cached) {
    return cached;
  }

  const { html, attrNamesForParts } = scanTemplateQuasis(strings);

  const template = document.createElement('template');
  if (result.svg) {
    template.innerHTML = `<svg>${html}</svg>`;
    const wrapper = template.content.firstElementChild!;
    while (wrapper.firstChild) {
      template.content.insertBefore(wrapper.firstChild, wrapper);
    }
    template.content.removeChild(wrapper);
  } else {
    template.innerHTML = html;
  }

  let tmpl: Template;
  try {
    tmpl = new Template(result, template, attrNamesForParts);
  } catch (error) {
    if ((typeof __SNICE_DEV__ === 'undefined' || __SNICE_DEV__) && (typeof process === 'undefined' || !process.env || process.env.NODE_ENV !== 'production')) {
      throw contextualizeTemplatePreparationError(error, strings);
    }
    throw error;
  }
  templateCache.set(strings, tmpl);
  return tmpl;
}

/**
 * Instance of a runtime-parsed template
 */
export class TemplateInstance implements TemplateInstanceLike {
  readonly [TEMPLATE_INSTANCE_BRAND] = true as const;
  template: Template;
  strings: TemplateStringsArray;
  parts: Part[] = [];
  fragment: DocumentFragment | null = null;
  private conditionalParts: Array<{ part: Part; index: number }> = [];
  private regularParts: Array<{ part: Part; index: number }> = [];
  readonly #renderIdentity: RenderHostIdentity | null;
  readonly #customElementRegistry: PropertyBindingRegistry | null;

  constructor(
    result: TemplateResult,
    renderIdentity: RenderHostIdentity | null = null,
    customElementRegistry: PropertyBindingRegistry | null =
      document.defaultView?.customElements ?? globalThis.customElements ?? null
  ) {
    this.#renderIdentity = renderIdentity;
    this.#customElementRegistry = customElementRegistry;
    try {
      this.template = prepareTemplate(result);
    } catch (error) {
      throw renderIdentity ? contextualizeRenderError(renderIdentity, error) : error;
    }
    this.strings = result.strings;
  }

  isSameTemplate(strings: TemplateStringsArray): boolean {
    return this.strings === strings;
  }

  getRenderHostIdentity(): RenderHostIdentity | null {
    return this.#renderIdentity;
  }

  renderFragment(): DocumentFragment {
    if (!this.fragment) {
      this.fragment = this.template.element.content.cloneNode(true) as DocumentFragment;

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
            part = new NodePart(
              nodeMap.get(partDef.startNode!) as Comment,
              nodeMap.get(partDef.endNode!) as Comment,
              this.#renderIdentity,
              this.#customElementRegistry
            );
            break;
          case 'attribute':
            part = new AttributePart(
              nodeMap.get(partDef.element!) as Element,
              partDef.name!,
              partDef.attrStrings
            );
            break;
          case 'property':
            part = new PropertyPart(
              nodeMap.get(partDef.element!) as Element,
              partDef.name!,
              this.#customElementRegistry
            );
            break;
          case 'boolean-attribute':
            part = new BooleanAttributePart(
              nodeMap.get(partDef.element!) as Element,
              partDef.name!
            );
            break;
          case 'event':
            part = new EventPart(
              nodeMap.get(partDef.element!) as Element,
              partDef.name!,
              KEYBOARD_FILTER_TOOLS
            );
            break;
          case 'class':
            part = new ClassPart(nodeMap.get(partDef.element!) as Element, partDef.name!);
            break;
          case 'style':
            part = new StylePart(nodeMap.get(partDef.element!) as HTMLElement, partDef.name!);
            break;
          case 'spread':
            part = new SpreadPart(
              nodeMap.get(partDef.element!) as Element,
              partDef.name!,
              this.#customElementRegistry
            );
            break;
          case 'controller':
            part = new ControllerPart(nodeMap.get(partDef.element!) as HTMLElement);
            break;
          case 'conditional-if':
            part = new ConditionalIfPart(nodeMap.get(partDef.element!) as Element);
            break;
          case 'conditional-else-if':
            part = new ConditionalElseIfPart(nodeMap.get(partDef.element!) as Element);
            break;
          case 'conditional-case':
            part = new ConditionalCasePart(
              nodeMap.get(partDef.element!) as Element,
              dynamicWhenElements
            );
            break;
          case 'conditional-when':
            part = new ConditionalWhenPart(nodeMap.get(partDef.element!) as Element);
            break;
          case 'comment':
            part = new CommentPart(
              nodeMap.get(partDef.startNode!) as Comment,
              partDef.attrStrings!
            );
            break;
        }

        this.parts.push(part);

        if (part._isCond) {
          this.conditionalParts.push({ part, index: partDef.index });
        } else {
          this.regularParts.push({ part, index: partDef.index });
        }
      }
    }

    return this.fragment;
  }

  render(values: readonly any[]): DocumentFragment {
    const fragment = this.renderFragment();
    this.update(values);
    return fragment;
  }

  update(values: readonly any[]): void {
    for (const { part, index } of this.conditionalParts) {
      part.commit(values[index]);
    }

    const flushed = new Set<Part>();
    for (const { part } of this.conditionalParts) {
      const coordinator = part._getCoordinator ? part._getCoordinator() : part;
      if (flushed.has(coordinator)) continue;
      flushed.add(coordinator);
      coordinator._flush?.();
    }

    for (const { part, index } of this.regularParts) {
      if (part._multi) {
        part.commit(values, index);
      } else {
        part.commit(values[index]);
      }
    }

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

function createRuntimeInstance(
  result: TemplateResult,
  renderIdentity: RenderHostIdentity | null,
  customElementRegistry: PropertyBindingRegistry | null
): TemplateInstance {
  return new TemplateInstance(result, renderIdentity, customElementRegistry);
}

function getRuntimeKeyIndex(result: TemplateResult): number {
  return prepareTemplate(result).keyIndex;
}

/**
 * Tagged template function for creating HTML templates
 */
export function html(strings: TemplateStringsArray, ...values: any[]): TemplateResult {
  return {
    _$litType$: HTML_RESULT,
    strings,
    values,
    _create: createRuntimeInstance,
    _keyIndex: getRuntimeKeyIndex,
  };
}

/**
 * Tagged template function for SVG fragments
 */
export function svg(strings: TemplateStringsArray, ...values: any[]): TemplateResult {
  return {
    _$litType$: HTML_RESULT,
    strings,
    values,
    svg: true,
    _create: createRuntimeInstance,
    _keyIndex: getRuntimeKeyIndex,
  };
}
