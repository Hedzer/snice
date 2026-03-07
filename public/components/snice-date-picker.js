/*!
 * snice v4.25.0
 * A decorator-driven web component library with differential rendering, routing, controllers, and 130+ ready-made UI components. Use as much or as little as you want. Zero dependencies, works anywhere.
 * (c) 2024
 * Released under the MIT License.
 */
if(typeof globalThis.Snice==="undefined"){console.warn("[snice] snice-runtime.min.js must be loaded before snice-date-picker.min.js");}
var SniceDatePicker = (function (exports, snice) {
  'use strict';

  /******************************************************************************
  Copyright (c) Microsoft Corporation.

  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.

  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** */
  /* global Reflect, Promise, SuppressedError, Symbol, Iterator */


  function __esDecorate(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
  }
  function __runInitializers(thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
  }
  typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
  };

  var cssContent = ":host{display:block;position:relative;font-family:var(--snice-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);font-size:var(--snice-font-size-sm, .875rem);line-height:var(--snice-line-height-normal, 1.5)}.date-picker-wrapper{display:flex;flex-direction:column}.label{font-size:var(--snice-font-size-sm, .875rem);font-weight:var(--snice-font-weight-medium,500);line-height:var(--snice-line-height-normal, 1.5);color:var(--snice-color-text);margin-bottom:var(--snice-spacing-2xs,.25rem)}.label--required::after{content:'*';color:var(--snice-color-danger);margin-left:var(--snice-spacing-2xs,.25rem)}.input-container{position:relative;display:flex;align-items:center}.input{width:100%;box-sizing:border-box;min-height:2.5rem;border:1px solid var(--snice-color-border);border-radius:var(--snice-border-radius-lg,6px);padding:var(--snice-spacing-xs,.5rem) 3rem var(--snice-spacing-xs,.5rem) var(--snice-spacing-sm,.75rem);font-size:inherit;font-family:inherit;line-height:var(--snice-line-height-normal, 1.5);background:var(--snice-color-background-input);color:var(--snice-color-text);transition:border-color var(--snice-transition-fast, .15s) ease,box-shadow var(--snice-transition-fast, .15s) ease}.input:focus{outline:0;border-color:var(--snice-color-border-focus);box-shadow:0 0 0 var(--snice-focus-ring-width,3px) var(--snice-focus-ring-color)}.input--small{padding:.375rem 2.75rem .375rem .625rem;font-size:.875rem}.input--large{padding:.75rem 3.5rem .75rem 1rem;font-size:1rem}.input--filled{background:var(--snice-color-background-secondary);border:1px solid transparent}.input--underlined{border:none;border-bottom:1px solid var(--snice-color-border);border-radius:0;background:0 0;padding-left:0}.input--invalid{border-color:var(--snice-color-danger)}.input--invalid:focus{border-color:var(--snice-color-danger);box-shadow:0 0 0 3px var(--snice-color-danger-alpha,hsl(var(--snice-color-red-500) / .1))}.input:disabled{background:var(--snice-color-background-secondary);color:var(--snice-color-text-tertiary);cursor:not-allowed}.input:not(:disabled):not([readonly]){cursor:pointer}.calendar-toggle,.clear-button{position:absolute;padding:.25rem;border:none;background:0 0;color:var(--snice-color-text-secondary);cursor:pointer;border-radius:4px;transition:color .15s,background-color .15s}.calendar-toggle{right:.5rem}.clear-button{right:2.5rem}.calendar-toggle:hover,.clear-button:hover{color:var(--snice-color-text);background:var(--snice-color-background-tertiary)}.calendar-toggle:disabled,.clear-button:disabled{opacity:.5;cursor:not-allowed}.input--loading{cursor:wait}.spinner{position:absolute;right:3rem;width:1em;height:1em;pointer-events:none}.spinner::after{content:'';display:block;width:100%;height:100%;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:.6s linear infinite spin}@keyframes spin{to{transform:rotate(360deg)}}.calendar{position:absolute;top:100%;left:0;right:0;z-index:var(--snice-z-index-dropdown,1000);background:var(--snice-color-background-element);border:1px solid var(--snice-color-border);border-radius:var(--snice-border-radius-lg,8px);box-shadow:var(--snice-shadow-lg);margin-top:var(--snice-spacing-3xs,.125rem);padding:var(--snice-spacing-md,1rem);min-width:280px}.calendar[hidden]{display:none}.calendar-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem}.calendar-title{flex:1;text-align:center}.month-button{background:0 0;border:none;font-size:var(--snice-font-size-md, 1rem);font-weight:var(--snice-font-weight-semibold,600);color:var(--snice-color-text);cursor:pointer;padding:var(--snice-spacing-2xs,.25rem) var(--snice-spacing-xs,.5rem);border-radius:var(--snice-border-radius-md,4px);transition:background-color var(--snice-transition-fast, .15s) ease}.month-button:hover{background:var(--snice-color-background-tertiary)}.nav-button{background:0 0;border:none;padding:.5rem;cursor:pointer;color:var(--snice-color-text-secondary);border-radius:4px;transition:color .15s,background-color .15s}.nav-button:hover{color:var(--snice-color-text);background:var(--snice-color-background-tertiary)}.calendar-weekdays{display:grid;grid-template-columns:repeat(7,1fr);gap:.25rem;margin-bottom:.5rem}.weekday{text-align:center;font-size:.75rem;font-weight:600;color:var(--snice-color-text-secondary);padding:.5rem .25rem}.calendar-days{display:grid;grid-template-columns:repeat(7,1fr);gap:.25rem}.day{width:32px;height:32px;border:none;background:0 0;cursor:pointer;border-radius:var(--snice-border-radius-md,4px);font-size:var(--snice-font-size-sm, .875rem);color:var(--snice-color-text);transition:background-color var(--snice-transition-fast, .15s) ease,color var(--snice-transition-fast, .15s) ease;display:flex;align-items:center;justify-content:center}.day:hover:not(.day--disabled){background:var(--snice-color-background-tertiary)}.day--today{background:var(--snice-color-primary-subtle);color:var(--snice-color-primary);font-weight:var(--snice-font-weight-semibold,600)}.day--selected{background:var(--snice-color-primary);color:var(--snice-color-text-inverse);font-weight:var(--snice-font-weight-semibold,600)}.day--disabled{color:var(--snice-color-text-disabled);cursor:not-allowed}.day--empty{cursor:default}.year-button{background:0 0;border:none;font-size:var(--snice-font-size-md, 1rem);font-weight:var(--snice-font-weight-semibold,600);font-family:inherit;color:var(--snice-color-primary);cursor:pointer;padding:.125rem .375rem;border-radius:var(--snice-border-radius-md,4px);transition:background-color var(--snice-transition-fast, .15s) ease}.year-button:hover{background:var(--snice-color-background-tertiary)}.year-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;padding:.5rem 0}.year-cell{border:none;background:0 0;cursor:pointer;padding:.625rem .25rem;border-radius:var(--snice-border-radius-md,4px);font-size:var(--snice-font-size-sm, .875rem);font-family:inherit;color:var(--snice-color-text);transition:background-color var(--snice-transition-fast, .15s) ease,color var(--snice-transition-fast, .15s) ease}.year-cell:hover{background:var(--snice-color-background-tertiary)}.year-cell--current{outline:2px solid var(--snice-color-primary);outline-offset:-2px;color:var(--snice-color-primary);font-weight:var(--snice-font-weight-semibold,600)}.year-cell--selected{background:var(--snice-color-primary);color:var(--snice-color-text-inverse);font-weight:var(--snice-font-weight-semibold,600)}.month-label{font-size:var(--snice-font-size-md, 1rem);font-weight:var(--snice-font-weight-semibold,600);color:var(--snice-color-text)}.calendar-footer{margin-top:1rem;padding-top:1rem;border-top:1px solid var(--snice-color-border);display:flex;justify-content:center}.error-text,.helper-text{font-size:var(--snice-font-size-sm, .875rem);margin-top:var(--snice-spacing-2xs,.25rem)}.helper-text{color:var(--snice-color-text-secondary)}.error-text{color:var(--snice-color-danger)}:host([size=small]) .calendar{min-width:240px;padding:.75rem}:host([size=small]) .day{width:28px;height:28px;font-size:.8125rem}:host([size=large]) .calendar{min-width:320px;padding:1.25rem}:host([size=large]) .day{width:36px;height:36px;font-size:.9375rem}@media (max-width:640px){.calendar{left:50%;right:auto;transform:translateX(-50%);min-width:280px}}";

  let SniceDatePicker = (() => {
      let _classDecorators = [snice.element('snice-date-picker', { formAssociated: true })];
      let _classDescriptor;
      let _classExtraInitializers = [];
      let _classThis;
      let _classSuper = HTMLElement;
      let _instanceExtraInitializers = [];
      let _size_decorators;
      let _size_initializers = [];
      let _size_extraInitializers = [];
      let _variant_decorators;
      let _variant_initializers = [];
      let _variant_extraInitializers = [];
      let _value_decorators;
      let _value_initializers = [];
      let _value_extraInitializers = [];
      let _format_decorators;
      let _format_initializers = [];
      let _format_extraInitializers = [];
      let _placeholder_decorators;
      let _placeholder_initializers = [];
      let _placeholder_extraInitializers = [];
      let _label_decorators;
      let _label_initializers = [];
      let _label_extraInitializers = [];
      let _helperText_decorators;
      let _helperText_initializers = [];
      let _helperText_extraInitializers = [];
      let _errorText_decorators;
      let _errorText_initializers = [];
      let _errorText_extraInitializers = [];
      let _disabled_decorators;
      let _disabled_initializers = [];
      let _disabled_extraInitializers = [];
      let _readonly_decorators;
      let _readonly_initializers = [];
      let _readonly_extraInitializers = [];
      let _loading_decorators;
      let _loading_initializers = [];
      let _loading_extraInitializers = [];
      let _required_decorators;
      let _required_initializers = [];
      let _required_extraInitializers = [];
      let _invalid_decorators;
      let _invalid_initializers = [];
      let _invalid_extraInitializers = [];
      let _clearable_decorators;
      let _clearable_initializers = [];
      let _clearable_extraInitializers = [];
      let _min_decorators;
      let _min_initializers = [];
      let _min_extraInitializers = [];
      let _max_decorators;
      let _max_initializers = [];
      let _max_extraInitializers = [];
      let _name_decorators;
      let _name_initializers = [];
      let _name_extraInitializers = [];
      let _showCalendar_decorators;
      let _showCalendar_initializers = [];
      let _showCalendar_extraInitializers = [];
      let _firstDayOfWeek_decorators;
      let _firstDayOfWeek_initializers = [];
      let _firstDayOfWeek_extraInitializers = [];
      let _input_decorators;
      let _input_initializers = [];
      let _input_extraInitializers = [];
      let _calendar_decorators;
      let _calendar_initializers = [];
      let _calendar_extraInitializers = [];
      let _clearButton_decorators;
      let _clearButton_initializers = [];
      let _clearButton_extraInitializers = [];
      let _calendarToggle_decorators;
      let _calendarToggle_initializers = [];
      let _calendarToggle_extraInitializers = [];
      let _selectedDayButton_decorators;
      let _selectedDayButton_initializers = [];
      let _selectedDayButton_extraInitializers = [];
      let _firstDayButton_decorators;
      let _firstDayButton_initializers = [];
      let _firstDayButton_extraInitializers = [];
      let _styles_decorators;
      let _render_decorators;
      let _init_decorators;
      let _handleValueChange_decorators;
      let _handleShowCalendarChange_decorators;
      let _handleDisabledChange_decorators;
      let _handleReadonlyChange_decorators;
      let _handleInvalidChange_decorators;
      let _handleFormatChange_decorators;
      let _dispatchInputEvent_decorators;
      let _dispatchChangeEvent_decorators;
      let _dispatchFocusEvent_decorators;
      let _dispatchBlurEvent_decorators;
      let _dispatchOpenEvent_decorators;
      let _dispatchCloseEvent_decorators;
      let _dispatchClearEvent_decorators;
      let _dispatchSelectEvent_decorators;
      (class extends _classSuper {
          static { _classThis = this; }
          static {
              const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
              _size_decorators = [snice.property({})];
              _variant_decorators = [snice.property({})];
              _value_decorators = [snice.property({})];
              _format_decorators = [snice.property({})];
              _placeholder_decorators = [snice.property({})];
              _label_decorators = [snice.property({})];
              _helperText_decorators = [snice.property({ attribute: 'helper-text', })];
              _errorText_decorators = [snice.property({ attribute: 'error-text', })];
              _disabled_decorators = [snice.property({ type: Boolean, })];
              _readonly_decorators = [snice.property({ type: Boolean, })];
              _loading_decorators = [snice.property({ type: Boolean, })];
              _required_decorators = [snice.property({ type: Boolean, })];
              _invalid_decorators = [snice.property({ type: Boolean, })];
              _clearable_decorators = [snice.property({ type: Boolean, })];
              _min_decorators = [snice.property({})];
              _max_decorators = [snice.property({})];
              _name_decorators = [snice.property({})];
              _showCalendar_decorators = [snice.property({ type: Boolean, attribute: 'show-calendar', })];
              _firstDayOfWeek_decorators = [snice.property({ type: Number, attribute: 'first-day-of-week', })];
              _input_decorators = [snice.query('.input')];
              _calendar_decorators = [snice.query('.calendar')];
              _clearButton_decorators = [snice.query('.clear-button')];
              _calendarToggle_decorators = [snice.query('.calendar-toggle')];
              _selectedDayButton_decorators = [snice.query('.day--selected')];
              _firstDayButton_decorators = [snice.query('.day:not(.day--empty):not(.day--disabled)')];
              _styles_decorators = [snice.styles()];
              _render_decorators = [snice.render()];
              _init_decorators = [snice.ready()];
              _handleValueChange_decorators = [snice.watch('value')];
              _handleShowCalendarChange_decorators = [snice.watch('show-calendar')];
              _handleDisabledChange_decorators = [snice.watch('disabled')];
              _handleReadonlyChange_decorators = [snice.watch('readonly')];
              _handleInvalidChange_decorators = [snice.watch('invalid')];
              _handleFormatChange_decorators = [snice.watch('format')];
              _dispatchInputEvent_decorators = [snice.dispatch('datepicker-input', { bubbles: true, composed: true })];
              _dispatchChangeEvent_decorators = [snice.dispatch('datepicker-change', { bubbles: true, composed: true })];
              _dispatchFocusEvent_decorators = [snice.dispatch('datepicker-focus', { bubbles: true, composed: true })];
              _dispatchBlurEvent_decorators = [snice.dispatch('datepicker-blur', { bubbles: true, composed: true })];
              _dispatchOpenEvent_decorators = [snice.dispatch('datepicker-open', { bubbles: true, composed: true })];
              _dispatchCloseEvent_decorators = [snice.dispatch('datepicker-close', { bubbles: true, composed: true })];
              _dispatchClearEvent_decorators = [snice.dispatch('datepicker-clear', { bubbles: true, composed: true })];
              _dispatchSelectEvent_decorators = [snice.dispatch('datepicker-select', { bubbles: true, composed: true })];
              __esDecorate(this, null, _styles_decorators, { kind: "method", name: "styles", static: false, private: false, access: { has: obj => "styles" in obj, get: obj => obj.styles }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _render_decorators, { kind: "method", name: "render", static: false, private: false, access: { has: obj => "render" in obj, get: obj => obj.render }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _init_decorators, { kind: "method", name: "init", static: false, private: false, access: { has: obj => "init" in obj, get: obj => obj.init }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _handleValueChange_decorators, { kind: "method", name: "handleValueChange", static: false, private: false, access: { has: obj => "handleValueChange" in obj, get: obj => obj.handleValueChange }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _handleShowCalendarChange_decorators, { kind: "method", name: "handleShowCalendarChange", static: false, private: false, access: { has: obj => "handleShowCalendarChange" in obj, get: obj => obj.handleShowCalendarChange }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _handleDisabledChange_decorators, { kind: "method", name: "handleDisabledChange", static: false, private: false, access: { has: obj => "handleDisabledChange" in obj, get: obj => obj.handleDisabledChange }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _handleReadonlyChange_decorators, { kind: "method", name: "handleReadonlyChange", static: false, private: false, access: { has: obj => "handleReadonlyChange" in obj, get: obj => obj.handleReadonlyChange }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _handleInvalidChange_decorators, { kind: "method", name: "handleInvalidChange", static: false, private: false, access: { has: obj => "handleInvalidChange" in obj, get: obj => obj.handleInvalidChange }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _handleFormatChange_decorators, { kind: "method", name: "handleFormatChange", static: false, private: false, access: { has: obj => "handleFormatChange" in obj, get: obj => obj.handleFormatChange }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _dispatchInputEvent_decorators, { kind: "method", name: "dispatchInputEvent", static: false, private: false, access: { has: obj => "dispatchInputEvent" in obj, get: obj => obj.dispatchInputEvent }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _dispatchChangeEvent_decorators, { kind: "method", name: "dispatchChangeEvent", static: false, private: false, access: { has: obj => "dispatchChangeEvent" in obj, get: obj => obj.dispatchChangeEvent }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _dispatchFocusEvent_decorators, { kind: "method", name: "dispatchFocusEvent", static: false, private: false, access: { has: obj => "dispatchFocusEvent" in obj, get: obj => obj.dispatchFocusEvent }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _dispatchBlurEvent_decorators, { kind: "method", name: "dispatchBlurEvent", static: false, private: false, access: { has: obj => "dispatchBlurEvent" in obj, get: obj => obj.dispatchBlurEvent }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _dispatchOpenEvent_decorators, { kind: "method", name: "dispatchOpenEvent", static: false, private: false, access: { has: obj => "dispatchOpenEvent" in obj, get: obj => obj.dispatchOpenEvent }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _dispatchCloseEvent_decorators, { kind: "method", name: "dispatchCloseEvent", static: false, private: false, access: { has: obj => "dispatchCloseEvent" in obj, get: obj => obj.dispatchCloseEvent }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _dispatchClearEvent_decorators, { kind: "method", name: "dispatchClearEvent", static: false, private: false, access: { has: obj => "dispatchClearEvent" in obj, get: obj => obj.dispatchClearEvent }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _dispatchSelectEvent_decorators, { kind: "method", name: "dispatchSelectEvent", static: false, private: false, access: { has: obj => "dispatchSelectEvent" in obj, get: obj => obj.dispatchSelectEvent }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(null, null, _size_decorators, { kind: "field", name: "size", static: false, private: false, access: { has: obj => "size" in obj, get: obj => obj.size, set: (obj, value) => { obj.size = value; } }, metadata: _metadata }, _size_initializers, _size_extraInitializers);
              __esDecorate(null, null, _variant_decorators, { kind: "field", name: "variant", static: false, private: false, access: { has: obj => "variant" in obj, get: obj => obj.variant, set: (obj, value) => { obj.variant = value; } }, metadata: _metadata }, _variant_initializers, _variant_extraInitializers);
              __esDecorate(null, null, _value_decorators, { kind: "field", name: "value", static: false, private: false, access: { has: obj => "value" in obj, get: obj => obj.value, set: (obj, value) => { obj.value = value; } }, metadata: _metadata }, _value_initializers, _value_extraInitializers);
              __esDecorate(null, null, _format_decorators, { kind: "field", name: "format", static: false, private: false, access: { has: obj => "format" in obj, get: obj => obj.format, set: (obj, value) => { obj.format = value; } }, metadata: _metadata }, _format_initializers, _format_extraInitializers);
              __esDecorate(null, null, _placeholder_decorators, { kind: "field", name: "placeholder", static: false, private: false, access: { has: obj => "placeholder" in obj, get: obj => obj.placeholder, set: (obj, value) => { obj.placeholder = value; } }, metadata: _metadata }, _placeholder_initializers, _placeholder_extraInitializers);
              __esDecorate(null, null, _label_decorators, { kind: "field", name: "label", static: false, private: false, access: { has: obj => "label" in obj, get: obj => obj.label, set: (obj, value) => { obj.label = value; } }, metadata: _metadata }, _label_initializers, _label_extraInitializers);
              __esDecorate(null, null, _helperText_decorators, { kind: "field", name: "helperText", static: false, private: false, access: { has: obj => "helperText" in obj, get: obj => obj.helperText, set: (obj, value) => { obj.helperText = value; } }, metadata: _metadata }, _helperText_initializers, _helperText_extraInitializers);
              __esDecorate(null, null, _errorText_decorators, { kind: "field", name: "errorText", static: false, private: false, access: { has: obj => "errorText" in obj, get: obj => obj.errorText, set: (obj, value) => { obj.errorText = value; } }, metadata: _metadata }, _errorText_initializers, _errorText_extraInitializers);
              __esDecorate(null, null, _disabled_decorators, { kind: "field", name: "disabled", static: false, private: false, access: { has: obj => "disabled" in obj, get: obj => obj.disabled, set: (obj, value) => { obj.disabled = value; } }, metadata: _metadata }, _disabled_initializers, _disabled_extraInitializers);
              __esDecorate(null, null, _readonly_decorators, { kind: "field", name: "readonly", static: false, private: false, access: { has: obj => "readonly" in obj, get: obj => obj.readonly, set: (obj, value) => { obj.readonly = value; } }, metadata: _metadata }, _readonly_initializers, _readonly_extraInitializers);
              __esDecorate(null, null, _loading_decorators, { kind: "field", name: "loading", static: false, private: false, access: { has: obj => "loading" in obj, get: obj => obj.loading, set: (obj, value) => { obj.loading = value; } }, metadata: _metadata }, _loading_initializers, _loading_extraInitializers);
              __esDecorate(null, null, _required_decorators, { kind: "field", name: "required", static: false, private: false, access: { has: obj => "required" in obj, get: obj => obj.required, set: (obj, value) => { obj.required = value; } }, metadata: _metadata }, _required_initializers, _required_extraInitializers);
              __esDecorate(null, null, _invalid_decorators, { kind: "field", name: "invalid", static: false, private: false, access: { has: obj => "invalid" in obj, get: obj => obj.invalid, set: (obj, value) => { obj.invalid = value; } }, metadata: _metadata }, _invalid_initializers, _invalid_extraInitializers);
              __esDecorate(null, null, _clearable_decorators, { kind: "field", name: "clearable", static: false, private: false, access: { has: obj => "clearable" in obj, get: obj => obj.clearable, set: (obj, value) => { obj.clearable = value; } }, metadata: _metadata }, _clearable_initializers, _clearable_extraInitializers);
              __esDecorate(null, null, _min_decorators, { kind: "field", name: "min", static: false, private: false, access: { has: obj => "min" in obj, get: obj => obj.min, set: (obj, value) => { obj.min = value; } }, metadata: _metadata }, _min_initializers, _min_extraInitializers);
              __esDecorate(null, null, _max_decorators, { kind: "field", name: "max", static: false, private: false, access: { has: obj => "max" in obj, get: obj => obj.max, set: (obj, value) => { obj.max = value; } }, metadata: _metadata }, _max_initializers, _max_extraInitializers);
              __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: obj => "name" in obj, get: obj => obj.name, set: (obj, value) => { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
              __esDecorate(null, null, _showCalendar_decorators, { kind: "field", name: "showCalendar", static: false, private: false, access: { has: obj => "showCalendar" in obj, get: obj => obj.showCalendar, set: (obj, value) => { obj.showCalendar = value; } }, metadata: _metadata }, _showCalendar_initializers, _showCalendar_extraInitializers);
              __esDecorate(null, null, _firstDayOfWeek_decorators, { kind: "field", name: "firstDayOfWeek", static: false, private: false, access: { has: obj => "firstDayOfWeek" in obj, get: obj => obj.firstDayOfWeek, set: (obj, value) => { obj.firstDayOfWeek = value; } }, metadata: _metadata }, _firstDayOfWeek_initializers, _firstDayOfWeek_extraInitializers);
              __esDecorate(null, null, _input_decorators, { kind: "field", name: "input", static: false, private: false, access: { has: obj => "input" in obj, get: obj => obj.input, set: (obj, value) => { obj.input = value; } }, metadata: _metadata }, _input_initializers, _input_extraInitializers);
              __esDecorate(null, null, _calendar_decorators, { kind: "field", name: "calendar", static: false, private: false, access: { has: obj => "calendar" in obj, get: obj => obj.calendar, set: (obj, value) => { obj.calendar = value; } }, metadata: _metadata }, _calendar_initializers, _calendar_extraInitializers);
              __esDecorate(null, null, _clearButton_decorators, { kind: "field", name: "clearButton", static: false, private: false, access: { has: obj => "clearButton" in obj, get: obj => obj.clearButton, set: (obj, value) => { obj.clearButton = value; } }, metadata: _metadata }, _clearButton_initializers, _clearButton_extraInitializers);
              __esDecorate(null, null, _calendarToggle_decorators, { kind: "field", name: "calendarToggle", static: false, private: false, access: { has: obj => "calendarToggle" in obj, get: obj => obj.calendarToggle, set: (obj, value) => { obj.calendarToggle = value; } }, metadata: _metadata }, _calendarToggle_initializers, _calendarToggle_extraInitializers);
              __esDecorate(null, null, _selectedDayButton_decorators, { kind: "field", name: "selectedDayButton", static: false, private: false, access: { has: obj => "selectedDayButton" in obj, get: obj => obj.selectedDayButton, set: (obj, value) => { obj.selectedDayButton = value; } }, metadata: _metadata }, _selectedDayButton_initializers, _selectedDayButton_extraInitializers);
              __esDecorate(null, null, _firstDayButton_decorators, { kind: "field", name: "firstDayButton", static: false, private: false, access: { has: obj => "firstDayButton" in obj, get: obj => obj.firstDayButton, set: (obj, value) => { obj.firstDayButton = value; } }, metadata: _metadata }, _firstDayButton_initializers, _firstDayButton_extraInitializers);
              __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
              _classThis = _classDescriptor.value;
              if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
              __runInitializers(_classThis, _classExtraInitializers);
          }
          constructor() {
              super();
              this.internals = __runInitializers(this, _instanceExtraInitializers);
              this.size = __runInitializers(this, _size_initializers, 'medium');
              this.variant = (__runInitializers(this, _size_extraInitializers), __runInitializers(this, _variant_initializers, 'outlined'));
              this.value = (__runInitializers(this, _variant_extraInitializers), __runInitializers(this, _value_initializers, ''));
              // Track input separately to prevent cursor jumps during typing
              this.inputValue = (__runInitializers(this, _value_extraInitializers), '');
              this.format = __runInitializers(this, _format_initializers, 'mm/dd/yyyy');
              this.placeholder = (__runInitializers(this, _format_extraInitializers), __runInitializers(this, _placeholder_initializers, ''));
              this.label = (__runInitializers(this, _placeholder_extraInitializers), __runInitializers(this, _label_initializers, ''));
              this.helperText = (__runInitializers(this, _label_extraInitializers), __runInitializers(this, _helperText_initializers, ''));
              this.errorText = (__runInitializers(this, _helperText_extraInitializers), __runInitializers(this, _errorText_initializers, ''));
              this.disabled = (__runInitializers(this, _errorText_extraInitializers), __runInitializers(this, _disabled_initializers, false));
              this.readonly = (__runInitializers(this, _disabled_extraInitializers), __runInitializers(this, _readonly_initializers, false));
              this.loading = (__runInitializers(this, _readonly_extraInitializers), __runInitializers(this, _loading_initializers, false));
              this.required = (__runInitializers(this, _loading_extraInitializers), __runInitializers(this, _required_initializers, false));
              this.invalid = (__runInitializers(this, _required_extraInitializers), __runInitializers(this, _invalid_initializers, false));
              this.clearable = (__runInitializers(this, _invalid_extraInitializers), __runInitializers(this, _clearable_initializers, false));
              this.min = (__runInitializers(this, _clearable_extraInitializers), __runInitializers(this, _min_initializers, ''));
              this.max = (__runInitializers(this, _min_extraInitializers), __runInitializers(this, _max_initializers, ''));
              this.name = (__runInitializers(this, _max_extraInitializers), __runInitializers(this, _name_initializers, ''));
              this.showCalendar = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _showCalendar_initializers, false));
              this.firstDayOfWeek = (__runInitializers(this, _showCalendar_extraInitializers), __runInitializers(this, _firstDayOfWeek_initializers, 0)); // 0 = Sunday
              this.input = (__runInitializers(this, _firstDayOfWeek_extraInitializers), __runInitializers(this, _input_initializers, void 0));
              this.calendar = (__runInitializers(this, _input_extraInitializers), __runInitializers(this, _calendar_initializers, void 0));
              this.clearButton = (__runInitializers(this, _calendar_extraInitializers), __runInitializers(this, _clearButton_initializers, void 0));
              this.calendarToggle = (__runInitializers(this, _clearButton_extraInitializers), __runInitializers(this, _calendarToggle_initializers, void 0));
              this.selectedDayButton = (__runInitializers(this, _calendarToggle_extraInitializers), __runInitializers(this, _selectedDayButton_initializers, void 0));
              this.firstDayButton = (__runInitializers(this, _selectedDayButton_extraInitializers), __runInitializers(this, _firstDayButton_initializers, void 0));
              this.selectedDate = (__runInitializers(this, _firstDayButton_extraInitializers), null);
              this.viewDate = new Date();
              this.calendarView = 'days';
              this.yearRangeStart = 0;
              this.monthNames = [
                  'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'
              ];
              this.dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              if (typeof this.attachInternals == 'function') {
                  this.internals = this.attachInternals();
              }
          }
          styles() {
              return snice.css /*css*/ `${cssContent}`;
          }
          render() {
              const labelClasses = ['label', this.required ? 'label--required' : ''].filter(Boolean).join(' ');
              const inputClasses = [
                  'input',
                  `input--${this.size}`,
                  `input--${this.variant}`,
                  this.invalid ? 'input--invalid' : '',
                  this.clearable ? 'input--clearable' : '',
                  this.loading ? 'input--loading' : ''
              ].filter(Boolean).join(' ');
              return snice.html /*html*/ `
      <div class="date-picker-wrapper">
        <if ${this.label}>
          <label class="${labelClasses}">
            ${this.label}
          </label>
        </if>

        <div class="input-container">
          <input
            class="${inputClasses}"
            type="text"
            value="${this.inputValue || this.getFormattedValue()}"
            placeholder="${this.placeholder || this.getPlaceholderForFormat()}"
            ?disabled=${this.disabled || this.loading}
            ?readonly=${this.readonly}
            ?required=${this.required}
            name="${this.name || ''}"
            part="input"
            autocomplete="off"
            @input=${(e) => this.handleInput(e)}
            @change=${(e) => this.handleChange(e)}
            @focus=${(e) => this.handleFocus(e)}
            @blur=${(e) => this.handleBlur(e)}
            @click=${(e) => this.handleInputClick(e)}
            @keydown=${(e) => this.handleKeydown(e)}
          />

          <button
            class="calendar-toggle"
            type="button"
            aria-label="Open calendar"
            tabindex="-1"
            part="calendar-toggle"
            ?disabled=${this.disabled || this.loading}
            @click=${(e) => this.handleCalendarToggle(e)}
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" fill="currentColor"/>
            </svg>
          </button>

          <button
            class="clear-button"
            type="button"
            aria-label="Clear"
            tabindex="-1"
            part="clear"
            style="display: none;"
            @click=${(e) => this.handleClear(e)}
          >
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
            </svg>
          </button>

          <if ${this.loading}>
            <span class="spinner" part="spinner"></span>
          </if>

          <div class="calendar" part="calendar" ?hidden=${!this.showCalendar} @click=${(e) => this.handleCalendarClick(e)}>
            <case ${this.calendarView}>
              <when value="years">
                <div class="calendar-header">
                  <button class="nav-button" type="button" data-nav="prev-years" aria-label="Previous years">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
                    </svg>
                  </button>
                  <div class="calendar-title">
                    <span class="month-label">${this.yearRangeStart} — ${this.yearRangeStart + 11}</span>
                  </div>
                  <button class="nav-button" type="button" data-nav="next-years" aria-label="Next years">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>
                    </svg>
                  </button>
                </div>
                <div class="year-grid">
                  ${this.getYearsGrid()}
                </div>
              </when>
              <default>
                <div class="calendar-header">
                  <button class="nav-button" type="button" data-nav="prev-month" aria-label="Previous month">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
                    </svg>
                  </button>

                  <div class="calendar-title">
                    <span class="month-label">${this.monthNames[this.viewDate.getMonth()]} </span><button class="year-button" type="button" data-nav="show-years">${this.viewDate.getFullYear()}</button>
                  </div>

                  <button class="nav-button" type="button" data-nav="next-month" aria-label="Next month">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>
                    </svg>
                  </button>
                </div>

                <div class="calendar-weekdays">
                  ${this.getDayHeaders()}
                </div>

                <div class="calendar-days">
                  ${this.getDaysGrid()}
                </div>
              </default>
            </case>

            <div class="calendar-footer">
              <snice-button class="today-button" variant="default" size="small" data-nav="today">
                Today
              </snice-button>
            </div>
          </div>
        </div>

        <case ${this.errorText ? 'error' : this.helperText ? 'helper' : 'empty'}>
          <when value="error">
            <span class="error-text" part="error-text">${this.errorText}</span>
          </when>
          <when value="helper">
            <span class="helper-text" part="helper-text">${this.helperText}</span>
          </when>
          <default></default>
        </case>
      </div>
    `;
          }
          init() {
              this.parseInitialValue();
              if (this.internals) {
                  this.internals.setFormValue(this.value);
              }
              // Update clear button after queries are resolved
              queueMicrotask(() => this.updateClearButton());
              this.setupCalendarClickOutside();
              if (this.input) {
                  this.input.disabled = this.disabled;
                  this.input.readOnly = this.readonly;
                  this.input.required = this.required;
                  if (this.invalid) {
                      this.input.setAttribute('aria-invalid', 'true');
                      this.input.classList.add('input--invalid');
                  }
              }
          }
          parseInitialValue() {
              if (this.value) {
                  const date = this.parseDate(this.value);
                  if (date) {
                      this.selectedDate = date;
                      this.viewDate = new Date(date);
                      this.inputValue = this.formatDate(date);
                  }
                  else {
                      this.inputValue = this.value;
                  }
              }
          }
          parseDate(dateString) {
              if (!dateString)
                  return null;
              if (this.format === 'mmmm dd, yyyy') {
                  const monthNameRegex = /^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/;
                  const match = dateString.match(monthNameRegex);
                  if (match) {
                      const [, monthName, day, year] = match;
                      const monthIndex = this.monthNames.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
                      if (monthIndex >= 0) {
                          const date = new Date(parseInt(year), monthIndex, parseInt(day));
                          if (!isNaN(date.getTime())) {
                              return date;
                          }
                      }
                  }
                  return null;
              }
              // Detect ISO date format (yyyy-mm-dd) and parse manually to avoid UTC issues
              const isoDateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
              const isoMatch = dateString.match(isoDateRegex);
              if (isoMatch) {
                  const [, year, month, day] = isoMatch.map(Number);
                  const date = new Date(year, month - 1, day);
                  if (!isNaN(date.getTime())) {
                      return date;
                  }
              }
              // Try manual parsing based on format
              const parts = dateString.split(/[-\/]/);
              if (parts.length === 3) {
                  let year, month, day;
                  switch (this.format) {
                      case 'mm/dd/yyyy':
                      case 'mm-dd-yyyy':
                          [month, day, year] = parts.map(Number);
                          break;
                      case 'dd/mm/yyyy':
                      case 'dd-mm-yyyy':
                          [day, month, year] = parts.map(Number);
                          break;
                      case 'yyyy-mm-dd':
                      case 'yyyy/mm/dd':
                          [year, month, day] = parts.map(Number);
                          break;
                      default:
                          return null;
                  }
                  if (year && month && day) {
                      const date = new Date(year, month - 1, day);
                      if (!isNaN(date.getTime())) {
                          return date;
                      }
                  }
              }
              return null;
          }
          formatDate(date) {
              if (!date)
                  return '';
              const year = date.getFullYear();
              const month = date.getMonth() + 1;
              const day = date.getDate();
              const mm = month.toString().padStart(2, '0');
              const dd = day.toString().padStart(2, '0');
              const yyyy = year.toString();
              switch (this.format) {
                  case 'mm/dd/yyyy':
                      return `${mm}/${dd}/${yyyy}`;
                  case 'dd/mm/yyyy':
                      return `${dd}/${mm}/${yyyy}`;
                  case 'yyyy-mm-dd':
                      return `${yyyy}-${mm}-${dd}`;
                  case 'yyyy/mm/dd':
                      return `${yyyy}/${mm}/${dd}`;
                  case 'dd-mm-yyyy':
                      return `${dd}-${mm}-${yyyy}`;
                  case 'mm-dd-yyyy':
                      return `${mm}-${dd}-${yyyy}`;
                  case 'mmmm dd, yyyy':
                      return `${this.monthNames[date.getMonth()]} ${dd}, ${yyyy}`;
                  default:
                      return `${mm}/${dd}/${yyyy}`;
              }
          }
          getFormattedValue() {
              return this.selectedDate ? this.formatDate(this.selectedDate) : this.value;
          }
          getPlaceholderForFormat() {
              switch (this.format) {
                  case 'mm/dd/yyyy':
                      return 'MM/DD/YYYY';
                  case 'dd/mm/yyyy':
                      return 'DD/MM/YYYY';
                  case 'yyyy-mm-dd':
                      return 'YYYY-MM-DD';
                  case 'yyyy/mm/dd':
                      return 'YYYY/MM/DD';
                  case 'dd-mm-yyyy':
                      return 'DD-MM-YYYY';
                  case 'mm-dd-yyyy':
                      return 'MM-DD-YYYY';
                  case 'mmmm dd, yyyy':
                      return 'Month DD, YYYY';
                  default:
                      return 'MM/DD/YYYY';
              }
          }
          getDayHeaders() {
              const days = [...this.dayNames];
              // Rotate array based on firstDayOfWeek (0=Sunday, 1=Monday, etc.)
              for (let i = 0; i < this.firstDayOfWeek; i++) {
                  days.push(days.shift());
              }
              return days.map(day => snice.html `<div class="weekday">${day}</div>`);
          }
          getYearsGrid() {
              const currentYear = new Date().getFullYear();
              const selectedYear = this.viewDate.getFullYear();
              const years = [];
              for (let i = 0; i < 12; i++) {
                  const year = this.yearRangeStart + i;
                  const classes = ['year-cell'];
                  if (year === currentYear)
                      classes.push('year-cell--current');
                  if (year === selectedYear)
                      classes.push('year-cell--selected');
                  years.push(snice.html `
        <button class="${classes.join(' ')}" type="button" data-year="${year}">${year}</button>
      `);
              }
              return years;
          }
          getDaysGrid() {
              const year = this.viewDate.getFullYear();
              const month = this.viewDate.getMonth();
              // First day of the month
              const firstDay = new Date(year, month, 1);
              // Last day of the month
              const lastDay = new Date(year, month + 1, 0);
              // Calculate starting position based on first day of week preference
              let startingDayOfWeek = firstDay.getDay() - this.firstDayOfWeek;
              if (startingDayOfWeek < 0)
                  startingDayOfWeek += 7;
              const daysInMonth = lastDay.getDate();
              const today = new Date();
              const isToday = (date) => date.getDate() === today.getDate() &&
                  date.getMonth() === today.getMonth() &&
                  date.getFullYear() === today.getFullYear();
              const isSelected = (date) => this.selectedDate &&
                  date.getDate() === this.selectedDate.getDate() &&
                  date.getMonth() === this.selectedDate.getMonth() &&
                  date.getFullYear() === this.selectedDate.getFullYear();
              const isDisabled = (date) => {
                  if (this.min) {
                      const minDate = this.parseDate(this.min);
                      if (minDate && date < minDate)
                          return true;
                  }
                  if (this.max) {
                      const maxDate = this.parseDate(this.max);
                      if (maxDate && date > maxDate)
                          return true;
                  }
                  return false;
              };
              const days = [];
              // Empty cells for days before month starts
              for (let i = 0; i < startingDayOfWeek; i++) {
                  days.push(snice.html `<div class="day day--empty"></div>`);
              }
              // Days of the month
              for (let day = 1; day <= daysInMonth; day++) {
                  const date = new Date(year, month, day);
                  const classes = ['day'];
                  if (isToday(date))
                      classes.push('day--today');
                  if (isSelected(date))
                      classes.push('day--selected');
                  if (isDisabled(date))
                      classes.push('day--disabled');
                  const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                  days.push(snice.html `
        <button
          class="${classes.join(' ')}"
          type="button"
          data-date="${dateStr}"
          ?disabled="${isDisabled(date)}"
          aria-label="${this.formatDate(date)}"
        >
          ${day}
        </button>
      `);
              }
              return days;
          }
          updateInputValue() {
              if (this.input && document.activeElement !== this.input) {
                  const displayValue = this.getFormattedValue();
                  this.input.value = displayValue;
                  this.inputValue = displayValue;
              }
              this.updateClearButton();
          }
          isCompleteDate(value) {
              if (this.format === 'mmmm dd, yyyy') {
                  return /^[A-Za-z]+\s+\d{1,2},\s+\d{4}$/.test(value);
              }
              const separators = (value.match(/[\/\-]/g) || []).length;
              return separators >= 2 && value.length >= 8;
          }
          updateClearButton() {
              if (!this.clearButton || !this.clearable)
                  return;
              const shouldShow = this.selectedDate && !this.disabled && !this.readonly;
              this.clearButton.style.display = shouldShow ? '' : 'none';
              this.clearButton.classList.toggle('clear-button--visible', !!shouldShow);
          }
          updateCalendarGrid() {
              // Trigger full re-render instead of manual DOM manipulation
              this.render();
          }
          setupCalendarClickOutside() {
              document.addEventListener('click', (e) => {
                  if (!this.contains(e.target) && this.showCalendar) {
                      this.close();
                  }
              });
          }
          handleInput(e) {
              const input = e.target;
              this.inputValue = input.value;
              const date = this.parseDate(input.value);
              if (date && this.isCompleteDate(input.value)) {
                  this.selectedDate = date;
                  this.viewDate = new Date(date);
                  if (this.showCalendar) {
                      this.updateCalendarGrid();
                  }
              }
              this.updateClearButton();
              this.dispatchInputEvent();
          }
          handleChange(e) {
              const input = e.target;
              const date = this.parseDate(input.value);
              if (date) {
                  this.selectedDate = date;
                  this.value = this.formatDate(date);
                  this.inputValue = this.value;
                  if (this.input) {
                      this.input.value = this.value;
                  }
              }
              else if (input.value) {
                  this.selectedDate = null;
                  this.value = input.value;
                  this.inputValue = input.value;
              }
              else {
                  this.selectedDate = null;
                  this.value = '';
                  this.inputValue = '';
              }
              this.updateClearButton();
              this.dispatchChangeEvent();
          }
          handleFocus(e) {
              this.dispatchFocusEvent();
          }
          handleInputClick(e) {
              if (!this.showCalendar && !this.disabled && !this.readonly) {
                  this.open();
              }
          }
          handleBlur(e) {
              this.dispatchBlurEvent();
          }
          handleCalendarToggle(e) {
              if (this.showCalendar) {
                  this.close();
              }
              else {
                  this.open();
              }
          }
          handleClear(e) {
              this.clear();
          }
          handleCalendarClick(e) {
              e.stopPropagation();
              const target = e.target;
              if (target.closest('[data-year]')) {
                  const year = parseInt(target.closest('[data-year]').getAttribute('data-year'), 10);
                  this.viewDate = new Date(year, this.viewDate.getMonth(), 1);
                  this.calendarView = 'days';
                  this.updateCalendarGrid();
                  return;
              }
              if (target.closest('[data-date]')) {
                  const dateString = target.closest('[data-date]')?.getAttribute('data-date');
                  if (dateString) {
                      // Parse as local date to avoid timezone issues
                      const [year, month, day] = dateString.split('-').map(Number);
                      const date = new Date(year, month - 1, day);
                      this.selectDate(date);
                  }
              }
              else if (target.closest('[data-nav]')) {
                  const nav = target.closest('[data-nav]')?.getAttribute('data-nav');
                  this.handleNavigation(nav);
              }
          }
          handleKeydown(e) {
              if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (!this.showCalendar) {
                      this.open();
                  }
              }
              else if (e.key === 'Escape' && this.showCalendar) {
                  this.close();
                  this.focus();
              }
          }
          handleNavigation(nav) {
              switch (nav) {
                  case 'prev-month':
                      this.viewDate.setMonth(this.viewDate.getMonth() - 1);
                      this.updateCalendarGrid();
                      break;
                  case 'next-month':
                      this.viewDate.setMonth(this.viewDate.getMonth() + 1);
                      this.updateCalendarGrid();
                      break;
                  case 'today':
                      this.calendarView = 'days';
                      this.goToToday();
                      break;
                  case 'show-years':
                      this.yearRangeStart = this.viewDate.getFullYear() - (this.viewDate.getFullYear() % 12);
                      this.calendarView = 'years';
                      this.updateCalendarGrid();
                      break;
                  case 'prev-years':
                      this.yearRangeStart -= 12;
                      this.updateCalendarGrid();
                      break;
                  case 'next-years':
                      this.yearRangeStart += 12;
                      this.updateCalendarGrid();
                      break;
              }
          }
          handleValueChange() {
              const date = this.parseDate(this.value);
              this.selectedDate = date;
              if (date) {
                  this.viewDate = new Date(date);
              }
              this.updateInputValue();
              this.updateClearButton();
              if (this.internals) {
                  this.internals.setFormValue(this.value);
              }
              if (this.showCalendar) {
                  this.updateCalendarGrid();
              }
          }
          // Manual DOM manipulation required since Snice is imperative
          handleShowCalendarChange() {
              console.log('showCalendar changed:', this.calendar);
              if (this.calendar) {
                  if (this.showCalendar) {
                      this.calendar.removeAttribute('hidden');
                      this.dispatchOpenEvent();
                      // Focus selected date or first available date for accessibility
                      setTimeout(() => {
                          (this.selectedDayButton || this.firstDayButton)?.focus();
                      }, 100);
                  }
                  else {
                      this.calendar.setAttribute('hidden', '');
                      this.dispatchCloseEvent();
                  }
              }
          }
          handleDisabledChange() {
              if (this.input) {
                  this.input.disabled = this.disabled;
              }
              if (this.calendarToggle) {
                  this.calendarToggle.disabled = this.disabled;
              }
              this.updateClearButton();
          }
          handleReadonlyChange() {
              if (this.input) {
                  this.input.readOnly = this.readonly;
              }
              this.updateClearButton();
          }
          handleInvalidChange() {
              if (this.input) {
                  this.input.setAttribute('aria-invalid', String(this.invalid));
                  this.input.classList.toggle('input--invalid', this.invalid);
              }
          }
          handleFormatChange() {
              this.updateInputValue();
          }
          dispatchInputEvent() {
              return { value: this.value, datePicker: this };
          }
          dispatchChangeEvent() {
              return {
                  value: this.value,
                  date: this.selectedDate,
                  formatted: this.selectedDate ? this.formatDate(this.selectedDate) : '',
                  iso: this.selectedDate ? this.selectedDate.toISOString().split('T')[0] : '',
                  datePicker: this
              };
          }
          dispatchFocusEvent() {
              return { datePicker: this };
          }
          dispatchBlurEvent() {
              return { datePicker: this };
          }
          dispatchOpenEvent() {
              return { datePicker: this };
          }
          dispatchCloseEvent() {
              return { datePicker: this };
          }
          dispatchClearEvent() {
              return { datePicker: this };
          }
          dispatchSelectEvent(date) {
              return {
                  date,
                  formatted: this.formatDate(date),
                  iso: date.toISOString().split('T')[0],
                  datePicker: this
              };
          }
          focus() {
              this.input?.focus();
          }
          blur() {
              this.input?.blur();
          }
          clear() {
              this.selectedDate = null;
              this.value = '';
              this.updateInputValue();
              this.dispatchClearEvent();
              this.dispatchChangeEvent();
              this.focus();
          }
          open() {
              if (!this.disabled && !this.readonly) {
                  this.showCalendar = true;
                  this.calendarView = 'days';
                  if (this.selectedDate) {
                      this.viewDate = new Date(this.selectedDate);
                  }
                  this.updateCalendarGrid();
                  if (this.calendar) {
                      this.calendar.removeAttribute('hidden');
                  }
                  this.dispatchOpenEvent();
              }
          }
          close() {
              this.showCalendar = false;
              if (this.calendar) {
                  this.calendar.setAttribute('hidden', '');
              }
              this.dispatchCloseEvent();
          }
          selectDate(date) {
              this.selectedDate = date;
              this.value = this.formatDate(date);
              this.viewDate = new Date(date);
              this.updateInputValue();
              this.updateCalendarGrid();
              this.dispatchSelectEvent(date);
              this.dispatchChangeEvent();
              this.close();
              this.focus();
          }
          goToMonth(year, month) {
              this.viewDate = new Date(year, month, 1);
              this.updateCalendarGrid();
          }
          goToToday() {
              const today = new Date();
              this.selectDate(today);
          }
          checkValidity() {
              return this.input?.checkValidity() ?? true;
          }
          reportValidity() {
              return this.input?.reportValidity() ?? true;
          }
          setCustomValidity(message) {
              this.input?.setCustomValidity(message);
          }
      });
      return _classThis;
  })();

  exports.SniceDatePicker = SniceDatePicker;

  return exports;

})({}, Snice);
//# sourceMappingURL=snice-date-picker.js.map
