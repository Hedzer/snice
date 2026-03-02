/**
 * React Adapter Test for OrgChart
 */

import { describe, it, expect } from 'vitest';
import { testComponent } from './test-helpers';
import { OrgChart } from '../../adapters/react/org-chart';

describe('OrgChart React Adapter', () => {
  testComponent({
    name: 'OrgChart',
    Component: OrgChart,
    properties: [
      { name: 'data', value: null, type: 'object' },
      { name: 'direction', value: 'top-down', type: 'string' },
      { name: 'compact', value: false, type: 'boolean' }
    ],
    events: [
      { name: 'onNodeClick', trigger: 'node-click' },
      { name: 'onNodeExpand', trigger: 'node-expand' },
      { name: 'onNodeCollapse', trigger: 'node-collapse' }
    ],
    defaultProps: {}
  });
});
