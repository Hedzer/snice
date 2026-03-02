/**
 * React Adapter Test for Weather
 */

import { describe, it, expect } from 'vitest';
import { testComponent } from './test-helpers';
import { Weather } from '../../adapters/react/weather';

describe('Weather React Adapter', () => {
  testComponent({
    name: 'Weather',
    Component: Weather,
    properties: [
      { name: 'data', value: null, type: 'object' },
      { name: 'unit', value: 'celsius', type: 'string' },
      { name: 'variant', value: 'full', type: 'string' }
    ],
    defaultProps: {}
  });
});
