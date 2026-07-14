import { describe, it } from 'vitest';
import { createComponent, introspect } from './components/test-utils';
import '../packages/components/src/badge/snice-badge';
import type { SniceBadgeElement } from '../packages/components/src/badge/snice-badge.types';
import { INITIALIZED, PROPERTIES_INITIALIZED, RENDER_METHOD } from '../packages/core/src/symbols';

describe('debug badge', () => {
  it('should check oldValue vs newValue', async () => {
    const badge = await createComponent<SniceBadgeElement>('snice-badge');

    console.log('===== Getting current value BEFORE setting =====');
    const beforeValue = badge.content;
    console.log('badge.content (getter):', beforeValue, 'type:', typeof beforeValue);
    console.log('badge.getAttribute("content"):', badge.getAttribute('content'));

    console.log('\n===== Setting content to "New" =====');
    badge.content = 'New';

    console.log('\n===== Getting value AFTER setting =====');
    const afterValue = badge.content;
    console.log('badge.content (getter):', afterValue, 'type:', typeof afterValue);
    console.log('badge.getAttribute("content"):', badge.getAttribute('content'));

    console.log('\n===== Comparison =====');
    console.log('beforeValue === "New":', beforeValue === 'New');
    console.log('afterValue === "New":', afterValue === 'New');
    console.log('beforeValue === afterValue:', beforeValue === afterValue);
  });
});
