import { describe, expect, it } from 'vitest';
import { isSafeUrl } from './test-imports';

describe('isSafeUrl shared URL policy', () => {
  it.each([
    ['/rooted/path', 'root-relative path'],
    ['./sibling', 'dot-relative path'],
    ['../parent', 'parent-relative path'],
    ['plain/path', 'plain relative path'],
    ['docs/page:edit', 'colon outside the scheme position'],
    ['#section', 'hash reference'],
    ['?page=2', 'query reference'],
    ['//example.com/path', 'HTTP network-path reference'],
    ['http://example.com/path', 'HTTP URL'],
    ['HTTPS://EXAMPLE.COM/path', 'mixed-case HTTPS URL'],
    ['mailto:user+tag@example.com?subject=Hello', 'email URL'],
    ['tel:+1-555-0100', 'telephone URL'],
    ['https://example.com/a%20b?next=javascript%3Aalert(1)', 'encoded query data'],
    ['javascript%3Aalert(1)', 'percent-encoded relative path'],
    ['  https://example.com/trimmed  ', 'ordinary surrounding spaces']
  ])('accepts %s as an ordinary %s', (url) => {
    expect(isSafeUrl(url)).toBe(true);
  });

  it.each([
    ['', 'empty input'],
    ['   ', 'space-only input'],
    ['javascript:alert(1)', 'JavaScript scheme'],
    ['JaVaScRiPt:alert(1)', 'mixed-case JavaScript scheme'],
    ['\u00a0javascript:alert(1)', 'Unicode-space-prefixed JavaScript scheme'],
    ['data:text/html,<script>alert(1)</script>', 'HTML data URL'],
    ['data:image/svg+xml,<svg onload=alert(1)>', 'SVG data URL'],
    ['vbscript:msgbox(1)', 'VBScript scheme'],
    ['file:///tmp/private', 'file scheme'],
    ['ftp://example.com/file', 'unlisted FTP scheme'],
    ['custom:payload', 'unlisted custom scheme'],
    ['http://[', 'malformed absolute URL'],
    ['//[', 'malformed network-path reference']
  ])('rejects %s as %s', (url) => {
    expect(isSafeUrl(url)).toBe(false);
  });

  it('rejects every raw ASCII control character in prefixes, schemes, and paths', () => {
    const controls = [
      ...Array.from({ length: 0x20 }, (_, code) => String.fromCharCode(code)),
      String.fromCharCode(0x7f)
    ];

    for (const control of controls) {
      expect(isSafeUrl(`${control}javascript:alert(1)`)).toBe(false);
      expect(isSafeUrl(`java${control}script:alert(1)`)).toBe(false);
      expect(isSafeUrl(`https://example.com/path${control}segment`)).toBe(false);
    }
  });

  it('supports explicit protocol policies without changing relative-reference behavior', () => {
    expect(isSafeUrl('blob:https://example.com/id')).toBe(false);
    expect(isSafeUrl('blob:https://example.com/id', { allowed: ['blob:'] })).toBe(true);
    expect(isSafeUrl('HTTPS://example.com', { allowed: ['HTTPS:'] })).toBe(true);
    expect(isSafeUrl('http://example.com', { allowed: ['https:'] })).toBe(false);
    expect(isSafeUrl('http://__snice-relative.invalid/', { allowed: ['https:'] })).toBe(false);
    expect(isSafeUrl('/still-relative', { allowed: [] })).toBe(true);
    expect(isSafeUrl('//example.com', { allowed: ['https:'] })).toBe(false);
  });

  it('fails closed when an input cannot be converted to text', () => {
    const value = {
      toString() {
        throw new Error('conversion failed');
      }
    };

    expect(isSafeUrl(null)).toBe(false);
    expect(isSafeUrl(undefined)).toBe(false);
    expect(isSafeUrl(value)).toBe(false);
  });
});
