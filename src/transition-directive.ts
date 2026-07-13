import { Directive, DirectivePart, DirectiveResult, directive, directiveServerResult } from './directive';
import { NodePart, noChange } from './parts';
import { isTemplateResult } from './template';
import { isRepeatResult } from './repeat';
import { parseStyles } from './transitions';
import type { Transition } from './types/transition';

export interface TransitionDirectiveOptions extends Transition {
  /** Identity that triggers a transition. Inferred from template/list identity when omitted. */
  key?: unknown;
  /** Respect prefers-reduced-motion. Defaults to true. */
  respectReducedMotion?: boolean;
  onStart?: () => void;
  onComplete?: () => void;
}

interface Region {
  start: Comment;
  end: Comment;
  part: NodePart;
}

interface PendingTransition {
  content: unknown;
  key: unknown;
  options: TransitionDirectiveOptions;
}

interface ActiveTransition {
  oldRegion: Region;
  newRegion: Region;
  key: unknown;
  options: TransitionDirectiveOptions;
  oldStyles: Array<{ element: TransitionElement; style: string | null }>;
  newStyles: Array<{ element: TransitionElement; style: string | null }>;
  parent: HTMLElement | null;
  parentPosition: string;
  finished: boolean;
}

type TransitionElement = HTMLElement | SVGElement;

function inferKey(content: unknown, options: TransitionDirectiveOptions): unknown {
  if (Object.prototype.hasOwnProperty.call(options, 'key')) return options.key;
  if (isTemplateResult(content)) return content.strings;
  if (isRepeatResult(content)) return content.keys;
  return content;
}

function keysEqual(first: unknown, second: unknown): boolean {
  if (Object.is(first, second)) return true;
  if (Array.isArray(first) && Array.isArray(second)) {
    return first.length === second.length && first.every((value, index) => Object.is(value, second[index]));
  }
  return false;
}

function elementsIn(region: Region): TransitionElement[] {
  const elements: TransitionElement[] = [];
  let node = region.start.nextSibling;
  while (node && node !== region.end) {
    if (node instanceof HTMLElement || node instanceof SVGElement) elements.push(node);
    node = node.nextSibling;
  }
  return elements;
}

function applyStyles(element: TransitionElement, styles: Readonly<Record<string, string>>): void {
  for (const [property, value] of Object.entries(styles)) {
    element.style.setProperty(property, value);
  }
}

class TransitionDirective extends Directive {
  static renderToString(values: readonly unknown[]): unknown {
    return directiveServerResult('boundary', values[0], 'transition');
  }
  private hostPart: NodePart | null = null;
  private current: Region | null = null;
  private currentKey: unknown;
  private active: ActiveTransition | null = null;
  private pending: PendingTransition | null = null;
  private version = 0;
  private waitTimer: ReturnType<typeof setTimeout> | null = null;
  private resolveWait: (() => void) | null = null;

  render(): unknown {
    return noChange;
  }

  update(part: DirectivePart, values: readonly unknown[]): unknown {
    if (!(part instanceof NodePart)) {
      throw new TypeError('snice: transition() must be used in a node expression.');
    }
    const content = values[0];
    const options = (values[1] || {}) as TransitionDirectiveOptions;
    const key = inferKey(content, options);
    this.hostPart = part;

    if (!this.current) {
      this.current = this.createRegion(content, false);
      this.currentKey = key;
      return noChange;
    }

    if (this.active) {
      this.pending = { content, key, options };
      return noChange;
    }

    if (keysEqual(key, this.currentKey)) {
      this.current.part.commit(content);
      return noChange;
    }

    this.startSwap({ content, key, options });
    return noChange;
  }

  disconnected(): void {
    this.finishActive();
    if (this.pending && this.current) {
      this.current.part.commit(this.pending.content);
      this.currentKey = this.pending.key;
      this.pending = null;
    }
    this.current?.part.disconnected();
  }

  reconnected(): void {
    this.current?.part.reconnected();
  }

  adopted(nodeMap: ReadonlyMap<Node, Node>): void {
    const adoptRegion = (region: Region | null): void => {
      if (!region) return;
      const start = nodeMap.get(region.start);
      const end = nodeMap.get(region.end);
      if (start instanceof Comment) region.start = start;
      if (end instanceof Comment) region.end = end;
      region.part.adoptNodes(nodeMap);
    };
    adoptRegion(this.current);
    if (this.active) {
      adoptRegion(this.active.oldRegion);
      adoptRegion(this.active.newRegion);
    }
  }

  private createRegion(content: unknown, detached: boolean): Region {
    if (!this.hostPart) throw new Error('snice: transition host part is unavailable.');
    const documentRef = this.hostPart.endMarker.ownerDocument;
    const start = documentRef.createComment('transition');
    const end = documentRef.createComment('/transition');
    const part = new NodePart(start, end);

    if (detached) {
      const fragment = documentRef.createDocumentFragment();
      fragment.append(start, end);
      part.commit(content);
      this.hostPart.endMarker.parentNode?.insertBefore(fragment, this.hostPart.endMarker);
      if (this.hostPart.isConnected) part.reconnected();
    } else {
      const parent = this.hostPart.endMarker.parentNode!;
      parent.insertBefore(start, this.hostPart.endMarker);
      parent.insertBefore(end, this.hostPart.endMarker);
      part.commit(content);
    }
    return { start, end, part };
  }

