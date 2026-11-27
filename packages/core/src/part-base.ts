import { TemplateResult, isTemplateResult } from './template';
import { PRE_UPGRADE_PROPERTY_BINDINGS, PROPERTIES } from './symbols';
import { contextualizeRenderError, type RenderHostIdentity } from './render-errors';

// Sentinel for "not yet set" - distinct from undefined/null
export const NOT_COMMITTED = /*#__PURE__*/ Symbol('not-committed');

// Brand symbol for template instances (both runtime and compiled)
export const TEMPLATE_INSTANCE_BRAND = /*#__PURE__*/ Symbol.for('snice:template-instance');

export type PropertyBindingRegistry = Pick<CustomElementRegistry, 'get' | 'whenDefined'>;

const pendingDefinitionRegistries = /*#__PURE__*/ new WeakMap<Element, PropertyBindingRegistry>();

function isUpgradedBy(element: Element, constructor: CustomElementConstructor): boolean {
  return Object.prototype.isPrototypeOf.call(constructor.prototype, element);
}

export function flushPreUpgradePropertyBindings(
  element: Element,
  registry: PropertyBindingRegistry | null
): void {
  const tagName = element.localName;
  const constructor = tagName && registry?.get(tagName);
  if (!constructor || !isUpgradedBy(element, constructor)) return;

  const target = element as any;
  const markedBindings = target[PRE_UPGRADE_PROPERTY_BINDINGS] as Set<string> | undefined;
  if (!markedBindings?.size) return;
  for (const propertyName of Array.from(markedBindings)) {
    // A Snice @property initializer consumes its own marker and expando while
    // the element upgrades. Anything left belongs to a class that retained
    // the native/custom property channel, so replay the latest parked value
    // through that now-upgraded channel.
    if (Object.prototype.hasOwnProperty.call(target, propertyName)) {
      const value = target[propertyName];
      delete target[propertyName];
      target[propertyName] = value;
    }
    markedBindings.delete(propertyName);
  }
  delete target[PRE_UPGRADE_PROPERTY_BINDINGS];
}

function schedulePreUpgradePropertyFlush(
  element: Element,
  registry: PropertyBindingRegistry | null
): void {
  if (!registry?.whenDefined || pendingDefinitionRegistries.get(element) === registry) return;
  pendingDefinitionRegistries.set(element, registry);
  const reference = new WeakRef(element);
  void registry.whenDefined(element.localName).then(() => {
    const target = reference.deref();
    if (target) flushPreUpgradePropertyBindings(target, registry);
  });
}

function markPreUpgradePropertyBinding(
  element: Element,
  propertyName: string,
  registry: PropertyBindingRegistry | null
): boolean {
  const tagName = element.localName;
  if (!tagName?.includes('-')) return false;
  const registeredConstructor = registry?.get(tagName) as any;
  if (registeredConstructor) {
    // Template contents can still contain an unupgraded HTMLElement after the
    // definition has been registered. Registry presence alone therefore does
    // not prove that the reactive accessor exists on this clone yet.
    const isUpgraded = isUpgradedBy(element, registeredConstructor);
    if (isUpgraded) return false;

    // A registered non-Snice element (or a Snice element that did not
    // redeclare this member) must retain the native IDL channel. Parking its
    // role/title/etc. would replace native reflection with an own expando.
    const reactiveProperties = registeredConstructor[PROPERTIES] as Map<string, unknown> | undefined;
    if (!reactiveProperties?.has(propertyName)) return false;
  }
  const target = element as any;
  if (!target[PRE_UPGRADE_PROPERTY_BINDINGS]) target[PRE_UPGRADE_PROPERTY_BINDINGS] = new Set<string>();
  target[PRE_UPGRADE_PROPERTY_BINDINGS].add(propertyName);
  schedulePreUpgradePropertyFlush(element, registry);
  return true;
}

