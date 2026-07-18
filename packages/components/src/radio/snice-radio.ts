import { element, property, state, query, on, watch, dispatch, ready, render, styles, html, css } from 'snice';
import cssContent from './snice-radio.css?inline';
import type { RadioSize, RadioVariant, SniceRadioElement } from './snice-radio.types';

@element('snice-radio', { formAssociated: true })
export class SniceRadio extends HTMLElement implements SniceRadioElement {
  internals!: ElementInternals;

  private static readonly pendingRootSyncs = new Set<ParentNode>();

  private dirtyCheckedness = false;
  private pendingUserChange = false;
  private forwardingHostActivation = false;
  private customValidationMessage = '';
  private lastRoot: ParentNode | null = null;

  @state()
  private checkedState = false;

  @state()
  private formDisabled = false;

  @state()
  private keyboardFocused = false;

  constructor() {
    super();
    if (typeof this.attachInternals == 'function') {
      this.internals = this.attachInternals();
    }
  }

  /**
   * Live checkedness. Assignments are silent, make checkedness dirty, and do
   * not change the authored reset default, matching `HTMLInputElement`.
   * @public
   */
  get checked(): boolean {
    return this.checkedState;
  }

  set checked(value: boolean) {
    this.setCheckedness(Boolean(value), true, true);
  }

  // The checked content attribute is the reset default, exposed through the
  // native-compatible `defaultChecked` property.
  @property({ type: Boolean, attribute: 'checked' })
  defaultChecked = false;

  @property({ type: Boolean })
  disabled = false;

  @property({ type: Boolean })
  loading = false;

  @property({ type: Boolean })
  required = false;

  @property({ type: Boolean })
  invalid = false;

  @property()
  variant: RadioVariant = 'default';

  @property()
  size: RadioSize = 'medium';

  @property()
  name = '';

  @property()
  value = 'on';

  @property()
  label = '';

  @property()
  description = '';

  @query('.radio-input')
  input?: HTMLInputElement;

  @query('.radio')
  radio?: HTMLElement;

  @query('.radio-label')
  labelElement?: HTMLElement;

  @query('.radio-wrapper')
  wrapper?: HTMLElement;

  @render()
  render() {
    const isBlock = this.variant === 'block';
    const interactionDisabled = this.interactionDisabled;
    const group = this.findGroupRadios();
    const groupRequired = group.some(radio => radio.required);
    const wrapperClasses = `radio-wrapper${isBlock ? ' radio-wrapper--block' : ''}${interactionDisabled ? ' radio-wrapper--disabled' : ''}${this.loading ? ' radio-wrapper--loading' : ''}`;
    const radioClasses = `radio radio--${this.size}${this.invalid ? ' radio--invalid' : ''}${this.loading ? ' radio--loading' : ''}${this.keyboardFocused ? ' radio--keyboard-focus' : ''}`;
    const labelClasses = `radio-label radio-label--${this.size}${this.required ? ' radio-label--required' : ''}`;

    return html/*html*/`
      <label class="${wrapperClasses}">
        <input
          type="radio"
          class="radio-input"
          .checked=${this.checked}
          .disabled=${interactionDisabled}
          .required=${groupRequired}
          .name=${this.name}
          .value=${this.formValue}
          .tabIndex=${this.tabIndexFor(group)}
          aria-invalid="${this.invalid ? 'true' : 'false'}"
          aria-checked="${this.checked}"
          part="input"
          @click=${this.handleInternalClick}
          @input=${this.handleInternalInput}
          @change=${this.handleInternalChange}
          @blur=${this.handleInternalBlur}
        />

        <span class="${radioClasses}" part="radio">
          <if ${!this.loading}>
            <span class="radio-dot" part="dot"></span>
          </if>
          <if ${this.loading}>
            <span class="radio-spinner" part="spinner"></span>
          </if>
        </span>

        <if ${isBlock}>
          <span class="radio-content" part="content">
            <if ${this.label}>
              <span class="${labelClasses}" part="label">
                ${this.label}
              </span>
            </if>
            <if ${this.description}>
              <span class="radio-description" part="description">
                ${this.description}
              </span>
            </if>
          </span>
          <slot name="suffix"></slot>
        </if>

        <if ${!isBlock}>
          <if ${this.label}>
            <span class="${labelClasses}" part="label">
              ${this.label}
            </span>
          </if>
        </if>
      </label>
    `;
  }

