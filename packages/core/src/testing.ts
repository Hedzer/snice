// Full export build - includes all exports including internal APIs

// Export everything from the main index
export * from './index';

// Export additional controller functions that are internal but needed for testing
export {
  registerControllerCleanup,
  getControllerScope,
  attachController,
  detachController,
  getController,
  cleanupNativeElementControllers
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
  IS_DAEMON_CLASS,
  IS_DAEMON_INSTANCE,
  DAEMON_STATE,
  NATIVE_CONTROLLER,
  DIRECT_CONTROLLER,
  PENDING_CONTROLLER_BINDING,
  CLEANUP,
  ON_HANDLERS,
  DISPATCH_TIMERS,
  CHANNEL_HANDLERS,
  OBSERVERS
} from './symbols';

// Export additional utilities that might be needed for testing
export { parseAttributeValue, detectType } from './utils';

// Export the low-level template instance only from the dedicated testing
// bundle so renderer tests can exercise host-free template preparation.
export { TemplateInstance } from './parts';
export { captureRenderHostIdentity } from './render-errors';
export { renderElementNow } from './render';
