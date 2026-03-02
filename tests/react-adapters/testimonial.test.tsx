/**
 * React Adapter Test for Testimonial
 */

import { describe, it, expect } from 'vitest';
import { testComponent } from './test-helpers';
import { Testimonial } from '../../adapters/react/testimonial';

describe('Testimonial React Adapter', () => {
  testComponent({
    name: 'Testimonial',
    Component: Testimonial,
    properties: [
      { name: 'quote', value: '', type: 'string' },
      { name: 'author', value: '', type: 'string' },
      { name: 'avatar', value: '', type: 'string' },
      { name: 'role', value: '', type: 'string' },
      { name: 'company', value: '', type: 'string' },
      { name: 'rating', value: 0, type: 'number' },
      { name: 'variant', value: 'card', type: 'string' }
    ],
    defaultProps: {}
  });
});
