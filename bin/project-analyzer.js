/**
 * Snice-aware static checks for generated application source.
 *
 * This intentionally uses a small lexical rule engine instead of a TypeScript
 * parser so the published CLI can run it without adding a runtime dependency.
 * Rules should only report patterns that are unambiguous enough to survive
 * that constraint. Model-specific failures belong in regression fixtures,
 * then in a focused rule once the pattern can be detected without guesswork.
 */

import { ANALYZER_CONTRACTS } from './analyzer-contracts.js';

export const PROJECT_ANALYZER_SCHEMA_VERSION = 1;

const COMPONENT_CONTRACTS = ANALYZER_CONTRACTS.components;
const REACT_WRAPPERS = ANALYZER_CONTRACTS.react.wrappers;
const ROOT_EXPORTS = new Set(ANALYZER_CONTRACTS.rootExports);
const REACT_EXPORTS = new Set(ANALYZER_CONTRACTS.react.exports);
const REACT_TYPE_EXPORTS = new Set(ANALYZER_CONTRACTS.react.typeExports ?? []);
const REACT_MODULE_PATHS = new Set(ANALYZER_CONTRACTS.react.modulePaths ?? []);
const COMPONENT_MODULE_PATHS = new Set(ANALYZER_CONTRACTS.componentModulePaths);
const COMPONENT_UTILITY_MODULE_PATHS = new Set(ANALYZER_CONTRACTS.componentUtilityModulePaths ?? []);
const COMPONENT_TYPE_MODULE_PATHS = new Set(ANALYZER_CONTRACTS.componentTypeModulePaths);
const COMPONENT_RECOMMENDATIONS = Object.freeze({
  modal: componentRecommendation('modal'),
  table: componentRecommendation('table'),
  toast: componentRecommendation('toast', {
    tag: 'snice-toast-container',
    importPath: 'snice/components/toast/snice-toast-container'
  }),
  'notification-center': componentRecommendation('notification-center'),
  input: componentRecommendation('input'),
  textarea: componentRecommendation('textarea'),
  select: componentRecommendation('select'),
  checkbox: componentRecommendation('checkbox'),
  radio: componentRecommendation('radio'),
  tabs: componentRecommendation('tabs'),
  pagination: componentRecommendation('pagination')
});

const LEGACY_LIT_LIFECYCLE = new Set([
  'firstUpdated',
  'updated',
  'willUpdate',
  'update',
  'requestUpdate',
  'performUpdate'
]);

const SNICE_REACT_EVENT_PROPS = new Set([
  'onInputChange', 'onSelectChange', 'onTextareaChange', 'onCheckboxChange',
  'onRadioChange', 'onSliderChange', 'onDateChange', 'onTimeChange',
  'onDateRangeChange', 'onDateTimeChange', 'onColorChange', 'onAudioRecorderChange',
  'onStepInputChange', 'onModalClose', 'onCloseToast'
]);

/**
 * Global HTML attributes and React-specific props inherited through
 * SniceBaseProps (React.HTMLAttributes<HTMLElement>). Deliberately excludes
 * element-specific attributes (form, value, href, placeholder, ...): those
 * are only valid when the generated wrapper contract declares them.
 */
const NATIVE_REACT_PROPS = new Set([
  'about', 'accessKey', 'autoCapitalize', 'autoCorrect', 'autoSave', 'className',
  'color', 'contentEditable', 'contextMenu', 'datatype', 'dir', 'draggable',
  'hidden', 'id', 'inert', 'inputMode', 'is', 'itemID', 'itemProp', 'itemRef',
  'itemScope', 'itemType', 'lang', 'nonce', 'prefix', 'property', 'radioGroup',
  'rel', 'resource', 'results', 'rev', 'role', 'security', 'slot', 'spellCheck',
  'style', 'suppressContentEditableWarning', 'suppressHydrationWarning',
  'tabIndex', 'title', 'translate', 'typeof', 'unselectable', 'vocab'
]);

/** Native React synthetic-event handler props available on any DOM element. */
const NATIVE_REACT_EVENT_PROPS = new Set([
  'onAnimationEnd', 'onAnimationIteration', 'onAnimationStart', 'onAuxClick',
  'onBeforeInput', 'onBlur', 'onCanPlay', 'onCanPlayThrough', 'onChange',
  'onClick', 'onCompositionEnd', 'onCompositionStart', 'onCompositionUpdate',
  'onContextMenu', 'onCopy', 'onCut', 'onDblClick', 'onDoubleClick', 'onDrag',
  'onDragEnd', 'onDragEnter', 'onDragExit', 'onDragLeave', 'onDragOver',
  'onDragStart', 'onDrop', 'onDurationChange', 'onEmptied', 'onEncrypted',
  'onEnded', 'onError', 'onFocus', 'onGotPointerCapture', 'onInput', 'onInvalid',
  'onKeyDown', 'onKeyPress', 'onKeyUp', 'onLoad', 'onLoadedData',
  'onLoadedMetadata', 'onLoadStart', 'onLostPointerCapture', 'onMouseDown',
  'onMouseEnter', 'onMouseLeave', 'onMouseMove', 'onMouseOut', 'onMouseOver',
  'onMouseUp', 'onPaste', 'onPause', 'onPlay', 'onPlaying', 'onPointerCancel',
  'onPointerDown', 'onPointerEnter', 'onPointerLeave', 'onPointerMove',
  'onPointerOut', 'onPointerOver', 'onPointerUp', 'onProgress', 'onRateChange',
  'onReset', 'onScroll', 'onSeeked', 'onSeeking', 'onSelect', 'onStalled',
  'onSubmit', 'onSuspend', 'onTimeUpdate', 'onTouchCancel', 'onTouchEnd',
  'onTouchMove', 'onTouchStart', 'onTransitionEnd', 'onVolumeChange',
  'onWaiting', 'onWheel'
]);

/**
 * Authored props already owned by a targeted diagnostic inside
 * snice/react-prop-contract. The general unsupported-prop check skips these
 * so one authored attribute never produces two errors.
 */
const TARGETED_WRAPPER_PROPS = {
  Table: new Set(['rows']),
  Input: new Set(['onChange']),
  Select: new Set(['onChange']),
  Tabs: new Set(['value']),
  Modal: new Set(['title', 'onClose']),
  Toast: new Set(['variant', 'open', 'duration', 'onClose']),
  Badge: new Set(['tone']),
  Nav: new Set(['items'])
};

