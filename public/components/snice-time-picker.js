/*!
 * snice v4.25.0
 * A decorator-driven web component library with differential rendering, routing, controllers, and 130+ ready-made UI components. Use as much or as little as you want. Zero dependencies, works anywhere.
 * (c) 2024
 * Released under the MIT License.
 */
if(typeof globalThis.Snice==="undefined"){console.warn("[snice] snice-runtime.min.js must be loaded before snice-time-picker.min.js");}
var SniceTimePicker = (function (exports, snice) {
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

  var cssContent = ":host{display:block;position:relative;font-family:var(--snice-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif);font-size:var(--snice-font-size-sm, .875rem);line-height:var(--snice-line-height-normal, 1.5)}.time-picker-wrapper{display:flex;flex-direction:column}.label{font-size:var(--snice-font-size-sm, .875rem);font-weight:var(--snice-font-weight-medium,500);line-height:var(--snice-line-height-normal, 1.5);color:var(--snice-color-text,rgb(23 23 23));margin-bottom:var(--snice-spacing-2xs,.25rem)}.label--required::after{content:'*';color:var(--snice-color-danger,rgb(220 38 38));margin-left:var(--snice-spacing-2xs,.25rem)}.input-container{position:relative;display:flex;align-items:center}.input{width:100%;box-sizing:border-box;min-height:2.5rem;border:1px solid var(--snice-color-border,rgb(226 226 226));border-radius:var(--snice-border-radius-lg,6px);padding:var(--snice-spacing-xs,.5rem) 2.75rem var(--snice-spacing-xs,.5rem) var(--snice-spacing-sm,.75rem);font-size:inherit;font-family:inherit;line-height:var(--snice-line-height-normal, 1.5);background:var(--snice-color-background-input,rgb(248 247 245));color:var(--snice-color-text,rgb(23 23 23));transition:border-color var(--snice-transition-fast, 150ms) ease,box-shadow var(--snice-transition-fast, 150ms) ease;outline:0;box-sizing:border-box}.input:focus{border-color:var(--snice-color-primary,rgb(37 99 235));box-shadow:0 0 0 var(--snice-focus-ring-width,2px) var(--snice-focus-ring-color,rgb(59 130 246 / .5))}.input--invalid{border-color:var(--snice-color-danger,rgb(220 38 38))}.input--invalid:focus{border-color:var(--snice-color-danger,rgb(220 38 38));box-shadow:0 0 0 var(--snice-focus-ring-width,2px) rgb(220 38 38 / .3)}.input--small{padding:.375rem 2.75rem .375rem .625rem;font-size:.875rem;min-height:2rem}.input--large{padding:.75rem 3.5rem .75rem 1rem;font-size:1rem;min-height:3rem}.input--loading{cursor:wait}.input:disabled{background:var(--snice-color-background-secondary,rgb(243 244 246));color:var(--snice-color-text-tertiary,rgb(115 115 115));cursor:not-allowed}.input::placeholder{color:var(--snice-color-text-secondary,rgb(82 82 82));opacity:.7}.input:not(:disabled):not([readonly]){cursor:pointer}.clock-toggle{position:absolute;right:.5rem;padding:.25rem;border:none;background:0 0;color:var(--snice-color-text-secondary,rgb(82 82 82));cursor:pointer;border-radius:4px;transition:color var(--snice-transition-fast, 150ms) ease,background-color var(--snice-transition-fast, 150ms) ease;display:flex;align-items:center;justify-content:center}.clock-toggle:hover{color:var(--snice-color-text,rgb(23 23 23));background:var(--snice-color-background-tertiary,rgb(240 240 240))}.clock-toggle:disabled{opacity:.5;cursor:not-allowed}.dropdown{position:absolute;top:100%;left:0;right:0;z-index:var(--snice-z-index-dropdown,1000);background:var(--snice-color-background-element,rgb(252 251 249));border:1px solid var(--snice-color-border,rgb(226 226 226));border-radius:var(--snice-border-radius-lg,8px);box-shadow:var(--snice-shadow-lg,0 10px 15px -3px rgb(0 0 0 / .1),0 4px 6px -4px rgb(0 0 0 / .1));margin-top:var(--snice-spacing-3xs,.125rem);padding:var(--snice-spacing-sm,.75rem)}.dropdown[hidden]{display:none}.dropdown--inline{position:static;box-shadow:none;border:1px solid var(--snice-color-border,rgb(226 226 226));margin-top:0}.selectors{display:flex;gap:var(--snice-spacing-2xs,.25rem)}.selector-column{flex:1;display:flex;flex-direction:column;min-width:0}.selector-column--period{flex:0 0 auto;width:3.5rem}.selector-label{font-size:var(--snice-font-size-xs, .75rem);font-weight:var(--snice-font-weight-semibold,600);color:var(--snice-color-text-secondary,rgb(82 82 82));text-align:center;padding-bottom:var(--snice-spacing-2xs,.25rem);border-bottom:1px solid var(--snice-color-border,rgb(226 226 226));margin-bottom:var(--snice-spacing-2xs,.25rem)}.selector-list{display:flex;flex-direction:column;gap:1px;max-height:12rem;overflow-y:auto;scrollbar-width:thin}.selector-list::-webkit-scrollbar{width:4px}.selector-list::-webkit-scrollbar-thumb{background:var(--snice-color-border,rgb(226 226 226));border-radius:2px}.selector-item{border:none;background:0 0;padding:.375rem .5rem;font-size:var(--snice-font-size-sm, .875rem);font-family:inherit;color:var(--snice-color-text,rgb(23 23 23));cursor:pointer;border-radius:var(--snice-border-radius-md,4px);text-align:center;transition:background-color var(--snice-transition-fast, 150ms) ease,color var(--snice-transition-fast, 150ms) ease;white-space:nowrap}.selector-item:hover:not(:disabled){background:var(--snice-color-background-tertiary,rgb(240 240 240))}.selector-item--selected{background:var(--snice-color-primary,rgb(37 99 235));color:var(--snice-color-text-inverse,rgb(250 250 250));font-weight:var(--snice-font-weight-medium,500)}.selector-item--selected:hover{background:var(--snice-color-primary,rgb(37 99 235));color:var(--snice-color-text-inverse,rgb(250 250 250))}.selector-item:disabled{color:var(--snice-color-text-tertiary,rgb(115 115 115));cursor:not-allowed;opacity:.5}.error-text,.helper-text{font-size:var(--snice-font-size-xs, .75rem);margin-top:var(--snice-spacing-2xs,.25rem)}.helper-text{color:var(--snice-color-text-secondary,rgb(82 82 82))}.error-text{color:var(--snice-color-danger,rgb(220 38 38))}.spinner{position:absolute;right:3rem;width:1em;height:1em;pointer-events:none}.spinner::after{content:'';display:block;width:100%;height:100%;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:.6s linear infinite spin}@keyframes spin{to{transform:rotate(360deg)}}.clear-button{position:absolute;right:2.5rem;padding:.25rem;border:none;background:0 0;color:var(--snice-color-text-secondary,rgb(82 82 82));cursor:pointer;border-radius:4px;transition:color var(--snice-transition-fast, 150ms) ease,background-color var(--snice-transition-fast, 150ms) ease;display:flex;align-items:center;justify-content:center}.clear-button:hover{color:var(--snice-color-text,rgb(23 23 23));background:var(--snice-color-background-tertiary,rgb(240 240 240))}";

  let SniceTimePicker = (() => {
      let _classDecorators = [snice.element('snice-time-picker', { formAssociated: true })];
      let _classDescriptor;
      let _classExtraInitializers = [];
      let _classThis;
      let _classSuper = HTMLElement;
      let _instanceExtraInitializers = [];
      let _value_decorators;
      let _value_initializers = [];
      let _value_extraInitializers = [];
      let _format_decorators;
      let _format_initializers = [];
      let _format_extraInitializers = [];
      let _step_decorators;
      let _step_initializers = [];
      let _step_extraInitializers = [];
      let _minTime_decorators;
      let _minTime_initializers = [];
      let _minTime_extraInitializers = [];
      let _maxTime_decorators;
      let _maxTime_initializers = [];
      let _maxTime_extraInitializers = [];
      let _showSeconds_decorators;
      let _showSeconds_initializers = [];
      let _showSeconds_extraInitializers = [];
      let _disabled_decorators;
      let _disabled_initializers = [];
      let _disabled_extraInitializers = [];
      let _readonly_decorators;
      let _readonly_initializers = [];
      let _readonly_extraInitializers = [];
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
      let _required_decorators;
      let _required_initializers = [];
      let _required_extraInitializers = [];
      let _invalid_decorators;
      let _invalid_initializers = [];
      let _invalid_extraInitializers = [];
      let _name_decorators;
      let _name_initializers = [];
      let _name_extraInitializers = [];
      let _variant_decorators;
      let _variant_initializers = [];
      let _variant_extraInitializers = [];
      let _size_decorators;
      let _size_initializers = [];
      let _size_extraInitializers = [];
      let _loading_decorators;
      let _loading_initializers = [];
      let _loading_extraInitializers = [];
      let _clearable_decorators;
      let _clearable_initializers = [];
      let _clearable_extraInitializers = [];
      let _showDropdown_decorators;
      let _showDropdown_initializers = [];
      let _showDropdown_extraInitializers = [];
      let _input_decorators;
      let _input_initializers = [];
      let _input_extraInitializers = [];
      let _dropdown_decorators;
      let _dropdown_initializers = [];
      let _dropdown_extraInitializers = [];
      let _clearButton_decorators;
      let _clearButton_initializers = [];
      let _clearButton_extraInitializers = [];
      let _componentStyles_decorators;
      let _renderContent_decorators;
      let _init_decorators;
      let _handleValueChange_decorators;
      let _handleShowDropdownChange_decorators;
      let _handleDisabledChange_decorators;
      let _handleInvalidChange_decorators;
      let _emitTimeChange_decorators;
      let _emitFocus_decorators;
      let _emitBlur_decorators;
      let _emitOpen_decorators;
      let _emitClose_decorators;
      let _emitClear_decorators;
      (class extends _classSuper {
          static { _classThis = this; }
          static {
              const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
              _value_decorators = [snice.property()];
              _format_decorators = [snice.property()];
              _step_decorators = [snice.property({ type: Number })];
              _minTime_decorators = [snice.property({ attribute: 'min-time' })];
              _maxTime_decorators = [snice.property({ attribute: 'max-time' })];
              _showSeconds_decorators = [snice.property({ type: Boolean, attribute: 'show-seconds' })];
              _disabled_decorators = [snice.property({ type: Boolean })];
              _readonly_decorators = [snice.property({ type: Boolean })];
              _placeholder_decorators = [snice.property()];
              _label_decorators = [snice.property()];
              _helperText_decorators = [snice.property({ attribute: 'helper-text' })];
              _errorText_decorators = [snice.property({ attribute: 'error-text' })];
              _required_decorators = [snice.property({ type: Boolean })];
              _invalid_decorators = [snice.property({ type: Boolean })];
              _name_decorators = [snice.property()];
              _variant_decorators = [snice.property()];
              _size_decorators = [snice.property()];
              _loading_decorators = [snice.property({ type: Boolean })];
              _clearable_decorators = [snice.property({ type: Boolean })];
              _showDropdown_decorators = [snice.property({ type: Boolean, attribute: 'show-dropdown' })];
              _input_decorators = [snice.query('.input')];
              _dropdown_decorators = [snice.query('.dropdown')];
              _clearButton_decorators = [snice.query('.clear-button')];
              _componentStyles_decorators = [snice.styles()];
              _renderContent_decorators = [snice.render()];
              _init_decorators = [snice.ready()];
              _handleValueChange_decorators = [snice.watch('value')];
              _handleShowDropdownChange_decorators = [snice.watch('show-dropdown')];
              _handleDisabledChange_decorators = [snice.watch('disabled')];
              _handleInvalidChange_decorators = [snice.watch('invalid')];
              _emitTimeChange_decorators = [snice.dispatch('time-change', { bubbles: true, composed: true })];
              _emitFocus_decorators = [snice.dispatch('timepicker-focus', { bubbles: true, composed: true })];
              _emitBlur_decorators = [snice.dispatch('timepicker-blur', { bubbles: true, composed: true })];
              _emitOpen_decorators = [snice.dispatch('timepicker-open', { bubbles: true, composed: true })];
              _emitClose_decorators = [snice.dispatch('timepicker-close', { bubbles: true, composed: true })];
              _emitClear_decorators = [snice.dispatch('timepicker-clear', { bubbles: true, composed: true })];
              __esDecorate(this, null, _componentStyles_decorators, { kind: "method", name: "componentStyles", static: false, private: false, access: { has: obj => "componentStyles" in obj, get: obj => obj.componentStyles }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _renderContent_decorators, { kind: "method", name: "renderContent", static: false, private: false, access: { has: obj => "renderContent" in obj, get: obj => obj.renderContent }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _init_decorators, { kind: "method", name: "init", static: false, private: false, access: { has: obj => "init" in obj, get: obj => obj.init }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _handleValueChange_decorators, { kind: "method", name: "handleValueChange", static: false, private: false, access: { has: obj => "handleValueChange" in obj, get: obj => obj.handleValueChange }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _handleShowDropdownChange_decorators, { kind: "method", name: "handleShowDropdownChange", static: false, private: false, access: { has: obj => "handleShowDropdownChange" in obj, get: obj => obj.handleShowDropdownChange }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _handleDisabledChange_decorators, { kind: "method", name: "handleDisabledChange", static: false, private: false, access: { has: obj => "handleDisabledChange" in obj, get: obj => obj.handleDisabledChange }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _handleInvalidChange_decorators, { kind: "method", name: "handleInvalidChange", static: false, private: false, access: { has: obj => "handleInvalidChange" in obj, get: obj => obj.handleInvalidChange }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _emitTimeChange_decorators, { kind: "method", name: "emitTimeChange", static: false, private: false, access: { has: obj => "emitTimeChange" in obj, get: obj => obj.emitTimeChange }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _emitFocus_decorators, { kind: "method", name: "emitFocus", static: false, private: false, access: { has: obj => "emitFocus" in obj, get: obj => obj.emitFocus }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _emitBlur_decorators, { kind: "method", name: "emitBlur", static: false, private: false, access: { has: obj => "emitBlur" in obj, get: obj => obj.emitBlur }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _emitOpen_decorators, { kind: "method", name: "emitOpen", static: false, private: false, access: { has: obj => "emitOpen" in obj, get: obj => obj.emitOpen }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _emitClose_decorators, { kind: "method", name: "emitClose", static: false, private: false, access: { has: obj => "emitClose" in obj, get: obj => obj.emitClose }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _emitClear_decorators, { kind: "method", name: "emitClear", static: false, private: false, access: { has: obj => "emitClear" in obj, get: obj => obj.emitClear }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(null, null, _value_decorators, { kind: "field", name: "value", static: false, private: false, access: { has: obj => "value" in obj, get: obj => obj.value, set: (obj, value) => { obj.value = value; } }, metadata: _metadata }, _value_initializers, _value_extraInitializers);
              __esDecorate(null, null, _format_decorators, { kind: "field", name: "format", static: false, private: false, access: { has: obj => "format" in obj, get: obj => obj.format, set: (obj, value) => { obj.format = value; } }, metadata: _metadata }, _format_initializers, _format_extraInitializers);
              __esDecorate(null, null, _step_decorators, { kind: "field", name: "step", static: false, private: false, access: { has: obj => "step" in obj, get: obj => obj.step, set: (obj, value) => { obj.step = value; } }, metadata: _metadata }, _step_initializers, _step_extraInitializers);
              __esDecorate(null, null, _minTime_decorators, { kind: "field", name: "minTime", static: false, private: false, access: { has: obj => "minTime" in obj, get: obj => obj.minTime, set: (obj, value) => { obj.minTime = value; } }, metadata: _metadata }, _minTime_initializers, _minTime_extraInitializers);
              __esDecorate(null, null, _maxTime_decorators, { kind: "field", name: "maxTime", static: false, private: false, access: { has: obj => "maxTime" in obj, get: obj => obj.maxTime, set: (obj, value) => { obj.maxTime = value; } }, metadata: _metadata }, _maxTime_initializers, _maxTime_extraInitializers);
              __esDecorate(null, null, _showSeconds_decorators, { kind: "field", name: "showSeconds", static: false, private: false, access: { has: obj => "showSeconds" in obj, get: obj => obj.showSeconds, set: (obj, value) => { obj.showSeconds = value; } }, metadata: _metadata }, _showSeconds_initializers, _showSeconds_extraInitializers);
              __esDecorate(null, null, _disabled_decorators, { kind: "field", name: "disabled", static: false, private: false, access: { has: obj => "disabled" in obj, get: obj => obj.disabled, set: (obj, value) => { obj.disabled = value; } }, metadata: _metadata }, _disabled_initializers, _disabled_extraInitializers);
              __esDecorate(null, null, _readonly_decorators, { kind: "field", name: "readonly", static: false, private: false, access: { has: obj => "readonly" in obj, get: obj => obj.readonly, set: (obj, value) => { obj.readonly = value; } }, metadata: _metadata }, _readonly_initializers, _readonly_extraInitializers);
              __esDecorate(null, null, _placeholder_decorators, { kind: "field", name: "placeholder", static: false, private: false, access: { has: obj => "placeholder" in obj, get: obj => obj.placeholder, set: (obj, value) => { obj.placeholder = value; } }, metadata: _metadata }, _placeholder_initializers, _placeholder_extraInitializers);
              __esDecorate(null, null, _label_decorators, { kind: "field", name: "label", static: false, private: false, access: { has: obj => "label" in obj, get: obj => obj.label, set: (obj, value) => { obj.label = value; } }, metadata: _metadata }, _label_initializers, _label_extraInitializers);
              __esDecorate(null, null, _helperText_decorators, { kind: "field", name: "helperText", static: false, private: false, access: { has: obj => "helperText" in obj, get: obj => obj.helperText, set: (obj, value) => { obj.helperText = value; } }, metadata: _metadata }, _helperText_initializers, _helperText_extraInitializers);
              __esDecorate(null, null, _errorText_decorators, { kind: "field", name: "errorText", static: false, private: false, access: { has: obj => "errorText" in obj, get: obj => obj.errorText, set: (obj, value) => { obj.errorText = value; } }, metadata: _metadata }, _errorText_initializers, _errorText_extraInitializers);
              __esDecorate(null, null, _required_decorators, { kind: "field", name: "required", static: false, private: false, access: { has: obj => "required" in obj, get: obj => obj.required, set: (obj, value) => { obj.required = value; } }, metadata: _metadata }, _required_initializers, _required_extraInitializers);
              __esDecorate(null, null, _invalid_decorators, { kind: "field", name: "invalid", static: false, private: false, access: { has: obj => "invalid" in obj, get: obj => obj.invalid, set: (obj, value) => { obj.invalid = value; } }, metadata: _metadata }, _invalid_initializers, _invalid_extraInitializers);
              __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: obj => "name" in obj, get: obj => obj.name, set: (obj, value) => { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
              __esDecorate(null, null, _variant_decorators, { kind: "field", name: "variant", static: false, private: false, access: { has: obj => "variant" in obj, get: obj => obj.variant, set: (obj, value) => { obj.variant = value; } }, metadata: _metadata }, _variant_initializers, _variant_extraInitializers);
              __esDecorate(null, null, _size_decorators, { kind: "field", name: "size", static: false, private: false, access: { has: obj => "size" in obj, get: obj => obj.size, set: (obj, value) => { obj.size = value; } }, metadata: _metadata }, _size_initializers, _size_extraInitializers);
              __esDecorate(null, null, _loading_decorators, { kind: "field", name: "loading", static: false, private: false, access: { has: obj => "loading" in obj, get: obj => obj.loading, set: (obj, value) => { obj.loading = value; } }, metadata: _metadata }, _loading_initializers, _loading_extraInitializers);
              __esDecorate(null, null, _clearable_decorators, { kind: "field", name: "clearable", static: false, private: false, access: { has: obj => "clearable" in obj, get: obj => obj.clearable, set: (obj, value) => { obj.clearable = value; } }, metadata: _metadata }, _clearable_initializers, _clearable_extraInitializers);
              __esDecorate(null, null, _showDropdown_decorators, { kind: "field", name: "showDropdown", static: false, private: false, access: { has: obj => "showDropdown" in obj, get: obj => obj.showDropdown, set: (obj, value) => { obj.showDropdown = value; } }, metadata: _metadata }, _showDropdown_initializers, _showDropdown_extraInitializers);
              __esDecorate(null, null, _input_decorators, { kind: "field", name: "input", static: false, private: false, access: { has: obj => "input" in obj, get: obj => obj.input, set: (obj, value) => { obj.input = value; } }, metadata: _metadata }, _input_initializers, _input_extraInitializers);
              __esDecorate(null, null, _dropdown_decorators, { kind: "field", name: "dropdown", static: false, private: false, access: { has: obj => "dropdown" in obj, get: obj => obj.dropdown, set: (obj, value) => { obj.dropdown = value; } }, metadata: _metadata }, _dropdown_initializers, _dropdown_extraInitializers);
              __esDecorate(null, null, _clearButton_decorators, { kind: "field", name: "clearButton", static: false, private: false, access: { has: obj => "clearButton" in obj, get: obj => obj.clearButton, set: (obj, value) => { obj.clearButton = value; } }, metadata: _metadata }, _clearButton_initializers, _clearButton_extraInitializers);
              __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
              _classThis = _classDescriptor.value;
              if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
              __runInitializers(_classThis, _classExtraInitializers);
          }
          constructor() {
              super();
              this.internals = __runInitializers(this, _instanceExtraInitializers);
              this.value = __runInitializers(this, _value_initializers, '');
              this.format = (__runInitializers(this, _value_extraInitializers), __runInitializers(this, _format_initializers, '24h'));
              this.step = (__runInitializers(this, _format_extraInitializers), __runInitializers(this, _step_initializers, 15));
              this.minTime = (__runInitializers(this, _step_extraInitializers), __runInitializers(this, _minTime_initializers, ''));
              this.maxTime = (__runInitializers(this, _minTime_extraInitializers), __runInitializers(this, _maxTime_initializers, ''));
              this.showSeconds = (__runInitializers(this, _maxTime_extraInitializers), __runInitializers(this, _showSeconds_initializers, false));
              this.disabled = (__runInitializers(this, _showSeconds_extraInitializers), __runInitializers(this, _disabled_initializers, false));
              this.readonly = (__runInitializers(this, _disabled_extraInitializers), __runInitializers(this, _readonly_initializers, false));
              this.placeholder = (__runInitializers(this, _readonly_extraInitializers), __runInitializers(this, _placeholder_initializers, ''));
              this.label = (__runInitializers(this, _placeholder_extraInitializers), __runInitializers(this, _label_initializers, ''));
              this.helperText = (__runInitializers(this, _label_extraInitializers), __runInitializers(this, _helperText_initializers, ''));
              this.errorText = (__runInitializers(this, _helperText_extraInitializers), __runInitializers(this, _errorText_initializers, ''));
              this.required = (__runInitializers(this, _errorText_extraInitializers), __runInitializers(this, _required_initializers, false));
              this.invalid = (__runInitializers(this, _required_extraInitializers), __runInitializers(this, _invalid_initializers, false));
              this.name = (__runInitializers(this, _invalid_extraInitializers), __runInitializers(this, _name_initializers, ''));
              this.variant = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _variant_initializers, 'dropdown'));
              this.size = (__runInitializers(this, _variant_extraInitializers), __runInitializers(this, _size_initializers, 'medium'));
              this.loading = (__runInitializers(this, _size_extraInitializers), __runInitializers(this, _loading_initializers, false));
              this.clearable = (__runInitializers(this, _loading_extraInitializers), __runInitializers(this, _clearable_initializers, false));
              this.showDropdown = (__runInitializers(this, _clearable_extraInitializers), __runInitializers(this, _showDropdown_initializers, false));
              this.input = (__runInitializers(this, _showDropdown_extraInitializers), __runInitializers(this, _input_initializers, void 0));
              this.dropdown = (__runInitializers(this, _input_extraInitializers), __runInitializers(this, _dropdown_initializers, void 0));
              this.clearButton = (__runInitializers(this, _dropdown_extraInitializers), __runInitializers(this, _clearButton_initializers, void 0));
              this.hours = (__runInitializers(this, _clearButton_extraInitializers), 0);
              this.minutes = 0;
              this.seconds = 0;
              this.period = 'AM';
              if (typeof this.attachInternals == 'function') {
                  this.internals = this.attachInternals();
              }
          }
          componentStyles() {
              return snice.css /*css*/ `${cssContent}`;
          }
          renderContent() {
              const labelClasses = ['label', this.required ? 'label--required' : ''].filter(Boolean).join(' ');
              const isInline = this.variant === 'inline';
              const inputClasses = [
                  'input',
                  `input--${this.size}`,
                  this.invalid ? 'input--invalid' : '',
                  this.loading ? 'input--loading' : ''
              ].filter(Boolean).join(' ');
              const isDisabledOrLoading = this.disabled || this.loading;
              return snice.html /*html*/ `
      <div class="time-picker-wrapper" part="base">
        <if ${this.label}>
          <label class="${labelClasses}" part="label">${this.label}</label>
        </if>

        <if ${!isInline}>
          <div class="input-container">
            <input
              class="${inputClasses}"
              type="text"
              value="${this.getFormattedValue()}"
              placeholder="${this.placeholder || this.getPlaceholder()}"
              ?disabled=${isDisabledOrLoading}
              ?readonly=${this.readonly}
              ?required=${this.required}
              name="${this.name || ''}"
              part="input"
              autocomplete="off"
              @focus=${this.handleFocus}
              @blur=${this.handleBlur}
              @click=${this.handleInputClick}
              @keydown=${this.handleKeydown}
              @input=${this.handleInputChange}
            />

            <button
              class="clock-toggle"
              type="button"
              aria-label="Open time picker"
              tabindex="-1"
              part="toggle"
              ?disabled=${isDisabledOrLoading}
              @click=${this.handleToggle}
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="currentColor"/>
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
          </div>
        </if>

        <div class="dropdown ${isInline ? 'dropdown--inline' : ''}" part="dropdown" ?hidden=${!isInline && !this.showDropdown}>
          ${this.renderTimeSelectors()}
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
          renderTimeSelectors() {
              const hourOptions = this.getHourOptions();
              const minuteOptions = this.getMinuteOptions();
              const secondOptions = this.getSecondOptions();
              return snice.html /*html*/ `
      <div class="selectors">
        <div class="selector-column" part="hours">
          <div class="selector-label">Hr</div>
          <div class="selector-list" @click=${(e) => this.handleHourClick(e)}>
            ${hourOptions.map(h => {
                const isSelected = h.value === this.hours;
                return snice.html `
                <button
                  class="selector-item ${isSelected ? 'selector-item--selected' : ''}"
                  type="button"
                  data-hour="${h.value}"
                  ?disabled=${h.disabled}
                >${h.label}</button>
              `;
            })}
          </div>
        </div>

        <div class="selector-column" part="minutes">
          <div class="selector-label">Min</div>
          <div class="selector-list" @click=${(e) => this.handleMinuteClick(e)}>
            ${minuteOptions.map(m => {
                const isSelected = m.value === this.minutes;
                return snice.html `
                <button
                  class="selector-item ${isSelected ? 'selector-item--selected' : ''}"
                  type="button"
                  data-minute="${m.value}"
                  ?disabled=${m.disabled}
                >${m.label}</button>
              `;
            })}
          </div>
        </div>

        <if ${this.showSeconds}>
          <div class="selector-column" part="seconds">
            <div class="selector-label">Sec</div>
            <div class="selector-list" @click=${(e) => this.handleSecondClick(e)}>
              ${secondOptions.map(s => {
                const isSelected = s.value === this.seconds;
                return snice.html `
                  <button
                    class="selector-item ${isSelected ? 'selector-item--selected' : ''}"
                    type="button"
                    data-second="${s.value}"
                  >${s.label}</button>
                `;
            })}
            </div>
          </div>
        </if>

        <if ${this.format === '12h'}>
          <div class="selector-column selector-column--period" part="period">
            <div class="selector-label">Period</div>
            <div class="selector-list">
              <button
                class="selector-item ${this.period === 'AM' ? 'selector-item--selected' : ''}"
                type="button"
                @click=${() => this.setPeriod('AM')}
              >AM</button>
              <button
                class="selector-item ${this.period === 'PM' ? 'selector-item--selected' : ''}"
                type="button"
                @click=${() => this.setPeriod('PM')}
              >PM</button>
            </div>
          </div>
        </if>
      </div>
    `;
          }
          init() {
              this.parseValue();
              if (this.internals) {
                  this.internals.setFormValue(this.value);
              }
              this.setupClickOutside();
              queueMicrotask(() => this.updateClearButton());
          }
          parseValue() {
              if (!this.value)
                  return;
              const parts = this.value.split(':');
              if (parts.length >= 2) {
                  this.hours = parseInt(parts[0], 10) || 0;
                  this.minutes = parseInt(parts[1], 10) || 0;
                  this.seconds = parts.length >= 3 ? (parseInt(parts[2], 10) || 0) : 0;
                  if (this.format === '12h') {
                      if (this.hours >= 12) {
                          this.period = 'PM';
                          if (this.hours > 12)
                              this.hours -= 12;
                      }
                      else {
                          this.period = 'AM';
                          if (this.hours === 0)
                              this.hours = 12;
                      }
                  }
              }
          }
          getFormattedValue() {
              if (!this.value)
                  return '';
              if (this.format === '12h') {
                  const displayHour = this.hours === 0 ? 12 : this.hours > 12 ? this.hours - 12 : this.hours;
                  const period = this.hours >= 12 ? 'PM' : 'AM';
                  const base = `${displayHour}:${this.minutes.toString().padStart(2, '0')}`;
                  if (this.showSeconds) {
                      return `${base}:${this.seconds.toString().padStart(2, '0')} ${period}`;
                  }
                  return `${base} ${period}`;
              }
              const base = `${this.hours.toString().padStart(2, '0')}:${this.minutes.toString().padStart(2, '0')}`;
              if (this.showSeconds) {
                  return `${base}:${this.seconds.toString().padStart(2, '0')}`;
              }
              return base;
          }
          getPlaceholder() {
              if (this.format === '12h') {
                  return this.showSeconds ? 'HH:MM:SS AM' : 'HH:MM AM';
              }
              return this.showSeconds ? 'HH:MM:SS' : 'HH:MM';
          }
          get24HourValue() {
              let h = this.hours;
              if (this.format === '12h') {
                  if (this.period === 'AM' && h === 12)
                      h = 0;
                  else if (this.period === 'PM' && h !== 12)
                      h += 12;
              }
              const base = `${h.toString().padStart(2, '0')}:${this.minutes.toString().padStart(2, '0')}`;
              if (this.showSeconds) {
                  return `${base}:${this.seconds.toString().padStart(2, '0')}`;
              }
              return base;
          }
          timeToMinutes(time) {
              const parts = time.split(':');
              return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
          }
          isTimeInRange(hours, minutes) {
              const timeMinutes = hours * 60 + minutes;
              if (this.minTime) {
                  const minMinutes = this.timeToMinutes(this.minTime);
                  if (timeMinutes < minMinutes)
                      return false;
              }
              if (this.maxTime) {
                  const maxMinutes = this.timeToMinutes(this.maxTime);
                  if (timeMinutes > maxMinutes)
                      return false;
              }
              return true;
          }
          getHourOptions() {
              const options = [];
              const max = this.format === '12h' ? 12 : 23;
              const start = this.format === '12h' ? 1 : 0;
              for (let h = start; h <= max; h++) {
                  let actual24h = h;
                  if (this.format === '12h') {
                      if (this.period === 'AM' && h === 12)
                          actual24h = 0;
                      else if (this.period === 'PM' && h !== 12)
                          actual24h = h + 12;
                      else
                          actual24h = h;
                  }
                  const disabled = !this.isTimeInRange(actual24h, 0) && !this.isTimeInRange(actual24h, 59);
                  const label = this.format === '12h' ? String(h) : h.toString().padStart(2, '0');
                  options.push({ value: h, label, disabled });
              }
              return options;
          }
          getMinuteOptions() {
              const options = [];
              for (let m = 0; m < 60; m += this.step) {
                  let actualHour = this.hours;
                  if (this.format === '12h') {
                      if (this.period === 'AM' && actualHour === 12)
                          actualHour = 0;
                      else if (this.period === 'PM' && actualHour !== 12)
                          actualHour += 12;
                  }
                  const disabled = !this.isTimeInRange(actualHour, m);
                  options.push({ value: m, label: m.toString().padStart(2, '0'), disabled });
              }
              return options;
          }
          getSecondOptions() {
              const options = [];
              for (let s = 0; s < 60; s += this.step) {
                  options.push({ value: s, label: s.toString().padStart(2, '0'), disabled: false });
              }
              return options;
          }
          handleHourClick(e) {
              const target = e.target.closest('[data-hour]');
              if (!target || target.disabled)
                  return;
              this.hours = parseInt(target.getAttribute('data-hour'), 10);
              this.updateValue();
          }
          handleMinuteClick(e) {
              const target = e.target.closest('[data-minute]');
              if (!target || target.disabled)
                  return;
              this.minutes = parseInt(target.getAttribute('data-minute'), 10);
              this.updateValue();
          }
          handleSecondClick(e) {
              const target = e.target.closest('[data-second]');
              if (!target || target.disabled)
                  return;
              this.seconds = parseInt(target.getAttribute('data-second'), 10);
              this.updateValue();
          }
          setPeriod(period) {
              this.period = period;
              this.updateValue();
          }
          updateValue() {
              this.value = this.get24HourValue();
              if (this.input) {
                  this.input.value = this.getFormattedValue();
              }
              if (this.internals) {
                  this.internals.setFormValue(this.value);
              }
              this.updateClearButton();
              this.emitTimeChange();
          }
          handleInputChange(e) {
              const input = e.target;
              const parsed = this.parseTimeString(input.value);
              if (parsed) {
                  this.hours = parsed.hours;
                  this.minutes = parsed.minutes;
                  this.seconds = parsed.seconds;
                  this.period = parsed.period;
                  this.value = this.get24HourValue();
                  if (this.internals) {
                      this.internals.setFormValue(this.value);
                  }
                  this.emitTimeChange();
              }
          }
          parseTimeString(str) {
              str = str.trim();
              const match12 = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
              if (match12) {
                  return {
                      hours: parseInt(match12[1], 10),
                      minutes: parseInt(match12[2], 10),
                      seconds: match12[3] ? parseInt(match12[3], 10) : 0,
                      period: match12[4].toUpperCase(),
                  };
              }
              const match24 = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
              if (match24) {
                  const h = parseInt(match24[1], 10);
                  return {
                      hours: h,
                      minutes: parseInt(match24[2], 10),
                      seconds: match24[3] ? parseInt(match24[3], 10) : 0,
                      period: h >= 12 ? 'PM' : 'AM',
                  };
              }
              return null;
          }
          handleFocus() {
              this.emitFocus();
          }
          handleBlur() {
              this.emitBlur();
          }
          handleInputClick() {
              if (!this.showDropdown && !this.disabled && !this.readonly) {
                  this.open();
              }
          }
          handleToggle() {
              if (this.showDropdown) {
                  this.close();
              }
              else {
                  this.open();
              }
          }
          handleKeydown(e) {
              if (e.key === 'Escape' && this.showDropdown) {
                  this.close();
                  this.focus();
              }
              else if (e.key === 'Enter' || e.key === ' ') {
                  if (!this.showDropdown) {
                      e.preventDefault();
                      this.open();
                  }
              }
          }
          setupClickOutside() {
              document.addEventListener('click', (e) => {
                  if (!this.contains(e.target) && this.showDropdown) {
                      this.close();
                  }
              });
          }
          handleValueChange() {
              this.parseValue();
              if (this.input) {
                  this.input.value = this.getFormattedValue();
              }
              if (this.internals) {
                  this.internals.setFormValue(this.value);
              }
          }
          handleShowDropdownChange() {
              if (this.dropdown) {
                  if (this.showDropdown) {
                      this.dropdown.removeAttribute('hidden');
                      this.emitOpen();
                      // Scroll selected items into view
                      queueMicrotask(() => this.scrollSelectedIntoView());
                  }
                  else {
                      this.dropdown.setAttribute('hidden', '');
                      this.emitClose();
                  }
              }
          }
          handleDisabledChange() {
              if (this.input) {
                  this.input.disabled = this.disabled;
              }
              this.updateClearButton();
          }
          handleInvalidChange() {
              if (this.input) {
                  this.input.setAttribute('aria-invalid', String(this.invalid));
                  this.input.classList.toggle('input--invalid', this.invalid);
              }
          }
          scrollSelectedIntoView() {
              const selectedItems = this.shadowRoot?.querySelectorAll('.selector-item--selected');
              selectedItems?.forEach(item => {
                  item.scrollIntoView({ block: 'center', behavior: 'smooth' });
              });
          }
          emitTimeChange() {
              let h = this.hours;
              if (this.format === '12h') {
                  if (this.period === 'AM' && h === 12)
                      h = 0;
                  else if (this.period === 'PM' && h !== 12)
                      h += 12;
              }
              return {
                  value: this.value,
                  hours: h,
                  minutes: this.minutes,
                  seconds: this.seconds,
                  formatted: this.getFormattedValue(),
                  timePicker: this,
              };
          }
          emitFocus() {
              return { timePicker: this };
          }
          emitBlur() {
              return { timePicker: this };
          }
          emitOpen() {
              return { timePicker: this };
          }
          emitClose() {
              return { timePicker: this };
          }
          emitClear() {
              return { timePicker: this };
          }
          handleClear(e) {
              e.stopPropagation();
              this.clear();
          }
          updateClearButton() {
              if (!this.clearButton || !this.clearable)
                  return;
              const shouldShow = this.value && !this.disabled && !this.readonly;
              this.clearButton.style.display = shouldShow ? '' : 'none';
          }
          // Public API
          open() {
              if (!this.disabled && !this.readonly && this.variant === 'dropdown') {
                  this.showDropdown = true;
                  if (this.dropdown) {
                      this.dropdown.removeAttribute('hidden');
                  }
                  this.emitOpen();
              }
          }
          close() {
              this.showDropdown = false;
              if (this.dropdown) {
                  this.dropdown.setAttribute('hidden', '');
              }
              this.emitClose();
          }
          focus() {
              this.input?.focus();
          }
          blur() {
              this.input?.blur();
          }
          clear() {
              this.hours = 0;
              this.minutes = 0;
              this.seconds = 0;
              this.period = 'AM';
              this.value = '';
              if (this.input) {
                  this.input.value = '';
              }
              this.updateClearButton();
              this.emitClear();
              this.emitTimeChange();
              this.focus();
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

  exports.SniceTimePicker = SniceTimePicker;

  return exports;

})({}, Snice);
//# sourceMappingURL=snice-time-picker.js.map
