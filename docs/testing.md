<!-- AI: For the AI-optimized version of this doc, see docs/ai/testing.md -->
# Testing

Snice elements are custom elements, so they test in any DOM-capable runner. The only Snice-specific part is knowing when an element is ready to assert against.

## The Two Promises

Rendering is asynchronous and batched, so assertions must wait.

| Promise | Await it | Resolves when |
|---|---|---|
| `el.ready` | after mounting, before the first assertion | the first render is done and every `@ready()` handler has finished |
| `el.rendered` | after writing a reactive property | the render queued by that write has been applied |

```typescript
import { describe, it, expect } from 'vitest';
import './my-counter';

describe('my-counter', () => {
  it('renders its initial count', async () => {
    const el = document.createElement('my-counter');
    document.body.appendChild(el);
    await el.ready;

    expect(el.shadowRoot.querySelector('button').textContent).toBe('0');
  });

  it('re-renders when the count changes', async () => {
    const el = document.createElement('my-counter');
    document.body.appendChild(el);
    await el.ready;

    el.count = 5;
    await el.rendered;

    expect(el.shadowRoot.querySelector('button').textContent).toBe('5');
  });
});
```

Awaiting `ready` on an element that never connects will hang; append it to the document first.

`ready` rejects when any `@ready()` handler throws or returns a rejected
promise. Always await it: the rejection points at the initialization failure
instead of allowing later assertions to fail against a half-initialized
element. Snice form controls also retain their native-input/proxy fallback in
DOM runners such as jsdom that expose only the ARIA subset of
`ElementInternals`.

## Strict Render Errors

Rendering logs failures by default and retains the previous DOM. Tests that need a synchronous render failure to fail the assertion directly can temporarily enable strict mode:

```typescript
import { setStrictRenderErrors } from 'snice';

try {
  setStrictRenderErrors(true);
  expect(() => { element.invalid = true; }).toThrow(/<my-element> \(MyElement\)/);
} finally {
  setStrictRenderErrors(false);
}
```

Template parse and authoring errors identify the owning component by its authoritative registered tag and, when safely available, its class, and include a nearby static-template excerpt. Minified CDN constructors may have no class name, so tests should accept tag-only attribution. Attribution requires the exact constructor and immediate prototype successfully registered by `@element`, `@layout`, or Router (or that exact constructor already present in the registry): undecorated subclasses stay generic, and document adoption does not change an instance's captured registration identity. The original error is retained as `cause`, so assertions and debugging can inspect its stack. Snice cannot recover a source filename from a runtime tagged-template value and does not fabricate one. A template prepared outside a component render therefore keeps the generic nearby-template diagnostic.

Promise and async-iterable values settle after the synchronous render call has returned, so their failures are reported through `console.error` even while strict mode is enabled. Spy on `console.error`, wait for the deferred value to settle, and assert against the `Error` argument; it carries the same owning-component context.

## Partial DOM Compatibility

In a simulated DOM, opt into Snice's standards compatibility layer from your
test setup file:

```typescript
import 'snice/testing/dom';
```

The module capability-tests the current DOM and fills only missing IDL
behavior. For example, jsdom and some happy-dom versions omit the browser's
reflective `HTMLElement.autofocus` property for generic custom-element hosts;
the adapter adds that property without replacing an implementation already
provided by the runner. Application tests can then use
`element.autofocus = true` exactly as browser code does.

The adapter does not simulate layout, paint, or real focus navigation. Keep a
browser-test lane for behavior that depends on those capabilities. If a runner
creates its DOM after module evaluation, import and call
`installDOMTestingCompatibility(scope)` explicitly.

## Reading the DOM

Use the element's render root directly:

```typescript
el.shadowRoot.querySelector('.label');
```

For components whose render root may be closed or light, use `@query` inside the component and assert against the property, or select from `el` rather than `el.shadowRoot`. See [Queries](./queries.md).

## Events

Snice events carry their payload in `detail`, so type handlers as `CustomEvent`:

```typescript
const seen: string[] = [];
el.addEventListener('status-changed', (e: CustomEvent) => seen.push(e.detail.value));

el.shadowRoot.querySelector('input').click();
await el.rendered;

expect(seen).toEqual(['done']);
```

Assert on `e.detail`, not `e.target.value`.

## Controllers

A controller attaches asynchronously, so wait for the element before asserting on its effects:

```typescript
import { attachController } from 'snice';

const el = document.createElement('user-list');
document.body.appendChild(el);
await attachController(el, UserController);
```

Swapping a controller is the supported way to test an element in isolation: attach a fixture controller that responds on the same channel the production controller uses, and the element itself never changes. See [Request / Response](./request-response.md) and [Controllers](./controllers.md).

When a controller calls `getContext(this)`, install the same application
context on its host (or an ancestor) before attachment, then release it during
cleanup:

```typescript
import { attachController, detachController, provideContext } from 'snice';

const host = document.createElement('user-list');
document.body.append(host);
const releaseContext = provideContext(host, {
  api: { listUsers: async () => [{ id: 'u1' }] }
}, {
  fetch: async () => new Response(JSON.stringify([{ id: 'u1' }]))
});

try {
  await attachController(host, UserController);
  // assert controller effects
} finally {
  await detachController(host);
  releaseContext();
  host.remove();
}
```

Assigning the host's own `@context` field does not create a provider;
`getContext()` resolves the nearest `provideContext()` boundary.
When production code uses `getContextFetch()`, pass the test fetch function in
the same provider's third argument as shown above. `Router` supplies its
middleware-bound fetch function there in an application.

If the controller uses `@context()`, test it beneath a real `Router` target.
`provideContext()` intentionally provides application state and transport, not
navigation notifications — a `provideContext()` boundary can NEVER satisfy a
`@context()` handler. The handler simply never fires, with no error, so a
harness built on `provideContext()` alone shows a silently empty page and a
green-looking suite. Using `Router` exercises the same registration, initial
catch-up, middleware-aware `ctx.fetch`, updates, and detach cleanup as
production:

```typescript
const router = Router({ target: '#fixture', context: { accountId: 'a1' }, fetcher });

@router.page({ tag: 'fixture-page', routes: ['/fixture'] })
class FixturePage extends HTMLElement {}

router.initialize();
await router.navigate('/fixture');
const host = document.createElement('user-list');
document.querySelector('fixture-page')!.append(host);
await attachController(host, UserController);
```

To re-deliver a Context to an already-attached controller — exactly what
testing a first-delivery guard requires — capture the `Context` on the fixture
page and call its public `update()`, which re-notifies every registered
handler:

```typescript
@router.page({ tag: 'fixture-page', routes: ['/fixture'] })
class FixturePage extends HTMLElement {
  ctx?: Context;
  @context() capture(ctx: Context) { this.ctx = ctx; }
}

// after attach:
fixturePage.ctx!.update();
// assert the guarded controller did NOT start its work again
```

Two traps: invoking the `@context()` method directly does not work (the
registered handler is a wrapped method), and `detachController()` nulls
`element` before any late delivery, so a post-detach assertion must be set up
before detaching.

## Validating Source

Beyond unit tests, the analyzer catches Snice-specific mistakes that still compile:

```bash
npx snice validate
npx snice check --json
```

See [CLI](./cli.md).
