/**
 * Public directive protocol.
 *
 * Directives are stateful values that can participate in any template part.
 * A directive instance is retained while the same directive class remains in
 * the same expression position, which gives it a reliable place to manage
 * listeners, async work, and other lifecycle-bound resources.
 */

export const DIRECTIVE_RESULT = Symbol.for('snice:directive-result');
export const DIRECTIVE_SERVER_RESULT = Symbol.for('snice:directive-server-result');

export type PartType =
  | 'node'
  | 'attribute'
  | 'property'
  | 'boolean-attribute'
  | 'event'
  | 'element'
  | 'class'
  | 'style'
  | 'spread';

export interface PartInfo {
  readonly type: PartType;
  readonly element?: Element;
  readonly name?: string;
  readonly strings?: readonly string[];
}

/** The live template position supplied to a directive's update hook. */
export interface DirectivePart extends PartInfo {
  /** Commit a value from an async callback without replacing the directive. */
  setValue(value: unknown): void;
  /** Whether this template position is currently connected to a document. */
  readonly isConnected: boolean;
}

export interface DirectiveServerContext extends PartInfo {
  /** True for renderToStringAsync(), false for synchronous SSR. */
  readonly async: boolean;
}

export interface DirectiveDisconnectContext {
  /** Why the directive is leaving its connected state. */
  readonly reason: 'host' | 'branch' | 'dispose';
}

export interface DirectiveServerResult {
  readonly _$serverDirective$: typeof DIRECTIVE_SERVER_RESULT;
  readonly kind: 'attributes' | 'properties' | 'events' | 'boundary';
  readonly value: unknown;
  readonly name?: string;
}

export type DirectiveConstructor<T extends Directive = Directive> =
  (new (partInfo: PartInfo) => T) & {
    renderToString?(values: readonly unknown[], context: DirectiveServerContext): unknown;
  };

export interface DirectiveResult<T extends Directive = Directive> {
  readonly _$directive$: typeof DIRECTIVE_RESULT;
  readonly directive: DirectiveConstructor<T>;
  readonly values: readonly unknown[];
}

/**
 * Base class for stateful template directives.
 *
 * `render()` describes the initial result. Override `update()` when later
 * commits need different behavior. `disconnected()` and `reconnected()` are
 * paired and may run more than once as a branch or host moves in and out of a
 * live document.
 */
export abstract class Directive {
  constructor(readonly partInfo: PartInfo) {}

  abstract render(...values: any[]): unknown;

  update(_part: DirectivePart, values: readonly unknown[]): unknown {
    return this.render(...values);
  }

  disconnected(_context?: DirectiveDisconnectContext): void {}

  reconnected(): void {}

  /** Retarget directive-owned DOM while hydrating server-rendered markup. */
  adopted(_nodeMap: ReadonlyMap<Node, Node>): void {}
}

/** Turn a Directive class into a template-callable helper. */
export function directive<T extends Directive, A extends readonly unknown[]>(
  DirectiveClass: DirectiveConstructor<T>
): (...values: A) => DirectiveResult<T> {
  return (...values: A): DirectiveResult<T> => ({
    _$directive$: DIRECTIVE_RESULT,
    directive: DirectiveClass,
    values
  });
}

export function isDirectiveResult(value: unknown): value is DirectiveResult {
  return !!value && (value as DirectiveResult)._$directive$ === DIRECTIVE_RESULT;
}

export function directiveServerResult(
  kind: DirectiveServerResult['kind'],
  value: unknown,
  name?: string
): DirectiveServerResult {
  return { _$serverDirective$: DIRECTIVE_SERVER_RESULT, kind, value, name };
}

export function isDirectiveServerResult(value: unknown): value is DirectiveServerResult {
  return !!value && (value as DirectiveServerResult)._$serverDirective$ === DIRECTIVE_SERVER_RESULT;
}
