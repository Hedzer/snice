/**
 * EXACT `part` lookups.
 *
 * `[part~="field"]` is the correct CSS for "the element whose part list
 * CONTAINS the token field", and it is what `matrix-kit`'s `part()` /
 * `parts()` use. In happy-dom, however, `~=` also matches hyphen-prefixed
 * neighbours: a card with two `part="field"` rows, each holding a
 * `part="field-label"` and a `part="field-value"`, answers `[part~="field"]`
 * with SIX elements. A matrix oracle that counted rows that way would assert
 * against a number the component never rendered.
 *
 * So these helpers read the attribute and split it themselves. Same semantics
 * as `~=` in a real browser, minus the environment's opinion — which matters
 * for every component in this tree whose part names share a prefix
 * (`field`/`field-label`, `price`/`price-current`, `variant`/`variant-group`,
 * `tab`/`tab-panel`).
 */

/** The part tokens of a node, as a list. */
export function partTokens(node: Element | null | undefined): string[] {
  return (node?.getAttribute('part') ?? '').split(/\s+/).filter(Boolean);
}

/** Does this node expose exactly the named part token? */
export function hasPart(node: Element | null | undefined, name: string): boolean {
  return partTokens(node).includes(name);
}

/** Every descendant of `root` exposing the part token, in document order. */
export function exactPartsIn<T extends Element = HTMLElement>(root: ParentNode, name: string): T[] {
  return [...root.querySelectorAll('[part]')].filter(node => hasPart(node, name)) as unknown as T[];
}

/** The first descendant of `root` exposing the part token. */
export function exactPartIn<T extends Element = HTMLElement>(root: ParentNode, name: string): T | null {
  return exactPartsIn<T>(root, name)[0] ?? null;
}

function shadowOf(el: HTMLElement): ShadowRoot {
  const root = el.shadowRoot;
  if (!root) throw new Error(`${el.tagName.toLowerCase()} rendered no shadow root`);
  return root;
}

/** Every shadow element of `el` exposing the part token. */
export function exactParts<T extends Element = HTMLElement>(el: HTMLElement, name: string): T[] {
  return exactPartsIn<T>(shadowOf(el), name);
}

/** The first shadow element of `el` exposing the part token. */
export function exactPart<T extends Element = HTMLElement>(el: HTMLElement, name: string): T | null {
  return exactPartsIn<T>(shadowOf(el), name)[0] ?? null;
}
