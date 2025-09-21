import { SimpleArray } from './simple-array';
import { PropertyConverter } from './property-converter';

export interface PropertyOptions {
  type?: StringConstructor | NumberConstructor | BooleanConstructor | ArrayConstructor | ObjectConstructor | DateConstructor | BigIntConstructor | typeof SimpleArray;
  attribute?: string | boolean;
  converter?: PropertyConverter;
  hasChanged?: (value: any, oldValue: any) => boolean;
}