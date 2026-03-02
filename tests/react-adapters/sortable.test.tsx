/**
 * React Adapter Test for Sortable
 */

import { describe, it, expect } from 'vitest';
import { testComponent } from './test-helpers';
import { Sortable } from '../../adapters/react/sortable';

describe('Sortable React Adapter', () => {
  testComponent({
    name: 'Sortable',
    Component: Sortable,
    properties: [
      { name: 'direction', value: 'vertical', type: 'string' },
      { name: 'handle', value: '', type: 'string' },
      { name: 'disabled', value: false, type: 'boolean' },
      { name: 'group', value: '', type: 'string' }
    ],
    events: [
      { name: 'onSortStart', trigger: 'sort-start' },
      { name: 'onSortEnd', trigger: 'sort-end' },
      { name: 'onSortChange', trigger: 'sort-change' }
    ],
    defaultProps: {}
  });
});
