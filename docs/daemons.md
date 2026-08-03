<!-- AI: For the AI-optimized version of this doc, see docs/ai/daemons.md -->
# Daemons

Daemons are ordinary, explicitly constructed objects with state and an
application-owned lifecycle. The `@daemon` decorator gives each instance a
private communication target so elements, controllers, and daemons can use
Snice's two communication models:

- `@request` / `@respond` for one request and one asynchronous response.
- `@dispatch` / `@on` for ephemeral notifications with zero or more listeners.

`@daemon` does not construct, cache, globally register, start, or stop
anything.

## Define and provide a daemon

```typescript
import { daemon, dispatch, on, request, respond, provideContext } from 'snice';
import type { Response } from 'snice';

@daemon
class SessionDaemon {
  session: Session | null = null;

  @respond('get-session')
  getSession() {
    return this.session;
  }

  @on('set-session')
  setSession(event: CustomEvent<Session>) {
    this.session = event.detail;
    this.sessionChanged();
  }

  @dispatch('session-changed')
  sessionChanged() {
    return this.session;
  }
}

const session = new SessionDaemon();
const appContext = {
  daemons: { session }
};

const release = provideContext(document.querySelector('#app')!, appContext);
```

The context key is the daemon's address. The class decorator takes no name,
avoiding two sources of truth.

Application contexts expose only this daemon surface to Snice:

```typescript
type DaemonMap = Readonly<Record<string, object>>;

interface AppContext {
  readonly daemons?: DaemonMap;
  [key: string]: unknown;
}
```

They may still contain application-specific state such as `user`, `theme`, or
configuration. Extend `AppContext` with those fields to give application code
their concrete types.

## Router integration

`Router` provides its `context` beneath its target before rendering a page.
No separate `provideContext()` call is needed:

```typescript
const session = new SessionDaemon();

const router = Router({
  target: '#app',
  type: 'hash',
  context: {
    user: null,
    daemons: { session }
  }
});
```

`provideContext(root, context)` is the same public mechanism used internally
by Router. Use it for applications without Router and for isolated tests. It
returns an idempotent cleanup function.

`getContext(elementOrController)` returns the raw application context visible
to that participant. It is separate from the method-form `@context()`, which
receives Router navigation updates.

## Communicate from elements and controllers

Consumers use the context address and never import the daemon implementation:

```typescript
@element('session-view')
class SessionView extends HTMLElement {
  @request<Session | null>('get-session', { daemon: 'session' })
  async *loadSession(): Response<Session | null> {
    return yield {};
  }

  @dispatch('set-session', { daemon: 'session' })
  setSession(session: Session) {
    return session;
  }

  @on('session-changed', { daemon: 'session' })
  sessionChanged(event: CustomEvent<Session | null>) {
    this.renderSession(event.detail);
  }
}
```

Controllers resolve the context through their attached host element, so the
same syntax works in controller methods.

The reverse direction is also supported. A daemon's `@request` dispatches on
its own communication target, while an element or controller may install a
responder there:

```typescript
@daemon
class SessionDaemon {
  @request<boolean>('confirm-logout')
  async *confirmLogout(): Response<boolean> {
    return yield {};
  }
}

class SessionView extends HTMLElement {
  @respond('confirm-logout', { daemon: 'session' })
  confirmLogout() {
    return window.confirm('Log out?');
  }
}
```

As with DOM-scoped request channels, only one responder should own a daemon
request channel.

## Resolution and lifecycle

Resolution has one path:

```text
element/controller
  -> nearest explicitly provided application context
  -> context.daemons[name]
  -> that instance's private communication target
```

There is no global fallback, implicit construction, registry scan, or delayed
registration.

- Construct every daemon explicitly with `new`.
- Provide the context before connecting elements or attaching controllers.
  `@on` and `@respond` install listeners at those lifecycle boundaries.
- `@request` and `@dispatch` resolve their daemon when invoked.
- Disconnecting an element or detaching a controller removes its daemon
  listeners automatically.
- Releasing the context deactivates its daemon communication. A later provision
  starts with a fresh event target.
- The same daemon class may have any number of independently provided
  instances.
- The same name may resolve to different instances under different context
  roots.

Missing contexts, missing daemon names, undecorated values, and inactive
daemon instances produce explicit errors or setup warnings. `daemon` and DOM
`scope` options are mutually exclusive. Selector delegation is not available
on a daemon target because it is not a DOM tree.

## Testing

Each test owns its instance, context root, and cleanup:

```typescript
const root = document.createElement('div');
document.body.appendChild(root);

const session = new SessionDaemon();
const release = provideContext(root, {
  daemons: { session }
});

const view = document.createElement('session-view');
root.appendChild(view);
await view.ready;

expect(await view.loadSession()).toBeNull();

root.remove();
release();
```

No shared singleton state or framework reset API is involved.