  @ready()
  init() {
    // Property bindings can run before this custom element upgrades. Preserve
    // that value, then remove the own data property so it cannot shadow the
    // native-compatible accessor.
    if (Object.prototype.hasOwnProperty.call(this, 'checked')) {
      const checked = Boolean((this as { checked: unknown }).checked);
      delete (this as Partial<{ checked: unknown }>).checked;
      this.checked = checked;
    }

    this.lastRoot = this.radioRoot;
    this.setCheckedness(this.checked || (!this.dirtyCheckedness && this.defaultChecked), false, false);
    this.syncGroupState();
  }

  connectedCallback() {
    const root = this.radioRoot;
    this.lastRoot = root;
    queueMicrotask(() => {
      if (!this.isConnected) return;
      this.lastRoot = this.radioRoot;
      if (this.checked) this.uncheckOthersInGroup(false);
      this.syncGroupState();
    });
  }

  disconnectedCallback() {
    const root = this.lastRoot;
    this.lastRoot = null;
    const Radio = this.constructor as typeof SniceRadio;
    Radio.scheduleRootSync(root);
  }

  formAssociatedCallback() {
    if (this.checked) this.uncheckOthersInGroup(true);
    this.syncRootState();
  }

  formResetCallback() {
    this.dirtyCheckedness = false;
    this.setCheckedness(this.defaultChecked, false, false);
    this.syncRootState();
  }

  formDisabledCallback(disabled: boolean) {
    // Effective disabledness can come from a disabled fieldset. Keep it
    // separate from the authored disabled property/attribute.
    this.formDisabled = disabled;
  }

  formStateRestoreCallback(state: File | string | FormData | null) {
    if (typeof state !== 'string') return;

    if (state === 'checked') {
      this.setCheckedness(true, true, true);
    } else if (state === 'unchecked') {
      this.setCheckedness(false, true, true);
    }
    this.syncRootState();
  }

  private handleInternalInput(event: Event) {
    const target = event.currentTarget as HTMLInputElement;
    const changed = target.checked !== this.checked;
    this.pendingUserChange = changed;
    if (!changed) return;

    this.setCheckedness(target.checked, true, true);
  }

  private handleInternalClick(event: MouseEvent) {
    // The host click generated by an associated external label is the public
    // activation event. Suppress only the second click introduced while that
    // activation is forwarded to the native shadow input.
    if (this.forwardingHostActivation) event.stopPropagation();
  }

  private handleInternalChange() {
    if (!this.pendingUserChange) return;
    this.pendingUserChange = false;

    // Native input is composed and already reaches the host. Native change is
    // not composed, so surface it before the component-specific event.
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    this.dispatchRadioChange();
  }

  private handleInternalBlur() {
    this.keyboardFocused = false;
  }

  @on('pointerdown')
  private handlePointerDown() {
    this.keyboardFocused = false;
  }

  @on('click')
  private handleHostActivationClick(event: MouseEvent) {
    // Internal input/label activation is already native. A click whose
    // original target is the host comes from an associated external label (or
    // an explicitly dispatched host click) and must be forwarded exactly once.
    if (event.composedPath()[0] !== this) return;
    if (this.interactionDisabled) return;

    this.input?.focus();
    queueMicrotask(() => {
      if (event.defaultPrevented || this.interactionDisabled) return;
      this.forwardingHostActivation = true;
      try {
        this.input?.click();
      } finally {
        this.forwardingHostActivation = false;
      }
    });
  }

  @on('keydown')
  private handleKeydown(event: KeyboardEvent) {
    if (this.interactionDisabled || !this.name || event.composedPath()[0] !== this.input) return;

    const isArrowKey = event.key === 'ArrowDown'
      || event.key === 'ArrowRight'
      || event.key === 'ArrowUp'
      || event.key === 'ArrowLeft';
    if (!isArrowKey) return;

    const radios = this.findGroupRadios().filter(radio => !radio.interactionDisabled);
    if (radios.length < 2) return;

    const currentIndex = radios.indexOf(this);
    if (currentIndex === -1) return;

    event.preventDefault();
    const forward = event.key === 'ArrowDown' || event.key === 'ArrowRight';
    const nextIndex = forward
      ? (currentIndex + 1) % radios.length
      : (currentIndex - 1 + radios.length) % radios.length;
    const next = radios[nextIndex];
    next.keyboardFocused = true;
    next.focus();
    next.select();
  }

