import { describe, it, expect } from 'vitest';
import { element, property } from '../src/index';

describe('Boolean property reflection', () => {
  it('should reflect boolean properties as "true" in DOM', async () => {
    @element('test-bool-reflection')
    class TestBoolReflection extends HTMLElement {
      @property({ type: Boolean }) active = false;
      @property({ type: Boolean }) disabled = false;
    }

    const el = document.createElement('test-bool-reflection') as any;
    el.setAttribute('active', '');
    el.setAttribute('disabled', '');

    document.body.appendChild(el);
    await el.ready;

    // After initialization, boolean attributes should be normalized to "true"
    expect(el.getAttribute('active')).toBe('true');
    expect(el.getAttribute('disabled')).toBe('true');

    // Properties should read as true
    expect(el.active).toBe(true);
    expect(el.disabled).toBe(true);

    // Setting property to true should reflect as "true"
    el.active = false;
    el.active = true;
    expect(el.getAttribute('active')).toBe('true');

    // Setting property to false should remove attribute
    el.active = false;
    expect(el.hasAttribute('active')).toBe(false);

    document.body.removeChild(el);
  });
});
