/**
 * Convert kebab-case to camelCase
 * @param str - The kebab-case string
 * @returns The camelCase string
 */
export declare function kebabToCamel(str: string): string;
/**
 * Convert camelCase to kebab-case
 * @param str - The camelCase string
 * @returns The kebab-case string
 */
export declare function camelToKebab(str: string): string;
/**
 * Extract component metadata from a web component class
 * @param tagName - The tag name of the web component
 * @returns Component metadata including properties, events, and methods
 */
export declare function extractComponentMetadata(tagName: string): {
    properties: string[];
    events: Record<string, string>;
    methods: string[];
};
/**
 * Check if a component is form-associated
 * @param tagName - The tag name of the web component
 * @returns true if the component is form-associated
 */
export declare function isFormAssociated(tagName: string): boolean;
/**
 * Wait for a web component to be defined
 * @param tagName - The tag name to wait for
 * @param timeout - Maximum time to wait in milliseconds
 * @returns Promise that resolves when component is defined or rejects on timeout
 */
export declare function waitForComponentDefinition(tagName: string, timeout?: number): Promise<void>;
//# sourceMappingURL=utils.d.ts.map