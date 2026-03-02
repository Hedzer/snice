/**
 * React Adapter Test - DataCard
 *
 * Tests for the DataCard React adapter
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { DataCard } from '../../adapters/react/data-card';
import {
  testComponentBasics,
  testComponentProperties,
  testComponentVariants,
  testComponent
} from './test-helpers';

describe('DataCard React Adapter', () => {
  describe('Component Registration', () => {
    it('should be defined', () => {
      expect(DataCard).toBeDefined();
    });

    it('should have correct display name', () => {
      expect(DataCard.displayName).toBe('Snice(snice-data-card)');
    });
  });

  describe('Basic Functionality', () => {
    testComponentBasics('DataCard', DataCard);

    it('should accept ref', () => {
      const ref = { current: null };
      const element = <DataCard ref={ref} />;
      expect(element).toBeDefined();
    });

    it('should render without props', () => {
      const element = <DataCard />;
      expect(element).toBeDefined();
      expect(element.type).toBeDefined();
    });
  });

  describe('Properties', () => {
    testComponentProperties('DataCard', DataCard, [
      { name: 'fields', value: [{ key: 'name', label: 'Name', value: 'John' }] },
      { name: 'editable', value: true },
      { name: 'variant', value: 'default' }
    ]);

    it('should accept fields property', () => {
      const fields = [
        { key: 'name', label: 'Full Name', value: 'John Doe' },
        { key: 'email', label: 'Email', value: 'john@example.com' }
      ];
      const element = <DataCard fields={fields} />;
      expect(element.props.fields).toEqual(fields);
    });

    it('should accept editable property', () => {
      const element = <DataCard editable={true} />;
      expect(element.props.editable).toBe(true);
    });

    it('should accept variant property', () => {
      const element = <DataCard variant="compact" />;
      expect(element.props.variant).toBe('compact');
    });

    it('should handle multiple properties at once', () => {
      const fields = [{ key: 'title', label: 'Title', value: 'Manager' }];
      const element = (
        <DataCard
          fields={fields}
          editable={true}
          variant="detailed"
        />
      );
      expect(element.props.fields).toEqual(fields);
      expect(element.props.editable).toBe(true);
      expect(element.props.variant).toBe('detailed');
    });
  });

  describe('Variants', () => {
    const variants = ['default', 'compact', 'detailed', 'minimal'];
    
    variants.forEach(variant => {
      it(`should accept ${variant} variant`, () => {
        const element = <DataCard variant={variant} />;
        expect(element.props.variant).toBe(variant);
      });
    });
  });

  describe('Events', () => {
    it('should accept standard React event handlers', () => {
      const onClick = vi.fn();
      const onFocus = vi.fn();
      const onBlur = vi.fn();
      
      const element = (
        <DataCard
          onClick={onClick}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      );
      
      expect(element.props.onClick).toBe(onClick);
      expect(element.props.onFocus).toBe(onFocus);
      expect(element.props.onBlur).toBe(onBlur);
    });
  });

  describe('CSS Classes and Styling', () => {
    it('should accept className', () => {
      const element = <DataCard className="my-data-card" />;
      expect(element.props.className).toBe('my-data-card');
    });

    it('should accept style object', () => {
      const style = { margin: '1rem', padding: '0.5rem' };
      const element = <DataCard style={style} />;
      expect(element.props.style).toEqual(style);
    });
  });

  describe('Children', () => {
    it('should accept children', () => {
      const element = (
        <DataCard>
          <div>Additional content</div>
        </DataCard>
      );
      expect(element.props.children).toBeDefined();
    });
  });
});
