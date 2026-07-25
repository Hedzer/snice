/**
 * Snice core kitchen sink.
 *
 * One dense example of every public framework category: elements, pages,
 * layouts, controllers, properties/state, rendering/bindings/control flow,
 * lifecycle, queries, events, communication, observers, method decorators,
 * router context/fetch middleware, helpers, readiness, and test utilities.
 * Built-in UI components intentionally live in their own component docs.
 */
import {
  ContextAwareFetcher,
  SniceElement,
  adopted,
  classMap,
  clearDebounceTimers,
  clearMemoizeCache,
  clearThrottleTimers,
  context,
  controller,
  createRequestHandler,
  css,
  debounce,
  dispatch,
  dispose,
  element,
  escapeAttr,
  escapeHtml,
  getBodyScrollLockCount,
  html,
  isSafeUrl,
  layout,
  live,
  lockBodyScroll,
  memoize,
  moved,
  noChange,
  nothing,
  observe,
  on,
  once,
  parseDuration,
  property,
  query,
  queryAll,
  ready,
  reconnect,
  render,
  repeat,
  request,
  resetOnce,
  respond,
  Router,
  setDisableElementReadyWarnings,
  setStrictRenderErrors,
  state,
  styleMap,
  styles,
  svg,
  throttle,
  trackRenders,
  unsafeHTML,
  unlockBodyScroll,
  waitForAllCustomElements,
  waitForElementDefined,
  waitForElementReady,
  watch
} from 'snice';
import type {
  AppContext,
  Context,
  IController,
  Layout,
  Placard,
  RouteParams
} from 'snice';

type Item = { id: number; label: string };
type User = { id: string; name: string };
interface KitchenContext extends AppContext {
  user: User | null;
  token: string;
}

const fetcher = new ContextAwareFetcher();
fetcher.use('request', function (request, next) {
  const { token } = this.application as KitchenContext;
  if (token) request.headers.set('authorization', `Bearer ${token}`);
  return next();
});
fetcher.use('response', async function (response, next) {
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return next();
});

export const { page, navigate, initialize } = Router({
  target: '#app',
  type: 'hash',
  layout: 'kitchen-shell',
  context: { user: null, token: '' } satisfies KitchenContext,
  fetcher
});

const authenticated = (app: AppContext, _params: RouteParams) =>
  !!(app as KitchenContext).user;

@layout('kitchen-shell')
class KitchenShell extends HTMLElement implements Layout {
  @state() placards: Placard[] = [];
  @state() route = '';

  update(_app: AppContext, placards: Placard[], route: string) {
    this.placards = placards;
    this.route = route;
  }

  @render()
  template() {
    return html`
      <nav aria-label="Pages">
        ${this.placards.map(item => html`<a href=${item.href ?? '#'}>${item.title}</a>`)}
      </nav>
      <main data-route=${this.route}><slot name="page"></slot></main>
    `;
  }
}

@controller('kitchen-data')
class KitchenDataController implements IController {
  element!: HTMLElement;

  async attach(element: HTMLElement) {
    this.element = element;
  }

  async detach() {}

  @query('[data-action]', { light: true }) action!: HTMLElement;

  @on('click', '[data-action]')
  select(event: MouseEvent) {
    (event.currentTarget as HTMLElement).toggleAttribute('data-selected');
  }

  @respond('load-user')
  loadUser({ id }: { id: string }): User {
    return { id, name: 'Ada' };
  }
}

@element('kitchen-view', { delegatesFocus: true })
class KitchenView extends SniceElement {
  static styles = css`
    :host { display: block; }
    .active { font-weight: 700; }
  `;
  static renderOptions = { debounce: 0 };

  @property() title = 'Kitchen sink';
  @property({ type: Number }) count = 0;
  @property({ reflect: false }) input = '';
  @property({ attribute: 'data-mode' }) mode: 'list' | 'empty' = 'list';
  @property({ attribute: false, deep: true }) model = { items: [] as Item[] };
  @state() open = false;
  @state({ deep: true }) status = { text: 'idle' };

  @query('input') inputElement!: HTMLInputElement;
  @queryAll('button') buttons!: NodeListOf<HTMLButtonElement>;

  @watch('count', 'mode')
  changed(_oldValue: unknown, _newValue: unknown, _propertyName: string) {}

  @watch('input', { immediate: false })
  inputChanged() {
    this.emitValue();
  }

  @ready()
  mounted() {}

  @reconnect()
  reconnected() {}

  @dispose()
  unmounted() {
    clearDebounceTimers(this);
    clearThrottleTimers(this);
    clearMemoizeCache(this);
    resetOnce(this);
  }

