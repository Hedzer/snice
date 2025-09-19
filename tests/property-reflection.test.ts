import { beforeEach, describe, it, expect, vi } from 'vitest';
import { element, property } from './test-imports';
import type { SniceElement } from './test-imports';

describe('@property reflection with Date and BigInt', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should reflect Date properties to attributes', async () => {
    @element('test-date-reflect-unique')
    class TestDateReflect extends HTMLElement {
      @property({ type: Date })
      createdAt = new Date('2024-01-15T10:30:00Z');
    }

    const el = document.createElement('test-date-reflect-unique') as TestDateReflect & SniceElement;
    document.body.appendChild(el);
    await el.ready;

    // Initial value: no attribute exists, should return initial value
    expect(el.getAttribute('createdat')).toBe(null);
    expect(el.createdAt.toISOString()).toBe('2024-01-15T10:30:00.000Z');

    // Setting the property should reflect to attribute
    el.createdAt = new Date('2024-01-16T11:30:00Z');
    expect(el.getAttribute('createdat')).toBe('2024-01-16T11:30:00.000Z');
  });

  it('should parse Date attributes to Date properties', async () => {
    @element('test-date-parse-unique')
    class TestDateParse extends HTMLElement {
      @property({ type: Date })
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
      @property({ type: BigInt })
      largeNumber = 123456789012345n;
    }

    const el = document.createElement('test-bigint-reflect-unique') as TestBigIntReflect & SniceElement;
    document.body.appendChild(el);
    await el.ready;

    // Initial value: no attribute exists, should return initial value
    expect(el.getAttribute('largenumber')).toBe(null);
    expect(el.largeNumber).toBe(123456789012345n);

    // Setting the property should reflect BigInt with n suffix
    el.largeNumber = 987654321098765n;
    expect(el.getAttribute('largenumber')).toBe('987654321098765n');
  });

  it('should parse BigInt attributes with n suffix to BigInt properties', async () => {
    @element('test-bigint-parse-unique')
    class TestBigIntParse extends HTMLElement {
      @property({ type: BigInt })
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
      @property({ type: BigInt })
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
      @property({ type: Date })
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
      @property({ type: BigInt })
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
      @property({ type: Date,  attribute: 'created-date' })
      createdAt = new Date('2024-02-14T09:30:00Z');

      @property({ type: BigInt,  attribute: 'item-count' })
      count = 42n;
    }

    const el = document.createElement('test-custom-attr-unique') as TestCustomAttr & SniceElement;
    document.body.appendChild(el);
    await el.ready;

    // Initial values: no attributes exist, should return initial values
    expect(el.getAttribute('created-date')).toBe(null);
    expect(el.getAttribute('item-count')).toBe(null);
    expect(el.createdAt.toISOString()).toBe('2024-02-14T09:30:00.000Z');
    expect(el.count).toBe(42n);

    // Setting properties should use custom attribute names
    el.createdAt = new Date('2024-02-15T10:30:00Z');
    el.count = 100n;
    expect(el.getAttribute('created-date')).toBe('2024-02-15T10:30:00.000Z');
    expect(el.getAttribute('item-count')).toBe('100n');
  });

  it('should handle null/undefined Date and BigInt values', async () => {
    @element('test-null-values-unique')
    class TestNullValues extends HTMLElement {
      @property({ type: Date })
      optionalDate: Date | null = null;

      @property({ type: BigInt })
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

