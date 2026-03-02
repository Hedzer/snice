/**
 * React Adapter Test for Doc
 */

import { describe, it, expect } from 'vitest';
import { testComponent } from './test-helpers';
import { Doc } from '../../adapters/react/doc';

describe('Doc React Adapter', () => {
  testComponent({
    name: 'Doc',
    Component: Doc,
    properties: [
      { name: 'placeholder', value: 'Enter text...', type: 'string' },
      { name: 'readonly', value: false, type: 'boolean' },
      { name: 'icons', value: 'default', type: 'string' }
    ],
    defaultProps: {}
  });
});
