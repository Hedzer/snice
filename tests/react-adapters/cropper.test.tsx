/**
 * React Adapter Test for Cropper
 */

import { describe, it, expect } from 'vitest';
import { testComponent } from './test-helpers';
import { Cropper } from '../../adapters/react/cropper';

describe('Cropper React Adapter', () => {
  testComponent({
    name: 'Cropper',
    Component: Cropper,
    properties: [
      { name: 'src', value: '/test-image.jpg', type: 'string' },
      { name: 'aspectRatio', value: 1, type: 'number' },
      { name: 'zoom', value: 1, type: 'number' },
      { name: 'disabled', value: false, type: 'boolean' }
    ],
    events: [
      { name: 'onCrop', trigger: 'crop' },
      { name: 'onZoom', trigger: 'zoom' }
    ],
    defaultProps: {}
  });
});
