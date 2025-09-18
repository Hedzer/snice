import { SimpleArray, PropertyOptions } from './element';

/**
 * Detects the type constructor from an initial value
 * @param initialValue - The default value assigned to a property field (e.g., `name = "default"` -> "default")
 * @returns The constructor function (String, Number, Boolean, etc.) or undefined if type can't be determined
 */
export function detectType(initialValue: any): any {
  if (initialValue === null || initialValue === undefined) {
    return undefined;
  }

  if (typeof initialValue === 'string') {
    return String;
  }

  if (typeof initialValue === 'number') {
    return Number;
  }

  if (typeof initialValue === 'boolean') {
    return Boolean;
  }

  if (initialValue instanceof Date) {
    return Date;
  }

  if (typeof initialValue === 'bigint') {
    return BigInt;
  }

  if (Array.isArray(initialValue)) {
    return Array;
  }

  return undefined;
}

/**
 * Parses an attribute value based on the property type
 * @param attributeValue - The raw string value from the HTML attribute (e.g., "123", "true", "hello")
 * @param propertyOptions - The options from @property decorator (contains explicit type, attribute name, etc.)
 * @param currentValue - The current stored value of the property (used for type inference when no explicit type)
 * @param initialValue - The default value assigned to the property field (used for type detection as fallback)
 * @returns The parsed value in the correct JavaScript type
 */
export function parseAttributeValue(attributeValue: string | null, propertyOptions: PropertyOptions, currentValue?: any, initialValue?: any): any {
  // Use explicit type or detect from initial value
  const typeToUse = propertyOptions.type || detectType(initialValue);

  switch (typeToUse) {
    case Boolean:
      return attributeValue !== null && attributeValue !== 'false';
    case Number:
      return attributeValue !== null ? Number(attributeValue) : null;
    case String:
      return attributeValue;
    case Date:
      return attributeValue ? new Date(attributeValue) : null;
    case BigInt:
      if (attributeValue && attributeValue.endsWith('n')) {
        return BigInt(attributeValue.slice(0, -1));
      } else {
        return attributeValue ? BigInt(attributeValue) : null;
      }
    case SimpleArray:
      return SimpleArray.parse(attributeValue);
    default:
      // If no type specified and can't detect, try to infer from current value type
      if (typeof currentValue === 'number' && attributeValue !== null) {
        return Number(attributeValue);
      } else {
        return attributeValue;
      }
  }
}