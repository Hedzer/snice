import { describe, expect, it } from 'vitest';
import { isSafeUrl } from './test-imports';
import { allowedNavigationUrls, unsafeNavigationUrls } from './navigation-url-cases';

describe('isSafeUrl shared URL policy', () => {
  it.each(allowedNavigationUrls)('accepts %s as an ordinary %s', (url) => {
    expect(isSafeUrl(url)).toBe(true);
  });

  it('accepts ordinary surrounding spaces', () => {
    expect(isSafeUrl('  https://example.com/trimmed  ')).toBe(true);
  });

  it.each([
    ['', 'empty input'] as const,
    ...unsafeNavigationUrls
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
