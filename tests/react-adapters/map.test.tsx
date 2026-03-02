/**
 * React Adapter Test for Map
 */

import { describe, it, expect } from 'vitest';
import { testComponent } from './test-helpers';
import { Map } from '../../adapters/react/map';

describe('Map React Adapter', () => {
  testComponent({
    name: 'Map',
    Component: Map,
    properties: [
      { name: 'center', value: { lat: 0, lng: 0 }, type: 'object' },
      { name: 'zoom', value: 13, type: 'number' },
      { name: 'minZoom', value: 1, type: 'number' },
      { name: 'maxZoom', value: 18, type: 'number' },
      { name: 'markers', value: [], type: 'object' }
    ],
    events: [
      { name: 'onMapClick', trigger: 'map-click' },
      { name: 'onMarkerClick', trigger: 'marker-click' },
      { name: 'onMapMove', trigger: 'map-move' },
      { name: 'onMapZoom', trigger: 'map-zoom' }
    ],
    defaultProps: {}
  });
});
