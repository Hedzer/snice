/**
 * SimpleArray type for arrays that can be safely reflected to attributes
 * Supports arrays of: string, number, boolean
 * Uses full-width comma (，) as separator to avoid conflicts
 * Strings cannot contain the full-width comma character
 */
export class SimpleArray {
  static readonly SEPARATOR = '，'; // U+FF0C Full-width comma

  /**
   * Serialize array to string for attribute storage
   */
  static serialize(arr: (string | number | boolean)[]): string {
    if (!Array.isArray(arr)) return '';

    return arr.map(item => {
      if (typeof item === 'string') {
        // Validate string doesn't contain our separator
        if (item.includes(SimpleArray.SEPARATOR)) {
          throw new Error(`SimpleArray strings cannot contain the character "${SimpleArray.SEPARATOR}" (U+FF0C)`);
        }
        return item;
      } else if (typeof item === 'number' || typeof item === 'boolean') {
        return String(item);
      } else {
        throw new Error(`SimpleArray only supports string, number, and boolean types. Got: ${typeof item}`);
      }
    }).join(SimpleArray.SEPARATOR);
  }

  /**
   * Parse string from attribute back to array
   */
  static parse(str: string | null): (string | number | boolean)[] {
    if (str === null || str === undefined) return [];
    // Empty string should not be parsed as containing an empty string
    // since empty arrays don't get reflected (handled by the reflection logic)
    if (str === '') return [];

    return str.split(SimpleArray.SEPARATOR).map(item => {
      // Try to parse as number
      if (/^-?\d+\.?\d*$/.test(item)) {
        const num = Number(item);
        if (!isNaN(num)) return num;
      }

      // Parse as boolean
      if (item === 'true') return true;
      if (item === 'false') return false;

      // Default to string
      return item;
    });
  }
}