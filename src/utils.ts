import { SimpleArray, PropertyOptions } from './types';

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
      // Boolean semantics per user specification:
      // - No attribute = false
      // - String "false" = false
      // - String "true" = true
      // - Empty string = true (attribute exists like <element bool-attr>)
      // - Any other value = true

      if (attributeValue === null) return false;           // No attribute
      if (attributeValue === 'false') return false;        // String "false"

      // All other cases (including empty string) = true (attribute exists)
      return true;
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
    case Array:
      try {
        return attributeValue ? JSON.parse(attributeValue) : [];
      } catch {
        return [];
      }
    case Object:
      try {
        return attributeValue ? JSON.parse(attributeValue) : {};
      } catch {
        return {};
      }
    default:
      // If no type specified and can't detect, try to infer from current value type
      if (typeof currentValue === 'number' && attributeValue !== null) {
        return Number(attributeValue);
      } else {
        return attributeValue;
      }
  }
}

/**
 * Converts a property value to its attribute string representation
 * @param value - The property value to convert
 * @param propertyOptions - The options from @property decorator
 * @param initialValue - The default value assigned to the property field (used for type detection)
 * @returns The string representation for the HTML attribute, or null if value should remove attribute
 */
export function valueToAttribute(value: any, propertyOptions: PropertyOptions, initialValue?: any): string | null {
  // Handle null/undefined/false values and empty arrays
  if (value === null || value === undefined || value === false ||
      (propertyOptions?.type === SimpleArray && Array.isArray(value) && value.length === 0)) {
    return null;
  }

  // Use custom converter if provided
  if (propertyOptions.converter?.toAttribute) {
    return propertyOptions.converter.toAttribute(value, propertyOptions.type);
  }

  // Use explicit type or detect from initial value
  const typeToUse = propertyOptions.type || detectType(initialValue);

  switch (typeToUse) {
    case Boolean:
      // For boolean attributes, return "true" when true
      // (false is already handled above - returns null to remove attribute)
      return 'true';
    case Date:
      return value instanceof Date ? value.toISOString() : String(value);
    case BigInt:
      return typeof value === 'bigint' ? value.toString() + 'n' : String(value);
    case SimpleArray:
      return Array.isArray(value) ? SimpleArray.serialize(value) : String(value);
    case Array:
      return Array.isArray(value) ? JSON.stringify(value) : String(value);
    case Object:
      return typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value);
    default:
      return String(value);
  }
}