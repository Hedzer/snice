/**
 * React Adapter Test - Mentions
 *
 * Tests for the Mentions React adapter
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { Mentions } from '../../adapters/react/mentions';
import {
  testComponentBasics,
  testComponentProperties,
  testComponent
} from './test-helpers';

describe('Mentions React Adapter', () => {
  describe('Component Registration', () => {
    it('should be defined', () => {
      expect(Mentions).toBeDefined();
    });

    it('should have correct display name', () => {
      expect(Mentions.displayName).toBe('Snice(snice-mentions)');
    });
  });

  describe('Basic Functionality', () => {
    testComponentBasics('Mentions', Mentions);

    it('should accept ref', () => {
      const ref = { current: null };
      const element = <Mentions ref={ref} />;
      expect(element).toBeDefined();
    });

    it('should render without props', () => {
      const element = <Mentions />;
      expect(element).toBeDefined();
      expect(element.type).toBeDefined();
    });
  });

  describe('Properties', () => {
    testComponentProperties('Mentions', Mentions, [
      { name: 'value', value: '@user1 hello world' },
      { name: 'users', value: [{ id: '1', name: 'User One', username: 'user1' }] },
      { name: 'placeholder', value: 'Type @ to mention...' },
      { name: 'readonly', value: true },
      { name: 'trigger', value: '@' }
    ]);

    it('should accept value property', () => {
      const element = <Mentions value="@john test" />;
      expect(element.props.value).toBe('@john test');
    });

    it('should accept users array property', () => {
      const users = [
        { id: '1', name: 'John Doe', username: 'john' },
        { id: '2', name: 'Jane Smith', username: 'jane' }
      ];
      const element = <Mentions users={users} />;
      expect(element.props.users).toEqual(users);
    });

    it('should accept placeholder property', () => {
      const element = <Mentions placeholder="Mention someone..." />;
      expect(element.props.placeholder).toBe('Mention someone...');
    });

    it('should accept readonly property', () => {
      const element = <Mentions readonly={true} />;
      expect(element.props.readonly).toBe(true);
    });

    it('should accept trigger property', () => {
      const element = <Mentions trigger="#" />;
      expect(element.props.trigger).toBe('#');
    });

    it('should handle multiple properties at once', () => {
      const users = [{ id: '1', name: 'Test User', username: 'test' }];
      const element = (
        <Mentions
          value="@test hello"
          users={users}
          placeholder="Type here..."
          readonly={false}
          trigger="@"
        />
      );
      expect(element.props.value).toBe('@test hello');
      expect(element.props.users).toEqual(users);
      expect(element.props.placeholder).toBe('Type here...');
      expect(element.props.readonly).toBe(false);
      expect(element.props.trigger).toBe('@');
    });
  });

  describe('Events', () => {
    it('should accept standard React event handlers', () => {
      const onClick = vi.fn();
      const onFocus = vi.fn();
      const onBlur = vi.fn();
      
      const element = (
        <Mentions
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
      const element = <Mentions className="my-mentions" />;
      expect(element.props.className).toBe('my-mentions');
    });

    it('should accept style object', () => {
      const style = { width: '100%', maxWidth: '500px' };
      const element = <Mentions style={style} />;
      expect(element.props.style).toEqual(style);
    });
  });

  describe('Children', () => {
    it('should accept children', () => {
      const element = (
        <Mentions>
          <span>Child content</span>
        </Mentions>
      );
      expect(element.props.children).toBeDefined();
    });
  });
});
