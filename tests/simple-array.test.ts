import { beforeEach, describe, it, expect } from 'vitest';
import { element, property } from '../src/element';
import { SimpleArray } from '../src/types/simple-array';
import type { SniceElement } from '../src/types/snice-element';

describe('SimpleArray class', () => {
  describe('serialize method', () => {
    it('should serialize arrays of basic types', () => {
      expect(SimpleArray.serialize(['hello', 42, true, 'world', false])).toBe('hello，42，true，world，false');
    });

    it('should handle empty arrays', () => {
      expect(SimpleArray.serialize([])).toBe('');
    });

    it('should handle arrays with only strings', () => {
      expect(SimpleArray.serialize(['apple', 'banana', 'cherry'])).toBe('apple，banana，cherry');
    });

    it('should handle arrays with only numbers', () => {
      expect(SimpleArray.serialize([1, 2.5, -10, 0])).toBe('1，2.5，-10，0');
    });

    it('should handle arrays with only booleans', () => {
      expect(SimpleArray.serialize([true, false, true])).toBe('true，false，true');
    });

    it('should throw error for invalid types', () => {
      expect(() => SimpleArray.serialize([null as any])).toThrow('SimpleArray only supports string, number, and boolean types. Got: object');
      expect(() => SimpleArray.serialize([undefined as any])).toThrow('SimpleArray only supports string, number, and boolean types. Got: undefined');
      expect(() => SimpleArray.serialize([{} as any])).toThrow('SimpleArray only supports string, number, and boolean types. Got: object');
      expect(() => SimpleArray.serialize([[] as any])).toThrow('SimpleArray only supports string, number, and boolean types. Got: object');
    });

    it('should throw error for strings containing separator character', () => {
      expect(() => SimpleArray.serialize(['hello，world'])).toThrow('SimpleArray strings cannot contain the character "，" (U+FF0C)');
    });

    it('should handle non-arrays gracefully', () => {
      expect(SimpleArray.serialize('not an array' as any)).toBe('');
      expect(SimpleArray.serialize(null as any)).toBe('');
      expect(SimpleArray.serialize(undefined as any)).toBe('');
    });
  });

  describe('parse method', () => {
    it('should parse basic types correctly', () => {
      expect(SimpleArray.parse('hello，42，true，world，false')).toEqual(['hello', 42, true, 'world', false]);
    });

    it('should handle empty strings', () => {
      expect(SimpleArray.parse('')).toEqual([]);
      expect(SimpleArray.parse('   ')).toEqual(['   ']); // Whitespace string should be preserved
      expect(SimpleArray.parse(null)).toEqual([]);
    });

    it('should parse numbers correctly', () => {
      expect(SimpleArray.parse('1，2.5，-10，0')).toEqual([1, 2.5, -10, 0]);
    });

    it('should parse booleans correctly', () => {
      expect(SimpleArray.parse('true，false，true')).toEqual([true, false, true]);
    });

    it('should parse strings correctly', () => {
      expect(SimpleArray.parse('apple，banana，cherry')).toEqual(['apple', 'banana', 'cherry']);
    });

    it('should handle mixed content', () => {
      expect(SimpleArray.parse('name，25，true，active，3.14，false')).toEqual(['name', 25, true, 'active', 3.14, false]);
    });

    it('should handle edge case numbers', () => {
      expect(SimpleArray.parse('0，-0，123.456，-789.012')).toEqual([0, -0, 123.456, -789.012]);
    });

    it('should treat invalid numbers as strings', () => {
      expect(SimpleArray.parse('123abc，def456，12.34.56')).toEqual(['123abc', 'def456', '12.34.56']);
    });

    it('should handle single items', () => {
      expect(SimpleArray.parse('single')).toEqual(['single']);
      expect(SimpleArray.parse('42')).toEqual([42]);
      expect(SimpleArray.parse('true')).toEqual([true]);
    });
  });

  describe('round-trip serialization', () => {
    it('should maintain data integrity for mixed arrays', () => {
      const original = ['test', 123, true, 'hello', 45.67, false, 'world'];
      const serialized = SimpleArray.serialize(original);
      const parsed = SimpleArray.parse(serialized);
      expect(parsed).toEqual(original);
    });

    it('should handle edge cases', () => {
      const testCases = [
        [], // Empty array
        ['single'],
        [0],
        [true],
        [false],
        ['string', 0, true, false, -1, 3.14]
      ];

      testCases.forEach(testCase => {
        const serialized = SimpleArray.serialize(testCase);
        const parsed = SimpleArray.parse(serialized);
        expect(parsed).toEqual(testCase);
      });
    });

    it('should handle arrays with empty strings specially', () => {
      // Arrays containing only empty strings are edge cases because:
      // 1. [''] serializes to '' (empty string)
      // 2. Empty arrays also don't create attributes (handled by reflection logic)
      // 3. So they can't round-trip perfectly in the attribute reflection context
      const serialized = SimpleArray.serialize(['']);
      expect(serialized).toBe(''); // Empty string
      
      const parsed = SimpleArray.parse(serialized);
      expect(parsed).toEqual([]); // Gets parsed as empty array since empty string = no attribute
      
      // But if we have empty string mixed with other content, it works
      const mixed = ['', 'test', ''];
      const mixedSerialized = SimpleArray.serialize(mixed);
      const mixedParsed = SimpleArray.parse(mixedSerialized);
      expect(mixedParsed).toEqual(mixed);
    });
  });
});

