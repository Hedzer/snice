import { beforeEach, describe, it, expect, vi } from 'vitest';
import { element, property } from '../src/element';
import type { SniceElement } from '../src/element';

describe('@property reflection with Date and BigInt', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should reflect Date properties to attributes', async () => {
    @element('test-date-reflect-unique')
    class TestDateReflect extends HTMLElement {
      @property({ type: Date, reflect: true })
      createdAt = new Date('2024-01-15T10:30:00Z');
    }

    const el = document.createElement('test-date-reflect-unique') as TestDateReflect & SniceElement;
    document.body.appendChild(el);
    await el.ready;

    // Should reflect Date to ISO string attribute
    expect(el.getAttribute('createdat')).toBe('2024-01-15T10:30:00.000Z');
  });

  it('should parse Date attributes to Date properties', async () => {
    @element('test-date-parse-unique')
    class TestDateParse extends HTMLElement {
      @property({ type: Date, reflect: true })
      updatedAt: Date | null = null;
    }

    const el = document.createElement('test-date-parse-unique') as TestDateParse & SniceElement;
    el.setAttribute('updatedat', '2024-03-20T15:45:30Z');
    document.body.appendChild(el);
    await el.ready;

    // Should parse ISO string to Date object
    expect(el.updatedAt).toBeInstanceOf(Date);
    expect(el.updatedAt?.toISOString()).toBe('2024-03-20T15:45:30.000Z');
  });

  it('should reflect BigInt properties to attributes with n suffix', async () => {
    @element('test-bigint-reflect-unique')
    class TestBigIntReflect extends HTMLElement {
      @property({ type: BigInt, reflect: true })
      largeNumber = 123456789012345n;
    }

    const el = document.createElement('test-bigint-reflect-unique') as TestBigIntReflect & SniceElement;
    document.body.appendChild(el);
    await el.ready;

    // Should reflect BigInt with n suffix
    expect(el.getAttribute('largenumber')).toBe('123456789012345n');
  });

  it('should parse BigInt attributes with n suffix to BigInt properties', async () => {
    @element('test-bigint-parse-unique')
    class TestBigIntParse extends HTMLElement {
      @property({ type: BigInt, reflect: true })
      bigValue: bigint | null = null;
    }

    const el = document.createElement('test-bigint-parse-unique') as TestBigIntParse & SniceElement;
    el.setAttribute('bigvalue', '987654321098765n');
    document.body.appendChild(el);
    await el.ready;

    // Should parse string with n suffix to BigInt
    expect(typeof el.bigValue).toBe('bigint');
    expect(el.bigValue).toBe(987654321098765n);
  });

  it('should parse BigInt attributes without n suffix to BigInt properties', async () => {
    @element('test-bigint-parse-no-suffix-unique')
    class TestBigIntParseNoSuffix extends HTMLElement {
      @property({ type: BigInt, reflect: true })
      number: bigint | null = null;
    }

    const el = document.createElement('test-bigint-parse-no-suffix-unique') as TestBigIntParseNoSuffix & SniceElement;
    el.setAttribute('number', '555555555555');
    document.body.appendChild(el);
    await el.ready;

    // Should parse string without n suffix to BigInt
    expect(typeof el.number).toBe('bigint');
    expect(el.number).toBe(555555555555n);
  });

  it('should update reflected attributes when Date property changes', async () => {
    @element('test-date-update-unique')
    class TestDateUpdate extends HTMLElement {
      @property({ type: Date, reflect: true })
      timestamp = new Date('2024-01-01T00:00:00Z');
    }

    const el = document.createElement('test-date-update-unique') as TestDateUpdate & SniceElement;
    document.body.appendChild(el);
    await el.ready;

    // Change the Date property
    el.timestamp = new Date('2024-12-25T12:00:00Z');

    // Should update the attribute
    expect(el.getAttribute('timestamp')).toBe('2024-12-25T12:00:00.000Z');
  });

  it('should update reflected attributes when BigInt property changes', async () => {
    @element('test-bigint-update-unique')
    class TestBigIntUpdate extends HTMLElement {
      @property({ type: BigInt, reflect: true })
      counter = 100n;
    }

    const el = document.createElement('test-bigint-update-unique') as TestBigIntUpdate & SniceElement;
    document.body.appendChild(el);
    await el.ready;

    // Change the BigInt property
    el.counter = 999888777n;

    // Should update the attribute with n suffix
    expect(el.getAttribute('counter')).toBe('999888777n');
  });

  it('should handle custom attribute names for Date and BigInt', async () => {
    @element('test-custom-attr-unique')
    class TestCustomAttr extends HTMLElement {
      @property({ type: Date, reflect: true, attribute: 'created-date' })
      createdAt = new Date('2024-02-14T09:30:00Z');

      @property({ type: BigInt, reflect: true, attribute: 'item-count' })
      count = 42n;
    }

    const el = document.createElement('test-custom-attr-unique') as TestCustomAttr & SniceElement;
    document.body.appendChild(el);
    await el.ready;

    // Should use custom attribute names
    expect(el.getAttribute('created-date')).toBe('2024-02-14T09:30:00.000Z');
    expect(el.getAttribute('item-count')).toBe('42n');
  });

  it('should handle null/undefined Date and BigInt values', async () => {
    @element('test-null-values-unique')
    class TestNullValues extends HTMLElement {
      @property({ type: Date, reflect: true })
      optionalDate: Date | null = null;

      @property({ type: BigInt, reflect: true })
      optionalBigInt: bigint | null = null;
    }

    const el = document.createElement('test-null-values-unique') as TestNullValues & SniceElement;
    document.body.appendChild(el);
    await el.ready;

    // Should not create attributes for null values
    expect(el.hasAttribute('optionaldate')).toBe(false);
    expect(el.hasAttribute('optionalbigint')).toBe(false);

    // Set values
    el.optionalDate = new Date('2024-06-15T14:20:00Z');
    el.optionalBigInt = 777n;

    // Should create attributes
    expect(el.getAttribute('optionaldate')).toBe('2024-06-15T14:20:00.000Z');
    expect(el.getAttribute('optionalbigint')).toBe('777n');

    // Set back to null
    el.optionalDate = null;
    el.optionalBigInt = null;

    // Should remove attributes
    expect(el.hasAttribute('optionaldate')).toBe(false);
    expect(el.hasAttribute('optionalbigint')).toBe(false);
  });
});

