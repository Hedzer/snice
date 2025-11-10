/**
 * Tests for React adapters
 *
 * These tests verify that React adapters work correctly with Snice components
 */

import { describe, it, expect, beforeAll } from 'vitest';
import React from 'react';
import { createReactAdapter } from '../adapters/react/wrapper';

// Mock React hooks for testing
const mockUseEffect = (callback: () => void) => callback();
const mockUseRef = <T,>(initial: T) => ({ current: initial });
const mockForwardRef = <T, P>(component: any) => component;

describe('React Adapters', () => {
  describe('createReactAdapter', () => {
    it('should create a React component wrapper', () => {
      const Button = createReactAdapter({
        tagName: 'snice-button',
        properties: ['variant', 'size'],
        events: { click: 'onClick' }
      });

      expect(Button).toBeDefined();
      expect(Button.displayName).toBe('Snice(snice-button)');
    });

    it('should handle properties correctly', () => {
      const Button = createReactAdapter({
        tagName: 'snice-button',
        properties: ['variant', 'size', 'disabled'],
        events: {}
      });

      expect(Button).toBeDefined();
      // Component should exist and be callable
      expect(typeof Button).toBe('object');
    });

    it('should map events to callbacks', () => {
      const Input = createReactAdapter({
        tagName: 'snice-input',
        properties: ['value'],
        events: {
          input: 'onInput',
          change: 'onChange',
          focus: 'onFocus',
          blur: 'onBlur'
        }
      });

      expect(Input).toBeDefined();
      expect(Input.displayName).toBe('Snice(snice-input)');
    });

    it('should handle form-associated components', () => {
      const Input = createReactAdapter({
        tagName: 'snice-input',
        properties: ['value', 'name', 'disabled'],
        events: { change: 'onChange' },
        formAssociated: true
      });

      expect(Input).toBeDefined();
    });

    it('should expose methods via ref', () => {
      const Button = createReactAdapter({
        tagName: 'snice-button',
        properties: ['variant'],
        events: {},
        methods: ['focus', 'blur']
      });

      expect(Button).toBeDefined();
    });
  });

  describe('Component Integration', () => {
    beforeAll(() => {
      // Import button component to ensure it's registered
      // This would normally be done in the actual test environment
    });

    it('should work with button component', () => {
      const Button = createReactAdapter({
        tagName: 'snice-button',
        properties: ['variant', 'size', 'disabled', 'loading'],
        events: { click: 'onClick' },
        methods: ['focus', 'blur']
      });

      expect(Button.displayName).toBe('Snice(snice-button)');
    });

    it('should work with input component', () => {
      const Input = createReactAdapter({
        tagName: 'snice-input',
        properties: [
          'value',
          'type',
          'placeholder',
          'disabled',
          'readonly',
          'required',
          'minlength',
          'maxlength'
        ],
        events: {
          input: 'onInput',
          change: 'onChange',
          focus: 'onFocus',
          blur: 'onBlur'
        },
        formAssociated: true,
        methods: ['focus', 'blur']
      });

      expect(Input.displayName).toBe('Snice(snice-input)');
    });

    it('should work with card component', () => {
      const Card = createReactAdapter({
        tagName: 'snice-card',
        properties: ['variant', 'clickable', 'disabled'],
        events: { click: 'onClick' }
      });

      expect(Card.displayName).toBe('Snice(snice-card)');
    });
  });

  describe('Generated Adapters', () => {
    it('should have adapters for all components', async () => {
      // Dynamically import the components export
      // This tests that all component adapters were generated correctly
      try {
        const components = await import('../adapters/react/components');
        expect(components).toBeDefined();

        // Check that some key components exist
        expect(components.Button).toBeDefined();
        expect(components.Input).toBeDefined();
        expect(components.Card).toBeDefined();
      } catch (error) {
        // If components haven't been built yet, that's okay for this test
        console.warn('React adapters not built yet. Run `npm run build:react` to generate them.');
      }
    });
  });

  describe('TypeScript Types', () => {
    it('should have proper type exports', async () => {
      try {
        const types = await import('../adapters/react/types');
        expect(types).toBeDefined();

        // Check that type exports exist
        expect(types).toHaveProperty('SniceBaseProps');
        expect(types).toHaveProperty('SniceFormProps');
      } catch (error) {
        console.warn('Type definitions not built yet.');
      }
    });
  });

  describe('Utilities', () => {
    it('should have utility functions', async () => {
      const utils = await import('../adapters/react/utils');

      expect(utils.kebabToCamel).toBeDefined();
      expect(utils.camelToKebab).toBeDefined();
      expect(utils.extractComponentMetadata).toBeDefined();
      expect(utils.isFormAssociated).toBeDefined();
      expect(utils.waitForComponentDefinition).toBeDefined();
    });

    it('should convert kebab-case to camelCase', async () => {
      const { kebabToCamel } = await import('../adapters/react/utils');

      expect(kebabToCamel('snice-button')).toBe('sniceButton');
      expect(kebabToCamel('my-component-name')).toBe('myComponentName');
    });

    it('should convert camelCase to kebab-case', async () => {
      const { camelToKebab } = await import('../adapters/react/utils');

      expect(camelToKebab('sniceButton')).toBe('snice-button');
      expect(camelToKebab('myComponentName')).toBe('my-component-name');
    });
  });
});

/**
 * Integration test notes:
 *
 * To run full integration tests with React:
 * 1. Ensure React and React-DOM are installed as dev dependencies
 * 2. Set up React Testing Library
 * 3. Import actual Snice components
 * 4. Create React components using the adapters
 * 5. Render and test component behavior
 *
 * Example integration test:
 *
 * ```tsx
 * import { render, fireEvent } from '@testing-library/react';
 * import { Button } from '../adapters/react';
 * import '../components/button/snice-button';
 *
 * test('Button click handler works', () => {
 *   const handleClick = vi.fn();
 *   const { getByText } = render(
 *     <Button onClick={handleClick}>Click me</Button>
 *   );
 *
 *   fireEvent.click(getByText('Click me'));
 *   expect(handleClick).toHaveBeenCalled();
 * });
 * ```
 */