describe('@property with SimpleArray type', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should reflect SimpleArray properties to attributes', async () => {
    @element('test-simple-array-reflect-unique')
    class TestSimpleArrayReflect extends HTMLElement {
      @property({ type: SimpleArray })
      tags = ['javascript', 'typescript', 'web'];

      @property({ type: SimpleArray })
      scores = [95, 87, 92];

      @property({ type: SimpleArray })
      flags = [true, false, true];
    }

    const el = document.createElement('test-simple-array-reflect-unique') as TestSimpleArrayReflect & SniceElement;
    document.body.appendChild(el);
    await el.ready;

    // Initial values: no attributes exist, should return initial values
    expect(el.getAttribute('tags')).toBe(null);
    expect(el.getAttribute('scores')).toBe(null);
    expect(el.getAttribute('flags')).toBe(null);
    expect(el.tags).toEqual(['javascript', 'typescript', 'web']);
    expect(el.scores).toEqual([95, 87, 92]);
    expect(el.flags).toEqual([true, false, true]);

    // Setting properties should reflect arrays using full-width comma separator
    el.tags = ['react', 'vue', 'angular'];
    el.scores = [88, 92, 85];
    el.flags = [false, true, false];
    expect(el.getAttribute('tags')).toBe('react，vue，angular');
    expect(el.getAttribute('scores')).toBe('88，92，85');
    expect(el.getAttribute('flags')).toBe('false，true，false');
  });

  it('should parse SimpleArray attributes to array properties', async () => {
    @element('test-simple-array-parse-unique')
    class TestSimpleArrayParse extends HTMLElement {
      @property({ type: SimpleArray })
      categories: (string | number | boolean)[] = [];

      @property({ type: SimpleArray })
      values: (string | number | boolean)[] = [];
    }

    const el = document.createElement('test-simple-array-parse-unique') as TestSimpleArrayParse & SniceElement;
    el.setAttribute('categories', 'tech，science，42，true');
    el.setAttribute('values', '123，hello，false，3.14');
    document.body.appendChild(el);
    await el.ready;

    // Should parse attributes to typed arrays
    expect(el.categories).toEqual(['tech', 'science', 42, true]);
    expect(el.values).toEqual([123, 'hello', false, 3.14]);
  });

  it('should update reflected attributes when SimpleArray property changes', async () => {
    @element('test-simple-array-update-unique')
    class TestSimpleArrayUpdate extends HTMLElement {
      @property({ type: SimpleArray })
      items: SimpleArray = ['initial'];
    }

    const el = document.createElement('test-simple-array-update-unique') as TestSimpleArrayUpdate & SniceElement;
    document.body.appendChild(el);
    await el.ready;

    // Change the array property
    el.items = ['updated', 42, true, 'values'];

    // Should update the attribute
    expect(el.getAttribute('items')).toBe('updated，42，true，values');
  });

  it('should handle custom attribute names', async () => {
    @element('test-simple-array-custom-attr-unique')
    class TestSimpleArrayCustomAttr extends HTMLElement {
      @property({ type: SimpleArray,  attribute: 'data-keywords' })
      keywords = ['snice', 'framework', 'typescript'];

      @property({ type: SimpleArray,  attribute: 'user-scores' })
      userScores = [100, 95, 88];
    }

    const el = document.createElement('test-simple-array-custom-attr-unique') as TestSimpleArrayCustomAttr & SniceElement;
    document.body.appendChild(el);
    await el.ready;

    // Initial values: no attributes exist, should return initial values
    expect(el.getAttribute('data-keywords')).toBe(null);
    expect(el.getAttribute('user-scores')).toBe(null);
    expect(el.keywords).toEqual(['snice', 'framework', 'typescript']);
    expect(el.userScores).toEqual([100, 95, 88]);

    // Setting properties should use custom attribute names
    el.keywords = ['react', 'vue', 'svelte'];
    el.userScores = [99, 87, 94];
    expect(el.getAttribute('data-keywords')).toBe('react，vue，svelte');
    expect(el.getAttribute('user-scores')).toBe('99，87，94');
  });

  it('should handle empty arrays', async () => {
    @element('test-simple-array-empty-unique')
    class TestSimpleArrayEmpty extends HTMLElement {
      @property({ type: SimpleArray })
      emptyArray: (string | number | boolean)[] = [];

      @property({ type: SimpleArray })
      populatedArray = ['initial'];
    }

    const el = document.createElement('test-simple-array-empty-unique') as TestSimpleArrayEmpty & SniceElement;
    document.body.appendChild(el);
    await el.ready;

    // Initial values don't reflect automatically
    expect(el.hasAttribute('emptyarray')).toBe(false);
    expect(el.hasAttribute('populatedarray')).toBe(false);
    expect(el.emptyArray).toEqual([]);
    expect(el.populatedArray).toEqual(['initial']);

    // Setting to empty array should remove attribute
    el.populatedArray = [];
    expect(el.hasAttribute('populatedarray')).toBe(false);

    // Setting from empty to populated should create attribute
    el.emptyArray = ['new', 'values'];
    expect(el.getAttribute('emptyarray')).toBe('new，values');
  });

  it('should handle attribute changes from HTML', async () => {
    @element('test-simple-array-html-change-unique')
    class TestSimpleArrayHtmlChange extends HTMLElement {
      @property({ type: SimpleArray })
      config: (string | number | boolean)[] = [];
    }

    const el = document.createElement('test-simple-array-html-change-unique') as TestSimpleArrayHtmlChange & SniceElement;
    document.body.appendChild(el);
    await el.ready;

    // Change attribute programmatically
    el.setAttribute('config', 'setting1，123，true，setting2');

    // Should update the property
    expect(el.config).toEqual(['setting1', 123, true, 'setting2']);
  });

  it('should throw error during reflection for invalid string content', async () => {
    @element('test-simple-array-invalid-string-unique')
    class TestSimpleArrayInvalidString extends HTMLElement {
      @property({ type: SimpleArray })
      badData = ['valid'];
    }

    const el = document.createElement('test-simple-array-invalid-string-unique') as TestSimpleArrayInvalidString & SniceElement;
    document.body.appendChild(el);
    await el.ready;

    // Should throw when trying to serialize string with separator
    expect(() => {
      el.badData = ['contains，separator'];
    }).toThrow('SimpleArray strings cannot contain the character "，" (U+FF0C)');
  });

  it('should handle complex mixed data types', async () => {
    @element('test-simple-array-mixed-unique')
    class TestSimpleArrayMixed extends HTMLElement {
      @property({ type: SimpleArray })
      mixedData = ['string', 42, true, 'another', 3.14159, false, 0, ''];
    }

    const el = document.createElement('test-simple-array-mixed-unique') as TestSimpleArrayMixed & SniceElement;
    document.body.appendChild(el);
    await el.ready;

    // Initial values don't reflect automatically
    expect(el.getAttribute('mixeddata')).toBe(null);
    expect(el.mixedData).toEqual(['string', 42, true, 'another', 3.14159, false, 0, '']);

    // Setting the property should handle complex mixed data
    el.mixedData = ['string', 42, true, 'another', 3.14159, false, 0, ''];
    const expected = 'string，42，true，another，3.14159，false，0，';
    expect(el.getAttribute('mixeddata')).toBe(expected);

    // Should round-trip correctly
    el.setAttribute('mixedData', 'new，123，false，test，0.5，true');
    expect(el.mixedData).toEqual(['new', 123, false, 'test', 0.5, true]);
  });
});

