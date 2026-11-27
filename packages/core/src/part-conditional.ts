import { nothing } from './template';
import { Part, noChange, type CompiledPartContext } from './part-base';

const NOT_SET = /*#__PURE__*/ Symbol('not-set');

const conditionalElseIfOwners = /*#__PURE__*/ new WeakMap<Element, {
  coordinator: ConditionalIfPart;
  index: number;
}>();

const conditionalWhenOwners = /*#__PURE__*/ new WeakMap<Element, {
  coordinator: ConditionalCasePart;
  index: number;
}>();

/**
 * ConditionalIfPart handles <if>/<else-if>/<else> conditional rendering
 */
export class ConditionalIfPart extends Part {
  readonly type = 'node' as const;
  readonly _isCond = true;
  private startNode: Comment;
  private endNode: Comment;
  private conditions: unknown[] = [NOT_SET];
  private branches: DocumentFragment[] = [];
  private defaultBranch = -1;
  private currentBranch = -1;

  constructor(ifElement: Element) {
    super();
    const parent = ifElement.parentNode!;

    this.startNode = document.createComment('if');
    this.endNode = document.createComment('/if');

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

  _flush(): void {
    this.flush();
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

export class ConditionalElseIfPart extends Part {
  readonly type = 'node' as const;
  readonly _isCond = true;
  readonly coordinator: ConditionalIfPart;
  private readonly index: number;

  constructor(element: Element) {
    super();
    const owner = conditionalElseIfOwners.get(element);
    if (!owner) throw new Error('snice: <else-if> must be a direct child of <if>.');
    this.coordinator = owner.coordinator;
    this.index = owner.index;
  }

  _getCoordinator(): Part {
    return this.coordinator;
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
 */
export class ConditionalCasePart extends Part {
  readonly type = 'node' as const;
  readonly _isCond = true;
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

    this.startNode = document.createComment('case');
    this.endNode = document.createComment('/case');

    parent.insertBefore(this.startNode, caseElement);
    parent.insertBefore(this.endNode, caseElement.nextSibling);

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

    parent.removeChild(caseElement);
  }

  commit(value: any): void {
    if (value !== noChange) this.value = value;
  }

  setExpected(index: number, value: unknown): void {
    if (value !== noChange) this.branches[index].expected = value;
  }

  _flush(): void {
    this.flush();
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

export class ConditionalWhenPart extends Part {
  readonly type = 'node' as const;
  readonly _isCond = true;
  readonly coordinator: ConditionalCasePart;
  private readonly index: number;

  constructor(element: Element) {
    super();
    const owner = conditionalWhenOwners.get(element);
    if (!owner) throw new Error('snice: dynamic <when> must be a direct child of <case>.');
    this.coordinator = owner.coordinator;
    this.index = owner.index;
  }

  _getCoordinator(): Part {
    return this.coordinator;
  }

  commit(value: unknown): void {
    this.coordinator.setExpected(this.index, value);
  }

  clear(): void {}

  get isConnected(): boolean {
    return this.coordinator.isConnected;
  }
}

/** @internal Tree-shakeable compiled-template factories */
export function __pIf(node: Node): ConditionalIfPart {
  return new ConditionalIfPart(node as Element);
}

export function __pElseIf(node: Node): ConditionalElseIfPart {
  return new ConditionalElseIfPart(node as Element);
}

export function __pCase(
  node: Node,
  _a: unknown,
  _b: unknown,
  ctx: CompiledPartContext
): ConditionalCasePart {
  return new ConditionalCasePart(node as Element, ctx.dynamicWhenElements ?? new Set());
}

export function __pWhen(node: Node): ConditionalWhenPart {
  return new ConditionalWhenPart(node as Element);
}
(__pWhen as any)._isWhen = true;