  private async swap(next: PendingTransition): Promise<void> {
    if (!this.current) return;
    const oldRegion = this.current;
    const newRegion = this.createRegion(next.content, true);
    const oldElements = elementsIn(oldRegion);
    const newElements = elementsIn(newRegion);
    const parentNode = this.hostPart?.endMarker.parentNode;
    const parent = parentNode instanceof HTMLElement ? parentNode : null;
    const parentPosition = parent?.style.position || '';
    const oldStyles = oldElements.map(element => ({
      element,
      style: element.getAttribute('style')
    }));
    const newStyles = newElements.map(element => ({
      element,
      style: element.getAttribute('style')
    }));
    const active: ActiveTransition = {
      oldRegion,
      newRegion,
      key: next.key,
      options: next.options,
      oldStyles,
      newStyles,
      parent,
      parentPosition,
      finished: false
    };
    this.active = active;
    const version = ++this.version;

    const reduced = next.options.respectReducedMotion !== false &&
      typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;
    const outDuration = reduced ? 0 : (next.options.outDuration ?? 300);
    const inDuration = reduced ? 0 : (next.options.inDuration ?? 300);
    const mode = next.options.mode ?? 'sequential';
    const outStyles = next.options.out !== undefined
      ? parseStyles(next.options.out)
      : { opacity: '0' };
    const inStyles = {
      opacity: '1',
      ...(next.options.in !== undefined ? parseStyles(next.options.in) : {})
    };

    if (parent) parent.style.position = parent.style.position || 'relative';
    for (const element of [...oldElements, ...newElements]) {
      element.style.position = 'absolute';
      element.style.inset = '0';
      element.style.width = '100%';
    }
    for (const element of oldElements) element.style.transition = `all ${outDuration}ms ease-in-out`;
    for (const element of newElements) {
      element.style.opacity = '0';
      element.style.transition = `all ${inDuration}ms ease-in-out`;
    }
    // Force style calculation before applying the target state. Unlike
    // offsetHeight, getBoundingClientRect() is available on both HTML and SVG.
    newElements[0]?.getBoundingClientRect();

    try { next.options.onStart?.(); } catch (error) { console.error('snice: transition onStart failed:', error); }

    if (mode === 'simultaneous') {
      for (const element of oldElements) applyStyles(element, outStyles);
      for (const element of newElements) applyStyles(element, inStyles);
      await this.delay(Math.max(outDuration, inDuration));
    } else {
      for (const element of oldElements) applyStyles(element, outStyles);
      await this.delay(outDuration);
      if (version !== this.version) return;
      for (const element of newElements) applyStyles(element, inStyles);
      await this.delay(inDuration);
    }

    if (version !== this.version) return;
    this.finishActive();
  }

  private finishActive(): void {
    const active = this.active;
    if (!active || active.finished) return;
    active.finished = true;
    this.version++;
    this.cancelWait();
    this.removeRegion(active.oldRegion);

    for (const { element, style } of active.newStyles) {
      if (style === null) element.removeAttribute('style');
      else element.setAttribute('style', style);
    }
    if (active.parent) active.parent.style.position = active.parentPosition;

    this.current = active.newRegion;
    this.currentKey = active.key;
    this.active = null;
    try { active.options.onComplete?.(); } catch (error) { console.error('snice: transition onComplete failed:', error); }

    const pending = this.pending;
    this.pending = null;
    if (!pending || !this.current) return;
    if (keysEqual(pending.key, this.currentKey)) {
      this.current.part.commit(pending.content);
    } else if (this.hostPart?.isConnected) {
      this.startSwap(pending);
    } else {
      this.current.part.commit(pending.content);
      this.currentKey = pending.key;
    }
  }

  private removeRegion(region: Region): void {
    let cleanupError: unknown;
    try {
      region.part.destroy();
    } catch (error) {
      cleanupError = error;
    }
    let node: Node | null = region.start;
    const stop = region.end.nextSibling;
    while (node && node !== stop) {
      const nextNode: Node | null = node.nextSibling;
      node.parentNode?.removeChild(node);
      node = nextNode;
    }
    if (cleanupError) console.error('snice: transition region cleanup failed:', cleanupError);
  }

  private startSwap(next: PendingTransition): void {
    void this.swap(next).catch(error => {
      if (this.active) this.abortActive();
      console.error('snice: transition failed:', error);
    });
  }

  private abortActive(): void {
    const active = this.active;
    if (!active || active.finished) return;
    active.finished = true;
    this.version++;
    this.cancelWait();
    this.removeRegion(active.newRegion);
    for (const { element, style } of active.oldStyles) {
      if (style === null) element.removeAttribute('style');
      else element.setAttribute('style', style);
    }
    if (active.parent) active.parent.style.position = active.parentPosition;
    this.active = null;

    const pending = this.pending;
    this.pending = null;
    if (!pending || !this.current) return;
    if (keysEqual(pending.key, this.currentKey)) {
      this.current.part.commit(pending.content);
    } else if (this.hostPart?.isConnected) {
      this.startSwap(pending);
    } else {
      this.current.part.commit(pending.content);
      this.currentKey = pending.key;
    }
  }

  private delay(milliseconds: number): Promise<void> {
    if (milliseconds <= 0) return Promise.resolve();
    return new Promise(resolve => {
      this.resolveWait = resolve;
      this.waitTimer = setTimeout(() => {
        this.waitTimer = null;
        this.resolveWait = null;
        resolve();
      }, milliseconds);
    });
  }

  private cancelWait(): void {
    if (this.waitTimer) clearTimeout(this.waitTimer);
    this.waitTimer = null;
    const resolve = this.resolveWait;
    this.resolveWait = null;
    resolve?.();
  }
}

const transitionResult = directive<TransitionDirective, readonly [unknown, TransitionDirectiveOptions?]>(TransitionDirective);

/** Animate keyed conditional, list, or route content without a wrapper node. */
export function transition(
  content: unknown,
  options?: TransitionDirectiveOptions
): DirectiveResult {
  return transitionResult(content, options);
}