  @watch('defaultChecked', { immediate: false })
  handleDefaultCheckedChange() {
    if (!this.dirtyCheckedness) {
      this.setCheckedness(this.defaultChecked, false, true);
    }
  }

  @watch('name', { immediate: false })
  handleNameChange() {
    if (this.checked) this.uncheckOthersInGroup(true);
    this.syncRootState();
  }

  @watch('value', { immediate: false })
  handleValueChange() {
    this.syncNativeInput();
    this.syncOwnFormState();
  }

  @watch('required', { immediate: false })
  handleRequiredChange() {
    this.syncRootState();
  }

  @watch('disabled', 'loading', 'formDisabled', { immediate: false })
  handleDisabledChange() {
    this.syncRootState();
  }

  @watch('invalid', { immediate: false })
  handleInvalidChange() {
    this.input?.setAttribute('aria-invalid', this.invalid ? 'true' : 'false');
  }

  private get interactionDisabled() {
    return this.disabled || this.formDisabled || this.loading;
  }

  private get formValue() {
    return String(this.value ?? '');
  }

  private get radioRoot(): ParentNode | null {
    const root = this.getRootNode();
    if (root === this || !('querySelectorAll' in root)) return null;
    return root as ParentNode;
  }

  /**
   * ElementInternals.form is authoritative in browsers. Some DOM
   * implementations expose ElementInternals without implementing form-owner
   * discovery, so preserve the HTML ownership rules as a fallback: an
   * explicit form attribute wins, otherwise use the nearest ancestor form.
   */
  private get fallbackFormOwner(): HTMLFormElement | null {
    const explicitOwner = this.getAttribute('form');
    if (explicitOwner !== null) {
      const root = this.radioRoot;
      if (!root) return null;
      return Array.from(root.querySelectorAll('form[id]'))
        .find((candidate): candidate is HTMLFormElement =>
          candidate instanceof HTMLFormElement && candidate.id === explicitOwner
        ) ?? null;
    }

    return this.closest('form');
  }

  private setCheckedness(checked: boolean, dirtySelf: boolean, dirtyPeers: boolean) {
    if (dirtySelf) this.dirtyCheckedness = true;
    this.checkedState = checked;
    this.syncNativeInput();

    if (checked) this.uncheckOthersInGroup(dirtyPeers);
    this.syncGroupState();
  }

  private uncheckFromGroup(dirty: boolean) {
    if (dirty) this.dirtyCheckedness = true;
    this.checkedState = false;
    this.syncNativeInput();
    this.syncOwnFormState();
  }

  private uncheckOthersInGroup(dirtyPeers: boolean) {
    if (!this.name) return;
    for (const radio of this.findGroupRadios()) {
      if (radio !== this && radio.checked) radio.uncheckFromGroup(dirtyPeers);
    }
  }

  /**
   * Native radio groups share a non-empty name, a form owner, and a tree root.
   * Filtering instead of selector interpolation also handles every valid name.
   */
  private findGroupRadios(): SniceRadio[] {
    if (!this.name) return [this];
    const root = this.radioRoot;
    if (!root) return [this];
    const form = this.form;
    return Array.from(root.querySelectorAll('snice-radio'))
      .filter((radio): radio is SniceRadio =>
        typeof (radio as SniceRadio).syncNativeInput === 'function'
      )
      .filter(radio => radio.name === this.name && radio.form === form);
  }

  private tabIndexFor(group = this.findGroupRadios()) {
    const enabled = group.filter(radio => !radio.interactionDisabled);
    const selected = enabled.find(radio => radio.checked);
    const tabbable = selected ?? enabled[0];
    return tabbable === this ? 0 : -1;
  }

  private syncNativeInput(group = this.findGroupRadios()) {
    if (!this.input) return;
    this.input.checked = this.checked;
    this.input.disabled = this.interactionDisabled;
    this.input.required = group.some(radio => radio.required);
    this.input.name = this.name;
    this.input.value = this.formValue;
    this.input.tabIndex = this.tabIndexFor(group);
    this.input.setCustomValidity(this.customValidationMessage);
    this.input.setAttribute('aria-invalid', this.invalid ? 'true' : 'false');
    this.input.setAttribute('aria-checked', String(this.checked));
  }

