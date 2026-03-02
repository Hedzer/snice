/**
 * React Adapter Test for Waterfall
 */

import { describe, it, expect } from 'vitest';
import { testComponent } from './test-helpers';
import { Waterfall } from '../../adapters/react/waterfall';

describe('Waterfall React Adapter', () => {
  testComponent({
    name: 'Waterfall',
    Component: Waterfall,
    properties: [
      { name: 'data', value: [], type: 'object' },
      { name: 'orientation', value: 'vertical', type: 'string' },
      { name: 'showValues', value: true, type: 'boolean' },
      { name: 'showConnectors', value: true, type: 'boolean' },
      { name: 'animated', value: false, type: 'boolean' }
    ],
    events: [
      { name: 'onBarClick', trigger: 'bar-click' },
      { name: 'onBarHover', trigger: 'bar-hover' }
    ],
    defaultProps: {}
  });
});
