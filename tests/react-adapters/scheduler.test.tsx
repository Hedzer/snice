/**
 * React Adapter Test - Scheduler
 *
 * Tests for the Scheduler React adapter
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { Scheduler } from '../../adapters/react/scheduler';
import {
  testComponentBasics,
  testComponentProperties,
  testComponent
} from './test-helpers';

describe('Scheduler React Adapter', () => {
  describe('Component Registration', () => {
    it('should be defined', () => {
      expect(Scheduler).toBeDefined();
    });

    it('should have correct display name', () => {
      expect(Scheduler.displayName).toBe('Snice(snice-scheduler)');
    });
  });

  describe('Basic Functionality', () => {
    testComponentBasics('Scheduler', Scheduler);

    it('should accept ref', () => {
      const ref = { current: null };
      const element = <Scheduler ref={ref} />;
      expect(element).toBeDefined();
    });

    it('should render without props', () => {
      const element = <Scheduler />;
      expect(element).toBeDefined();
      expect(element.type).toBeDefined();
    });
  });

  describe('Properties', () => {
    testComponentProperties('Scheduler', Scheduler, [
      { name: 'resources', value: [{ id: '1', name: 'Room A' }, { id: '2', name: 'Room B' }] },
      { name: 'events', value: [{ id: '1', title: 'Meeting', start: '09:00', end: '10:00' }] },
      { name: 'view', value: 'day' },
      { name: 'date', value: '2024-03-15' },
      { name: 'granularity', value: 30 },
      { name: 'startHour', value: 8 },
      { name: 'endHour', value: 18 }
    ]);

    it('should accept resources property', () => {
      const resources = [
        { id: '1', name: 'Conference Room A' },
        { id: '2', name: 'Conference Room B' }
      ];
      const element = <Scheduler resources={resources} />;
      expect(element.props.resources).toEqual(resources);
    });

    it('should accept events property', () => {
      const events = [
        { id: '1', title: 'Team Standup', start: '09:00', end: '09:30', resourceId: '1' },
        { id: '2', title: 'Client Meeting', start: '10:00', end: '11:00', resourceId: '2' }
      ];
      const element = <Scheduler events={events} />;
      expect(element.props.events).toEqual(events);
    });

    it('should accept view property', () => {
      const element = <Scheduler view="week" />;
      expect(element.props.view).toBe('week');
    });

    it('should accept date property', () => {
      const element = <Scheduler date="2024-03-15" />;
      expect(element.props.date).toBe('2024-03-15');
    });

    it('should accept granularity property', () => {
      const element = <Scheduler granularity={15} />;
      expect(element.props.granularity).toBe(15);
    });

    it('should accept startHour property', () => {
      const element = <Scheduler startHour={7} />;
      expect(element.props.startHour).toBe(7);
    });

    it('should accept endHour property', () => {
      const element = <Scheduler endHour={20} />;
      expect(element.props.endHour).toBe(20);
    });

    it('should handle multiple properties at once', () => {
      const resources = [{ id: '1', name: 'Room 1' }];
      const events = [{ id: '1', title: 'Meeting', start: '10:00', end: '11:00' }];
      const element = (
        <Scheduler
          resources={resources}
          events={events}
          view="day"
          date="2024-03-15"
          granularity={30}
          startHour={9}
          endHour={17}
        />
      );
      expect(element.props.resources).toEqual(resources);
      expect(element.props.events).toEqual(events);
      expect(element.props.view).toBe('day');
      expect(element.props.date).toBe('2024-03-15');
      expect(element.props.granularity).toBe(30);
      expect(element.props.startHour).toBe(9);
      expect(element.props.endHour).toBe(17);
    });
  });

  describe('Views', () => {
    const views = ['day', 'week', 'month'];
    
    views.forEach(view => {
      it(`should accept ${view} view`, () => {
        const element = <Scheduler view={view} />;
        expect(element.props.view).toBe(view);
      });
    });
  });

  describe('Events', () => {
    it('should accept standard React event handlers', () => {
      const onClick = vi.fn();
      const onFocus = vi.fn();
      const onBlur = vi.fn();
      
      const element = (
        <Scheduler
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
      const element = <Scheduler className="my-scheduler" />;
      expect(element.props.className).toBe('my-scheduler');
    });

    it('should accept style object', () => {
      const style = { height: '600px', width: '100%' };
      const element = <Scheduler style={style} />;
      expect(element.props.style).toEqual(style);
    });
  });

  describe('Children', () => {
    it('should accept children', () => {
      const element = (
        <Scheduler>
          <div>Custom header</div>
        </Scheduler>
      );
      expect(element.props.children).toBeDefined();
    });
  });
});
