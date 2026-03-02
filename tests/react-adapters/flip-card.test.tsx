/**
 * React Adapter Test for FlipCard
 */

import { describe, it, expect } from 'vitest';
import { testComponent } from './test-helpers';
import { FlipCard } from '../../adapters/react/flip-card';

describe('FlipCard React Adapter', () => {
  testComponent({
    name: 'FlipCard',
    Component: FlipCard,
    properties: [
      { name: 'flipped', value: false, type: 'boolean' },
      { name: 'clickToFlip', value: true, type: 'boolean' },
      { name: 'direction', value: 'horizontal', type: 'string' },
      { name: 'duration', value: 600, type: 'number' }
    ],
    events: [
      { name: 'onFlipChange', trigger: 'flip-change' }
    ],
    defaultProps: {}
  });
});
