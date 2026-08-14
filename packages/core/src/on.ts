/**
 * @on decorator for listening to events
 * Use in elements or controllers to listen to DOM events or custom events
 */

import { CLEANUP, ON_METHODS } from './symbols';
import { getSymbol } from './symbols';
import type { OnOptions } from './types/on-options';
import { parseKeyboardFilter, matchesKeyboardFilter, warnIfModifierMisuse, type KeyboardFilter } from './keyboard-filter';
import { createDebounced, resolveEventTiming, resolveScope } from './utils';
import { isDaemonInstance, requireDaemonTarget } from './daemon-target';

// Re-export OnOptions for public API
export type { OnOptions } from './types/on-options';

const ON_HANDLERS = getSymbol('on-handlers');

// Per-decoration-site counter — see the registration identity note in `on()`.
let registrationCount = 0;

/**
 * @on decorator for listening to events
 *
 * Works in both elements and controllers with full event delegation support.
 *
 * @param eventName - Event name(s) to listen for
 * @param selector - Optional CSS selector for event delegation
 * @param options - Event listener options including debounce/throttle
 *
 * @example
 * ```typescript
 * // In elements
 * @element('my-button')
 * class MyButton extends HTMLElement {
 *   @on('click', 'button')
 *   handleClick(e: MouseEvent) {
 *     console.log('Button clicked!', e);
 *   }
 *
 *   @on('input', 'input', { debounce: 300 })
 *   handleInput(e: Event) {
 *     console.log('Input changed:', (e.target as HTMLInputElement).value);
 *   }
 * }
 *
 * // In controllers
 * @controller('my-controller')
 * class MyController {
 *   element!: HTMLElement;
 *
 *   @on('count-changed')
 *   handleCountChanged(e: CustomEvent) {
 *     console.log('Count changed to:', e.detail.count);
 *   }
 *
 *   @on('click', '.item', { throttle: 100 })
 *   handleItemClick(e: MouseEvent) {
 *     console.log('Item clicked');
 *   }
 * }
 * ```
 */
export function on(
  eventName: string | string[],
  selectorOrOptions?: string | OnOptions | null,
  options?: OnOptions
) {
  // Parse arguments to support multiple call signatures
  let selector: string | null = null;
  let opts: OnOptions = {};

  if (typeof selectorOrOptions === 'string') {
    selector = selectorOrOptions;
    opts = options || {};
  } else if (selectorOrOptions && typeof selectorOrOptions === 'object') {
    opts = selectorOrOptions;
  } else if (selectorOrOptions === null && options) {
    opts = options;
  }

  // `target` is the options-object spelling of the positional selector; fold it
  // into the same delegation path. The positional argument wins when both are given.
  if (!selector && opts.target) {
    selector = opts.target;
  }

  const eventNames = Array.isArray(eventName) ? eventName : [eventName];

  // Registration identity — derived from EVERY decorator argument, so no
  // option can be forgotten here and silently collapse two distinct stacked
  // @on decorators into one (that is how { debounce: 300 } stacked on a plain
  // @on for the same event used to lose one of its two registrations).
  // Options are serialized generically (sorted, so literal key order doesn't
  // matter); values that can't be compared by value — an EventTarget or a
  // resolver function passed as `scope` — fall back to this decoration site's
  // own id, which is stable across instances but unique per @on application.
  const siteId = `site:${++registrationCount}`;
  let optionSignature = '';
  let hasOpaqueOption = false;
  for (const key of Object.keys(opts).sort()) {
    const value = (opts as any)[key];
    if (value === undefined) continue;
    if (value !== null && (typeof value === 'object' || typeof value === 'function')) {
      hasOpaqueOption = true;
      continue;
    }
    optionSignature += `${key}=${String(value)};`;
  }
  const argumentKey = `${eventNames.join(',')}::${selector ?? ''}::${optionSignature}${hasOpaqueOption ? `::${siteId}` : ''}`;

  return function (originalMethod: any, context: ClassMethodDecoratorContext) {
    const methodName = context.name as string;
    // Same decoration, same method name → same registration. A subclass that
    // re-declares an identically decorated method must NOT add a second
    // listener on top of the one its parent's initializer already registered.
    const registrationKey = `${methodName}::${argumentKey}`;

    context.addInitializer(function(this: any) {
      const constructor = this.constructor as any;

      // Dedup by registration identity, NOT by method reference — stacked @on
      // decorators share one method and must each register. Use hasOwnProperty
      // so subclasses get their OWN Set instead of inheriting — otherwise
      // parent and child share state and child registrations pollute parent
      // (and vice versa) via the prototype chain.

      if (!Object.prototype.hasOwnProperty.call(constructor, ON_METHODS)) {
        constructor[ON_METHODS] = new Set();
      }
      if (constructor[ON_METHODS].has(registrationKey)) return;
      constructor[ON_METHODS].add(registrationKey);

      if (!Object.prototype.hasOwnProperty.call(constructor, ON_HANDLERS)) {
        // Seed with parent's handlers (if any) so inherited @on still fires.
        const inherited = constructor[ON_HANDLERS];
        constructor[ON_HANDLERS] = inherited ? [...inherited] : [];
      }

      for (const event of eventNames) {
        constructor[ON_HANDLERS].push({
          eventName: event,
          selector,
          methodName,
          method: originalMethod,
          options: opts
        });
      }
    });

    return originalMethod;
  };
}

