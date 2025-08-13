// Central file for all symbols used in the framework
// All symbols are stored globally to ensure consistency across modules

import { getSymbol } from './global';

export const IS_CONTROLLER_CLASS = getSymbol('is-controller-class');
export const IS_ELEMENT_CLASS = getSymbol('is-element-class');
export const CHANNEL_HANDLERS = getSymbol('channel-handlers');

// Internal element state symbols
export const READY_PROMISE = getSymbol('ready-promise');
export const READY_RESOLVE = getSymbol('ready-resolve');
export const CONTROLLER = getSymbol('controller');

// Event handler symbols
export const ON_HANDLERS = getSymbol('on-handlers');

// Controller symbols
export const CONTROLLER_KEY = getSymbol('controller-key');
export const CONTROLLER_NAME_KEY = getSymbol('controller-name');
export const CONTROLLER_ID = getSymbol('controller-id');
export const CONTROLLER_OPERATIONS = getSymbol('controller-operations');
export const NATIVE_CONTROLLER = getSymbol('native-controller');

// Cleanup symbol - holds an object with all cleanup arrays
export const CLEANUP = getSymbol('cleanup');

// Property symbols
export const PROPERTIES = getSymbol('properties');
export const PROPERTY_VALUES = getSymbol('property-values');
export const PROPERTIES_INITIALIZED = getSymbol('properties-initialized');
export const PROPERTY_WATCHERS = getSymbol('property-watchers');