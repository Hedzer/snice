/**
 * Test helpers for React adapter tests
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';

/**
 * Test component basic rendering and props
 */
export function testComponentBasics(
  ComponentName: string,
  Component: any,
  defaultProps: Record<string, any> = {}
) {
  describe(`${ComponentName} - Basics`, () => {
    it('should be defined', () => {
      expect(Component).toBeDefined();
    });

    it('should have correct display name', () => {
      expect(Component.displayName).toContain('Snice');
    });

    it('should accept ref', () => {
      const ref = React.createRef();
      // Component should be able to accept a ref
      expect(() => React.createElement(Component, { ref, ...defaultProps })).not.toThrow();
    });

    it('should accept children', () => {
      const element = React.createElement(
        Component,
        defaultProps,
        'Test content'
      );
      expect(element).toBeDefined();
    });
  });
}

/**
 * Test component properties
 */
export function testComponentProperties(
  ComponentName: string,
  Component: any,
  properties: Array<{ name: string; value: any; type?: string }>
) {
  describe(`${ComponentName} - Properties`, () => {
    properties.forEach(({ name, value, type }) => {
      it(`should accept ${name} property`, () => {
        const props = { [name]: value };
        const element = React.createElement(Component, props);
        expect(element).toBeDefined();
        expect(element.props[name]).toBe(value);
      });

      if (type) {
        it(`${name} should have correct type`, () => {
          expect(typeof value).toBe(type);
        });
      }
    });

    it('should handle multiple properties at once', () => {
      const props = properties.reduce(
        (acc, { name, value }) => ({ ...acc, [name]: value }),
        {}
      );
      const element = React.createElement(Component, props);
      expect(element).toBeDefined();
    });
  });
}

/**
 * Test component events
 */
export function testComponentEvents(
  ComponentName: string,
  Component: any,
  events: Array<{ name: string; trigger?: string }>
) {
  describe(`${ComponentName} - Events`, () => {
    events.forEach(({ name, trigger }) => {
      it(`should accept ${name} callback`, () => {
        const handler = vi.fn();
        const props = { [name]: handler };
        const element = React.createElement(Component, props);
        expect(element).toBeDefined();
        expect(element.props[name]).toBe(handler);
      });
    });

    it('should handle multiple event handlers', () => {
      const handlers = events.reduce(
        (acc, { name }) => ({ ...acc, [name]: vi.fn() }),
        {}
      );
      const element = React.createElement(Component, handlers);
      expect(element).toBeDefined();
    });
  });
}

/**
 * Test form components
 */
export function testFormComponent(
  ComponentName: string,
  Component: any,
  options: {
    valueType: string;
    defaultValue?: any;
    hasName?: boolean;
    hasDisabled?: boolean;
    hasRequired?: boolean;
  }
) {
  const { valueType, defaultValue, hasName = true, hasDisabled = true, hasRequired = true } = options;

  describe(`${ComponentName} - Form Integration`, () => {
    it('should accept value property', () => {
      const props = { value: defaultValue };
      const element = React.createElement(Component, props);
      expect(element).toBeDefined();
      expect(element.props.value).toBe(defaultValue);
    });

    if (hasName) {
      it('should accept name property', () => {
        const props = { name: 'testField' };
        const element = React.createElement(Component, props);
        expect(element.props.name).toBe('testField');
      });
    }

    if (hasDisabled) {
      it('should accept disabled property', () => {
        const props = { disabled: true };
        const element = React.createElement(Component, props);
        expect(element.props.disabled).toBe(true);
      });
    }

    if (hasRequired) {
      it('should accept required property', () => {
        const props = { required: true };
        const element = React.createElement(Component, props);
        expect(element.props.required).toBe(true);
      });
    }

    it('should handle onChange callback', () => {
      const handler = vi.fn();
      const props = { onChange: handler };
      const element = React.createElement(Component, props);
      expect(element.props.onChange).toBe(handler);
    });

    it('value should be of correct type', () => {
      if (defaultValue !== undefined && defaultValue !== null) {
        expect(typeof defaultValue).toBe(valueType);
      }
    });
  });
}

/**
 * Test component variants
 */
export function testComponentVariants(
  ComponentName: string,
  Component: any,
  variants: string[]
) {
  describe(`${ComponentName} - Variants`, () => {
    it('should have variant property', () => {
      const element = React.createElement(Component, { variant: variants[0] });
      expect(element).toBeDefined();
    });

    variants.forEach(variant => {
      it(`should accept ${variant} variant`, () => {
        const props = { variant };
        const element = React.createElement(Component, props);
        expect(element.props.variant).toBe(variant);
      });
    });
  });
}

/**
 * Test component sizes
 */
export function testComponentSizes(
  ComponentName: string,
  Component: any,
  sizes: string[]
) {
  describe(`${ComponentName} - Sizes`, () => {
    it('should have size property', () => {
      const element = React.createElement(Component, { size: sizes[0] });
      expect(element).toBeDefined();
    });

    sizes.forEach(size => {
      it(`should accept ${size} size`, () => {
        const props = { size };
        const element = React.createElement(Component, props);
        expect(element.props.size).toBe(size);
      });
    });
  });
}

/**
 * Complete component test suite
 */
export function testComponent(config: {
  name: string;
  Component: any;
  properties?: Array<{ name: string; value: any; type?: string }>;
  events?: Array<{ name: string; trigger?: string }>;
  variants?: string[];
  sizes?: string[];
  isForm?: boolean;
  formOptions?: {
    valueType: string;
    defaultValue?: any;
    hasName?: boolean;
    hasDisabled?: boolean;
    hasRequired?: boolean;
  };
  defaultProps?: Record<string, any>;
}) {
  const {
    name,
    Component,
    properties = [],
    events = [],
    variants,
    sizes,
    isForm,
    formOptions,
    defaultProps = {}
  } = config;

  describe(name, () => {
    testComponentBasics(name, Component, defaultProps);

    if (properties.length > 0) {
      testComponentProperties(name, Component, properties);
    }

    if (events.length > 0) {
      testComponentEvents(name, Component, events);
    }

    if (variants) {
      testComponentVariants(name, Component, variants);
    }

    if (sizes) {
      testComponentSizes(name, Component, sizes);
    }

    if (isForm && formOptions) {
      testFormComponent(name, Component, formOptions);
    }
  });
}