// Note: on.ts uses leading-edge-only throttle (no trailing call).
// createThrottled from utils has leading+trailing, so we keep a local leading-only variant.
function throttle<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  let lastCall = 0;
  return function (this: any, ...args: any[]) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn.apply(this, args);
    }
  } as T;
}

/**
 * Events that don't bubble - these require capture phase for delegation
 */
const NON_BUBBLING_EVENTS = new Set([
  'scroll',
  'focus',
  'blur',
  'load',
  'unload',
  'error',
  'resize',
  'abort',
  'mouseenter',
  'mouseleave',
  'pointerenter',
  'pointerleave',
]);

/**
 * Setup event listeners for an element or controller instance
 * Called automatically during element connection or controller attachment
 */
export function setupEventHandlers(instance: any, targetElement: EventTarget) {
  const handlers = instance.constructor[ON_HANDLERS];
  if (!handlers || !Array.isArray(handlers) || handlers.length === 0) {
    return;
  }

  // Initialize cleanup object if needed
  if (!instance[CLEANUP]) {
    instance[CLEANUP] = { events: [], eventCancels: [], channels: [], observers: [] };
  }
  if (!instance[CLEANUP].events) instance[CLEANUP].events = [];
  if (!instance[CLEANUP].eventCancels) instance[CLEANUP].eventCancels = [];
  if (instance[CLEANUP].events.length > 0 || instance[CLEANUP].eventCancels.length > 0) {
    // Events already set up - clean them up first to avoid duplicates
    cleanupEventHandlers(instance);
  }

  for (const handler of handlers) {
    // Get current method from instance (preserves decorator stacking)
    const currentMethod = (instance as any)[handler.methodName];
    let boundMethod = currentMethod ? currentMethod.bind(instance) : handler.method.bind(instance);
    const handlerOptions = handler.options || {};
    const debounceDelay = resolveEventTiming(instance, handlerOptions.debounce, '@on', 'debounce');
    const throttleDelay = debounceDelay && debounceDelay > 0
      ? undefined
      : resolveEventTiming(instance, handlerOptions.throttle, '@on', 'throttle');

    // Parse event name for key modifiers
    // Supports both dot notation (@keydown.enter) and colon notation (@keydown:Enter)
    // Only parse colons for keyboard events, not custom events
    const isKeyboardEvent = ['keydown', 'keyup', 'keypress'].includes(handler.eventName.split('.')[0].split(':')[0]);
    // Only keyboard events split on `.`/`:` into a key filter — a custom event
    // name may legitimately contain a dot (e.g. `app.ready`) and must be kept whole.
    const dotIndex = isKeyboardEvent ? handler.eventName.indexOf('.') : -1;
    const colonIndex = isKeyboardEvent ? handler.eventName.indexOf(':') : -1;

    const delimiterIndex = dotIndex > 0 && colonIndex > 0
      ? Math.min(dotIndex, colonIndex)
      : Math.max(dotIndex, colonIndex);

    const baseEventName = delimiterIndex > 0
      ? handler.eventName.substring(0, delimiterIndex)
      : handler.eventName;

    const keyModifier = delimiterIndex > 0
      ? handler.eventName.substring(delimiterIndex + 1)
      : null;

    if (delimiterIndex <= 0) warnIfModifierMisuse(handler.eventName);

    // Apply debounce (takes precedence over throttle)
    if (debounceDelay && debounceDelay > 0) {
      const debounced = createDebounced(boundMethod, debounceDelay);
      instance[CLEANUP].eventCancels.push(() => debounced.cancel());
      boundMethod = debounced;
    } else if (throttleDelay && throttleDelay > 0) {
      boundMethod = throttle(boundMethod, throttleDelay);
    }

    // Create event handler with key modifier support
    // Uses shared keyboard filter implementation from parts.ts
    let keyFilter: KeyboardFilter | null = null;
    if (keyModifier && ['keydown', 'keyup', 'keypress'].includes(baseEventName)) {
      keyFilter = parseKeyboardFilter(keyModifier);
    }

    // Returns whether the method actually ran, so `once` can be managed
    // manually: native `once` consumes the listener on ANY invocation — a
    // non-matching key or (with multiple tree listeners) a different root
    // would either eat the single firing or allow a second one.
    const createKeyModifierHandler = (method: Function): ((event: Event) => boolean) => {
      if (!keyFilter) {
        return (event: Event) => { method(event); return true; };
      }

      return (event: Event) => {
        const keyEvent = event as KeyboardEvent;
        if (matchesKeyboardFilter(keyEvent, keyFilter)) {
          method(event);
          return true;
        }
        return false;
      };
    };

    // Apply key modifier wrapper
    const keyModifierMethod = createKeyModifierHandler(boundMethod);

    // Resolve an explicit DOM scope or an app-context daemon. They are two
    // distinct addressing models and may not be combined.
    const hasExplicitScope = handlerOptions.scope !== undefined;
    const hasDaemon = handlerOptions.daemon !== undefined;
    if (hasExplicitScope && hasDaemon) {
      console.warn(
        `[snice/@on] "${handler.eventName}" cannot use both scope and daemon — listener skipped.`
      );
      continue;
    }
    if ((hasDaemon || isDaemonInstance(instance)) && handler.selector) {
      console.warn(
        `[snice/@on] "${handler.eventName}" cannot delegate "${handler.selector}" on a daemon target — listener skipped.`
      );
      continue;
    }

    const hasExplicitTarget = hasExplicitScope || hasDaemon;

    // Tree toggles — the same light/shadow pair @query uses. Both default to
    // true: direct listeners attach in both trees, delegated listeners match
    // in both. An explicit scope/daemon owns the listener target outright, so
    // the flags are meaningless there and ignored with a warning.
    const inShadow = handlerOptions.shadow !== false;
    const inLight = handlerOptions.light !== false;
    if (hasExplicitTarget
        && (handlerOptions.light !== undefined || handlerOptions.shadow !== undefined)) {
      console.warn(
        `[snice/@on] light/shadow are ignored for "${handler.eventName}" — an explicit scope/daemon owns the listener target.`
      );
    }
    if (!hasExplicitTarget && !inShadow && !inLight) {
      console.warn(
        `[snice/@on] "${handler.eventName}" disables both light and shadow — listener skipped.`
      );
      continue;
    }

    let scopedTarget: EventTarget | null = null;
    if (hasDaemon) {
      try {
        scopedTarget = requireDaemonTarget(instance, handlerOptions.daemon);
      } catch (error) {
        console.warn(`[snice/@on] ${(error as Error).message} Listener "${handler.eventName}" skipped.`);
        continue;
      }
    } else if (hasExplicitScope) {
      scopedTarget = resolveScope(targetElement as HTMLElement, handlerOptions.scope);
      if (!scopedTarget) {
        // Dev warning — listener silently dropped when scope cannot resolve.
        // Skip attachment so we don't bind to the wrong target.
        console.warn(
          `[snice/@on] scope did not resolve for "${handler.eventName}" on ${handler.methodName} — listener skipped.`
        );
        continue;
      }
    }

    // Main event handler with error handling and event delegation
    if (handler.selector) {
      // Delegated event handling. Listener roots by tree toggle:
      // - shadow → the shadow root (when present)
      // - light  → the host element (hears light-DOM bubbles)
      // - explicit scope: the scoped target only
      const componentShadowRoot = (targetElement as any).shadowRoot;
      const delegationRoots: EventTarget[] = hasExplicitTarget
        ? [scopedTarget!]
        : [
            ...(inShadow && componentShadowRoot ? [componentShadowRoot] : []),
            ...(inLight ? [targetElement] : []),
          ];

      if (delegationRoots.length === 0) {
        console.warn(
          `[snice/@on] "${handler.eventName}" cannot delegate "${handler.selector}" — no shadow root and light disabled; listener skipped.`
        );
        continue;
      }

      // One event can reach more than one root (e.g. a slotted click seen by
      // both the shadow root and the host); a per-handler Symbol keeps the
      // handler to one invocation per event. The symbol is only stamped on a
      // match so a non-matching root never blocks the other.
      const handledSymbol = Symbol();

      // Auto-enable capture for non-bubbling events when using delegation
      const needsCapture = NON_BUBBLING_EVENTS.has(baseEventName);
      const useCapture = handlerOptions.capture !== undefined
        ? handlerOptions.capture
        : needsCapture;

      // `once` is managed manually (never native): the handler fires exactly
      // once — a non-matching event or key must not consume it, and a match
      // must retire the listeners on EVERY root, not just the one that fired.
      const listenerOptions: AddEventListenerOptions = {
        capture: useCapture,
        once: false,
        passive: handlerOptions.passive || false,
      };

      const listenerGroup: Array<{ target: EventTarget; handler: EventListener }> = [];
      const removeGroup = () => {
        for (const entry of listenerGroup) {
          entry.target.removeEventListener(baseEventName, entry.handler, listenerOptions);
        }
      };

      for (const eventRoot of delegationRoots) {
        // Delegation matches only elements visible in the listener's own tree
        // scope: a shadow-root listener matches its shadow tree, anything else
        // matches its containing document/root. This mirrors native retargeting
        // (child-component internals never match) while still matching a shadow
        // wrapper when the click lands on light-DOM content slotted into it —
        // `target.closest()` alone cannot cross that slot boundary.
        const treeScope: Node = eventRoot instanceof ShadowRoot
          ? eventRoot
          : ((eventRoot as Node).getRootNode?.() ?? document);

        const findDelegateMatch = (event: Event): Element | null => {
          if (typeof event.composedPath !== 'function') {
            // Fallback for environments without composedPath: ancestor walk.
            const target = event.target as HTMLElement;
            return (target.matches && target.matches(handler.selector) && target)
              || (target.closest && target.closest(handler.selector))
              || null;
          }
          for (const node of event.composedPath()) {
            const el = node as Element;
            if (el === eventRoot) break;
            if (el.nodeType !== 1) continue;
            if (el.getRootNode() !== treeScope) continue;
            if (el.matches(handler.selector)) return el;
          }
          return null;
        };

        const delegatedHandler = (event: Event) => {
          if ((event as any)[handledSymbol]) return;

          const matchingElement = findDelegateMatch(event);
          if (!matchingElement) return;
          (event as any)[handledSymbol] = true;

          if (handlerOptions.preventDefault) event.preventDefault();
          if (handlerOptions.stopPropagation) {
            event.stopPropagation();
            event.stopImmediatePropagation();
          }

          let fired = false;
          try {
            fired = keyModifierMethod(event);
          } catch (error) {
            // A throw can only escape user code, so the handler DID run.
            fired = true;
            console.error(`Error in event handler ${handler.methodName}:`, error);
          }
          if (fired && handlerOptions.once) removeGroup();
        };

        eventRoot.addEventListener(baseEventName, delegatedHandler, listenerOptions);
        listenerGroup.push({ target: eventRoot, handler: delegatedHandler });

        instance[CLEANUP].events.push({
          target: eventRoot,
          eventName: baseEventName,
          handler: delegatedHandler,
          options: listenerOptions,
        });
      }
    } else {
      // Direct event handling.
      // - Default: shadow root + host element (so events inside shadow and on
      //   the host itself both fire). A per-handler Symbol dedupes.
      // - light/shadow narrow the attachment: shadow → the shadow root
      //   listener, light → the host listener.
      // - With explicit scope: attach to the scoped target ONLY (no duplication).
      const shadowRoot = (hasExplicitTarget || !inShadow)
        ? null
        : (targetElement as any).shadowRoot;

      if (!hasExplicitTarget && !shadowRoot && !inLight) {
        console.warn(
          `[snice/@on] "${handler.eventName}" requests shadow only but the element has no shadow root — listener skipped.`
        );
        continue;
      }

      // Per-handler private Symbol so dedup is scoped to THIS handler's two
      // listeners (shadowRoot + host). Using Symbol.for() with the method name
      // would collide across components that share a method name (e.g. a parent
      // and nested child both defining `handleClick`), causing the parent's
      // handler to be silently swallowed when events bubble up through a
      // shadow boundary.
      const handledSymbol = Symbol();

      // `once` is managed manually (never native): a key-filtered handler must
      // not be consumed by a non-matching key, and with listeners in two trees
      // the first real firing must retire BOTH, not just the one that fired.
      const listenerOptions: AddEventListenerOptions = {
        capture: handlerOptions.capture || false,
        once: false,
        passive: handlerOptions.passive || false,
      };

      const listenerGroup: Array<{ target: EventTarget; handler: EventListener }> = [];
      const removeGroup = () => {
        for (const entry of listenerGroup) {
          entry.target.removeEventListener(baseEventName, entry.handler, listenerOptions);
        }
      };

      const wrappedMethod = (event: Event) => {
        if ((event as any)[handledSymbol]) return;
        (event as any)[handledSymbol] = true;

        if (handlerOptions.preventDefault) event.preventDefault();
        if (handlerOptions.stopPropagation) event.stopPropagation();

        let fired = false;
        try {
          fired = keyModifierMethod(event);
        } catch (error) {
          // A throw can only escape user code, so the handler DID run.
          fired = true;
          console.error(`Error in event handler ${handler.methodName}:`, error);
        }
        if (fired && handlerOptions.once) removeGroup();
      };

      const attach = (target: EventTarget) => {
        target.addEventListener(baseEventName, wrappedMethod as EventListener, listenerOptions);
        listenerGroup.push({ target, handler: wrappedMethod });
        instance[CLEANUP].events.push({
          target,
          eventName: baseEventName,
          handler: wrappedMethod,
          options: listenerOptions,
        });
      };

      if (hasExplicitTarget) {
        attach(scopedTarget!);
        continue;
      }

      // Listen on shadow root for events inside shadow DOM
      if (shadowRoot) attach(shadowRoot);

      // Also listen on host element (for clicks on host itself, light-DOM
      // bubbles, or when no shadow root) — unless light is disabled.
      if (inLight) attach(targetElement);
    }
  }
}

/**
 * Cleanup event listeners for a controller instance
 * Called automatically by the controller system during detach
 */
export function cleanupEventHandlers(instance: any) {
  if (!instance[CLEANUP]?.events) return;

  for (const cancel of instance[CLEANUP].eventCancels ?? []) cancel();
  instance[CLEANUP].eventCancels = [];

  for (const { target, eventName, handler, options } of instance[CLEANUP].events) {
    target.removeEventListener(eventName, handler, options);
  }

  instance[CLEANUP].events = [];
}
