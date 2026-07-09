/**
 * Template binding helpers for class and style attributes.
 *
 * @example
 * ```typescript
 * html`<div class="${classMap({ box: true, 'box--active': this.active })}"></div>`
 * html`<div style="${styleMap({ color: this.color, fontWeight: 'bold' })}"></div>`
 * ```
 */

/**
 * Build a class string from an object: keys with truthy values are included.
 */
export function classMap(classes: Record<string, unknown>): string {
  let out = '';
  for (const name of Object.keys(classes)) {
    if (classes[name]) out += (out ? ' ' : '') + name;
  }
  return out;
}

/**
 * Build a style string from an object. camelCase keys convert to kebab-case;
 * CSS custom properties (`--token`) pass through unchanged. Entries whose
 * value is null/undefined/false are dropped.
 */
export function styleMap(styles: Record<string, unknown>): string {
  const decls: string[] = [];
  for (const key of Object.keys(styles)) {
    const value = styles[key];
    if (value === null || value === undefined || value === false) continue;
    const prop = key.startsWith('--')
      ? key
      : key.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
    decls.push(`${prop}: ${value}`);
  }
  return decls.join('; ');
}
