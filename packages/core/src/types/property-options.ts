import { SimpleArray } from './simple-array';
import { PropertyConverter } from './property-converter';

export interface PropertyOptions {
  type?: StringConstructor | NumberConstructor | BooleanConstructor | ArrayConstructor | ObjectConstructor | DateConstructor | BigIntConstructor | typeof SimpleArray;
  attribute?: string | boolean;
  /** Reflect property writes back to the attribute. Defaults to true for compatibility. */
  reflect?: boolean;
  /** Observe nested object/array/Map/Set mutations and request a render. */
  deep?: boolean;
  /** Attribute naming for implicit names. Legacy lowercases; kebab converts camelCase. */
  attributeNaming?: 'legacy' | 'kebab';
  converter?: PropertyConverter;
  hasChanged?: (value: any, oldValue: any) => boolean;
}

export type StateOptions = Pick<PropertyOptions, 'hasChanged' | 'deep'>;
