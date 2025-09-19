// Full export build - includes all exports including internal APIs

// Export everything from the main index
export * from './index';

// Export additional controller functions that are internal but needed for testing
export {
  registerControllerCleanup,
  getControllerScope,
  attachController as attachControllerInternal,
  detachController as detachControllerInternal
} from './controller';

// Export additional symbols that might be needed
export {
  CONTROLLER_KEY,
  CONTROLLER_OPERATIONS,
  CONTROLLER_NAME_KEY,
  CONTROLLER_ID,
  PROPERTIES_INITIALIZED,
  PROPERTY_VALUES,
  PROPERTY_WATCHERS,
  EXPLICITLY_SET_PROPERTIES,
  READY_PROMISE,
  READY_RESOLVE,
  READY_HANDLERS,
  DISPOSE_HANDLERS,
  PARTS,
  PART_TIMERS,
  ROUTER_CONTEXT,
  CONTEXT_REQUEST_HANDLER,
  PAGE_TRANSITION,
  CREATED_AT,
  IS_ELEMENT_CLASS,
  IS_CONTROLLER_CLASS,
  IS_CONTROLLER_INSTANCE,
  NATIVE_CONTROLLER,
  CLEANUP,
  ON_HANDLERS,
  DISPATCH_TIMERS,
  CHANNEL_HANDLERS,
  OBSERVERS
} from './symbols';

// Export additional utilities that might be needed for testing
export { parseAttributeValue, detectType } from './utils';