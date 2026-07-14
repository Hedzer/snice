import { element, property } from 'snice';
import type { SniceKvPairElement } from './snice-key-value.types';

/**
 * Data container element for key-value pairs.
 * Does NOT render its own shadow DOM — the parent <snice-key-value> reads
 * attributes from these children and renders the full UI.
 */
@element('snice-kv-pair')
export class SniceKvPair extends HTMLElement implements SniceKvPairElement {
  @property()
  key = '';

  @property()
  value = '';

  @property()
  description = '';
}
