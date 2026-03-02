/**
 * React Adapter Test - Booking
 *
 * Tests for the Booking React adapter
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { Booking } from '../../adapters/react/booking';
import {
  testComponentBasics,
  testComponentProperties,
  testComponentVariants,
  testComponent
} from './test-helpers';

describe('Booking React Adapter', () => {
  describe('Component Registration', () => {
    it('should be defined', () => {
      expect(Booking).toBeDefined();
    });

    it('should have correct display name', () => {
      expect(Booking.displayName).toBe('Snice(snice-booking)');
    });
  });

  describe('Basic Functionality', () => {
    testComponentBasics('Booking', Booking);

    it('should accept ref', () => {
      const ref = { current: null };
      const element = <Booking ref={ref} />;
      expect(element).toBeDefined();
    });

    it('should render without props', () => {
      const element = <Booking />;
      expect(element).toBeDefined();
      expect(element.type).toBeDefined();
    });
  });

  describe('Properties', () => {
    testComponentProperties('Booking', Booking, [
      { name: 'availableDates', value: ['2024-03-15', '2024-03-16', '2024-03-17'] },
      { name: 'availableSlots', value: [{ time: '09:00', available: true }, { time: '10:00', available: false }] },
      { name: 'duration', value: 60 },
      { name: 'minDate', value: '2024-03-01' },
      { name: 'maxDate', value: '2024-03-31' },
      { name: 'fields', value: [{ name: 'name', label: 'Full Name', required: true }] },
      { name: 'variant', value: 'default' }
    ]);

    it('should accept availableDates property', () => {
      const dates = ['2024-03-15', '2024-03-16', '2024-03-17'];
      const element = <Booking availableDates={dates} />;
      expect(element.props.availableDates).toEqual(dates);
    });

    it('should accept availableSlots property', () => {
      const slots = [
        { time: '09:00', available: true },
        { time: '10:00', available: true },
        { time: '11:00', available: false }
      ];
      const element = <Booking availableSlots={slots} />;
      expect(element.props.availableSlots).toEqual(slots);
    });

    it('should accept duration property', () => {
      const element = <Booking duration={30} />;
      expect(element.props.duration).toBe(30);
    });

    it('should accept minDate property', () => {
      const element = <Booking minDate="2024-03-01" />;
      expect(element.props.minDate).toBe('2024-03-01');
    });

    it('should accept maxDate property', () => {
      const element = <Booking maxDate="2024-12-31" />;
      expect(element.props.maxDate).toBe('2024-12-31');
    });

    it('should accept fields property', () => {
      const fields = [
        { name: 'name', label: 'Full Name', type: 'text', required: true },
        { name: 'email', label: 'Email Address', type: 'email', required: true },
        { name: 'notes', label: 'Additional Notes', type: 'textarea', required: false }
      ];
      const element = <Booking fields={fields} />;
      expect(element.props.fields).toEqual(fields);
    });

    it('should accept variant property', () => {
      const element = <Booking variant="compact" />;
      expect(element.props.variant).toBe('compact');
    });

    it('should handle multiple properties at once', () => {
      const dates = ['2024-03-15', '2024-03-16'];
      const slots = [{ time: '09:00', available: true }];
      const fields = [{ name: 'name', label: 'Name', required: true }];
      const element = (
        <Booking
          availableDates={dates}
          availableSlots={slots}
          duration={60}
          minDate="2024-03-01"
          maxDate="2024-03-31"
          fields={fields}
          variant="default"
        />
      );
      expect(element.props.availableDates).toEqual(dates);
      expect(element.props.availableSlots).toEqual(slots);
      expect(element.props.duration).toBe(60);
      expect(element.props.minDate).toBe('2024-03-01');
      expect(element.props.maxDate).toBe('2024-03-31');
      expect(element.props.fields).toEqual(fields);
      expect(element.props.variant).toBe('default');
    });
  });

  describe('Variants', () => {
    const variants = ['default', 'compact', 'wizard', 'minimal'];
    
    variants.forEach(variant => {
      it(`should accept ${variant} variant`, () => {
        const element = <Booking variant={variant} />;
        expect(element.props.variant).toBe(variant);
      });
    });
  });

  describe('Events', () => {
    it('should accept standard React event handlers', () => {
      const onClick = vi.fn();
      const onFocus = vi.fn();
      const onBlur = vi.fn();
      const onChange = vi.fn();
      const onSubmit = vi.fn();
      
      const element = (
        <Booking
          onClick={onClick}
          onFocus={onFocus}
          onBlur={onBlur}
          onChange={onChange}
        />
      );
      
      expect(element.props.onClick).toBe(onClick);
      expect(element.props.onFocus).toBe(onFocus);
      expect(element.props.onBlur).toBe(onBlur);
      expect(element.props.onChange).toBe(onChange);
    });
  });

  describe('CSS Classes and Styling', () => {
    it('should accept className', () => {
      const element = <Booking className="my-booking" />;
      expect(element.props.className).toBe('my-booking');
    });

    it('should accept style object', () => {
      const style = { maxWidth: '600px', margin: '0 auto' };
      const element = <Booking style={style} />;
      expect(element.props.style).toEqual(style);
    });
  });

  describe('Children', () => {
    it('should accept children', () => {
      const element = (
        <Booking>
          <div>Custom footer</div>
        </Booking>
      );
      expect(element.props.children).toBeDefined();
    });
  });
});
