# Testing

Public human reference: `docs/testing.md`.

Snice elements are custom elements — test in any DOM-capable runner. The only Snice-specific part: knowing when an element is ready to assert against.

## Two promises

| Promise | Await it | Resolves when |
|---|---|---|
| `el.ready` | after mounting, before the first assertion | first render done + every `@ready()` handler finished |
| `el.rendered` | after writing a reactive property | render queued by that write applied |

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

Gotcha: awaiting `ready` on an element that never connects hangs — append it to the document first.

- `ready` rejects with the first thrown/rejected `@ready()` failure; always await it.
- jsdom's partial `ElementInternals` is supported; form controls keep native-input/proxy fallback behavior when `setFormValue`/`setValidity` are absent.

## Strict render errors

```typescript
try {
  setStrictRenderErrors(true);
  expect(() => { element.invalid = true; }).toThrow(/<my-element> \(MyElement\)/);
} finally {
  setStrictRenderErrors(false);
}
```

- Default: log render failure, retain previous DOM. Strict: synchronously rethrow synchronous render failures.
- Template authoring errors include owning tag/class + nearby static-template excerpt when a host exists.
- Host-free preparation stays generic. Runtime does not claim a source filename it cannot know.
- Original error is `cause`; inspect `cause.stack` for the underlying stack.
- Promise/AsyncIterable failures happen after the render call and remain `console.error` reports in strict mode; await settlement and assert the `Error` argument.

## Partial DOM compatibility

In a simulated DOM, opt into Snice's standards compatibility layer from the
test setup file:

```typescript
import 'snice/testing/dom';
```

It capability-tests the current DOM and fills only missing IDL behavior. For
example, jsdom and some happy-dom versions omit the browser's reflective
`HTMLElement.autofocus` property for generic custom-element hosts; the adapter
adds that property without replacing implementations already supplied by the
runner. Application tests can then use `element.autofocus = true` exactly as
browser code does.

This adapter does not simulate layout, paint, or real focus navigation. Keep a
browser-test lane for behavior that depends on those capabilities. For a DOM
created after module evaluation, call `installDOMTestingCompatibility(scope)`
from the same module explicitly.

## Reading the DOM

```typescript
el.shadowRoot.querySelector('.label');
```

Closed or light render root: use `@query` inside the component and assert against the property, or select from `el` rather than `el.shadowRoot`. See queries.md.

## Events

Payload lives in `detail` — type handlers as `CustomEvent`:

```typescript
const seen: string[] = [];
el.addEventListener('status-changed', (e: CustomEvent) => seen.push(e.detail.value));

el.shadowRoot.querySelector('input').click();
await el.rendered;

expect(seen).toEqual(['done']);
```

Assert on `e.detail`, not `e.target.value`.

## Controllers

Attaches asynchronously — wait for the element before asserting on its effects:

```typescript
import { attachController } from 'snice';

const el = document.createElement('user-list');
document.body.appendChild(el);
await attachController(el, UserController);
```

To test an element in isolation, swap in a fixture controller that responds on the same channel the production controller uses; the element itself never changes. See request-response.md, controllers.md.

If the controller calls `getContext(this)`, provide its host (or an ancestor)
with the same application-context shape before attaching it. Release both
resources after the assertion:

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

Assigning a value to the host's own `@context` field is not a provider;
`getContext()` resolves the nearest `provideContext()` boundary.
When production code uses `getContextFetch()`, pass the test fetch function in
the same provider's third argument as shown above; `Router` supplies its
middleware-bound fetch function there in an application.

If the controller uses `@context()`, test it beneath a real `Router` target.
`provideContext()` intentionally provides application state and transport, not
navigation notifications — a `provideContext()` boundary can NEVER satisfy a
`@context()` handler; it simply never fires, with no error. Using `Router`
exercises the same registration, initial catch-up, middleware-aware
`ctx.fetch`, updates, and detach cleanup as production:

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

Re-delivering a Context to an already-attached controller (required to test a
first-delivery guard): capture the `Context` on the fixture page, then call its
public `update()` — it re-notifies every registered handler.

```typescript
@router.page({ tag: 'fixture-page', routes: ['/fixture'] })
class FixturePage extends HTMLElement {
  ctx?: Context;
  @context() capture(ctx: Context) { this.ctx = ctx; }
}
// after attach: fixturePage.ctx!.update(); then assert no second load.
```

Traps: calling the `@context()` method directly does nothing useful (the
registered handler is wrapped); `detachController()` nulls `element` before
any late delivery.

## Validating source

```bash
npx snice validate
npx snice check --json
```

See `docs/ai/cli.md`.