export function commitPropertyValue(
  element: Element,
  propertyName: string,
  value: unknown,
  registry: PropertyBindingRegistry | null
): void {
  if (!markPreUpgradePropertyBinding(element, propertyName, registry)) {
    (element as any)[propertyName] = value;
    return;
  }

  // An undefined custom element can inherit a native IDL setter with the same
  // name. Assignment would invoke that setter (for example HTMLElement.role),
  // stringify structured data into an attribute, and leave no own value for
  // @property's upgrade adoption. Park every pre-upgrade binding as the own,
  // configurable value that the initializer already knows how to replay.
  Object.defineProperty(element, propertyName, {
    configurable: true,
    enumerable: true,
    writable: true,
    value,
  });
}

// noChange sentinel - preserves the currently committed value
export const noChange = /*#__PURE__*/ Symbol.for('snice:no-change');
export type NoChange = typeof noChange;

// live() wrapper - marks a property binding value for comparison against the
// actual DOM property instead of the last committed value
const LIVE_MARKER = /*#__PURE__*/ Symbol.for('snice:live');

export interface LiveValue {
  readonly _$liveMarker$: typeof LIVE_MARKER;
  readonly value: unknown;
}

/**
 * Wrap a property binding value so the commit compares against the element's
 * CURRENT DOM property rather than the last committed value.
 */
export function live(value: unknown): LiveValue {
  return { _$liveMarker$: LIVE_MARKER, value };
}

export function isLive(value: any): value is LiveValue {
  return value && value._$liveMarker$ === LIVE_MARKER;
}

/**
 * Check if value is a primitive (can be compared with ===)
 */
export const isPrimitiveValue = (value: unknown): boolean =>
  value === null || (typeof value !== 'object' && typeof value !== 'function');

export interface TemplateInstanceLike {
  readonly [TEMPLATE_INSTANCE_BRAND]: true;
  strings: TemplateStringsArray;
  isSameTemplate(strings: TemplateStringsArray): boolean;
  getRenderHostIdentity(): RenderHostIdentity | null;
  renderFragment(): DocumentFragment;
  render(values: readonly any[]): DocumentFragment;
  update(values: readonly any[]): void;
  clear(): void;
  disconnected(preserveEventListeners?: boolean): void;
  reconnected(): void;
}

export function isTemplateInstance(value: unknown): value is TemplateInstanceLike {
  return Boolean(value && (value as any)[TEMPLATE_INSTANCE_BRAND] === true);
}

export interface CompiledPartContext {
  renderIdentity: RenderHostIdentity | null;
  customElementRegistry: PropertyBindingRegistry | null;
  dynamicWhenElements: Set<Element> | null;
  endNodes: Map<Node, Comment>;
}

/**
 * Base class for all parts
 */
export abstract class Part {
  abstract readonly type: string;
  readonly _isCond?: boolean;
  readonly _multi?: boolean;

  get isConnected(): boolean {
    return (this as any).element?.isConnected ?? false;
  }

  _flush?(): void;
  _getCoordinator?(): Part;

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

  abstract commit(value: any, startIndex?: number): void;
  abstract clear(): void;
}

/**
 * Create a TemplateInstance from a TemplateResult without statically coupling
 * `render.ts` or `part-node.ts` to the full runtime HTML parser in `parts.ts`.
 */
export function createTemplateInstance(
  result: TemplateResult,
  renderIdentity: RenderHostIdentity | null = null,
  customElementRegistry: PropertyBindingRegistry | null =
    document.defaultView?.customElements ?? globalThis.customElements ?? null
): TemplateInstanceLike {
  return result._create!(result, renderIdentity, customElementRegistry);
}

/**
 * Extract the key of a list item rendered from a template with a `key=${...}`
 * binding. Returns undefined for unkeyed items.
 */
export function getTemplateItemKey(
  item: unknown,
  renderIdentity: RenderHostIdentity | null
): unknown {
  if (!isTemplateResult(item)) return undefined;
  let keyIndex = -1;
  if (item.compiled) {
    keyIndex = item.compiled.k ?? -1;
  } else if (item._keyIndex) {
    try {
      keyIndex = item._keyIndex(item);
    } catch (error) {
      throw renderIdentity ? contextualizeRenderError(renderIdentity, error) : error;
    }
  }
  return keyIndex === -1 ? undefined : item.values[keyIndex];
}