  @moved()
  movedWithinDocument() {}

  @adopted()
  movedToDocument() {}

  @on('input', 'input')
  updateInput(event: InputEvent) {
    this.input = (event.currentTarget as HTMLInputElement).value;
  }

  @on('keydown:ctrl+s', { preventDefault: true })
  saveShortcut() {
    this.save();
  }

  @on('kitchen:refresh', { scope: 'global' })
  refresh() {
    void this.invalidate();
  }

  @dispatch('value-changed', { bubbles: true, composed: true })
  emitValue() {
    return { value: this.input };
  }

  @request('load-user', { timeout: 5_000 })
  async *loadUser(id: string): any {
    const user = await (yield { id });
    return user as User;
  }

  @observe('resize', '.panel')
  resized(_entries: ResizeObserverEntry[]) {}

  @observe('intersection', '.panel', { threshold: 0.1 })
  intersected(_entries: IntersectionObserverEntry[]) {}

  @observe('mutation:childList')
  mutated(_records: MutationRecord[]) {}

  @observe('media:(min-width: 48rem)')
  mediaChanged(_matches: boolean) {}

  @debounce(150)
  search(_query: string) {}

  @throttle(100)
  measure() {}

  @once()
  initializeOnce() {}

  @memoize({ maxSize: 20, ttl: 60_000 })
  labelFor(item: Item) {
    return `${item.id}: ${item.label}`;
  }

  private async *ticks() {
    yield 'ready';
  }

  private async save() {
    const user = await this.loadUser('42');
    this.status.text = user.name;
  }

  render() {
    const attrs = { 'aria-label': this.title, 'data-count': this.count };
    const props = { title: this.title };
    const events = { click: () => { this.open = !this.open; } };
    const safeLink = isSafeUrl('/settings') ? '/settings' : '#';

    return html`
      <!-- status: ${this.status.text} -->
      <section
        class=${classMap({ panel: true, active: this.open })}
        style=${styleMap({ '--count': this.count, fontSize: '1rem' })}
        class:active=${this.open}
        style:opacity=${this.open ? 1 : 0.8}
        ...attrs=${attrs}
        ...props=${props}
        ...events=${events}
      >
        <h1>${this.title}</h1>
        <input
          .value=${live(this.input)}
          ?disabled=${this.count < 0}
          @input=${this.updateInput}
          @keydown.enter=${this.save}
        />
        <button @click|prevent|once=${this.emitValue}>Emit</button>
        <a href=${safeLink}>Settings</a>

        <if ${this.open}>
          <p>${unsafeHTML('<strong>Open</strong>')}</p>
          <else-if ${this.count === 0}><p>Zero</p></else-if>
          <else><p>Closed</p></else>
        </if>

        <case ${this.mode}>
          <when value="list">
            ${repeat(this.model.items, {
              key: item => item.id,
              render: item => html`<span .item=${item}>${this.labelFor(item)}</span>`,
              empty: () => html`<em>No items</em>`
            })}
          </when>
          <default>${nothing}</default>
        </case>

        ${Promise.resolve('async')}
        ${this.ticks()}
        ${noChange}
        <svg viewBox="0 0 10 10">${svg`<circle cx="5" cy="5" r="4"></circle>`}</svg>
      </section>
    `;
  }
}

@page({
  tag: 'kitchen-page',
  routes: ['/', '/kitchen/:id'],
  guards: [authenticated],
  placard: { name: 'kitchen', title: 'Kitchen sink' }
})
class KitchenPage extends HTMLElement {
  private context?: Context;

  @context()
  receiveContext(context: Context) {
    this.context = context;
  }

  @ready()
  async load() {
    await this.context?.fetch('/api/example');
  }

  @render()
  template() {
    return html`<kitchen-view controller="kitchen-data"></kitchen-view>`;
  }
}

// Vanilla request/response interop.
const stopRequests = createRequestHandler(document, {
  ping: ({ value }: { value: string }) => ({ value })
});

// Small public utilities and test/debug helpers.
export async function coreUtilities(view: KitchenView) {
  parseDuration('250ms');
  escapeHtml('<unsafe>');
  escapeAttr('"unsafe"');
  lockBodyScroll();
  getBodyScrollLockCount();
  unlockBodyScroll();

  setStrictRenderErrors(true);
  setDisableElementReadyWarnings(true);
  await waitForElementDefined('kitchen-view');
  await waitForElementReady(view);
  await waitForAllCustomElements(view);

  const renders = trackRenders(view);
  view.count++;
  await renders.next();
  await renders.return();

  await view.renderNow();
  navigate('/kitchen/42');
  stopRequests();
}

initialize();