describe('@property warnings for problematic reflection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.warn
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should warn when using reflect:true with Array type', () => {
    @element('test-array-warning-unique')
    class TestArrayWarning extends HTMLElement {
      @property({ type: Array, reflect: true })
      items: any[] = [];
    }

    expect(console.warn).toHaveBeenCalledWith(
      "⚠️  Property 'items' uses reflect:true with Array type."
    );
  });

  it('should warn when using reflect:true with Object type', () => {
    @element('test-object-warning-unique')
    class TestObjectWarning extends HTMLElement {
      @property({ type: Object, reflect: true })
      config: any = {};
    }

    expect(console.warn).toHaveBeenCalledWith(
      "⚠️  Property 'config' uses reflect:true with Object type."
    );
  });

  it('should not warn for safe reflection types', () => {
    @element('test-safe-types-unique')
    class TestSafeTypes extends HTMLElement {
      @property({ type: String, reflect: true })
      name = 'test';

      @property({ type: Number, reflect: true })
      count = 0;

      @property({ type: Boolean, reflect: true })
      active = false;

      @property({ type: Date, reflect: true })
      created = new Date();

      @property({ type: BigInt, reflect: true })
      bigNum = 123n;
    }

    // Should not warn for safe types
    expect(console.warn).not.toHaveBeenCalled();
  });
});