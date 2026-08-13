// Unique marker for dynamic template parts. It parses as a comment node but
// does not get escaped in attributes.
export const templateMarker = `snice$${Math.random().toFixed(9).slice(2)}$`;
export const templateMarkerMatch = '?' + templateMarker;

// A true comment, not a processing instruction (<?...>): in HTML content both
// parse to the same comment node, but PIs are dropped inside foreign content
// (<svg>), which would silently kill any node binding inside an svg block.
export const templateNodeMarker = `<!--${templateMarkerMatch}-->`;

// Escape the `$` chars — as a bare RegExp they'd be end anchors and the
// pattern would never match, so marker-bearing text/comments never split.
export const templateMarkerRegex = new RegExp(templateMarker.replace(/\$/g, '\\$'), 'g');

export function hasTemplateMarker(value: string | null): boolean {
  return value?.includes(templateMarker) ?? false;
}
