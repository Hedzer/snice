/**
 * Shared component-level URL matrix. Navigation components consume the same
 * cases so their use of the core URL policy cannot drift independently.
 */
export const unsafeNavigationUrls = [
  ['   ', 'space-only input'],
  ['\u00a0', 'Unicode-space-only input'],
  ['javascript:globalThis.__sniceNavigationInjected++', 'JavaScript scheme'],
  ['JaVaScRiPt:globalThis.__sniceNavigationInjected++', 'mixed-case JavaScript scheme'],
  ['  javascript:globalThis.__sniceNavigationInjected++', 'space-prefixed JavaScript scheme'],
  ['\u00a0javascript:globalThis.__sniceNavigationInjected++', 'Unicode-space-prefixed JavaScript scheme'],
  ['java\tscript:globalThis.__sniceNavigationInjected++', 'tab-obfuscated JavaScript scheme'],
  ['java\nscript:globalThis.__sniceNavigationInjected++', 'newline-obfuscated JavaScript scheme'],
  ['jav\u0000ascript:globalThis.__sniceNavigationInjected++', 'null-obfuscated JavaScript scheme'],
  ['data:text/html,<script>globalThis.__sniceNavigationInjected++</script>', 'HTML data URL'],
  ['data:image/svg+xml,<svg onload=globalThis.__sniceNavigationInjected++>', 'SVG data URL'],
  ['vbscript:msgbox(1)', 'VBScript scheme'],
  ['file:///tmp/private', 'file scheme'],
  ['ftp://example.com/private', 'unlisted FTP scheme'],
  ['custom:payload', 'unlisted custom scheme'],
  ['http://[', 'malformed absolute URL'],
  ['//[', 'malformed network-path reference']
] as const;

export const allowedNavigationUrls = [
  ['/relative/path', 'root-relative path', '_blank'],
  ['./sibling', 'dot-relative path', '_blank'],
  ['../parent', 'parent-relative path', '_parent'],
  ['plain/path', 'plain relative path', '_self'],
  ['docs/page:edit', 'colon outside the scheme position', '_top'],
  ['#section', 'hash reference', '_blank'],
  ['?page=2', 'query reference', '_blank'],
  ['//example.com/path', 'HTTP network-path reference', '_blank'],
  ['http://example.com/path', 'HTTP URL', 'http-window'],
  ['HTTPS://EXAMPLE.COM/path', 'mixed-case HTTPS URL', '_blank'],
  ['mailto:user+tag@example.com?subject=Hello', 'email URL', 'mail-window'],
  ['tel:+1-555-0100', 'telephone URL', 'phone-window'],
  ['https://example.com/a%20b?next=javascript%3Aalert(1)', 'encoded query data', '_blank'],
  ['javascript%3Aalert(1)', 'percent-encoded relative path', '_blank']
] as const;
