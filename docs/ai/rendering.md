# Declarative Rendering Reference

## Authoring

```typescript
@element('my-view')
class MyView extends SniceElement {
  static styles = css`:host { display:block }`;
  static renderOptions = { debounce: 20 };

  @property() userId = '';                 // attr input + reflection
  @property({ reflect: false }) input = ''; // attr input, no output
  @property({ attribute: false }) api!: Api; // JS only
  @state() open = false;                   // reactive, never an attr
  @state({ deep: true }) model = { rows: [] as Row[] };

  render() { return html`...`; }
}
```

- `SniceElement` optional; plain `HTMLElement` + `@render()` / `@styles()` remains supported.
- `SniceElement`: conventional `render()`, static `styles`, static `renderOptions`, kebab implicit attrs, `invalidate()`, `renderNow()`.
- JS property assignment preserves value/type/identity. `type` and `converter.fromAttribute` apply only to string attributes.
- `reflect` defaults true. `reflect:false`: attr→prop only. `attribute:false`: neither direction.
- `@state(options?: { deep?, hasChanged? })`: no attribute channel.
- `deep:true`: nested plain object/array/Map/Set writes; cycles + stable proxies; uses native Proxy/Reflect; no IE; class instances remain intact.

## Bindings

```typescript
${value}                       // node
title=${value}                 // attribute
data-x="a ${value}"            // interpolated attribute
.value=${value}                // property
?disabled=${boolean}           // boolean attribute
@click=${handler}              // event
class:active=${boolean}        // one class
style:color=${value}           // one CSS property
style:--token=${value}         // custom property
...props=${object}             // property spread
...attrs=${object}             // attribute spread
...events=${object}            // event spread
```

Event modifiers: `|prevent`, `|stop`, `|immediate`, `|once`, `|capture`, `|passive`, `|self`. Aliases: `preventDefault`, `stopPropagation`, `stopImmediatePropagation`. `passive|prevent` invalid. Keyboard filters: `@keydown.enter`, `@keydown.ctrl+s`, `@keyup.~enter`; dot or colon syntax.

Event/spread handlers accept functions or EventListenerObject; null/false removes. Duplicate normalized spread names are invalid. Parked branches pause listeners; removing a host retains listeners on its retained DOM. Consumed `|once` and `EventListenerObject.once` state is retained.

## Built-in directives

```typescript
const button = createRef<HTMLButtonElement>();
html`<button ${ref(button)} ${use(action, value)}>`;

html`<input ${props(p)} ${attrs(a)} ${events(e)}>`;

html`<input .value=${bind(this, 'query', {
  event: 'change', toView, fromView
})}>`;

repeat(items, { key, render, empty? })
resource(promiseOrIterableOrSignalFunction, { pending?, ready?, error? })
portal(parentOrSelectorOrFunction, content)
transition(content, { key?, mode?, out?, in?, outDuration?, inDuration?, respectReducedMotion?, onStart?, onComplete? })
```

- `ref`: object/callback; clears to null on disconnect/retarget.
- `use`: action returns cleanup function or `{ update?, destroy? }`.
- `bind`: property binding only; inferred native events; IME-safe.
- direct Promise/AsyncIterable values work in node expressions.
- `resource` aborts/restarts source functions and ignores stale results.
- `portal` retains component event ownership outside render root.
- `transition`: wrapper-free; sequential default; reduced-motion default true.

## Control flow

```typescript
<if ${a}>
  A
  <else-if ${b}>B</else-if>
  <else>C</else>
</if>

<case ${value}>
  <when value="string-match">static</when>
  <when ${typedValue}>Object.is match</when>
  <default>fallback</default>
</case>

<component ${tag} ...attrs=${attrs}>children</component>
```

- Virtual tags add no elements.
- if/case branch DOM is parked and restored by identity.
- `repeat` requires keys, moves DOM by key, rejects duplicates, accepts any iterable.
- `<component>` validates tag, preserves HTML/SVG namespace, retargets bindings; null/false/nothing removes it. HTML void targets park children and restore their identity on a later non-void target.

## Render roots

```typescript
@element('x-open')                              // open shadow
@element('x-closed', { shadow: 'closed' })
@element('x-light', { renderRoot: 'light' })
@element('x-light-2', { shadow: false })
@element('x-focus', { delegatesFocus: true })
```

Custom `createRenderRoot()` must return host or ShadowRoot. Styles, queries, directives, events, reconnect work in all modes; framework queries work with closed roots.
Conflicting `renderRoot`/`shadow` pairs throw. An explicit child root option overrides an inherited root kind.

## Directive protocol

```typescript
class D extends Directive {
  static renderToString(values, context) { return context.async ? promise : value; }
  render(...values) {}
  update(part: DirectivePart, values) {}
  disconnected(context?: DirectiveDisconnectContext) {} // reason: host | branch | dispose
  reconnected() {}
  adopted(nodeMap) {}
}
const d = directive<D, readonly [Arg]>(D);
directiveServerResult('attributes' | 'properties' | 'events' | 'boundary', value, name?)
```

Part types: `node | attribute | property | boolean-attribute | event | element | class | style | spread`. `part.setValue(value)` publishes later. One retained instance per directive class/expression slot. Disconnect context distinguishes retained-host, parked-branch, and permanent-disposal lifecycles.

## SSR / hydration

```typescript
renderToString(template, { hydratable?: boolean }): string
renderToStringAsync(template, options): Promise<string>
renderElementToString(tag, template, { renderRoot?, shadow?: 'open'|'closed'|false, attributes?, styles?, delegatesFocus?, hydratable? }): string
renderElementToStringAsync(tag, template, options): Promise<string>
hydrate(template, container, { onMismatch?: 'throw' | 'replace' }): TemplateInstance
hydrateElement(element, template, options): TemplateInstance
```

- Sync SSR: DOM-free, hydration boundaries, `resource` pending branch.
- Async SSR: awaits Promise, consumes AsyncIterable latest, async directives/attrs/control flow/components.
- Element SSR: light DOM or declarative shadow DOM; `data-snice-hydrate` by default.
- First component render auto-hydrates a marked host and retains matching DOM identity/styles.
- Mismatch default throws `HydrationError` with path; `replace` mounts fresh DOM.

## Metadata

- `custom-elements.json`
- `vscode.html-custom-data.json`
- `snice/components/custom-elements` declarations
- Commands: `npm run generate:metadata`, `npm run check:metadata`
