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
navigation notifications; using `Router` exercises the same registration,
initial catch-up, middleware-aware `ctx.fetch`, updates, and detach cleanup as
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

## Validating Source

Beyond unit tests, the analyzer catches Snice-specific mistakes that still compile:

```bash
npx snice validate
npx snice check --json
```

See [CLI](./cli.md).
