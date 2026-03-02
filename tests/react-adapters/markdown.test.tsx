/**
 * React Adapter Test for Markdown
 */

import { describe, it, expect } from 'vitest';
import { testComponent } from './test-helpers';
import { Markdown } from '../../adapters/react/markdown';

describe('Markdown React Adapter', () => {
  testComponent({
    name: 'Markdown',
    Component: Markdown,
    properties: [
      { name: 'sanitize', value: true, type: 'boolean' },
      { name: 'theme', value: 'default', type: 'string' }
    ],
    events: [
      { name: 'onMarkdownRender', trigger: 'markdown-render' },
      { name: 'onLinkClick', trigger: 'link-click' }
    ],
    defaultProps: {}
  });
});
