/**
 * Conditional imports for testing both source and built distribution versions
 * Set TEST_BUILT=true to test against built distribution
 */

const USE_BUILT = process.env.TEST_BUILT === 'true';

// Dynamic imports based on environment
const modules = USE_BUILT ? {
  main: await import('../dist/testing.esm.js') as any,
  symbols: await import('../dist/testing.esm.js') as any, // All symbols are in testing build
  transitions: await import('../dist/testing.esm.js') as any, // All transitions are in testing build
  types: null, // Types come from main module in built version
  controller: null // Controller functions are in main module in built version
} : {
  main: await import('../src/index.js'),
  symbols: await import('../src/symbols.js'),
  transitions: await import('../src/transitions.js'),
  types: await import('../src/types/index.js'),
  controller: await import('../src/controller.js')
};

// Re-export main APIs that are available in both source and built versions
export const {
  element,
  layout,
  property,
  query,
  queryAll,
  watch,
  context,
  applyElementFunctionality,
  ready,
  dispose,
  moved,
  adopted,
  part,
  Router,
  controller,
  useNativeElementControllers,
  on,
  dispatch,
  observe,
  request,
  respond,
  render,
  html,
  css,
  styles
} = modules.main;

// Handle controller functions that were removed from main exports
export const attachController = USE_BUILT ? modules.main.attachController : modules.controller.attachController;
export const detachController = USE_BUILT ? modules.main.detachController : modules.controller.detachController;
export const getController = USE_BUILT ? modules.main.getController : modules.controller.getController;
export const cleanupNativeElementControllers = USE_BUILT ? modules.main.cleanupNativeElementControllers : modules.controller.cleanupNativeElementControllers;

// Handle internal APIs differently for source vs built
const internalApis = USE_BUILT ? {
  // In built version, everything is in the main module
  registerControllerCleanup: modules.main.registerControllerCleanup,
  getControllerScope: modules.main.getControllerScope,
  parseAttributeValue: modules.main.parseAttributeValue,
  detectType: modules.main.detectType
} : {
  // In source version, internal APIs come from separate modules
  registerControllerCleanup: modules.controller.registerControllerCleanup,
  getControllerScope: modules.controller.getControllerScope,
  parseAttributeValue: (await import('../src/utils.js')).parseAttributeValue,
  detectType: (await import('../src/utils.js')).detectType
};

export const registerControllerCleanup = internalApis.registerControllerCleanup;
export const getControllerScope = internalApis.getControllerScope;
export const parseAttributeValue = internalApis.parseAttributeValue;
export const detectType = internalApis.detectType;

// SimpleArray needs special handling
export const SimpleArray = USE_BUILT ? modules.main.SimpleArray : modules.types!.SimpleArray;

// Export symbols (all available in full build)
export const {
  IS_CONTROLLER_INSTANCE,
  getSymbol,
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
  MOVED_HANDLERS,
  ADOPTED_HANDLERS,
  PARTS,
  PART_TIMERS,
  ROUTER_CONTEXT,
  CONTEXT_REQUEST_HANDLER,
  PAGE_TRANSITION,
  CREATED_AT,
  IS_ELEMENT_CLASS,
  IS_CONTROLLER_CLASS,
  NATIVE_CONTROLLER,
  CLEANUP,
  ON_HANDLERS,
  DISPATCH_TIMERS,
  CHANNEL_HANDLERS,
  OBSERVERS
} = USE_BUILT ? modules.main : modules.symbols;

// Export transitions
export const {
  fadeTransition,
  slideTransition,
  slideRightTransition,
  slideUpTransition,
  slideDownTransition,
  scaleTransition,
  rotateTransition,
  flipTransition,
  zoomTransition,
  noneTransition,
  performTransition
} = modules.transitions;

// Export types (these work the same way for both built and source)
export type {
  QueryOptions,
  PropertyOptions,
  PropertyConverter,
  SniceElement,
  PartOptions,
  RouterOptions,
  PageOptions,
  Guard,
  RouteParams,
  RouterInstance,
  OnOptions,
  DispatchOptions,
  IController,
  ControllerClass,
  Transition,
  ObserveOptions,
  RequestOptions,
  RespondOptions,
  SniceGlobal
} from '../src/types/index.js';

console.log(`🧪 Testing against: ${USE_BUILT ? 'built distribution files' : 'source files'}`);