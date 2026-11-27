import { nothing } from './template';
import {
  Part,
  NOT_COMMITTED,
  noChange,
  isLive,
  isPrimitiveValue,
  commitPropertyValue,
  flushPreUpgradePropertyBindings,
  type PropertyBindingRegistry,
  type CompiledPartContext,
} from './part-base';

/**
 * AttributePart handles regular attribute updates (single-value or interpolated).
 */
export class AttributePart extends Part {
  readonly type = 'attribute' as const;
  readonly _multi: boolean;
  element: Element;
  readonly name: string;
  readonly strings?: readonly string[];
  private _committedValue: unknown | unknown[] = NOT_COMMITTED;

  constructor(element: Element, name: string, strings?: string[]) {
    super();
    this.element = element;
    this.name = name;

    if (strings && (strings.length > 2 || strings[0] !== '' || strings[1] !== '')) {
      this._committedValue = new Array(strings.length - 1).fill(NOT_COMMITTED);
      this.strings = strings;
      this._multi = true;
    } else {
      this._committedValue = NOT_COMMITTED;
      this._multi = false;
    }
  }

  commit(value: unknown, valueIndex: number = 0): void {
    let change = false;
    let finalValue: unknown;

    if (this.strings === undefined) {
      if (value === noChange) return;

      change = !isPrimitiveValue(value) ||
               (value !== this._committedValue && value !== noChange);

      if (change) {
        this._committedValue = value;
        finalValue = value;
      } else {
        return;
      }
    } else {
      const values = value as unknown[];
      const committedValues = this._committedValue as unknown[];
      finalValue = this.strings[0];

      for (let i = 0; i < this.strings.length - 1; i++) {
        let v = values[valueIndex + i];

        if (v === noChange) {
          v = committedValues[i];
          if (v === NOT_COMMITTED) v = '';
        }

        change = change || !isPrimitiveValue(v) || v !== committedValues[i];

        if (v === nothing) {
          finalValue = nothing;
        } else if (finalValue !== nothing) {
          finalValue = (finalValue as string) + (v ?? '') + this.strings[i + 1];
        }

        committedValues[i] = v;
      }

      if (!change) {
        return;
      }
    }

    this._commitValue(finalValue);
  }

  private _commitValue(value: unknown): void {
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
 * CommentPart renders binding values into an authored HTML comment's text.
 */
export class CommentPart extends Part {
  readonly type = 'node' as const;
  readonly _multi = true;
  node: Comment;
  readonly strings: readonly string[];
  private _committedValues: unknown[];

  constructor(node: Comment, strings: readonly string[]) {
    super();
    this.node = node;
    this.strings = strings;
    this._committedValues = new Array(strings.length - 1).fill(NOT_COMMITTED);
  }

  commit(values: unknown, startIndex: number = 0): void {
    const vals = values as unknown[];
    let change = false;
    let text = this.strings[0];

    for (let i = 0; i < this.strings.length - 1; i++) {
      let v = vals[startIndex + i];

      if (v === noChange) {
        v = this._committedValues[i];
        if (v === NOT_COMMITTED) v = '';
      }

      change = change || !isPrimitiveValue(v) || v !== this._committedValues[i];
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

/**
 * PropertyPart handles property bindings (.property=${value})
 */
export class PropertyPart extends Part {
  readonly type = 'property' as const;
  element: Element;
  readonly name: string;
  private _committedValue: unknown = NOT_COMMITTED;
  readonly #customElementRegistry: PropertyBindingRegistry | null;

  constructor(
    element: Element,
    name: string,
    customElementRegistry: PropertyBindingRegistry | null = null
  ) {
    super();
    this.element = element;
    this.name = name;
    this.#customElementRegistry = customElementRegistry;
  }

  commit(value: unknown): void {
    if (value === noChange) return;

    if (isLive(value)) {
      value = value.value;
      if (value === noChange) return;
      const domValue = (this.element as any)[this.name];
      if (value === domValue) {
        this._committedValue = value;
        return;
      }
    } else {
      if (value === this._committedValue) return;
    }

    this._committedValue = value;
    commitPropertyValue(
      this.element,
      this.name,
      value === nothing ? undefined : value,
      this.#customElementRegistry
    );
  }

  reconnected(): void {
    flushPreUpgradePropertyBindings(this.element, this.#customElementRegistry);
  }

  clear(): void {
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

    const boolValue = !!value && value !== nothing;
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

/** @internal Tree-shakeable compiled-template factories */
export function __pAttr(node: Node, name: string, strings?: string[]): AttributePart {
  return new AttributePart(node as Element, name, strings);
}

export function __pBool(node: Node, name: string): BooleanAttributePart {
  return new BooleanAttributePart(node as Element, name);
}

export function __pProp(
  node: Node,
  name: string,
  _b: unknown,
  ctx: CompiledPartContext
): PropertyPart {
  return new PropertyPart(node as Element, name, ctx.customElementRegistry);
}

export function __pClass(node: Node, name: string): ClassPart {
  return new ClassPart(node as Element, name);
}

export function __pStyle(node: Node, name: string): StylePart {
  return new StylePart(node as Element, name);
}

export function __pComment(node: Node, strings: readonly string[]): CommentPart {
  return new CommentPart(node as Comment, strings);
}
