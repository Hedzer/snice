/**
 * Convert kebab-case to camelCase
 * @param str - The kebab-case string
 * @returns The camelCase string
 */
export function kebabToCamel(str) {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}
/**
 * Convert camelCase to kebab-case
 * @param str - The camelCase string
 * @returns The kebab-case string
 */
export function camelToKebab(str) {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}
/**
 * Extract component metadata from a web component class
 * @param tagName - The tag name of the web component
 * @returns Component metadata including properties, events, and methods
 */
export function extractComponentMetadata(tagName) {
    const constructor = customElements.get(tagName);
    if (!constructor) {
        console.warn(`Component ${tagName} is not registered`);
        return { properties: [], events: {}, methods: [] };
    }
    const prototype = constructor.prototype;
    const properties = [];
    const methods = [];
    // Get all property descriptors
    const descriptors = Object.getOwnPropertyDescriptors(prototype);
    Object.keys(descriptors).forEach((key) => {
        const descriptor = descriptors[key];
        // Check if it's a property (has getter/setter)
        if (descriptor.get || descriptor.set) {
            properties.push(key);
        }
        // Check if it's a method (is a function and not a constructor)
        if (typeof descriptor.value === 'function' &&
            key !== 'constructor' &&
            !key.startsWith('_') &&
            !key.includes('Callback')) {
            methods.push(key);
        }
    });
    // Generate event mappings based on common patterns
    const events = {
        click: 'onClick',
        change: 'onChange',
        input: 'onInput',
        focus: 'onFocus',
        blur: 'onBlur',
        submit: 'onSubmit'
    };
    return { properties, events, methods };
}
/**
 * Check if a component is form-associated
 * @param tagName - The tag name of the web component
 * @returns true if the component is form-associated
 */
export function isFormAssociated(tagName) {
    const constructor = customElements.get(tagName);
    if (!constructor)
        return false;
    return 'formAssociated' in constructor && constructor.formAssociated === true;
}
/**
 * Wait for a web component to be defined
 * @param tagName - The tag name to wait for
 * @param timeout - Maximum time to wait in milliseconds
 * @returns Promise that resolves when component is defined or rejects on timeout
 */
export async function waitForComponentDefinition(tagName, timeout = 5000) {
    if (customElements.get(tagName)) {
        return Promise.resolve();
    }
    return Promise.race([
        customElements.whenDefined(tagName).then(() => { }),
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Component ${tagName} not defined within ${timeout}ms`)), timeout))
    ]);
}
//# sourceMappingURL=utils.js.map