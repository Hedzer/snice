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

// once/preventDefault/stopPropagation/capture/passive are @on() OPTIONS, not
// template modifiers. A dotted non-keyboard event whose suffix is one of these
// is almost certainly a mistake (e.g. `@click.once`) — it binds a listener for
// an event type the DOM never dispatches. Warn instead of failing silently. A
// legitimate custom event name like `app.ready` won't match and stays quiet.
const MODIFIER_WORDS = new Set([
  'once', 'prevent', 'preventdefault', 'stop', 'stoppropagation', 'capture', 'passive',
]);

export function warnIfModifierMisuse(eventName: string): void {
  const dot = eventName.lastIndexOf('.');
  if (dot < 0) return;

  const suffix = eventName.slice(dot + 1).toLowerCase();
  if (!MODIFIER_WORDS.has(suffix)) return;

  console.warn(
    `snice: "@${eventName}" is not a valid modifier — once/preventDefault/` +
    `stopPropagation/capture are @on() options, not template modifiers. ` +
    `This registers a listener for event "${eventName}", which never fires.`
  );
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
