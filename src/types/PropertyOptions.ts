import { SimpleArray } from './SimpleArray';
import { PropertyConverter } from './PropertyConverter';

export interface PropertyOptions {
  type?: StringConstructor | NumberConstructor | BooleanConstructor | ArrayConstructor | ObjectConstructor | DateConstructor | BigIntConstructor | typeof SimpleArray;
  attribute?: string | boolean;
  converter?: PropertyConverter;
  hasChanged?: (value: any, oldValue: any) => boolean;
}