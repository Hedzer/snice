import { parseKeyboardFilter, matchesKeyboardFilter, warnIfModifierMisuse } from './keyboard-filter';
import { EventPart, type KeyboardFilterTools } from './part-event';

export const KEYBOARD_FILTER_TOOLS: KeyboardFilterTools = {
  parse: parseKeyboardFilter,
  match: matchesKeyboardFilter,
  warn: (eventSpec: string) => {
    if ((typeof __SNICE_DEV__ === 'undefined' || __SNICE_DEV__) && (typeof process === 'undefined' || !process.env || process.env.NODE_ENV !== 'production')) {
      warnIfModifierMisuse(eventSpec);
    }
  },
};

/** @internal Tree-shakeable compiled-template factory for EventPart with keyboard shortcuts */
export function __pKeyEvent(node: Node, eventName: string): EventPart {
  return new EventPart(node as Element, eventName, KEYBOARD_FILTER_TOOLS);
}