const RECOMMENDATION_RULES = [
  recommendationRule({
    id: 'snice/recommend-modal',
    component: 'modal',
    message: 'A native dialog is being used where Snice can provide focus trapping, backdrop dismissal, and accessible modal behavior.',
    test: source => detectModalImplementation(source)
  }),
  recommendationRule({
    id: 'snice/recommend-table',
    component: 'table',
    message: 'A native table is present; snice-table can provide sorting, filtering, selection, pagination, virtualization, and rich cells.',
    test: source => findPattern(source, /<table\b/)
  }),
  recommendationRule({
    id: 'snice/recommend-toast',
    component: 'toast',
    message: 'Custom transient-notification UI is present; use Snice toast behavior instead of maintaining another toast implementation.',
    test: source => findFirstPattern(source, [
      /\b(?:show|create|display)Toast\s*\(/,
      /class(?:Name)?\s*=\s*["'][^"']*\btoast(?:s|--?[\w-]+)?\b/i,
      /classList\.(?:add|toggle)\(\s*["'][^"']*\btoast\b/i
    ])
  }),
  recommendationRule({
    id: 'snice/recommend-notification-center',
    component: 'notification-center',
    message: 'Notification-center behavior is present; Snice already provides unread state, dismiss, and mark-as-read behavior.',
    test: source => findFirstPattern(source, [
      /class(?:Name)?\s*=\s*["'][^"']*\bnotification-center\b/i,
      /\bunreadCount\b[\s\S]{0,240}\bmarkAllAsRead\b/,
      /\bmarkAllAsRead\b[\s\S]{0,240}\bunreadCount\b/
    ])
  }),
  recommendationRule({
    id: 'snice/recommend-checkbox',
    component: 'checkbox',
    message: 'A native checkbox can use snice-checkbox for form association, validation, reset, and consistent Snice presentation.',
    test: source => findPattern(source, /<input\b[^>]*\btype\s*=\s*["']checkbox["']/)
  }),
  recommendationRule({
    id: 'snice/recommend-radio',
    component: 'radio',
    message: 'A native radio can use snice-radio for grouped form behavior, validation, reset, and consistent Snice presentation.',
    test: source => findPattern(source, /<input\b[^>]*\btype\s*=\s*["']radio["']/)
  }),
  recommendationRule({
    id: 'snice/recommend-input',
    component: 'input',
    message: 'A native text-like input can use snice-input for form association, validation, labels, and consistent Snice presentation.',
    test(source) {
      const expression = /<input\b(?![^>]*\btype\s*=\s*["'](?:checkbox|radio|file|hidden|button|submit|reset|image)["'])[^>]*>/;
      return findPattern(source, expression);
    }
  }),
  recommendationRule({
    id: 'snice/recommend-textarea',
    component: 'textarea',
    message: 'A native textarea can use snice-textarea for form association, validation, labels, auto-grow, and character-count behavior.',
    test: source => findPattern(source, /<textarea\b/)
  }),
  recommendationRule({
    id: 'snice/recommend-select',
    component: 'select',
    message: 'A native select can use snice-select for searchable options, form association, validation, and consistent Snice presentation.',
    test: source => findPattern(source, /<select\b/)
  }),
  recommendationRule({
    id: 'snice/recommend-tabs',
    component: 'tabs',
    message: 'A hand-built tab interface is present; snice-tabs provides selection, keyboard navigation, disabled tabs, and panels.',
    test: source => findFirstPattern(source, [
      /\brole\s*=\s*["']tablist["']/i,
      /class(?:Name)?\s*=\s*["'][^"']*\btabs?(?:--?[\w-]+)?\b/i
    ])
  }),
  recommendationRule({
    id: 'snice/recommend-pagination',
    component: 'pagination',
    message: 'Pagination UI is present; snice-pagination provides page ranges, boundary controls, events, and accessible navigation.',
    test: source => findFirstPattern(source, [
      /\baria-label\s*=\s*["']pagination["']/i,
      /class(?:Name)?\s*=\s*["'][^"']*\bpagination\b/i,
      /\bcurrentPage\b[\s\S]{0,200}\btotalPages\b[\s\S]{0,200}\bnextPage\b/,
      /\bnextPage\b[\s\S]{0,200}\bcurrentPage\b[\s\S]{0,200}\btotalPages\b/
    ])
  })
];

const RULE_DEFINITIONS = [
  {
    id: 'snice/non-source-content',
    severity: 'error',
    category: 'source',
    description: 'Reject chat-transcript labels and Markdown code fences saved as a JavaScript or TypeScript source file.',
    standalone: true,
    check() {}
  },
  {
    id: 'snice/no-lit-api',
    severity: 'error',
    category: 'framework',
    description: 'Reject Lit imports, base classes, decorators, directives, and lifecycle APIs.',
    check(context) {
      const litImport = findImports(context.source).find(entry =>
        entry.path === 'lit' || entry.path.startsWith('lit/')
      );
      const index = litImport?.index ?? findFirstPattern(context.source, [
        /\bextends\s+LitElement\b/,
        /^\s*@customElement\s*\(/m
      ]);
      if (index >= 0) {
        context.report(index, {
          message: 'Lit APIs were found, but Snice is not Lit.',
          fix: "Use HTMLElement or SniceElement with @element(), Snice decorators, and html/css imported from 'snice'."
        });
      }
    }
  },
  {
    id: 'snice/element-decorator-usage',
    severity: 'error',
    category: 'framework',
    description: 'Reject element() used as a factory function; it only works as a class decorator.',
    check(context) {
      for (const binding of context.provenance.rootBindings.get('element') ?? []) {
        const pattern = new RegExp(`\\b${escapeRegExp(binding.local)}\\s*\\(\\s*['"]`, 'g');
        for (const match of context.source.matchAll(pattern)) {
          const before = context.source[match.index - 1] ?? '';
          // '@element(' is the decorator form; '.element(' is a method call.
          if (before === '@' || before === '.' || /[\w$]/.test(before)) continue;
          context.report(match.index, {
            message: `${binding.local}() returns a class decorator; calling it as a factory does not define a custom element.`,
            fix: `Use @${binding.local}('snice-tag') directly above a class that extends HTMLElement (or SniceElement). Review docs/ai/decorators.md.`
          });
        }
      }
    }
  },
  {
    id: 'snice/element-base-class',
    severity: 'error',
    category: 'framework',
    description: 'Require @element/@layout classes to extend HTMLElement (or a Snice element subclass).',
    check(context) {
      const pattern = /@(?:element|layout)\s*\(\s*['"][^'"]+['"](?:\s*,[\s\S]*?)?\)\s*(?:export\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)\s*([^{]*)\{/g;
      for (const match of context.source.matchAll(pattern)) {
        if (/\bextends\b/.test(match[2])) continue;
        context.report(match.index, {
          message: `@element-decorated class ${match[1]} does not extend a base element class.`,
          fix: 'Extend HTMLElement (or SniceElement, or another Snice element); Snice registers and renders only element subclasses. Review docs/ai/decorators.md.'
        });
      }
    }
  },
  {
    id: 'snice/stage-3-decorators',
    severity: 'error',
    category: 'configuration',
    description: 'Require the TC39 stage 3 decorator configuration used by Snice.',
    check(context) {
      const index = context.source.search(/\bexperimentalDecorators\s*["']?\s*:\s*true\b/);
      if (index >= 0) {
        context.report(index, {
          message: 'Legacy TypeScript decorators are enabled; Snice uses TC39 stage 3 decorators.',
          fix: 'Set compilerOptions.experimentalDecorators to false and compilerOptions.useDefineForClassFields to false.'
        });
      }
    }
  },
  {
    id: 'snice/no-nonexistent-lifecycle-super',
    severity: 'error',
    category: 'lifecycle',
    description: 'Reject superclass lifecycle calls that do not exist on the selected Snice base class.',
    check(context) {
      for (const match of context.source.matchAll(/\bsuper\.(firstUpdated|updated|willUpdate|update|requestUpdate|performUpdate)\s*\(/g)) {
        if (!LEGACY_LIT_LIFECYCLE.has(match[1])) continue;
        context.report(match.index, {
          message: `super.${match[1]}() is a Lit lifecycle call and does not exist on Snice element bases.`,
          fix: 'Use @ready(), @watch(), @dispose(), @reconnect(), or SniceElement.invalidate()/renderNow() as appropriate.'
        });
      }

      for (const classInfo of findClassBodies(context.source)) {
        if (classInfo.base !== 'HTMLElement') continue;
        for (const match of classInfo.body.matchAll(/\bsuper\.(connectedCallback|disconnectedCallback|adoptedCallback)\s*\(/g)) {
          context.report(classInfo.bodyStart + match.index, {
            message: `HTMLElement does not define super.${match[1]}().`,
            fix: lifecycleFix(match[1])
          });
        }
      }
    }
  },
  {
    id: 'snice/no-inner-html',
    severity: 'warning',
    category: 'rendering',
    description: 'Warn when a Snice element bypasses declarative rendering and escaping with innerHTML.',
    check(context) {
      for (const match of context.source.matchAll(/\bthis\.(?:(?:shadowRoot|renderRoot)[!?]?\.)?innerHTML\s*=/g)) {
        context.report(match.index, {
          message: 'Direct innerHTML assignment bypasses Snice rendering and template escaping.',
          fix: 'Return an html template from @render(); use unsafeHTML only for explicitly trusted markup.'
        });
      }
    }
  },
  {
    id: 'snice/escaped-quote-in-attribute',
    severity: 'error',
    category: 'rendering',
    description: 'Reject backslash-escaped HTML attribute quotes inside html templates.',
    check(context) {
      const htmlNames = localsFor(context.provenance.rootBindings, 'html');
      for (const finding of findEscapedHtmlAttributeQuotes(context.source, htmlNames)) {
        context.report(finding.index, {
          message: `HTML attributes do not support backslash-escaped ${finding.quote} quotes; the quote closes the attribute before the next template expression.`,
          fix: 'Bind the complete value as a property/attribute expression, use the other quote style where possible, or encode a literal quote as &quot; / &#39;.'
        });
      }
    }
  },
  {
    id: 'snice/imperative-reseed-instead-of-live',
    severity: 'suggestion',
    category: 'rendering',
    description: 'Recommend live property bindings over imperative writes through @query references.',
    check(context) {
      for (const declaration of findSniceElementClasses(context.source)) {
        if (!/@render\b/.test(declaration.body)) continue;
        for (const query of declaration.body.matchAll(/@query\s*\([^)]*\)\s*(?:(?:public|private|protected|readonly|declare)\s+)*([A-Za-z_$][\w$]*)/g)) {
          const referencePattern = new RegExp(`\\bthis\\.${escapeRegExp(query[1])}\\b`, 'g');
          const references = [...declaration.body.matchAll(referencePattern)];
          const writes = references.map(reference => {
            const suffix = declaration.body.slice(reference.index + reference[0].length);
            const propertyWrite = /^\s*\.(value|start|end)\s*=(?!=|>)/.exec(suffix);
            return propertyWrite ? { reference, property: propertyWrite[1] } : null;
          });
          if (!writes.length || writes.some(write => write === null)) continue;
          const firstWrite = writes[0];
          context.report(declaration.bodyStart + firstWrite.reference.index, {
            message: `${query[1]}.${firstWrite.property} is reseeded imperatively even though this class has a declarative render.`,
            fix: `Bind .${firstWrite.property}=\${live(state)} in the owning template so unchanged state can be reasserted on render. Review docs/ai/bindings.md.`
          });
        }
      }
    }
  },
  {
    id: 'snice/paint-method-smell',
    severity: 'suggestion',
    category: 'rendering',
    description: 'Flag once-only renders paired with imperative repaint mutations.',
    check(context) {
      if (isFrameworkImplementation(context.filename)) return;
      for (const declaration of findSniceElementClasses(context.source)) {
        if (!/@render\s*\(\s*\{[^}]*\bonce\s*:\s*true/.test(declaration.body)) continue;
        const mutation = /\.hidden\s*=|\.textContent\s*=|\.replaceChildren\s*\(/.exec(declaration.body);
        if (!mutation) continue;
        context.report(declaration.bodyStart + mutation.index, {
          message: `${declaration.name} combines @render({ once: true }) with imperative repaint mutations.`,
          fix: 'Use ordinary differential @render() with @property/@state inputs; reserve once:true for genuinely static output.'
        });
      }
    }
  },
  {
    id: 'snice/dom-building-in-element',
    severity: 'suggestion',
    category: 'rendering',
    description: 'Recommend template composition instead of hand-built DOM in declaratively rendered elements.',
    check(context) {
      if (isFrameworkImplementation(context.filename)) return;
      for (const declaration of findSniceElementClasses(context.source)) {
        if (!/@render\b/.test(declaration.body)) continue;
        const mutation = /\bdocument\.createElement\s*\(|\.replaceChildren\s*\(/.exec(declaration.body);
        if (!mutation) continue;
        context.report(declaration.bodyStart + mutation.index, {
          message: `${declaration.name} has @render but also builds or replaces DOM imperatively.`,
          fix: 'Express the nodes in html templates (use map()/repeat() for lists) so lifecycle, bindings, and updates remain declarative.'
        });
      }
    }
  },
  {
    id: 'snice/raf-focus',
    severity: 'suggestion',
    category: 'lifecycle',
    description: 'Recommend native autofocus or readiness promises over timer-based focus.',
    check(context) {
      if (isFrameworkImplementation(context.filename)) return;
      for (const match of context.source.matchAll(/\b(requestAnimationFrame|setTimeout)\s*\([\s\S]{0,240}?\.focus\s*\(/g)) {
        context.report(match.index, {
          message: `${match[1]}(...focus()) is a timing workaround for element readiness.`,
          fix: 'For initial focus, use the native autofocus attribute/property. For imperative focus, await the target\'s ready/rendered promise before calling focus(). Review docs/ai/elements.md.'
        });
      }
    }
  },
  {
    id: 'snice/ambiguous-delegation-selector',
    severity: 'warning',
    category: 'events',
    description: 'Warn when tag-only @on delegation can match multiple instances in one element template.',
    check(context) {
      for (const declaration of findSniceElementClasses(context.source)) {
        for (const handler of declaration.body.matchAll(/@on\s*\(\s*(?:\[[^\]]*\]|['"][^'"]+['"])\s*,\s*['"]([a-z][a-z0-9-]*)['"]/g)) {
          const tagName = handler[1];
          const instances = [...declaration.body.matchAll(new RegExp(`<${escapeRegExp(tagName)}(?=\\s|/?>)`, 'g'))];
          if (instances.length < 2) continue;
          context.report(declaration.bodyStart + handler.index, {
            message: `@on delegates to tag-only selector "${tagName}", but ${declaration.name}'s templates contain ${instances.length} matching instances.`,
            fix: 'Add a role-specific class/data attribute to the intended instance and delegate to that selector, or handle each instance directly in its template.'
          });
        }
      }
    }
  },
  {
    id: 'snice/observe-target',
    severity: 'error',
    category: 'observers',
    description: 'Require documented string targets for @observe.',
    check(context) {
      for (const match of context.source.matchAll(/@observe\s*\(\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/g)) {
        context.report(match.index, {
          message: '@observe() takes a documented string observer target, not a target resolver function.',
          fix: "Use targets such as @observe('resize', '.panel'), @observe('intersection'), or @observe('mutation:childList')."
        });
      }
    }
  },
  {
    id: 'snice/on-handler-argument',
    severity: 'error',
    category: 'events',
    description: 'Reject a handler function as the second @on() argument; it is silently ignored at runtime.',
    check(context) {
      for (const match of context.source.matchAll(/@on\(\s*(?:\[[^\]]*\]|['"][^'"]+['"])\s*,\s*(?:\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>|(?:async\s+)?function\b)/g)) {
        context.report(match.index, {
          message: "The second @on() argument must be a CSS selector string or an options object; a handler function is silently ignored at runtime.",
          fix: "Handle the event in the decorated method; use @on('event', '.selector') for delegation or @on('event', { preventDefault: true }) for options. Review docs/ai/api.md."
        });
      }
    }
  },
  {
    id: 'snice/component-import-path',
    severity: 'error',
    category: 'imports',
    description: 'Require documented deep component imports and reject invented component paths.',
    check(context) {
      for (const entry of findImports(context.source)) {
        const path = entry.path;
        if (!path.startsWith('snice/components/')) continue;
        if (COMPONENT_TYPE_MODULE_PATHS.has(path)) {
          if (isTypeOnlyImport(entry)) continue;
          context.report(entry.index, {
            message: `Component type module "${path}" ships only ambient types; a value or side-effect import resolves to no runtime JavaScript.`,
            fix: `Import types with import type { ... } from '${path}', and register the runtime element with import '${path.slice(0, -'.types'.length)}'.`
          });
          continue;
        }
        if (
          COMPONENT_MODULE_PATHS.has(path) ||
          COMPONENT_UTILITY_MODULE_PATHS.has(path) ||
          ['snice/components/icons', 'snice/components/custom-elements', 'snice/components/theme/theme.css'].includes(path)
        ) continue;

        const segments = path.slice('snice/components/'.length).split('/');
        if (segments.length === 1) {
          const component = segments[0];
          const expected = Object.values(COMPONENT_CONTRACTS)
            .find(contract => contract.family === component && contract.tagName === `snice-${component}`)
            ?.modulePath;
          context.report(entry.index, {
            message: `Component import "${path}" is too shallow to register a custom element.`,
            fix: expected
              ? `Use the documented deep import: import '${expected}'.`
              : 'Use an exact released module path from the generated Snice component contract.'
          });
          continue;
        }

        if (/\.js$/.test(path)) {
          context.report(entry.index, {
            message: `Component import "${path}" includes an extension that is not part of the package export path.`,
            fix: `Remove the .js extension: import '${path.slice(0, -3)}'.`
          });
          continue;
        }

        const moduleName = segments.at(-1);
        const matching = Object.values(COMPONENT_CONTRACTS).find(contract =>
          contract.modulePath.endsWith(`/${moduleName}`)
        );
        context.report(entry.index, {
          message: `Component import "${path}" is not a released Snice component module path.`,
          fix: matching
            ? `Use import '${matching.modulePath}'.`
            : 'Choose an exact path from the generated component contract or the component documentation.'
        });
      }
    }
  },
  {
    id: 'snice/controller-type-import',
    severity: 'warning',
    category: 'imports',
    description: 'Avoid loading component implementations when a controller only needs their types.',
    check(context) {
      if (!/@controller\s*\(/.test(context.source) && !/\bclass\s+\w+Controller\b/.test(context.source)) return;
      for (const entry of findImports(context.source)) {
        if (
          entry.typeOnly ||
          !entry.clause ||
          !COMPONENT_MODULE_PATHS.has(entry.path)
        ) continue;
        context.report(entry.index, {
          message: `A controller value-imports the component implementation "${entry.path}".`,
          fix: 'When the symbol is only used as a type, use an import type from the component .types module; keep registrations in the application entry point.'
        });
      }
    }
  },
  {
    id: 'snice/router-page-source',
    severity: 'error',
    category: 'router',
    description: 'Require page decorators to come from the application Router instance.',
    check(context) {
      for (const entry of findImports(context.source)) {
        if (entry.path === 'snice' && entry.clause && /(?:^|[,{]\s*)page(?:\s+as\s+\w+)?(?:\s*[,}])/.test(entry.clause)) {
          context.report(entry.index, {
            message: "The page decorator is returned by Router(); it is not exported from 'snice'.",
            fix: "Export { page } from the application's router module and import it from that local module."
          });
        }
      }
    }
  },
  {
    id: 'snice/router-config',
    severity: 'error',
    category: 'router',
    description: 'Validate the required Router target and navigation type options.',
    check(context) {
      for (const localName of localsFor(context.provenance.rootBindings, 'Router')) {
        for (const call of findObjectCalls(context.source, localName)) {
          if (!/\btype\s*:\s*['"](?:hash|pushstate)['"]/.test(call.body)) {
            context.report(call.index, {
              message: "Router() requires type: 'hash' or type: 'pushstate'.",
              fix: "Add type: 'hash' or type: 'pushstate' to the Router options."
            });
          }
          if (!/\b(?:target|outlet)\b\s*(?=[:,}])/.test(call.body)) {
            context.report(call.index, {
              message: 'Router() requires a target selector for the page outlet.',
              fix: "Add target: '#app' and ensure that element exists before initialize() runs."
            });
          }
          const outletIndex = call.body.search(/\boutlet\s*:/);
          if (outletIndex >= 0 && !/\btarget\s*:/.test(call.body)) {
            context.report(call.bodyStart + outletIndex, {
              message: 'Router() uses the target option, not outlet.',
              fix: "Replace outlet with target, for example target: '#app'."
            });
          }
        }
      }
    }
  },
  {
    id: 'snice/context-contract',
    severity: 'error',
    category: 'router',
    description: 'Validate Context typing, Router return values, and @context method usage.',
    check(context) {
      for (const localName of localsFor(context.provenance.rootBindings, 'Context')) {
        const expression = new RegExp(`\\b${escapeRegExp(localName)}\\s*<`, 'g');
        for (const match of context.source.matchAll(expression)) {
          context.report(match.index, {
            message: 'Snice Context is not generic.',
            fix: 'Extend AppContext for application state and read it from context.application.'
          });
        }
      }

      for (const routerName of localsFor(context.provenance.rootBindings, 'Router')) {
        const expression = new RegExp(`\\{([^}]*)\\}\\s*=\\s*${escapeRegExp(routerName)}\\s*\\(`, 'g');
        for (const match of context.source.matchAll(expression)) {
          if (/(?:^|,)\s*(?:Context|context|ctx)\s*(?:,|$)/.test(match[1])) {
            context.report(match.index, {
              message: 'Router() returns page, navigate, and initialize; it does not return Context.',
              fix: 'Receive Context in a decorated method: @context() handleContext(ctx: Context) { ... }.'
            });
          }
        }
      }

      for (const contextName of localsFor(context.provenance.rootBindings, 'context')) {
        const expression = new RegExp(`@${escapeRegExp(contextName)}\\s*\\([^)]*\\)\\s*(?:public\\s+|private\\s+|protected\\s+)?(?:readonly\\s+)?[#\\w$]+\\s*(?:[!:?]\\s*[^=;\\n]+)?[=;]`, 'g');
        for (const match of context.source.matchAll(expression)) {
          context.report(match.index, {
            message: '@context() decorates a method that receives Context updates; it is not a field injection decorator.',
            fix: '@context() handleContext(ctx: Context) { this.application = ctx.application as MyAppContext; }'
          });
        }
      }
    }
  },
  {
    id: 'snice/object-property-binding',
    severity: 'error',
    category: 'rendering',
    description: 'Require property bindings for object and array values.',
    check(context) {
      for (const opening of findOpeningTags(context.source, Object.keys(COMPONENT_CONTRACTS))) {
        const contract = COMPONENT_CONTRACTS[opening.name];
        const properties = new Set(contract.structuredProperties);
        const bindingPattern = /(?:^|\s)([a-z][\w-]*)\s*=\s*(?:["'])?\$\{/gi;
        for (const binding of opening.text.matchAll(bindingPattern)) {
          const authoredName = binding[1];
          const property = contract.attributes[authoredName]?.property ?? kebabToCamel(authoredName);
          if (!properties.has(property)) continue;
          context.report(opening.index + binding.index + binding[0].indexOf(authoredName), {
            message: `${opening.name}.${property} carries structured data and cannot be passed through a string attribute.`,
            fix: `Use a property binding: .${property}=\${value}.`
          });
        }
      }

      for (const match of context.source.matchAll(/(?:^|\s)([a-z][\w-]*)\s*=\s*(?:["'])?\$\{\s*(?:\[|\{)/g)) {
        const before = context.source.slice(Math.max(0, match.index - 2), match.index + match[0].indexOf(match[1]));
        if (before.endsWith('.')) continue;
        context.report(match.index + match[0].indexOf(match[1]), {
          message: `The ${match[1]} binding passes an object or array through the string-attribute channel.`,
          fix: `Use .${kebabToCamel(match[1])}=\${value} to preserve the value's type and identity.`
        });
      }
    }
  },
  {
    id: 'snice/custom-event-contract',
    severity: 'error',
    category: 'events',
    description: 'Catch CustomEvent detail and component event-name assumptions.',
    check(context) {
      for (const match of context.source.matchAll(/\b([A-Za-z_$][\w$]*)\s*:\s*Event\b[\s\S]{0,240}?\b\1\.detail\b/g)) {
        context.report(match.index, {
          message: `The handler reads ${match[1]}.detail but types the event as Event.`,
          fix: `Type ${match[1]} as CustomEvent or CustomEvent<Payload>.`
        });
      }

      const listenerPattern = /\b([A-Za-z_$][\w$]*)\.addEventListener\s*\(\s*['"]([^'"]+)['"]\s*,\s*\(?\s*([A-Za-z_$][\w$]*)[\s\S]{0,180}?\b\3\.(?:target|currentTarget)\.value\b/g;
      for (const match of context.source.matchAll(listenerPattern)) {
        const tagName = context.provenance.componentVariables.get(match[1]);
        const contract = tagName ? COMPONENT_CONTRACTS[tagName] : null;
        if (!contract?.events.some(event => event.name === match[2])) continue;
        context.report(match.index, {
          message: `The "${match[2]}" custom event payload is not read from event.target.value.`,
          fix: 'Read the documented payload from event.detail (for example, event.detail.value).'
        });
      }

      const decoratedPattern = /@on\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"](snice-[^'"]+)['"][^)]*\)\s*[\w$]+\s*\(\s*([A-Za-z_$][\w$]*)[^)]*\)\s*\{[\s\S]{0,240}?\b\3\.(?:target|currentTarget)\.value\b/g;
      for (const match of context.source.matchAll(decoratedPattern)) {
        if (!COMPONENT_CONTRACTS[match[2]]?.events.some(event => event.name === match[1])) continue;
        context.report(match.index, {
          message: `The "${match[1]}" custom event payload is not read from event.target.value.`,
          fix: 'Read the documented payload from event.detail (for example, event.detail.value).'
        });
      }

      const wrongEvents = [
        ['snice-input', 'input', 'input-input'],
        ['snice-input', 'change', 'input-change'],
        ['snice-textarea', 'input', 'textarea-input'],
        ['snice-textarea', 'change', 'textarea-change'],
        ['snice-select', 'change', 'select-change']
      ];
      for (const [tag, actual, expected] of wrongEvents) {
        const expression = new RegExp(`<${tag}\\b[^>]*@${actual}\\s*=`, 'gi');
        for (const match of context.source.matchAll(expression)) {
          context.report(match.index + match[0].lastIndexOf(`@${actual}`), {
            message: `<${tag}> documents "${expected}", not a host "${actual}" template event.`,
            fix: `Listen with @${expected}=\${handler} and read its documented event.detail payload.`
          });
        }
      }

      for (const match of context.source.matchAll(/@dispatch\s*\(\s*['"][^'"]+['"][^)]*\)\s*[\w$]+\s*\([^)]*\)\s*\{[\s\S]{0,180}?\breturn\s*\{\s*detail\s*:/g)) {
        context.report(match.index, {
          message: '@dispatch() uses the method return value as CustomEvent.detail; returning { detail: ... } adds an unintended extra wrapper.',
          fix: 'Return the payload directly from the decorated method.'
        });
      }
    }
  },
  {
    id: 'snice/event-kebab-case',
    severity: 'warning',
    category: 'events',
    description: 'Require kebab-case for dispatched multiword events.',
    check(context) {
      for (const match of context.source.matchAll(/@dispatch\s*\(\s*['"]([^'"]+)['"]/g)) {
        if (!/[A-Z]/.test(match[1])) continue;
        context.report(match.index, {
          message: `Dispatched event "${match[1]}" uses camelCase.`,
          fix: `Use kebab-case: "${camelToKebab(match[1])}".`
        });
      }
    }
  },
  {
    id: 'snice/icon-contract',
    severity: 'warning',
    category: 'components',
    description: 'Reject invented icon elements and icon-name resolvers.',
    check(context) {
      let index = findPattern(context.source, /<snice-icon\b/i);
      if (index < 0) index = findPattern(context.source, /['"]snice\/components\/icon(?:\/[^'"]*)?['"]/);
      if (index >= 0) {
        context.report(index, {
          message: 'Snice does not provide a <snice-icon> component or a singular components/icon module.',
          fix: "Use a component's named icon slot/property, or import documented glyph constants from 'snice/components/icons'.",
          recommendation: Object.freeze({
            component: 'icons',
            tag: null,
            import: "import { CHECK_CIRCLE_SOLID, X_MARK } from 'snice/components/icons';",
            docsPath: 'docs/ai/components/icons.md'
          })
        });
      }

      const namePattern = /\bicon\s*=\s*["'](home|search|close|menu|settings|user|edit|delete|check|warning|success|error|chevron-(?:up|down|left|right))["']/gi;
      const openings = [
        ...findOpeningTags(context.source, Object.keys(COMPONENT_CONTRACTS))
          .filter(opening => COMPONENT_CONTRACTS[opening.name].properties.icon),
        ...reactWrapperOpenings(context, wrapper =>
          Boolean(COMPONENT_CONTRACTS[wrapper.tagName]?.properties.icon)
        )
      ];
      for (const opening of openings) {
        for (const match of opening.text.matchAll(namePattern)) {
          context.report(opening.index + match.index, {
            message: `icon="${match[1]}" is treated as plain text/URL content; Snice does not resolve arbitrary icon names.`,
            fix: "Slot an SVG/icon-library element, pass an emoji or URL, or import a documented glyph from 'snice/components/icons'.",
            recommendation: Object.freeze({
              component: 'icons',
              tag: null,
              import: "import { CHECK_CIRCLE_SOLID, X_MARK } from 'snice/components/icons';",
              docsPath: 'docs/ai/components/icons.md'
            })
          });
        }
      }
    }
  },
  {
    id: 'snice/hallucinated-react-package',
    severity: 'error',
    category: 'imports',
    description: 'Reject the hallucinated snice-react package; direct to snice/react.',
    check(context) {
      for (const entry of findImports(context.source)) {
        if (entry.path !== 'snice-react' && !entry.path.startsWith('snice-react/')) continue;
        context.report(entry.index, {
          message: `The module "${entry.path}" does not exist; Snice exports React adapters from 'snice/react'.`,
          fix: "Import React wrapper components from 'snice/react' instead."
        });
      }
      const blanked = blankStringContents(maskComments(context.source));
      for (const match of blanked.matchAll(/\brequire\s*\(\s*(?=['"])/g)) {
        const moduleName = extractStringLiteral(context.source, match.index + match[0].length);
        if (moduleName && (moduleName === 'snice-react' || moduleName.startsWith('snice-react/'))) {
          context.report(match.index, {
            message: `The module "${moduleName}" does not exist; Snice exports React adapters from 'snice/react'.`,
            fix: "Import React wrapper components from 'snice/react' instead."
          });
        }
      }
      for (const match of blanked.matchAll(/\bimport\s*\(\s*(?=['"])/g)) {
        const moduleName = extractStringLiteral(context.source, match.index + match[0].length);
        if (moduleName && (moduleName === 'snice-react' || moduleName.startsWith('snice-react/'))) {
          context.report(match.index, {
            message: `The module "${moduleName}" does not exist; Snice exports React adapters from 'snice/react'.`,
            fix: "Import React wrapper components from 'snice/react' instead."
          });
        }
      }
    }
  },
  {
    id: 'snice/react-create-element',
    severity: 'error',
    category: 'react',
    description: 'Require the React wrapper for released snice-* components instead of React.createElement.',
    check(context) {
      const reactImports = new Map();
      for (const entry of findImports(context.source)) {
        if (entry.path !== 'react') continue;
        if (entry.clause === null) continue;
        const defaultMatch = entry.clause.trim().match(/^([\w$]+)(?:\s*,)?/);
        if (defaultMatch) {
          reactImports.set(defaultMatch[1], { type: 'default' });
        }
        const namespaceMatch = entry.clause.trim().match(/^\*\s+as\s+([\w$]+)/);
        if (namespaceMatch) {
          reactImports.set(namespaceMatch[1], { type: 'namespace' });
        }
        for (const binding of parseNamedImportEntries(entry.clause)) {
          if (binding.imported === 'createElement') {
            reactImports.set(binding.local, { type: 'named' });
          }
        }
      }
      for (const [varName, reactInfo] of reactImports) {
        const createElementPattern = reactInfo.type === 'namespace' || reactInfo.type === 'default'
          ? new RegExp(`\\b${escapeRegExp(varName)}\\.createElement\\s*\\(\\s*['"]([a-z][a-z0-9-]*)['"]`, 'g')
          : new RegExp(`\\b${escapeRegExp(varName)}\\s*\\(\\s*['"]([a-z][a-z0-9-]*)['"]`, 'g');
        for (const match of context.source.matchAll(createElementPattern)) {
          const tagName = match[1].toLowerCase();
          if (!tagName.startsWith('snice-')) continue;
          const component = COMPONENT_CONTRACTS[tagName];
          if (!component) continue;
          const wrapper = Object.values(REACT_WRAPPERS).find(w => w.tagName === tagName);
          if (!wrapper) continue;
          context.report(match.index, {
            message: `React.createElement('${tagName}') bypasses the Snice React wrapper validation.`,
            fix: `Import { ${wrapper.exportName} } from 'snice/react' and use <${wrapper.exportName}> instead of React.createElement('${tagName}').`
          });
        }
      }
    }
  },
  {
    id: 'snice/react-type-export-as-component',
    severity: 'error',
    category: 'react',
    description: 'Reject type-only snice/react exports (Placard, Props interfaces, ref types) used as JSX components.',
    check(context) {
      for (const binding of context.provenance.reactBindings) {
        if (!binding.normalizedExport || !REACT_TYPE_EXPORTS.has(binding.normalizedExport)) continue;
        for (const opening of findOpeningTags(context.source, [binding.local])) {
          if (isTypeArgumentUsage(context.source, opening)) continue;
          context.report(opening.index, {
            message: `${binding.normalizedExport} is a type-only export from 'snice/react' and cannot be used as a JSX component.`,
            fix: `Import it with import type { ${binding.normalizedExport} } from 'snice/react' and use it only in type positions; render a documented component wrapper instead. Review docs/ai/react-integration.md.`
          });
        }
      }
    }
  },
  {
    id: 'snice/package-path',
    severity: 'error',
    category: 'imports',
    description: 'Reject invented deep snice/* module paths outside the released package export surface.',
    check(context) {
      for (const entry of findImports(context.source)) {
        const path = entry.path;
        if (!path.startsWith('snice/') || path.startsWith('snice/components/')) continue;
        if (path === 'snice/symbols' || path === 'snice/transitions') continue;
        if (REACT_MODULE_PATHS.has(path)) continue;
        context.report(entry.index, {
          message: `The module "${path}" is not a released Snice package path.`,
          fix: "Use an exact package export: 'snice', 'snice/symbols', 'snice/transitions', 'snice/react' or a documented snice/react/<module> deep import, or a snice/components/<name>/<module> path."
        });
      }
    }
  },
  {
    id: 'snice/package-import',
    severity: 'error',
    category: 'imports',
    description: 'Reject invented scoped @snice/* module packages.',
    check(context) {
      for (const entry of findImports(context.source)) {
        if (!entry.path.startsWith('@snice/')) continue;
        context.report(entry.index, {
          message: `The module "${entry.path}" is invented; Snice does not publish @snice/* packages.`,
          fix: "Import framework APIs from 'snice', React APIs from 'snice/react', and custom elements from their documented snice/components/<name>/snice-<name> path."
        });
      }
    }
  },
  {
    id: 'snice/root-api-contract',
    severity: 'error',
    category: 'imports',
    description: 'Validate named imports against generated Snice package-root exports.',
    check(context) {
      for (const entry of findImports(context.source)) {
        if (entry.path !== 'snice') continue;
        const invented = parseNamedImportEntries(entry.clause)
          .map(binding => binding.imported)
          .filter(name => name !== 'page' && !ROOT_EXPORTS.has(name));
        if (!invented.length) continue;
        const knownModelInventions = invented.some(name =>
          ['Component', 'ComponentMethod', 'ComponentEvent'].includes(name)
        );
        context.report(entry.index, {
          message: `The Snice package root does not export ${invented.join(', ')}.`,
          fix: knownModelInventions
            ? "Use @element() for custom elements, @render()/@styles() for view methods, and @dispatch()/@on() or template event bindings for component events."
            : "Use an exact generated root export, a documented deep component import, or 'snice/react' for React wrappers."
        });
      }
    }
  },
  {
    id: 'snice/react-import-contract',
    severity: 'error',
    category: 'react',
    description: 'Validate named imports against generated Snice React exports.',
    check(context) {
      for (const entry of findImports(context.source)) {
        if (!['@snice/react', 'snice/react'].includes(entry.path)) continue;
        const corrections = [];
        for (const { imported } of parseNamedImportEntries(entry.clause)) {
          if (REACT_EXPORTS.has(imported)) continue;
          const replacement = reactExportReplacement(imported);
          if (replacement) corrections.push(`${imported} → ${replacement}`);
          else corrections.push(`${imported} is not exported`);
        }

        if (!corrections.length) continue;
        context.report(entry.index, {
          message: `Invented Snice React import contract: ${corrections.join('; ')}.`,
          fix: "Import router APIs and unprefixed component wrappers from 'snice/react'."
        });
      }
    }
  },
  {
    id: 'snice/react-prop-contract',
    severity: 'error',
    category: 'react',
    description: 'Catch invented React router, component property, and event-adapter names, and reject authored wrapper props outside the generated adapter contract.',
    check(context) {
      for (const opening of reactWrapperOpenings(context)) {
        validateReactEventProps(context, opening);
        validateUnsupportedWrapperProps(context, opening);
      }
      reportReactOpeningIssue(context, 'SniceRouter', opening => !/\bmode\s*=/.test(opening.text), {
        message: '<SniceRouter> requires mode="hash" or mode="history".',
        fix: 'Add mode="hash" or mode="history".'
      });
      reportReactOpeningIssue(context, 'Route', opening => /\belement\s*=/.test(opening.text), {
        message: 'Snice React Route uses the page prop, not the React Router element prop.',
        fix: 'Use <Route path="/" page={PageComponent} />.'
      });
      reportReactOpeningIssue(context, 'Table', opening => /\brows\s*=/.test(opening.text), {
        message: 'The Table adapter uses data, not rows.',
        fix: 'Replace rows={rows} with data={rows}; column display text uses label, not header.'
      });
      reportReactOpeningIssue(context, 'Input', opening => /\bonChange\s*=/.test(opening.text), {
        message: 'The Input adapter exposes the Snice input-change event as onInputChange.',
        fix: 'Use onInputChange={(event) => ... event.detail.value ...}.'
      });
      reportReactOpeningIssue(context, 'Select', opening => /\bonChange\s*=/.test(opening.text), {
        message: 'The Select adapter exposes the Snice select-change event as onSelectChange.',
        fix: 'Use onSelectChange={(event) => ... event.detail.value ...}.'
      });
      reportReactOpeningIssue(context, 'Tabs', opening => /\bvalue\s*=/.test(opening.text), {
        message: 'The Tabs adapter selects by numeric selected index, not a string value.',
        fix: 'Use selected={index}; author nested <snice-tab slot="nav"> and <snice-tab-panel> elements.'
      });
      reportReactOpeningIssue(context, 'Modal', opening => /\btitle\s*=/.test(opening.text), {
        message: 'Snice modal has no title prop; it uses label for its accessible name and a header slot for visible heading content.',
        fix: 'Use <Modal label="..."><h2 slot="header">...</h2>...</Modal>.'
      });
      reportReactOpeningIssue(context, 'Modal', opening => /\bonClose\s*=/.test(opening.text), {
        message: 'The Modal adapter event prop is onModalClose, not onClose.',
        fix: 'Use onModalClose={handler}.'
      });
      for (const opening of reactExportOpenings(context, 'Toast')) {
        for (const prop of ['variant', 'open', 'duration']) {
          const authored = findAuthoredAttribute(opening.text, prop);
          if (!authored) continue;
          context.report(opening.index + authored.index, {
            message: `The Toast adapter has no ${prop} prop.`,
            fix: prop === 'variant'
              ? 'Use type="info|success|warning|error"; "danger" is not a valid toast type.'
              : prop === 'open'
                ? 'Render the Toast conditionally and pass message={text}, or use the documented toast-container API.'
                : 'Use the documented toast-container API when you need timed dismissal.'
          });
        }
      }
      reportReactOpeningIssue(context, 'Toast', opening => /\bonClose\s*=/.test(opening.text), {
        message: 'The Toast adapter event prop is onCloseToast, not onClose.',
        fix: 'Use onCloseToast={handler}.'
      });
      reportReactOpeningIssue(context, 'Badge', opening => /\btone\s*=/.test(opening.text), {
        message: 'The Badge adapter has no tone prop.',
        fix: 'Use the documented variant prop.'
      });
      reportReactOpeningIssue(context, 'Nav', opening => /\bitems\s*=/.test(opening.text), {
        message: 'The Nav adapter has no items prop.',
        fix: 'Compose the documented navigation child content instead of passing an invented items array.'
      });

      for (const opening of reactExportOpenings(context, 'Select')) {
        const element = findElementBody(context.source, opening);
        if (!element) continue;
        // Case-sensitive: native <option> is lowercase; the generated Option
        // wrapper (<Option>) is a valid way to author select options.
        const option = element.body.match(/<option\b/);
        if (!option) continue;
        context.report(element.bodyStart + option.index, {
          message: 'Native <option> elements are not read by snice-select.',
          fix: 'In React, pass options={[{ label, value }]} to Select, or use the generated Option wrapper. Review docs/ai/components/select.md.'
        });
      }

      for (const opening of reactExportOpenings(context, 'Toast')) {
        const element = findElementBody(context.source, opening);
        if (!element || !element.body.trim()) continue;
        context.report(element.bodyStart, {
          message: 'snice-toast declares no default slot, so React children are not toast content.',
          fix: 'Pass the content through message={text}; use type and onCloseToast for the released Toast contract.'
        });
      }

    }
  },
  {
    id: 'snice/select-native-option',
    severity: 'error',
    category: 'components',
    description: 'Reject native <option> children inside snice-select; they are not read and silently do nothing.',
    check(context) {
      for (const opening of findOpeningTags(context.source, ['snice-select'])) {
        const element = findElementBody(context.source, opening);
        if (!element) continue;
        // Case-sensitive: native <option> is lowercase; <Option> is the
        // generated React wrapper and a valid select child.
        const option = element.body.match(/<option\b/);
        if (!option) continue;
        context.report(element.bodyStart + option.index, {
          message: 'Native <option> elements are not read by snice-select.',
          fix: 'Pass options with the options property, or use declarative <snice-option value="..."> children. Review docs/ai/components/select.md.',
          recommendation: {
            component: 'select',
            tag: 'snice-select',
            import: "import 'snice/components/select/snice-select';",
            docsPath: 'docs/ai/components/select.md'
          }
        });
      }
    }
  },
  {
    id: 'snice/recommend-key-filter',
    severity: 'suggestion',
    category: 'events',
    description: 'Recommend key-filtered event bindings (keydown:Enter) instead of manual event.key checks.',
    check(context) {
      if (isFrameworkImplementation(context.filename)) return;

      // Decorator form: @on('keydown'|'keyup'|'keypress') without a key filter,
      // where the decorated method checks event.key by hand.
      for (const match of context.source.matchAll(/@on\(\s*['"](keydown|keyup|keypress)['"]/g)) {
        const window = context.source.slice(match.index, match.index + 600);
        const keyCheck = /\.key\s*={2,3}\s*['"]([^'"]+)['"]/.exec(window);
        if (!keyCheck) continue;
        context.report(match.index, {
          message: `This @on('${match[1]}') handler filters on event.key manually; Snice supports key-filtered events.`,
          fix: `Use @on('${match[1]}:${keyCheck[1]}') and drop the manual check; pass preventDefault/stopPropagation through the @on options instead of calling them in the handler. Review docs/ai/api.md.`
        });
      }

      // Template form: an unfiltered @keydown=/@keyup=/@keypress= binding while
      // the file checks event.key by hand. Filtered forms (@keydown:Enter=,
      // @keydown.ctrl+s=, @keydown:Enter|prevent=) never match this pattern.
      const manualKeyCheck = /\.key\s*={2,3}\s*['"]([^'"]+)['"]/.exec(context.source);
      if (!manualKeyCheck) return;
      for (const match of context.source.matchAll(/@(keydown|keyup|keypress)\s*=/g)) {
        context.report(match.index, {
          message: `This template listens to every ${match[1]} and filters event.key by hand; Snice templates support key filters.`,
          fix: `Use @${match[1]}:${manualKeyCheck[1]}=\${...} (dot notation also works), and append |prevent or |stop instead of calling preventDefault()/stopPropagation() in the handler. Review docs/ai/bindings.md.`
        });
      }
    }
  },
  {
    id: 'snice/component-prop-contract',
    severity: 'error',
    category: 'components',
    description: 'Validate generated literal-union component contracts and static Table column definitions.',
    check(context) {
      for (const opening of findOpeningTags(context.source, Object.keys(COMPONENT_CONTRACTS))) {
        validateLiteralAttributes(context, opening, COMPONENT_CONTRACTS[opening.name], false);
      }
      for (const opening of reactWrapperOpenings(context)) {
        validateLiteralAttributes(context, opening, COMPONENT_CONTRACTS[opening.wrapper.tagName], true);
      }

      const tableOpenings = [
        ...findOpeningTags(context.source, ['snice-table']),
        ...reactWrapperOpenings(context, wrapper => wrapper.exportName === 'Table')
      ];
      for (const opening of tableOpenings) {
        const columns = findStaticColumnsExpression(opening.text);
        if (!columns) continue;
        const header = columns.text.match(/\bheader\s*:/);
        if (header) {
          context.report(opening.index + columns.offset + header.index, {
            message: 'A static Snice table column uses header, but ColumnDefinition uses label.',
            fix: 'Rename header to label in the column definition.'
          });
        }
        const render = columns.text.match(/\brender\s*:/);
        if (render) {
          context.report(opening.index + columns.offset + render.index, {
            message: 'A static Snice table column uses render, but ColumnDefinition uses renderCell.',
            fix: 'Rename render to renderCell and use the documented (value, row, column) callback signature.'
          });
        }
      }
    }
  },
  {
    id: 'snice/package-contract',
    severity: 'error',
    category: 'configuration',
    description: 'Reject invented scoped package names and nonexistent Snice CLI lifecycle commands.',
    check(context) {
      if (!/(?:^|[/\\])package\.json$/.test(context.filename)) return;
      const packageIndex = context.source.search(/["']@snice\/[^"']+["']/);
      if (packageIndex >= 0) {
        context.report(packageIndex, {
          message: "Snice is published as the 'snice' package; @snice/* packages do not exist.",
          fix: "Declare a dependency on 'snice' and import the React adapter from 'snice/react'."
        });
      }
      for (const match of context.source.matchAll(/["'](?:snice|npx\s+snice)\s+(dev|build)["']/g)) {
        context.report(match.index, {
          message: `The Snice CLI has no "${match[1]}" application command.`,
          fix: 'Use the generated Vite dev/build scripts; use snice doctor and snice validate for Snice-specific checks.'
        });
      }
    }
  },
  {
    id: 'snice/react-event-handler-type-mismatch',
    severity: 'error',
    category: 'react',
    description: 'Flag local Snice React custom-event handlers that read event.target/.currentTarget instead of event.detail.',
    check(context) {
      for (const opening of reactWrapperOpenings(context)) {
        const eventProps = Object.values(opening.wrapper.events);
        for (const eventProp of eventProps) {
          if (!SNICE_REACT_EVENT_PROPS.has(eventProp)) continue;
          validateReactEventHandler(context, opening, eventProp);
        }
      }
    }
  },
  {
    id: 'snice/table-native-elements',
    severity: 'error',
    category: 'react',
    description: 'Flag Snice Table React wrappers containing native HTML table elements as direct children.',
    check(context) {
      for (const opening of reactWrapperOpenings(context, wrapper => wrapper.exportName === 'Table')) {
        const element = findElementBody(context.source, opening);
        if (!element) continue;
        const match = /<(thead|tbody|tr|th|td)\b/i.exec(element.body);
        if (!match) continue;
        context.report(element.bodyStart + match.index, {
          message: `<${match[1].toLowerCase()}> is a native HTML element; snice-table has no default slot and uses the columns/data props or <Column>/<Row> wrappers with documented slots.`,
          fix: `Pass data via the data prop and columns via the columns prop, or use <Column> and <Row> wrappers instead of native table descendants.`
        });
      }
    }
  },
  {
    id: 'snice/react-component-registration',
    severity: 'error',
    category: 'react',
    description: 'Require project-wide custom-element registration for imported React wrappers.',
    projectOnly: true,
    check() {}
  },
  {
    id: 'snice/react-nested-element-contract',
    severity: 'error',
    category: 'react',
    description: 'Require runtime registration and JSX typing for nested custom elements without React wrappers.',
    projectOnly: true,
    check() {}
  },
  {
    id: 'snice/react-raw-custom-element',
    severity: 'error',
    category: 'react',
    description: 'Require the generated React wrapper (or registration plus JSX typing when no wrapper exists) for released Snice custom elements used as raw JSX in a React project.',
    projectOnly: true,
    check() {}
  },
  {
    id: 'snice/request-respond-pairing',
    severity: 'error',
    category: 'framework',
    description: 'Require every non-optional @request channel to have a matching @respond in the project.',
    projectOnly: true,
    check() {}
  },
  {
    id: 'snice/router-initialization',
    severity: 'error',
    category: 'router',
    description: 'Require each constructed Router instance to be initialized.',
    projectOnly: true,
    check() {}
  },
  {
    id: 'snice/page-element-double-decoration',
    severity: 'error',
    category: 'router',
    description: 'Reject combining Router page and element decorators on the same class.',
    projectOnly: true,
    check() {}
  },
  {
    id: 'snice/recommend-project-structure',
    severity: 'suggestion',
    category: 'architecture',
    description: 'Recommend conventional folders for pages, components, controllers, and daemons.',
    projectOnly: true,
    check() {}
  },
  {
    id: 'snice/recommend-page-controller',
    severity: 'suggestion',
    category: 'architecture',
    description: 'Recommend extracting substantial or repeated non-visual page logic into a controller.',
    projectOnly: true,
    check() {}
  },
  {
    id: 'snice/template-reads-nonreactive-field',
    severity: 'warning',
    category: 'rendering',
    description: 'Warn when a render method reads a mutable local field that cannot schedule a repaint.',
    projectOnly: true,
    check() {}
  },
  {
    id: 'snice/prop-binding-to-undecorated-member',
    severity: 'warning',
    category: 'rendering',
    description: 'Warn when a local custom-element property binding targets a non-reactive field or accessor.',
    projectOnly: true,
    check() {}
  },
  {
    id: 'snice/duplicated-stale-guard',
    severity: 'suggestion',
    category: 'architecture',
    description: 'Recommend extracting stale-response guarded fetch plumbing repeated across files.',
    projectOnly: true,
    check() {}
  },
  {
    id: 'snice/unused-dependency',
    severity: 'error',
    category: 'configuration',
    description: 'Reject a project that declares the Snice dependency but never uses, registers, or renders it.',
    projectOnly: true,
    check() {}
  },
  ...RECOMMENDATION_RULES
];

/**
 * Public registry metadata. `check` functions stay private so callers can rely
 * on stable descriptions without coupling to implementation details.
 */
export const PROJECT_ANALYZER_RULES = Object.freeze(
  RULE_DEFINITIONS.map(({ id, severity, category, description }) =>
    Object.freeze({ id, severity, category, description })
  )
);

/**
 * Analyze one source file.
 *
 * @param {string} source Source text (TypeScript, JavaScript, JSX, or HTML).
 * @param {string} [filename=''] Optional filename included in every diagnostic.
 * @returns {Array<{
 *   severity: 'error'|'warning'|'suggestion',
 *   ruleId: string,
 *   message: string,
 *   fix: string,
 *   file?: string,
 *   line: number,
 *   column: number,
 *   recommendation?: {
 *     component: string,
 *     tag: string|null,
 *     import: string,
 *     docsPath: string
 *   }
 * }>}
 */
export function analyzeSource(source, filename = '') {
  if (typeof source !== 'string') throw new TypeError('source must be a string');
  if (typeof filename !== 'string') throw new TypeError('filename must be a string');

  const nonSource = detectNonSourceContent(source, filename);
  if (nonSource) {
    const location = sourceLocation(source, Math.max(0, nonSource.index));
    return [{
      severity: 'error',
      ruleId: 'snice/non-source-content',
      message: nonSource.message,
      fix: nonSource.fix,
      ...(filename ? { file: filename } : {}),
      line: location.line,
      column: location.column
    }];
  }

  const analyzable = maskComments(source);
  const provenance = buildSourceProvenance(analyzable);
  const diagnostics = [];
  const seen = new Set();

  for (const rule of RULE_DEFINITIONS) {
    if (rule.projectOnly || rule.standalone) continue;
    const context = {
      source: analyzable,
      filename,
      provenance,
      report(index, detail) {
        const location = sourceLocation(source, Math.max(0, index));
        const key = `${rule.id}:${location.line}:${location.column}:${detail.message}`;
        if (seen.has(key)) return;
        seen.add(key);
        const diagnostic = {
          severity: rule.severity,
          ruleId: rule.id,
          message: detail.message,
          fix: detail.fix,
          ...(filename ? { file: filename } : {}),
          line: location.line,
          column: location.column,
          ...(detail.recommendation ? { recommendation: detail.recommendation } : {})
        };
        diagnostics.push(diagnostic);
      }
    };
    rule.check(context);
  }

  return diagnostics.sort(compareDiagnostics);
}

/**
 * Analyze a complete project and add checks that require cross-file evidence.
 *
 * @param {Array<{filename: string, source: string}>|Record<string, string>} files
 * @returns {ReturnType<typeof analyzeSource>}
 */
export function analyzeProject(files) {
  const normalized = normalizeProjectFiles(files);
  const diagnostics = normalized.flatMap(file => analyzeSource(file.source, file.filename));
  const reactEvidence = detectReactEvidence(normalized);
  const registrations = new Set();
  const wrapperUses = new Map();
  const nestedReactUses = [];
  const rawJsxUses = [];
  const snicePackageManifests = [];
  const requestChannels = [];
  const respondChannels = new Set();
  const routerConstructions = [];
  const architectureDeclarations = [];
  const pageClasses = [];
  const reactiveRenderContracts = new Map();
  const localElementContracts = new Map();
  const staleGuards = [];
  let usesSnice = false;

  for (const file of normalized) {
    if (/(?:^|[/\\])package\.json$/.test(file.filename)) {
      const manifest = parseSniceDependencyManifest(file);
      if (manifest) snicePackageManifests.push(manifest);
      continue;
    }
    const analyzable = maskComments(file.source);
    for (const guard of analyzable.matchAll(/\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*\+\+this\.([A-Za-z_$][\w$]*(?:Id|Version|Token|Generation))\b([\s\S]{0,2000}?)\b(?:\1\s*!==?\s*this\.\2|this\.\2\s*!==?\s*\1)/g)) {
      staleGuards.push({ file, index: guard.index, field: guard[2] });
    }
    const provenance = buildSourceProvenance(analyzable);
    routerConstructions.push(
      ...findRouterConstructions(analyzable, localsFor(provenance.rootBindings, 'Router'))
        .map(construction => ({ ...construction, file }))
    );
    for (const convention of [
      { decorator: 'page', folder: 'pages', kind: 'page' },
      { decorator: 'element', folder: 'components', kind: 'component' },
      { decorator: 'controller', folder: 'controllers', kind: 'controller' },
      { decorator: 'daemon', folder: 'daemons', kind: 'daemon' }
    ]) {
      for (const declaration of findDecoratedClasses(analyzable, convention.decorator)) {
        const architectural = { ...declaration, ...convention, file };
        architectureDeclarations.push(architectural);
        if (convention.decorator === 'page') pageClasses.push(architectural);
        if (convention.decorator === 'page' || convention.decorator === 'element') {
          reactiveRenderContracts.set(`${file.filename}:${declaration.bodyStart}`, {
            ...architectural,
            members: inspectElementMembers(declaration.body)
          });
        }
        if (convention.decorator === 'element') {
          const tagName = findElementDecoratorTag(analyzable, declaration.index);
          if (tagName) {
            localElementContracts.set(tagName, {
              ...architectural,
              tagName,
              members: reactiveRenderContracts.get(`${file.filename}:${declaration.bodyStart}`).members
            });
          }
        }
      }
    }
    for (const match of analyzable.matchAll(/@request\(\s*['"]([^'"]+)['"]\s*(?:,\s*\{([^}]*)\})?/g)) {
      requestChannels.push({
        file,
        index: match.index,
        channel: match[1],
        optional: match[2] ? /optional\s*:\s*true/.test(match[2]) : false
      });
    }
    for (const match of analyzable.matchAll(/@respond\(\s*['"]([^'"]+)['"]/g)) {
      respondChannels.add(match[1]);
    }
    for (const entry of provenance.imports) {
      // A type-only import is erased by TypeScript; it can never register a
      // custom element, so it must not satisfy project-level registration.
      if (COMPONENT_MODULE_PATHS.has(entry.path) && !isTypeOnlyImport(entry)) {
        registrations.add(entry.path);
      }
      if (
        (entry.path === 'snice' || entry.path.startsWith('snice/')) &&
        importHasProjectUse(analyzable, entry)
      ) {
        usesSnice = true;
      }
    }
    if (!usesSnice && findOpeningTags(analyzable, Object.keys(COMPONENT_CONTRACTS)).length) {
      usesSnice = true;
    }
    if (
      /\.[cm]?[jt]sx?$/.test(file.filename) &&
      (reactEvidence.project || reactEvidence.files.has(file.filename))
    ) {
      // Strings, templates, and comments cannot be JSX: blank them so Snice
      // markup inside html`` templates or quoted text is never misclassified.
      const codeOnly = blankStringContents(analyzable);
      for (const match of codeOnly.matchAll(/<(snice-[a-z0-9-]+)(?=\s|\/?>)/gi)) {
        const tagName = match[1].toLowerCase();
        if (!COMPONENT_CONTRACTS[tagName]) continue;
        rawJsxUses.push({ file, index: match.index, tagName });
      }
    }
    for (const binding of provenance.reactBindings) {
      // Invalid/invented wrapper names already receive an import-contract error.
      const wrapper = REACT_WRAPPERS[binding.imported];
      if (!wrapper) continue;
      if (!wrapperUses.has(wrapper.tagName)) {
        wrapperUses.set(wrapper.tagName, { file, binding, wrapper });
      }
      if (wrapper.exportName !== 'Tabs') continue;
      for (const opening of findOpeningTags(analyzable, [binding.local])) {
        const element = findElementBody(analyzable, opening);
        if (!element) continue;
        for (const match of element.body.matchAll(/<(snice-(?:tab-panel|tab))\b/gi)) {
          nestedReactUses.push({
            file,
            index: element.bodyStart + match.index,
            tagName: match[1].toLowerCase()
          });
        }
      }
    }
  }

  for (const { file, binding, wrapper } of wrapperUses.values()) {
    if (registrations.has(wrapper.componentModulePath)) continue;
    const location = sourceLocation(file.source, binding.index);
    diagnostics.push({
      severity: 'error',
      ruleId: 'snice/react-component-registration',
      message: `The ${wrapper.exportName} React wrapper requires project registration of <${wrapper.tagName}>.`,
      fix: `Add import '${wrapper.componentModulePath}'; once in the application entry point.`,
      file: file.filename,
      line: location.line,
      column: location.column,
      recommendation: {
        component: wrapper.family,
        tag: wrapper.tagName,
        import: `import '${wrapper.componentModulePath}';`,
        docsPath: `docs/ai/components/${COMPONENT_CONTRACTS[wrapper.tagName].family}.md`
      }
    });
  }

  const jsxTyping = collectReactJsxIntrinsicTyping(normalized);
  const seenNested = new Set();
  for (const use of nestedReactUses) {
    const component = COMPONENT_CONTRACTS[use.tagName];
    if (!component) continue;
    const releasedWrapper = Object.values(REACT_WRAPPERS)
      .find(wrapper => wrapper.tagName === use.tagName);
    const missingRegistration = !registrations.has(component.modulePath);
    const missingTyping = !jsxTyping.all && !jsxTyping.tags.has(use.tagName);
    const key = `${use.file.filename}:${use.tagName}`;
    if ((!missingRegistration && !missingTyping) || seenNested.has(key)) continue;
    seenNested.add(key);
    const missing = [
      ...(missingRegistration ? [`runtime registration import '${component.modulePath}'`] : []),
      ...(missingTyping ? [`a React JSX.IntrinsicElements declaration for <${use.tagName}>`] : [])
    ];
    const location = sourceLocation(use.file.source, use.index);
    diagnostics.push({
      severity: 'error',
      ruleId: 'snice/react-nested-element-contract',
      message: releasedWrapper
        ? `<${use.tagName}> is a raw custom element in React and is missing ${missing.join(' and ')}; Snice exports the ${releasedWrapper.exportName} wrapper.`
        : `<${use.tagName}> has no Snice React wrapper and is missing ${missing.join(' and ')}.`,
      fix: releasedWrapper
        ? `Import { ${releasedWrapper.exportName} } from 'snice/react', replace <${use.tagName}> with <${releasedWrapper.exportName}>, and register '${component.modulePath}' in the entry point.`
        : `Keep the raw nested element, add import '${component.modulePath}'; in the entry point, and type '${use.tagName}' in React JSX.IntrinsicElements.`,
      file: use.file.filename,
      line: location.line,
      column: location.column,
      recommendation: {
        component: component.family,
        tag: use.tagName,
        import: `import '${component.modulePath}';`,
        docsPath: `docs/ai/components/${component.family}.md`
      }
    });
  }

  const nestedCovered = new Set(
    nestedReactUses.map(use => `${use.file.filename}:${use.index}`)
  );  const seenRawJsx = new Set();
  for (const use of rawJsxUses) {
    if (nestedCovered.has(`${use.file.filename}:${use.index}`)) continue;
    const component = COMPONENT_CONTRACTS[use.tagName];
    if (!component) continue;
    const key = `${use.file.filename}:${use.tagName}`;
    if (seenRawJsx.has(key)) continue;
    seenRawJsx.add(key);
    const releasedWrapper = Object.values(REACT_WRAPPERS)
      .find(wrapper => wrapper.tagName === use.tagName);
    const location = sourceLocation(use.file.source, use.index);
    const recommendation = {
      component: component.family,
      tag: use.tagName,
      import: `import '${component.modulePath}';`,
      docsPath: `docs/ai/components/${component.family}.md`
    };
    if (releasedWrapper) {
      diagnostics.push({
        severity: 'error',
        ruleId: 'snice/react-raw-custom-element',
        message: `<${use.tagName}> is a released Snice custom element used as raw JSX in React; TypeScript cannot type it and Snice exports the ${releasedWrapper.exportName} wrapper.`,
        fix: `Import { ${releasedWrapper.exportName} } from 'snice/react', replace <${use.tagName}> with <${releasedWrapper.exportName}>, and register '${component.modulePath}' in the entry point.`,
        file: use.file.filename,
        line: location.line,
        column: location.column,
        recommendation
      });
      continue;
    }
    const missingRegistration = !registrations.has(component.modulePath);
    const missingTyping = !jsxTyping.all && !jsxTyping.tags.has(use.tagName);
    if (!missingRegistration && !missingTyping) continue;
    const missing = [
      ...(missingRegistration ? [`runtime registration import '${component.modulePath}'`] : []),
      ...(missingTyping ? [`a React JSX.IntrinsicElements declaration for <${use.tagName}>`] : [])
    ];
    diagnostics.push({
      severity: 'error',
      ruleId: 'snice/react-raw-custom-element',
      message: `<${use.tagName}> is a raw custom element in React, has no Snice React wrapper, and is missing ${missing.join(' and ')}.`,
      fix: `Keep the raw element, add import '${component.modulePath}'; in the entry point, and type '${use.tagName}' in React JSX.IntrinsicElements.`,
      file: use.file.filename,
      line: location.line,
      column: location.column,
      recommendation
    });
  }

  const seenUnpairedRequest = new Set();
  for (const request of requestChannels) {
    if (request.optional || respondChannels.has(request.channel)) continue;
    const key = `${request.file.filename}:${request.channel}`;
    if (seenUnpairedRequest.has(key)) continue;
    seenUnpairedRequest.add(key);
    const location = sourceLocation(request.file.source, request.index);
    diagnostics.push({
      severity: 'error',
      ruleId: 'snice/request-respond-pairing',
      message: `@request('${request.channel}') has no matching @respond('${request.channel}') in the project; it fails with a 50ms discovery timeout at runtime.`,
      fix: `Attach a controller or element with @respond('${request.channel}') before the request fires, or pass { optional: true } if an unhandled request is acceptable. Review docs/ai/decorators.md.`,
      file: request.file.filename,
      line: location.line,
      column: location.column
    });
  }

  const projectCode = normalized
    .filter(file => !/(?:^|[/\\])package\.json$/.test(file.filename))
    .map(file => maskComments(file.source))
    .join('\n');
  for (const construction of routerConstructions) {
    const initialized = construction.initializers.some(name => hasInvocation(projectCode, name)) ||
      (construction.instance && new RegExp(
        `\\b${escapeRegExp(construction.instance)}\\s*\\.\\s*initialize\\s*\\(`
      ).test(projectCode));
    if (initialized) continue;
    const location = sourceLocation(construction.file.source, construction.index);
    diagnostics.push({
      severity: 'error',
      ruleId: 'snice/router-initialization',
      message: 'Router() is constructed but its initialize() function is never called, so registered pages will not start routing.',
      fix: 'Export the Router-returned initialize function, import all page modules, then call initialize() from the application entry point. Review docs/ai/routing.md.',
      file: construction.file.filename,
      line: location.line,
      column: location.column
    });
  }

  const doubleDecoratedPages = new Set();
  const declarationsByClass = new Map();
  for (const declaration of architectureDeclarations) {
    const key = `${declaration.file.filename}:${declaration.name}`;
    if (!declarationsByClass.has(key)) declarationsByClass.set(key, []);
    declarationsByClass.get(key).push(declaration);
  }
  for (const [key, declarations] of declarationsByClass) {
    const page = declarations.find(declaration => declaration.decorator === 'page');
    const element = declarations.find(declaration => declaration.decorator === 'element');
    if (!page || !element) continue;
    doubleDecoratedPages.add(key);
    const location = sourceLocation(element.file.source, element.index);
    diagnostics.push({
      severity: 'error',
      ruleId: 'snice/page-element-double-decoration',
      message: `${page.name} combines @page and @element, so Snice element functionality is applied twice.`,
      fix: 'Remove @element from the routed class; the Router-returned @page decorator registers the custom element and applies element functionality. Review docs/ai/routing.md.',
      file: element.file.filename,
      line: location.line,
      column: location.column
    });
  }

  for (const declaration of architectureDeclarations) {
    const key = `${declaration.file.filename}:${declaration.name}`;
    if (declaration.decorator === 'element' && doubleDecoratedPages.has(key)) continue;
    if (isInSourceFolder(declaration.file.filename, declaration.folder)) continue;
    const target = `src/${declaration.folder}/${camelToKebab(declaration.name)}.ts`;
    const location = sourceLocation(declaration.file.source, declaration.index);
    diagnostics.push({
      severity: 'suggestion',
      ruleId: 'snice/recommend-project-structure',
      message: `${declaration.name} is a Snice ${declaration.kind} defined outside the conventional src/${declaration.folder}/ folder.`,
      fix: `Move the class to ${target} and import it from the application composition root. Review docs/ai/architecture.md.`,
      file: declaration.file.filename,
      line: location.line,
      column: location.column
    });
  }

  for (const contract of reactiveRenderContracts.values()) {
    const reportedFields = new Set();
    for (const method of findDecoratedClassMethods(contract.body, 'render', contract.bodyStart)) {
      for (const read of method.body.matchAll(/\bthis\.([A-Za-z_$][\w$]*)\b/g)) {
        const name = read[1];
        if (
          reportedFields.has(name) ||
          !contract.members.fields.has(name) ||
          contract.members.readonly.has(name) ||
          contract.members.functionFields.has(name) ||
          contract.members.reactive.has(name) ||
          isDirectMemberWrite(method.body, read.index, read[0].length)
        ) continue;
        reportedFields.add(name);
        const index = method.bodyStart + read.index;
        const location = sourceLocation(contract.file.source, index);
        diagnostics.push({
          severity: 'warning',
          ruleId: 'snice/template-reads-nonreactive-field',
          message: `${contract.name} renders this.${name}, but ${name} is a mutable plain field and changes cannot schedule a repaint.`,
          fix: `Decorate ${name} with @property() for public input or @state() for internal state, or make it readonly if it is intentionally immutable. Review docs/ai/properties.md.`,
          file: contract.file.filename,
          line: location.line,
          column: location.column
        });
      }
    }
  }

  if (localElementContracts.size) {
    const tags = [...localElementContracts.keys()];
    for (const file of normalized) {
      if (!/\.[cm]?[jt]sx?$/.test(file.filename)) continue;
      const analyzable = maskComments(file.source);
      for (const opening of findOpeningTags(analyzable, tags)) {
        const contract = localElementContracts.get(opening.name);
        for (const binding of opening.text.matchAll(/\.([A-Za-z_$][\w$]*)\s*=/g)) {
          const name = binding[1];
          if (
            !contract ||
            contract.members.reactive.has(name) ||
            contract.members.invalidatingAccessors.has(name) ||
            (!contract.members.fields.has(name) && !contract.members.accessors.has(name))
          ) continue;
          const index = opening.index + binding.index;
          const location = sourceLocation(file.source, index);
          diagnostics.push({
            severity: 'warning',
            ruleId: 'snice/prop-binding-to-undecorated-member',
            message: `.${name} assigns to <${opening.name}>.${name}, but that local member has no @property() or @state() decorator, so assignment alone cannot schedule its render.`,
            fix: `Decorate ${name} with @property({ attribute: false }) for a JS-only public input (or @state() if it is internal), or make its setter explicitly invalidate the element.`,
            file: file.filename,
            line: location.line,
            column: location.column
          });
        }
      }
    }
  }

  if (new Set(staleGuards.map(guard => guard.file.filename)).size >= 2) {
    for (const guard of staleGuards) {
      const location = sourceLocation(guard.file.source, guard.index);
      diagnostics.push({
        severity: 'suggestion',
        ruleId: 'snice/duplicated-stale-guard',
        message: `A ${guard.field} stale-response guard is repeated across project files.`,
        fix: 'Extract the shared fetch/loading/error/stale-response lifecycle into a controller under src/controllers/. Review docs/ai/controllers.md.',
        file: guard.file.filename,
        line: location.line,
        column: location.column
      });
    }
  }

  const pageControllerReported = new Set();
  for (const page of pageClasses) {
    const profile = pageLogicProfile(page.body);
    if (!profile.recommend) continue;
    const location = sourceLocation(page.file.source, page.index);
    diagnostics.push({
      severity: 'suggestion',
      ruleId: 'snice/recommend-page-controller',
      message: `${page.name} contains substantial non-visual logic (${profile.effectfulMethods} effectful methods, ${profile.effects} external effects, ${profile.decisions} decision points).`,
      fix: `Keep route orchestration and presentation in the page; move reusable data, business, timer, storage, or server behavior into a controller under src/controllers/. Review docs/ai/controllers.md and docs/ai/architecture.md.`,
      file: page.file.filename,
      line: location.line,
      column: location.column
    });
    pageControllerReported.add(`${page.file.filename}:${page.index}`);
  }

  const repeatedPageMethods = new Map();
  for (const page of pageClasses) {
    for (const method of findClassMethods(page.body, page.bodyStart)) {
      const fingerprint = sharedLogicFingerprint(method.body);
      if (!fingerprint) continue;
      if (!repeatedPageMethods.has(fingerprint)) repeatedPageMethods.set(fingerprint, []);
      repeatedPageMethods.get(fingerprint).push({ page, method });
    }
  }
  for (const occurrences of repeatedPageMethods.values()) {
    const files = [...new Set(occurrences.map(({ page }) => page.file.filename))];
    if (files.length < 2) continue;
    for (const { page, method } of occurrences) {
      const reportKey = `${page.file.filename}:${page.index}`;
      if (pageControllerReported.has(reportKey)) continue;
      const location = sourceLocation(page.file.source, method.index);
      diagnostics.push({
        severity: 'suggestion',
        ruleId: 'snice/recommend-page-controller',
        message: `${method.name}() repeats substantial non-visual logic across ${files.length} page files.`,
        fix: `Extract the shared behavior into a controller under src/controllers/ and let each page orchestrate it. Also review docs/ai/controllers.md and docs/ai/architecture.md.`,
        file: page.file.filename,
        line: location.line,
        column: location.column
      });
      pageControllerReported.add(reportKey);
    }
  }

  if (!usesSnice) {
    for (const manifest of snicePackageManifests) {
      const location = sourceLocation(manifest.source, manifest.index);
      diagnostics.push({
        severity: 'error',
        ruleId: 'snice/unused-dependency',
        message: 'package.json declares the snice dependency, but no project source references a Snice import, registers a Snice component, or renders a released snice-* custom element.',
        fix: "Use an imported binding from 'snice' or 'snice/react', add a side-effect registration import from the documented snice/components path, render a released snice-* element, or remove snice from package.json.",
        file: manifest.filename,
        line: location.line,
        column: location.column
      });
    }
  }

  return diagnostics.sort(compareProjectDiagnostics);
}

/**
 * Parse a package.json project file and, when it declares the published `snice`
 * dependency without being the Snice package itself, return the manifest with
 * the location of the dependency declaration. Returns null otherwise.
 */
function parseSniceDependencyManifest(file) {
  let data;
  try {
    data = JSON.parse(file.source);
  } catch {
    return null;
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  if (data.name === 'snice') return null;

  const declaresSnice = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']
    .some(field => data[field] && typeof data[field] === 'object' &&
      Object.prototype.hasOwnProperty.call(data[field], 'snice'));
  if (!declaresSnice) return null;

  const keyIndex = file.source.search(/["']snice["']\s*:/);
  return {
    filename: file.filename,
    source: file.source,
    index: keyIndex >= 0 ? keyIndex : 0
  };
}

function componentRecommendation(component, options = {}) {
  const tag = options.tag ?? `snice-${component}`;
  const importPath = options.importPath ?? `snice/components/${component}/snice-${component}`;
  return Object.freeze({
    component,
    tag,
    import: `import '${importPath}';`,
    docsPath: `docs/ai/components/${component}.md`
  });
}

function recommendationRule({ id, component, message, test }) {
  return {
    id,
    severity: 'suggestion',
    category: 'recommendation',
    description: `Recommend snice-${component} for a clear native or custom implementation pattern.`,
    check(context) {
      if (isFrameworkImplementation(context.filename)) return;
      const recommendation = COMPONENT_RECOMMENDATIONS[component];
      if (usesComponent(context.source, recommendation)) return;
      const index = test(context.source);
      if (index < 0) return;
      context.report(index, {
        message,
        fix: `Review ${recommendation.docsPath} and replace the custom implementation when its contract fits.`,
        recommendation
      });
    }
  };
}

function usesComponent(source, recommendation) {
  const tagPattern = recommendation.tag
    ? new RegExp(`<${escapeRegExp(recommendation.tag)}\\b`, 'i')
    : null;
  return Boolean(
    (tagPattern && tagPattern.test(source)) ||
    source.includes(recommendation.import.replace(/^import ['"]|['"];$/g, '')) ||
    source.includes(`snice/components/${recommendation.component}/`)
  );
}

export function findImports(source) {
  const imports = [];
  for (const start of source.matchAll(/^\s*import\b/gm)) {
    const statement = source.slice(start.index, start.index + 4000);
    const sideEffect = statement.match(/^\s*import\s*(['"])([^'"]+)\1\s*;?/);
    if (sideEffect) {
      imports.push({
        index: start.index,
        end: start.index + sideEffect[0].length,
        clause: null,
        path: sideEffect[2],
        typeOnly: false
      });
      continue;
    }
    const from = statement.match(/^\s*import\s+(?:type\s+)?([\s\S]*?)\s+from\s*(['"])([^'"]+)\2\s*;?/);
    if (!from || /\n\s*import\b/.test(from[1])) continue;
    imports.push({
      index: start.index,
      end: start.index + from[0].length,
      clause: from[1].trim(),
      path: from[3],
      typeOnly: /^\s*import\s+type\b/.test(statement)
    });
  }
  return imports.sort((a, b) => a.index - b.index);
}

function findObjectCalls(source, functionName) {
  const calls = [];
  const pattern = new RegExp(`\\b${escapeRegExp(functionName)}\\s*\\(\\s*\\{`, 'g');
  for (const match of source.matchAll(pattern)) {
    const bodyStart = source.indexOf('{', match.index);
    const bodyEnd = findMatchingDelimiter(source, bodyStart, '{', '}');
    if (bodyEnd < 0) continue;
    calls.push({
      index: match.index,
      bodyStart,
      body: source.slice(bodyStart, bodyEnd + 1)
    });
  }
  return calls;
}

function findClassBodies(source) {
  const classes = [];
  const pattern = /\bclass\s+[A-Za-z_$][\w$]*\s+extends\s+([A-Za-z_$][\w$]*)[^{]*\{/g;
  for (const match of source.matchAll(pattern)) {
    const open = source.indexOf('{', match.index);
    const close = findMatchingDelimiter(source, open, '{', '}');
    if (close < 0) continue;
    classes.push({
      base: match[1],
      bodyStart: open + 1,
      body: source.slice(open + 1, close)
    });
  }
  return classes;
}

function findRouterConstructions(source, routerNames) {
  const constructions = [];
  for (const routerName of routerNames) {
    const escaped = escapeRegExp(routerName);
    const assigned = new Set();
    const destructured = new RegExp(
      `\\b(?:const|let|var)\\s*\\{([^}]*)\\}\\s*=\\s*${escaped}\\s*\\(`,
      'g'
    );
    for (const match of source.matchAll(destructured)) {
      const initialize = /(?:^|,)\s*initialize(?:\s*:\s*([A-Za-z_$][\w$]*))?(?=\s*,|\s*$)/
        .exec(match[1]);
      constructions.push({
        index: match.index,
        initializers: initialize ? [initialize[1] ?? 'initialize'] : [],
        instance: null
      });
      assigned.add(source.indexOf(routerName, match.index));
    }

    const instance = new RegExp(
      `\\b(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*${escaped}\\s*\\(`,
      'g'
    );
    for (const match of source.matchAll(instance)) {
      const initializers = [];
      const instanceDestructuring = new RegExp(
        `\\b(?:export\\s+)?(?:const|let|var)\\s*\\{([^}]*)\\}\\s*=\\s*${escapeRegExp(match[1])}\\b`,
        'g'
      );
      for (const destructuring of source.matchAll(instanceDestructuring)) {
        const initialize = /(?:^|,)\s*initialize(?:\s*:\s*([A-Za-z_$][\w$]*))?(?=\s*,|\s*$)/
          .exec(destructuring[1]);
        if (initialize) initializers.push(initialize[1] ?? 'initialize');
      }
      constructions.push({ index: match.index, initializers, instance: match[1] });
      assigned.add(source.indexOf(routerName, match.index));
    }

    for (const call of findObjectCalls(source, routerName)) {
      if (assigned.has(call.index)) continue;
      constructions.push({ index: call.index, initializers: [], instance: null });
    }
  }
  return constructions.sort((left, right) => left.index - right.index);
}

function hasInvocation(source, name) {
  const pattern = new RegExp(`\\b${escapeRegExp(name)}\\s*\\(`, 'g');
  for (const match of source.matchAll(pattern)) {
    const open = source.indexOf('(', match.index);
    const close = findMatchingDelimiter(source, open, '(', ')');
    if (close < 0) continue;
    let next = close + 1;
    while (/\s/.test(source[next] ?? '')) next++;
    // A function or method declaration has a body immediately after its
    // parameter list. Router initializers are zero-argument function calls.
    if (source[next] !== '{') return true;
  }
  return false;
}

function findDecoratedClasses(source, decoratorName) {
  const declarations = [];
  const pattern = new RegExp(`@${escapeRegExp(decoratorName)}\\b`, 'g');
  for (const match of source.matchAll(pattern)) {
    let declarationStart = match.index + match[0].length;
    while (/\s/.test(source[declarationStart] ?? '')) declarationStart++;
    if (source[declarationStart] === '(') {
      const close = findMatchingDelimiter(source, declarationStart, '(', ')');
      if (close < 0) continue;
      declarationStart = close + 1;
    }
    // Class decorators stack above the same declaration. Walk past any
    // intervening decorators so each Snice role resolves to that class.
    while (true) {
      while (/\s/.test(source[declarationStart] ?? '')) declarationStart++;
      const nextDecorator = /^@[A-Za-z_$][\w$]*/.exec(source.slice(declarationStart));
      if (!nextDecorator) break;
      declarationStart += nextDecorator[0].length;
      while (/\s/.test(source[declarationStart] ?? '')) declarationStart++;
      if (source[declarationStart] === '(') {
        const close = findMatchingDelimiter(source, declarationStart, '(', ')');
        if (close < 0) break;
        declarationStart = close + 1;
      }
    }
    const declaration = /^\s*(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)[^\{]*\{/
      .exec(source.slice(declarationStart, declarationStart + 2_000));
    if (!declaration) continue;
    const open = declarationStart + declaration.index + declaration[0].lastIndexOf('{');
    const close = findMatchingDelimiter(source, open, '{', '}');
    if (close < 0) continue;
    declarations.push({
      index: match.index,
      name: declaration[1],
      bodyStart: open + 1,
      body: source.slice(open + 1, close)
    });
  }
  return declarations;
}

function findSniceElementClasses(source) {
  const seen = new Set();
  const declarations = [];
  for (const decoratorName of ['element', 'page']) {
    for (const declaration of findDecoratedClasses(source, decoratorName)) {
      if (seen.has(declaration.bodyStart)) continue;
      seen.add(declaration.bodyStart);
      declarations.push(declaration);
    }
  }
  return declarations;
}

function findElementDecoratorTag(source, index) {
  return /^@element\s*\(\s*['"]([^'"]+)['"]/.exec(source.slice(index, index + 500))?.[1] ?? null;
}

function inspectElementMembers(body) {
  const code = blankStringContents(maskComments(body));
  const depths = new Uint16Array(code.length + 1);
  let depth = 0;
  for (let index = 0; index < code.length; index++) {
    depths[index] = depth;
    if (code[index] === '{') depth++;
    else if (code[index] === '}') depth = Math.max(0, depth - 1);
  }

  const fields = new Set();
  const accessors = new Set();
  const readonly = new Set();
  const functionFields = new Set();
  const reactive = new Set();
  const fieldPattern = /(?:^|\n)\s*((?:(?:public|private|protected|static|readonly|override|declare|abstract)\s+)*)([A-Za-z_$][\w$]*)\s*[!?]?\s*(?::[^=\n;{]+)?\s*(?==|;)/g;
  for (const match of code.matchAll(fieldPattern)) {
    const nameIndex = match.index + match[0].lastIndexOf(match[2]);
    if (depths[nameIndex] !== 0) continue;
    fields.add(match[2]);
    if (/\breadonly\b/.test(match[1])) readonly.add(match[2]);
  }
  const functionFieldPattern = /(?:^|\n)\s*(?:(?:public|private|protected|static|readonly|override|declare|abstract)\s+)*([A-Za-z_$][\w$]*)\s*[!?]?\s*(?::[^=\n;{]+)?\s*=\s*(?:async\s*)?(?:\([^\n)]*\)|[A-Za-z_$][\w$]*)\s*=>/g;
  for (const match of code.matchAll(functionFieldPattern)) {
    const nameIndex = match.index + match[0].indexOf(match[1]);
    if (depths[nameIndex] === 0) functionFields.add(match[1]);
  }
  const accessorPattern = /(?:^|\n)\s*(?:(?:public|private|protected|static|readonly|override|declare|abstract)\s+)*(?:get|set|accessor)\s+([A-Za-z_$][\w$]*)\b/g;
  for (const match of code.matchAll(accessorPattern)) {
    const nameIndex = match.index + match[0].lastIndexOf(match[1]);
    if (depths[nameIndex] === 0) accessors.add(match[1]);
  }
  const decoratedPattern = /@(property|state)\b/g;
  for (const match of code.matchAll(decoratedPattern)) {
    if (depths[match.index] !== 0) continue;
    let cursor = match.index + match[0].length;
    while (/\s/.test(code[cursor] ?? '')) cursor++;
    if (code[cursor] === '(') {
      const close = findMatchingDelimiter(code, cursor, '(', ')');
      if (close < 0) continue;
      cursor = close + 1;
    }
    const declaration = /^\s*(?:(?:public|private|protected|static|readonly|override|declare|abstract)\s+)*(?:accessor\s+)?([A-Za-z_$][\w$]*)/.exec(code.slice(cursor));
    if (declaration) reactive.add(declaration[1]);
  }

  // An undecorated native-style accessor can still be reactive when its
  // setter updates decorated backing state (directly or through one helper),
  // or explicitly invalidates the host. Do not tell authors to redecorate
  // those deliberate APIs.
  const invalidatingAccessors = new Set();
  const methods = new Map(findClassMethods(body).map(method => [method.name, method.body]));
  const reactiveAlternation = [...reactive].map(escapeRegExp).join('|');
  const writesReactiveState = methodBody => reactiveAlternation &&
    new RegExp(`\\bthis\\.(?:${reactiveAlternation})\\s*(?:=|\\+\\+|--)`).test(methodBody);
  const invalidates = methodBody => {
    if (/\bthis\.(?:invalidate|renderNow)\s*\(/.test(methodBody) || writesReactiveState(methodBody)) return true;
    for (const call of methodBody.matchAll(/\bthis\.([A-Za-z_$][\w$]*)\s*\(/g)) {
      const calledBody = methods.get(call[1]);
      if (calledBody && writesReactiveState(calledBody)) return true;
    }
    return false;
  };
  const setterPattern = /(?:^|\n)\s*(?:(?:public|private|protected|static|override)\s+)*set\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g;
  for (const match of code.matchAll(setterPattern)) {
    const nameIndex = match.index + match[0].indexOf(match[1]);
    if (depths[nameIndex] !== 0) continue;
    const open = match.index + match[0].lastIndexOf('{');
    const close = findMatchingDelimiter(code, open, '{', '}');
    if (close >= 0 && invalidates(body.slice(open + 1, close))) invalidatingAccessors.add(match[1]);
  }

  return { fields, accessors, readonly, functionFields, reactive, invalidatingAccessors };
}

function findDecoratedClassMethods(body, decoratorName, bodyStart = 0) {
  const code = maskComments(body);
  const methods = [];
  const pattern = new RegExp(`@${escapeRegExp(decoratorName)}\\b`, 'g');
  for (const match of code.matchAll(pattern)) {
    let cursor = match.index + match[0].length;
    while (/\s/.test(code[cursor] ?? '')) cursor++;
    if (code[cursor] === '(') {
      const close = findMatchingDelimiter(code, cursor, '(', ')');
      if (close < 0) continue;
      cursor = close + 1;
    }
    const signature = /^\s*(?:(?:public|private|protected|static|override)\s+)*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\(/.exec(code.slice(cursor));
    if (!signature) continue;
    const parametersOpen = cursor + signature.index + signature[0].lastIndexOf('(');
    const parametersClose = findMatchingDelimiter(code, parametersOpen, '(', ')');
    if (parametersClose < 0) continue;
    const methodOpen = code.indexOf('{', parametersClose);
    if (methodOpen < 0) continue;
    const methodClose = findMatchingDelimiter(code, methodOpen, '{', '}');
    if (methodClose < 0) continue;
    methods.push({
      name: signature[1],
      bodyStart: bodyStart + methodOpen + 1,
      body: body.slice(methodOpen + 1, methodClose)
    });
  }
  return methods;
}

function isDirectMemberWrite(body, index, length) {
  const before = body.slice(Math.max(0, index - 3), index);
  const after = body.slice(index + length).trimStart();
  return /(?:\+\+|--)\s*$/.test(before) || /^(?:\+\+|--|(?:[+\-*/%&|^]|\?\?)?=(?!=|>))/.test(after);
}

function findClassMethods(body, bodyStart = 0) {
  const code = blankStringContents(body);
  const depths = new Uint16Array(code.length + 1);
  let depth = 0;
  for (let index = 0; index < code.length; index++) {
    depths[index] = depth;
    if (code[index] === '{') depth++;
    else if (code[index] === '}') depth = Math.max(0, depth - 1);
  }
  const methods = [];
  const pattern = /(?:^|\n)\s*(?:(?:public|private|protected|static|readonly|override|abstract|declare)\s+)*(?:async\s+)?(?:\*\s*)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*(?::\s*[^\n{]+)?\s*\{/g;
  const excluded = new Set(['if', 'for', 'while', 'switch', 'catch', 'with']);
  for (const match of code.matchAll(pattern)) {
    const open = match.index + match[0].lastIndexOf('{');
    if (depths[open] !== 0 || excluded.has(match[1])) continue;
    const close = findMatchingDelimiter(code, open, '{', '}');
    if (close < 0) continue;
    methods.push({
      name: match[1],
      index: bodyStart + match.index + match[0].indexOf(match[1]),
      body: body.slice(open + 1, close)
    });
  }
  return methods;
}

function pageLogicProfile(body) {
  const code = blankStringContents(body);
  const methods = findClassMethods(body);
  const effectPattern = /\bfetch\s*\(|\bnew\s+(?:WebSocket|EventSource|Worker)\s*\(|\b(?:localStorage|sessionStorage|indexedDB|caches)\b|\b(?:setInterval|setTimeout)\s*\(/g;
  const effectTest = /\bfetch\s*\(|\bnew\s+(?:WebSocket|EventSource|Worker)\s*\(|\b(?:localStorage|sessionStorage|indexedDB|caches)\b|\b(?:setInterval|setTimeout)\s*\(/;
  const decisionPattern = /\b(?:if|else\s+if|switch|for|while|try|catch)\b|\.(?:filter|map|reduce|sort|find|some|every)\s*\(/g;
  const effects = [...code.matchAll(effectPattern)].length;
  const decisions = [...code.matchAll(decisionPattern)].length;
  const effectfulMethods = methods.filter(method => {
    const methodCode = blankStringContents(method.body);
    return effectTest.test(methodCode);
  }).length;
  // A page is supposed to orchestrate. Recommend extraction only when several
  // separate methods own substantial external/business behavior, or when a
  // very large page also carries a dense decision tree. One fetch in @ready()
  // or a small route-state branch remains clean.
  const recommend = (
    (effectfulMethods >= 4 && effects >= 6) ||
    (effectfulMethods >= 3 && effects >= 4 && decisions >= 8) ||
    (code.length >= 4_000 && effects >= 2 && decisions >= 16)
  );
  return { recommend, effectfulMethods, effects, decisions };
}

function sharedLogicFingerprint(body) {
  const code = blankStringContents(maskComments(body))
    .replace(/\s+/g, ' ')
    .trim();
  if (code.length < 140 || (code.match(/;/g) ?? []).length < 3) return null;
  if (!/\bfetch\s*\(|\bnew\s+(?:WebSocket|EventSource|Worker)\s*\(|\b(?:localStorage|sessionStorage|indexedDB)\b|\b(?:if|for|while|switch)\b|\.(?:filter|map|reduce|sort)\s*\(/.test(code)) {
    return null;
  }
  return code;
}

function isInSourceFolder(filename, folder) {
  const normalized = filename.replaceAll('\\', '/');
  return new RegExp(`(?:^|/)src/${escapeRegExp(folder)}(?:/|$)`).test(normalized);
}

function findMatchingDelimiter(source, start, open, close) {
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let index = start; index < source.length; index++) {
    const character = source[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === quote) {
        quote = '';
      }
      continue;
    }
    if (character === "'" || character === '"' || character === '`') {
      quote = character;
      continue;
    }
    if (character === open) depth++;
    if (character === close) {
      depth--;
      if (depth === 0) return index;
    }
  }
  return -1;
}

export function maskComments(source) {
  let output = '';
  let state = 'code';
  let quote = '';
  let escaped = false;

  for (let index = 0; index < source.length; index++) {
    const character = source[index];
    const next = source[index + 1];
    if (state === 'line-comment') {
      if (character === '\n') {
        state = 'code';
        output += '\n';
      } else {
        output += ' ';
      }
      continue;
    }
    if (state === 'block-comment') {
      if (character === '*' && next === '/') {
        output += '  ';
        index++;
        state = 'code';
      } else {
        output += character === '\n' ? '\n' : ' ';
      }
      continue;
    }
    if (state === 'string') {
      output += character;
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === quote) {
        state = 'code';
        quote = '';
      }
      continue;
    }
    if (character === '/' && next === '/') {
      output += '  ';
      index++;
      state = 'line-comment';
    } else if (character === '/' && next === '*') {
      output += '  ';
      index++;
      state = 'block-comment';
    } else if (character === "'" || character === '"' || character === '`') {
      output += character;
      state = 'string';
      quote = character;
    } else {
      output += character;
    }
  }
  return output;
}

const SCRIPT_SOURCE_FILE = /\.[cm]?[jt]sx?$/;
const MARKDOWN_CODE_FENCE = /^[ \t]*```/m;
const TRANSCRIPT_USER_LABEL = /^[ \t]*(?:User|Human)[ \t]*:/m;
const TRANSCRIPT_ASSISTANT_LABEL = /^[ \t]*(?:Assistant|AI)[ \t]*:/m;

/**
 * Detect files that are chat-transcript or Markdown-fenced text rather than
 * compilable JavaScript/TypeScript. String and comment contents are blanked
 * first so that ordinary literals and comments (which legitimately mention
 * "User:", "Assistant:", or fenced snippets) never trigger the rule. Only the
 * script extensions the analyzer parses are inspected.
 */
function detectNonSourceContent(source, filename) {
  if (filename && !SCRIPT_SOURCE_FILE.test(filename)) return null;

  const stripped = blankStringContents(maskComments(source));
  const fence = MARKDOWN_CODE_FENCE.exec(stripped);
  const user = TRANSCRIPT_USER_LABEL.exec(stripped);
  const assistant = TRANSCRIPT_ASSISTANT_LABEL.exec(stripped);

  const indices = [];
  if (fence) indices.push(fence.index);
  if (user && assistant) indices.push(Math.min(user.index, assistant.index));
  if (!indices.length) return null;

  return {
    index: Math.min(...indices),
    message: 'This file is chat-transcript or Markdown-fenced text, not compilable JavaScript or TypeScript source.',
    fix: 'Save only the code: strip "User:"/"Assistant:" transcript labels and ``` Markdown fences, or keep the transcript as documentation instead of a source module.'
  };
}

/**
 * Blank the contents of string and template literals (preserving delimiters,
 * structure, and newlines) so line-anchored scans can distinguish real code
 * tokens from text that merely lives inside a literal.
 */
function blankStringContents(source) {
  let output = '';
  let quote = '';
  let escaped = false;
  for (let index = 0; index < source.length; index++) {
    const character = source[index];
    if (quote) {
      if (escaped) {
        escaped = false;
        output += character === '\n' ? '\n' : ' ';
      } else if (character === '\\') {
        escaped = true;
        output += ' ';
      } else if (character === quote) {
        quote = '';
        output += character;
      } else {
        output += character === '\n' ? '\n' : ' ';
      }
      continue;
    }
    if (character === "'" || character === '"' || character === '`') {
      quote = character;
      output += character;
      continue;
    }
    output += character;
  }
  return output;
}

function isClearlyMismatchedComponent(directory, moduleName) {
  const target = moduleName.slice('snice-'.length);
  const topLevel = new Set([
    'modal',
    'table',
    'toast',
    'input',
    'textarea',
    'select',
    'checkbox',
    'radio',
    'tabs',
    'pagination',
    'notification-center'
  ]);
  return topLevel.has(target) && target !== directory;
}

function lifecycleFix(name) {
  if (name === 'connectedCallback') {
    return 'Replace the callback with @ready() for first connection and @reconnect() for later connections.';
  }
  if (name === 'disconnectedCallback') {
    return 'Replace the callback with @dispose() for disconnect cleanup.';
  }
  return 'Replace the callback with @adopted().';
}

function parseNamedImports(clause) {
  return parseNamedImportEntries(clause).map(binding => binding.imported);
}

function parseNamedImportEntries(clause) {
  if (!clause) return [];
  const braces = clause.match(/\{([\s\S]*?)\}/);
  if (!braces) return [];
  return braces[1]
    .split(',')
    .map(value => {
      const cleaned = value.trim().replace(/^type\s+/, '');
      if (!cleaned) return null;
      const [imported, local = imported] = cleaned.split(/\s+as\s+/);
      return { imported: imported.trim(), local: local.trim() };
    })
    .filter(Boolean);
}

export function isTypeOnlyImport(entry) {
  if (entry.typeOnly) return true;
  if (!entry.clause) return false;
  const braces = entry.clause.trim().match(/^\{([\s\S]*)\}$/);
  if (!braces) return false;
  const specifiers = braces[1].split(',').map(specifier => specifier.trim()).filter(Boolean);
  return specifiers.length > 0 && specifiers.every(specifier => /^type\s+/.test(specifier));
}

function importHasProjectUse(source, entry) {
  // Side-effect imports are themselves runtime usage (and are the documented
  // way to register individual Snice custom elements).
  if (!entry.clause) return true;

  const namespace = entry.clause.match(/\*\s+as\s+([A-Za-z_$][\w$]*)/);
  // The observed gauntlet miss is specifically a cargo-culted namespace
  // import. Named/default import liveness belongs to TypeScript or a linter;
  // broadening this project rule into an incomplete identifier-use checker
  // would create false positives for otherwise valid authored imports.
  if (!namespace) return true;

  const outsideImport = `${source.slice(0, entry.index)}${' '.repeat(entry.end - entry.index)}${source.slice(entry.end)}`;
  return hasCodeIdentifier(outsideImport, namespace[1]);
}

function hasCodeIdentifier(source, target) {
  const stack = [{ kind: 'code', templateExpression: false, braces: 0 }];
  let index = 0;
  while (index < source.length) {
    const frame = stack.at(-1);
    const character = source[index];

    if (frame.kind === 'quoted') {
      if (character === '\\') index += 2;
      else {
        index++;
        if (character === frame.quote) stack.pop();
      }
      continue;
    }
    if (frame.kind === 'regex') {
      if (character === '\\') {
        index += 2;
      } else if (character === '[') {
        frame.characterClass = true;
        index++;
      } else if (character === ']' && frame.characterClass) {
        frame.characterClass = false;
        index++;
      } else if (character === '/' && !frame.characterClass) {
        index++;
        while (/[A-Za-z]/.test(source[index] ?? '')) index++;
        stack.pop();
      } else {
        index++;
      }
      continue;
    }
    if (frame.kind === 'template') {
      if (character === '\\') {
        index += 2;
      } else if (character === '`') {
        stack.pop();
        index++;
      } else if (character === '$' && source[index + 1] === '{') {
        stack.push({ kind: 'code', templateExpression: true, braces: 1 });
        index += 2;
      } else {
        index++;
      }
      continue;
    }

    if (character === "'" || character === '"') {
      stack.push({ kind: 'quoted', quote: character });
      index++;
      continue;
    }
    if (character === '`') {
      stack.push({ kind: 'template' });
      index++;
      continue;
    }
    if (character === '/' && startsRegexLiteral(source, index)) {
      stack.push({ kind: 'regex', characterClass: false });
      index++;
      continue;
    }
    if (frame.templateExpression && character === '{') {
      frame.braces++;
      index++;
      continue;
    }
    if (frame.templateExpression && character === '}') {
      frame.braces--;
      index++;
      if (frame.braces === 0) stack.pop();
      continue;
    }
    if (/[A-Za-z_$]/.test(character)) {
      let end = index + 1;
      while (/[\w$]/.test(source[end] ?? '')) end++;
      if (source.slice(index, end) === target) return true;
      index = end;
      continue;
    }
    index++;
  }
  return false;
}

function startsRegexLiteral(source, slashIndex) {
  let previous = slashIndex - 1;
  while (previous >= 0 && /\s/.test(source[previous])) previous--;
  if (previous < 0 || /[([{=:;,!?&|+*%^~<>-]/.test(source[previous])) return true;
  if (!/[\w$]/.test(source[previous])) return false;
  let start = previous;
  while (start > 0 && /[\w$]/.test(source[start - 1])) start--;
  return /^(?:return|case|throw|else|do|typeof|instanceof|in|of|yield|await|void|delete)$/.test(
    source.slice(start, previous + 1)
  );
}

function reactExportReplacement(name) {
  if (name === 'SniceRoute') return 'Route';
  if (name === 'SniceApp') return 'SniceProvider (or SniceRouter)';
  if (name === 'SniceDialog') return 'Modal';
  if (!name.startsWith('Snice')) return '';
  const unprefixed = name.slice('Snice'.length);
  return REACT_EXPORTS.has(unprefixed)
    ? unprefixed
    : `a documented unprefixed export (if that component exists)`;
}

function buildSourceProvenance(source) {
  const imports = findImports(source);
  const rootBindings = new Map();
  const reactBindings = [];
  const componentVariables = new Map();
  for (const entry of imports) {
    if (entry.path === 'snice') {
      for (const binding of parseNamedImportEntries(entry.clause)) {
        const list = rootBindings.get(binding.imported) ?? [];
        list.push({ ...binding, index: entry.index, path: entry.path });
        rootBindings.set(binding.imported, list);
      }
    }
    if (entry.path === 'snice/react' || entry.path === '@snice/react') {
      for (const binding of parseNamedImportEntries(entry.clause)) {
        const normalizedExport = normalizeReactExport(binding.imported);
        reactBindings.push({
          ...binding,
          normalizedExport,
          wrapper: REACT_WRAPPERS[normalizedExport] ?? null,
          index: entry.index,
          path: entry.path
        });
      }
    }
  }
  for (const match of source.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:document\.)?querySelector(?:<[^>]+>)?\(\s*['"](snice-[a-z0-9-]+)['"]\s*\)/g)) {
    if (COMPONENT_CONTRACTS[match[2]]) componentVariables.set(match[1], match[2]);
  }
  return { imports, rootBindings, reactBindings, componentVariables };
}

function normalizeReactExport(name) {
  if (REACT_EXPORTS.has(name)) return name;
  if (name === 'SniceRoute') return 'Route';
  if (name === 'SniceApp') return 'SniceProvider';
  if (name === 'SniceDialog') return 'Modal';
  if (name.startsWith('Snice') && REACT_EXPORTS.has(name.slice('Snice'.length))) {
    return name.slice('Snice'.length);
  }
  return '';
}

function localsFor(bindings, imported) {
  return (bindings.get(imported) ?? []).map(binding => binding.local);
}

function reactWrapperOpenings(context, predicate = () => true) {
  const openings = [];
  for (const binding of context.provenance.reactBindings) {
    if (!binding.wrapper || !predicate(binding.wrapper)) continue;
    for (const opening of findOpeningTags(context.source, [binding.local])) {
      openings.push({ ...opening, binding, wrapper: binding.wrapper });
    }
  }
  return openings;
}

function reactExportOpenings(context, exportName) {
  const openings = [];
  for (const binding of context.provenance.reactBindings) {
    if (binding.normalizedExport !== exportName) continue;
    for (const opening of findOpeningTags(context.source, [binding.local])) {
      openings.push({ ...opening, binding });
    }
  }
  return openings;
}

function reportReactOpeningIssue(context, exportName, predicate, detail) {
  for (const opening of reactExportOpenings(context, exportName)) {
    if (predicate(opening)) context.report(opening.index, detail);
  }
}

function validateReactEventProps(context, opening) {
  const released = new Set(Object.values(opening.wrapper.events));
  const authoredPattern = /(?:^|\s)(onSnice[A-Z][\w$]*)\s*=/g;
  for (const match of opening.text.matchAll(authoredPattern)) {
    const authored = match[1];
    if (released.has(authored)) continue;
    const available = [...released].sort();
    context.report(opening.index + match.index + match[0].indexOf(authored), {
      message: `${opening.wrapper.exportName} has no ${authored} event prop in the generated React adapter contract.`,
      fix: available.length
        ? `Use one of the released custom-event props: ${available.join(', ')}.`
        : `${opening.wrapper.exportName} exposes no Snice custom-event props.`
    });
  }
}

/**
 * Statically parse the authored attribute names of a JSX opening tag.
 * Expression containers and spreads ({...props}) are skipped: their contents
 * cannot be proven statically and must not be guessed at. Returns entries in
 * authored order with offsets relative to the opening-tag text.
 */
function parseJsxAttributeNames(text) {
  const attributes = [];
  // Skip '<' and the tag name.
  let index = 1;
  while (index < text.length && !/[\s/>]/.test(text[index])) index++;

  while (index < text.length) {
    const character = text[index];
    if (character === '>' || (character === '/' && text[index + 1] === '>')) break;
    if (/\s/.test(character)) {
      index++;
      continue;
    }
    if (character === '{') {
      const close = findMatchingDelimiter(text, index, '{', '}');
      if (close < 0) break;
      index = close + 1;
      continue;
    }
    const nameStart = index;
    while (index < text.length && !/[\s=/>{]/.test(text[index])) index++;
    const name = text.slice(nameStart, index);
    while (index < text.length && /\s/.test(text[index])) index++;
    if (text[index] === '=') {
      index++;
      while (index < text.length && /\s/.test(text[index])) index++;
      if (text[index] === '{') {
        const close = findMatchingDelimiter(text, index, '{', '}');
        if (close < 0) break;
        index = close + 1;
      } else if (text[index] === '"' || text[index] === "'") {
        const quote = text[index];
        index++;
        while (index < text.length && text[index] !== quote) index++;
        index++;
      }
    }
    if (name) attributes.push({ name, index: nameStart });
  }
  return attributes;
}

function levenshteinDistance(left, right) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i++) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= right.length; j++) {
      const saved = previous[j];
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + (left[i - 1] === right[j - 1] ? 0 : 1)
      );
      diagonal = saved;
    }
  }
  return previous[right.length];
}

function closestContractName(name, candidates) {
  let best = null;
  let bestDistance = Infinity;
  for (const candidate of [...candidates].sort()) {
    const distance = levenshteinDistance(name.toLowerCase(), candidate.toLowerCase());
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best !== null && bestDistance > 0 && bestDistance <= Math.max(2, Math.floor(name.length / 3))
    ? best
    : null;
}

function isNativeReactProp(name) {
  if (NATIVE_REACT_PROPS.has(name) || NATIVE_REACT_EVENT_PROPS.has(name)) return true;
  if (name.endsWith('Capture')) {
    return NATIVE_REACT_EVENT_PROPS.has(name.slice(0, -'Capture'.length));
  }
  return false;
}

/**
 * Distinguish `<Name` used as a JSX opening tag from the same spelling in
 * type-argument position: `useRef<SniceFormRef>(null)`, `Map<string, Placard>`,
 * `Promise<Placard | null>`. Type positions are the legitimate usage of a
 * type-only export and must never be reported as JSX.
 */
function isTypeArgumentUsage(source, opening) {
  // Identifier/dot directly before '<': generic instantiation (useRef<X>, React.Ref<X>).
  const before = source[opening.index - 1] ?? '';
  if (/[\w$.]/.test(before)) return true;
  // The tag text itself contains a type union or parameter list.
  if (/[|,]/.test(opening.text.slice(opening.name.length + 1))) return true;
  // A call immediately follows: useRef<SniceFormRef>(null).
  if (/^\s*\(/.test(source.slice(opening.index + opening.text.length))) return true;
  // An unclosed generic parameter list earlier on the line: Map<string, Placard>.
  const lineStart = source.lastIndexOf('\n', opening.index) + 1;
  const linePrefix = source.slice(lineStart, opening.index);
  if (/[A-Za-z_$][\w$]*<[^>]*$/.test(linePrefix)) return true;
  return false;
}

/**
 * Manifest-backed unsupported-prop validation: report statically authored
 * JSX attributes that are neither part of the generated wrapper contract
 * (properties, interface props, event props) nor the standard React/HTML
 * surface inherited through SniceBaseProps. Targeted diagnostics own their
 * specific props (see TARGETED_WRAPPER_PROPS) so nothing double-reports.
 */
function validateUnsupportedWrapperProps(context, opening) {
  const wrapper = opening.wrapper;
  const contractNames = new Set([
    ...wrapper.properties,
    ...(wrapper.interfaceProps ?? []),
    ...Object.values(wrapper.events)
  ]);
  const targeted = TARGETED_WRAPPER_PROPS[wrapper.exportName] ?? new Set();

  for (const attribute of parseJsxAttributeNames(opening.text)) {
    const name = attribute.name;
    if (contractNames.has(name) || targeted.has(name)) continue;
    if (name === 'children' || name === 'key' || name === 'ref') continue;
    if (name.startsWith('aria-') || name.startsWith('data-')) continue;
    if (/^onSnice[A-Z]/.test(name)) continue; // owned by validateReactEventProps
    if (isNativeReactProp(name)) continue;

    const suggestion = closestContractName(name, contractNames);
    context.report(opening.index + attribute.index, {
      message: `${wrapper.exportName} has no ${name} prop in the generated React adapter contract.`,
      fix: suggestion
        ? `Did you mean ${suggestion}? Otherwise remove ${name}; unsupported props are forwarded as attributes and silently do nothing.`
        : `Remove ${name}; unsupported props are forwarded as attributes and silently do nothing. Review the documented ${wrapper.exportName} props in the generated adapter contract.`
    });
  }
}

function validateReactEventHandler(context, opening, eventPropName) {
  const handlerPattern = new RegExp(`(?:^|\\s)${escapeRegExp(eventPropName)}\\s*=\\s*\\{([^}]*)\\}`, 'g');
  for (const match of opening.text.matchAll(handlerPattern)) {
    const expression = match[1].trim();
    const handler = resolveLocalReactHandler(context.source, expression);
    if (!handler || !handlerReadsNativeTarget(handler)) continue;
    context.report(opening.index + match.index, {
      message: `Handler for ${eventPropName} reads ${handler.parameter}.target/.currentTarget, but Snice custom-event values are in ${handler.parameter}.detail.`,
      fix: `Read the documented ${handler.parameter}.detail payload instead of treating the Snice event as a native React change event.`
    });
  }
}

function resolveLocalReactHandler(source, expression) {
  const inline = parseArrowHandler(expression);
  if (inline) return inline;
  if (!/^[A-Za-z_$][\w$]*$/.test(expression)) return null;

  const name = escapeRegExp(expression);
  const declaration = new RegExp(`\\bfunction\\s+${name}\\s*\\(`).exec(source);
  if (declaration) {
    const open = source.indexOf('(', declaration.index);
    const close = findMatchingDelimiter(source, open, '(', ')');
    if (close >= 0) {
      const bodyOpen = source.indexOf('{', close);
      const bodyClose = bodyOpen >= 0 ? findMatchingDelimiter(source, bodyOpen, '{', '}') : -1;
      if (bodyClose >= 0) {
        return buildReactHandler(
          source.slice(open + 1, close),
          source.slice(bodyOpen + 1, bodyClose)
        );
      }
    }
  }

  const assignment = new RegExp(`\\b(?:const|let)\\s+${name}\\s*=\\s*`).exec(source);
  if (!assignment) return null;
  const valueStart = assignment.index + assignment[0].length;
  const value = source.slice(valueStart);

  const functionExpression = /^function\s*\(/.exec(value);
  if (functionExpression) {
    const open = value.indexOf('(', functionExpression.index);
    const close = findMatchingDelimiter(value, open, '(', ')');
    const bodyOpen = close >= 0 ? value.indexOf('{', close) : -1;
    const bodyClose = bodyOpen >= 0 ? findMatchingDelimiter(value, bodyOpen, '{', '}') : -1;
    if (close >= 0 && bodyClose >= 0) {
      return buildReactHandler(
        value.slice(open + 1, close),
        value.slice(bodyOpen + 1, bodyClose)
      );
    }
    return null;
  }

  return parseArrowHandler(value);
}

function parseArrowHandler(source) {
  const arrow = findTopLevelArrow(source);
  if (arrow < 0) return null;
  const signature = source.slice(0, arrow).trim();
  let parameters = signature;
  if (signature.startsWith('(')) {
    const close = findMatchingDelimiter(signature, 0, '(', ')');
    if (close < 0 || signature.slice(close + 1).trim()) return null;
    parameters = signature.slice(1, close);
  }
  const bodyStart = arrow + 2;
  const remainder = source.slice(bodyStart).trimStart();
  let body;
  if (remainder.startsWith('{')) {
    const close = findMatchingDelimiter(remainder, 0, '{', '}');
    if (close < 0) return null;
    body = remainder.slice(1, close);
  } else {
    body = remainder.split(/[;\n]/, 1)[0];
  }
  return buildReactHandler(parameters, body);
}

function findTopLevelArrow(source) {
  let round = 0;
  let square = 0;
  let angle = 0;
  let quote = '';
  let escaped = false;
  for (let index = 0; index < source.length - 1; index++) {
    const character = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = '';
      continue;
    }
    if (character === '"' || character === "'" || character === '`') {
      quote = character;
      continue;
    }
    if (character === '(') round++;
    else if (character === ')') round--;
    else if (character === '[') square++;
    else if (character === ']') square--;
    else if (character === '<') angle++;
    else if (character === '>' && source[index - 1] !== '=') angle = Math.max(0, angle - 1);
    if (character === '=' && source[index + 1] === '>' && round === 0 && square === 0 && angle === 0) {
      return index;
    }
  }
  return -1;
}

function buildReactHandler(parameters, body) {
  const first = parameters.split(',', 1)[0].trim();
  const parameter = /^([A-Za-z_$][\w$]*)/.exec(first)?.[1];
  return parameter ? { parameter, body } : null;
}

function handlerReadsNativeTarget(handler) {
  return new RegExp(`\\b${escapeRegExp(handler.parameter)}\\s*\\.\\s*(?:target|currentTarget)\\b`).test(handler.body);
}

function validateLiteralAttributes(context, opening, component, react) {
  if (!component) return;
  if (react) {
    for (const [propertyName, property] of Object.entries(component.properties)) {
      if (!property.attribute) continue;
      const literals = component.attributes[property.attribute]?.literals ?? [];
      validateOneLiteral(context, opening, propertyName, literals, component);
    }
    return;
  }
  for (const [attributeName, attribute] of Object.entries(component.attributes)) {
    validateOneLiteral(context, opening, attributeName, attribute.literals, component);
  }
}

function validateOneLiteral(context, opening, name, literals, component) {
  if (!literals?.length) return;
  const authored = findStaticAttributeValue(opening.text, name);
  if (!authored || literals.includes(authored.value)) return;
  const buttonOutline = component.tagName === 'snice-button' && name === 'variant' && authored.value === 'outline';
  context.report(opening.index + authored.index, {
    message: `${component.tagName} ${name}="${authored.value}" is not in its released literal contract.`,
    fix: buttonOutline
      ? 'Remove variant="outline" and use the boolean outline prop/attribute.'
      : `Use one of: ${literals.join(', ')}.`
  });
}

function findStaticAttributeValue(opening, name) {
  const expression = new RegExp(`(?:^|\\s)${escapeRegExp(name)}\\s*=\\s*(?:\\{\\s*)?(['"])([^'"]*)\\1`);
  const match = expression.exec(opening);
  return match ? { index: match.index + match[0].indexOf(name), value: match[2] } : null;
}

function findAuthoredAttribute(opening, name) {
  const expression = new RegExp(`(?:^|\\s)${escapeRegExp(name)}(?=\\s|=|/?>)`);
  const match = expression.exec(opening);
  return match ? { index: match.index + match[0].indexOf(name) } : null;
}

function findElementBody(source, opening) {
  if (/\/\s*>$/.test(opening.text)) return null;
  const bodyStart = opening.index + opening.text.length;
  const closePattern = new RegExp(`</${escapeRegExp(opening.name)}\\s*>`, 'g');
  closePattern.lastIndex = bodyStart;
  const close = closePattern.exec(source);
  if (!close) return null;
  return {
    bodyStart,
    body: source.slice(bodyStart, close.index),
    end: close.index + close[0].length
  };
}

/**
 * Classify React usage from project and file evidence rather than from the
 * text `<snice-...>` alone: react/react-dom dependencies, a TypeScript JSX
 * compiler mode, imports from react (or snice/react), and JSX-capable
 * .tsx/.jsx sources. Non-React TypeScript/web-component projects produce no
 * evidence and are never scanned for raw Snice JSX.
 */
function detectReactEvidence(files) {
  let project = false;
  const reactFiles = new Set();
  for (const file of files) {
    if (/(?:^|[/\\])package\.json$/.test(file.filename)) {
      let data;
      try {
        data = JSON.parse(file.source);
      } catch {
        continue;
      }
      for (const field of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
        const declared = data?.[field];
        if (declared && typeof declared === 'object' && ('react' in declared || 'react-dom' in declared)) {
          project = true;
        }
      }
      continue;
    }
    if (/(?:^|[/\\])tsconfig[^/\\]*\.json$/.test(file.filename)) {
      if (/"jsx"\s*:\s*"react/.test(file.source)) project = true;
      continue;
    }
    if (!/\.[cm]?[jt]sx?$/.test(file.filename)) continue;
    if (/\.[cm]?[jt]sx$/.test(file.filename)) reactFiles.add(file.filename);
    for (const entry of findImports(maskComments(file.source))) {
      if (
        entry.path === 'react' ||
        entry.path === 'react-dom' ||
        entry.path.startsWith('react/') ||
        entry.path.startsWith('react-dom/') ||
        entry.path === 'snice/react' ||
        entry.path === '@snice/react'
      ) {
        reactFiles.add(file.filename);
      }
    }
  }
  return { project, files: reactFiles };
}

function collectReactJsxIntrinsicTyping(files) {
  const tags = new Set();
  let all = false;
  for (const file of files) {
    for (const match of file.source.matchAll(/\binterface\s+IntrinsicElements\s*\{/g)) {
      const open = file.source.indexOf('{', match.index);
      const close = findMatchingDelimiter(file.source, open, '{', '}');
      if (close < 0) continue;
      const body = file.source.slice(open + 1, close);
      if (/\[\s*[A-Za-z_$][\w$]*\s*:\s*string\s*\]\s*[?:]/.test(body)) all = true;
      for (const tag of body.matchAll(/['"]?(snice-[a-z0-9-]+)['"]?\s*[?:]/gi)) {
        tags.add(tag[1].toLowerCase());
      }
    }
  }
  return { all, tags };
}

function normalizeProjectFiles(files) {
  let entries;
  if (Array.isArray(files)) {
    entries = files.map(file => {
      if (!file || typeof file !== 'object' || typeof file.filename !== 'string' || typeof file.source !== 'string') {
        throw new TypeError('project files must contain string filename and source fields');
      }
      return { filename: file.filename, source: file.source };
    });
  } else if (files && typeof files === 'object') {
    entries = Object.entries(files).map(([filename, source]) => {
      if (typeof source !== 'string') throw new TypeError('project file sources must be strings');
      return { filename, source };
    });
  } else {
    throw new TypeError('files must be an array or filename-to-source object');
  }
  const names = new Set();
  for (const entry of entries) {
    if (names.has(entry.filename)) throw new TypeError(`duplicate project filename: ${entry.filename}`);
    names.add(entry.filename);
  }
  return entries.sort((left, right) => left.filename.localeCompare(right.filename));
}

function isFrameworkImplementation(filename) {
  return /(?:^|[/\\])packages[/\\]components[/\\]src(?:[/\\]|$)/.test(filename);
}

function sourceLocation(source, index) {
  const prefix = source.slice(0, index);
  const line = prefix.split('\n').length;
  const lastNewline = prefix.lastIndexOf('\n');
  return { line, column: index - lastNewline };
}

function compareDiagnostics(left, right) {
  return (
    left.line - right.line ||
    left.column - right.column ||
    severityRank(left.severity) - severityRank(right.severity) ||
    left.ruleId.localeCompare(right.ruleId) ||
    left.message.localeCompare(right.message)
  );
}

function compareProjectDiagnostics(left, right) {
  return (
    (left.file ?? '').localeCompare(right.file ?? '') ||
    compareDiagnostics(left, right)
  );
}

function severityRank(severity) {
  return { error: 0, warning: 1, suggestion: 2 }[severity] ?? 3;
}

function findPattern(source, pattern) {
  const match = pattern.exec(source);
  return match?.index ?? -1;
}

function findFirstPattern(source, patterns) {
  let first = -1;
  for (const pattern of patterns) {
    const index = findPattern(source, pattern);
    if (index >= 0 && (first < 0 || index < first)) first = index;
  }
  return first;
}

/**
 * Detect a modal-worthy implementation conservatively. A native <dialog>, an
 * explicit role="dialog" paired with aria-modal, or a modal-backdrop/overlay
 * class paired with modal-content/modal-dialog (or role="dialog") are the only
 * signals treated as an unmistakable custom modal. The bare word "modal" in a
 * string or comment, and Snice's own Modal wrapper/tag, never match.
 */
function detectModalImplementation(source) {
  const native = findPattern(source, /<dialog\b/);

  const roleDialog = findPattern(source, /\brole\s*=\s*["']dialog["']/i);
  const ariaModal = findPattern(source, /\baria-modal\b/i);
  const ariaPaired = roleDialog >= 0 && ariaModal >= 0 ? Math.min(roleDialog, ariaModal) : -1;

  const backdrop = findPattern(source, /\bmodal-(?:backdrop|overlay)\b/i);
  const content = findFirstPattern(source, [
    /\bmodal-(?:content|dialog)\b/i,
    /\brole\s*=\s*["']dialog["']/i
  ]);
  const classPaired = backdrop >= 0 && content >= 0 ? Math.min(backdrop, content) : -1;

  const candidates = [native, ariaPaired, classPaired].filter(index => index >= 0);
  return candidates.length ? Math.min(...candidates) : -1;
}

function extractStringLiteral(source, index) {
  if (index >= source.length) return null;
  const quote = source[index];
  if (quote !== '"' && quote !== "'" && quote !== '`') return null;
  let literal = '';
  let escaped = false;
  for (let i = index + 1; i < source.length; i++) {
    const char = source[i];
    if (escaped) {
      escaped = false;
      literal += char;
    } else if (char === '\\') {
      escaped = true;
    } else if (char === quote) {
      return literal;
    } else {
      literal += char;
    }
  }
  return null;
}

function camelToKebab(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
}

function kebabToCamel(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findOpeningTags(source, names) {
  const openings = [];
  const namePattern = [...names]
    .sort((left, right) => right.length - left.length || left.localeCompare(right))
    .map(escapeRegExp)
    .join('|');
  const pattern = new RegExp(`<(${namePattern})(?=\\s|/?>)`, 'g');
  for (const match of source.matchAll(pattern)) {
    const end = findOpeningTagEnd(source, match.index);
    if (end < 0) continue;
    openings.push({
      index: match.index,
      name: match[1],
      text: source.slice(match.index, end + 1)
    });
  }
  return openings;
}

/**
 * Find `\\"` / `\\'` used to "escape" the active HTML attribute delimiter
 * inside a Snice html`` template. JavaScript cooks away that backslash, while
 * HTML has no backslash escape, so the browser sees an early closing quote.
 */
function findEscapedHtmlAttributeQuotes(source, htmlNames) {
  if (!htmlNames.length) return [];
  const names = [...new Set(htmlNames)].map(escapeRegExp).join('|');
  const starts = new RegExp(`\\b(?:${names})\\s*\``, 'g');
  const findings = [];

  for (const start of source.matchAll(starts)) {
    if (source[start.index - 1] === '.') continue;
    let inTag = false;
    let attributeQuote = '';
    for (let index = start.index + start[0].length; index < source.length; index++) {
      const character = source[index];
      const next = source[index + 1];

      if (character === '\\') {
        if (inTag && attributeQuote && next === attributeQuote) {
          findings.push({ index, quote: attributeQuote });
          break;
        }
        index++;
        continue;
      }
      if (character === '`') break;
      if (character === '$' && next === '{') {
        const close = findMatchingDelimiter(source, index + 1, '{', '}');
        if (close < 0) break;
        index = close;
        continue;
      }
      if (!inTag) {
        if (character === '<' && /[A-Za-z!/?]/.test(next ?? '')) inTag = true;
        continue;
      }
      if (attributeQuote) {
        if (character === attributeQuote) attributeQuote = '';
        continue;
      }
      if (character === '"' || character === "'") attributeQuote = character;
      else if (character === '>') inTag = false;
    }
  }
  return findings;
}

function findOpeningTagEnd(source, start) {
  let braceDepth = 0;
  let quote = '';
  let escaped = false;
  for (let index = start; index < source.length; index++) {
    const character = source[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === quote) {
        quote = '';
      }
      continue;
    }
    if (character === "'" || character === '"' || character === '`') {
      quote = character;
      continue;
    }
    if (character === '{') braceDepth++;
    else if (character === '}') braceDepth = Math.max(0, braceDepth - 1);
    else if (character === '>' && braceDepth === 0) return index;
  }
  return -1;
}

function findStaticColumnsExpression(opening) {
  const binding = opening.match(/(?:\.columns\s*=\s*\$\{|(?:^|\s)columns\s*=\s*\{)/);
  if (!binding) return null;
  const openBrace = opening.indexOf('{', binding.index);
  const closeBrace = findMatchingDelimiter(opening, openBrace, '{', '}');
  if (closeBrace < 0) return null;
  const expression = opening.slice(openBrace + 1, closeBrace);
  if (!expression.trimStart().startsWith('[')) return null;
  return { text: expression, offset: openBrace + 1 };
}
