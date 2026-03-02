/**
 * React Adapter Test for Layout
 */

import { describe, it, expect } from 'vitest';
import { testComponent } from './test-helpers';
import { Layout } from '../../adapters/react/layout';

describe('Layout React Adapter', () => {
  testComponent({
    name: 'Layout',
    Component: Layout,
    defaultProps: {}
  });
});