  private syncOwnFormState(group = this.findGroupRadios()) {
    if (this.internals) {
      this.internals.setFormValue(
        this.checked ? this.formValue : null,
        this.checked ? 'checked' : 'unchecked'
      );
    }
    this.syncValidity(group);
  }

  private syncValidity(group = this.findGroupRadios()) {
    const valueMissing = group.some(radio => radio.required)
      && !group.some(radio => radio.checked);
    const customError = this.customValidationMessage.length > 0;

    if (this.input) {
      this.input.checked = this.checked;
      this.input.required = group.some(radio => radio.required);
      this.input.setCustomValidity(this.customValidationMessage);
    }
    if (!this.internals) return;

    if (!valueMissing && !customError) {
      this.internals.setValidity({});
      return;
    }

    const message = this.customValidationMessage
      || this.input?.validationMessage
      || 'Please select an option.';
    if (this.input) {
      this.internals.setValidity({ valueMissing, customError }, message, this.input);
    } else {
      this.internals.setValidity({ valueMissing, customError }, message);
    }
  }

  private syncGroupState() {
    const group = this.findGroupRadios();
    for (const radio of group) radio.syncNativeInput(group);
    for (const radio of group) radio.syncOwnFormState(group);
  }

  private syncRootState() {
    const root = this.radioRoot;
    if (!root) {
      this.syncGroupState();
      return;
    }
    const Radio = this.constructor as typeof SniceRadio;
    Radio.syncRadiosInRoot(root);
  }

  private static radiosInRoot(root: ParentNode) {
    return Array.from(root.querySelectorAll('snice-radio'))
      // customElements.define() upgrades matching elements synchronously. A
      // root can therefore contain a mix of upgraded and not-yet-upgraded
      // peers while this component's constructor is running. Detect the
      // initialized API instead of depending on a class binding that a
      // decorator/bundler may still be assigning during that window.
      .filter((radio): radio is SniceRadio =>
        typeof (radio as SniceRadio).syncNativeInput === 'function'
      );
  }

  private static syncRadiosInRoot(root: ParentNode) {
    const radios = this.radiosInRoot(root);
    for (const radio of radios) radio.syncNativeInput();
    for (const radio of radios) radio.syncOwnFormState();
  }

  private static scheduleRootSync(root: ParentNode | null) {
    if (!root || this.pendingRootSyncs.has(root)) return;
    this.pendingRootSyncs.add(root);
    const Radio = this;
    queueMicrotask(() => {
      Radio.pendingRootSyncs.delete(root);
      Radio.syncRadiosInRoot(root);
    });
  }

  @dispatch('radio-change', { bubbles: true, composed: true })
  private dispatchRadioChange() {
    return {
      checked: this.checked,
      value: this.value,
      radio: this
    };
  }

  @styles()
  styles() {
    return css/*css*/`${cssContent}`;
  }

  // Public API
  focus() {
    this.input?.focus();
  }

  blur() {
    this.keyboardFocused = false;
    this.input?.blur();
  }

  click() {
    if (this.interactionDisabled) return;
    this.input?.click();
  }

  select() {
    if (!this.checked) this.click();
  }

  /** Native-compatible control type. @public */
  get type(): 'radio' {
    return 'radio' as const;
  }

  /** Owning form, including association through a `form` attribute. @public */
  get form(): HTMLFormElement | null {
    return this.internals?.form ?? this.fallbackFormOwner;
  }

  /** Current constraint-validation state. @public */
  get validity(): ValidityState {
    return this.internals?.validity ?? this.input!.validity;
  }

  /** Current localized validation message. @public */
  get validationMessage(): string {
    return this.internals?.validationMessage ?? this.input?.validationMessage ?? '';
  }

  /** Whether this radio participates in constraint validation. @public */
  get willValidate(): boolean {
    return this.internals?.willValidate ?? this.input?.willValidate ?? false;
  }

  /** Labels associated with this radio. @public */
  get labels(): NodeList | null {
    return this.internals?.labels ?? this.input?.labels ?? null;
  }

  checkValidity() {
    this.syncRootState();
    return this.internals?.checkValidity() ?? this.input?.checkValidity() ?? true;
  }

  reportValidity() {
    this.syncRootState();
    return this.internals?.reportValidity() ?? this.input?.reportValidity() ?? true;
  }

  setCustomValidity(message: string) {
    this.customValidationMessage = String(message);
    this.syncOwnFormState();
  }
}
