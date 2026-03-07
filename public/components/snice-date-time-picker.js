/*!
 * snice v4.25.0
 * A decorator-driven web component library with differential rendering, routing, controllers, and 130+ ready-made UI components. Use as much or as little as you want. Zero dependencies, works anywhere.
 * (c) 2024
 * Released under the MIT License.
 */
if(typeof globalThis.Snice==="undefined"){console.warn("[snice] snice-runtime.min.js must be loaded before snice-date-time-picker.min.js");}
var SniceDateTimePicker = (function (exports, snice) {
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

  var cssContent = ":host{display:block;position:relative;font-family:var(--snice-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif);font-size:var(--snice-font-size-sm, .875rem);line-height:var(--snice-line-height-normal, 1.5)}.datetime-wrapper{display:flex;flex-direction:column}.label{font-size:var(--snice-font-size-sm, .875rem);font-weight:var(--snice-font-weight-medium,500);line-height:var(--snice-line-height-normal, 1.5);color:var(--snice-color-text,rgb(23 23 23));margin-bottom:var(--snice-spacing-2xs,.25rem)}.label--required::after{content:'*';color:var(--snice-color-danger,rgb(220 38 38));margin-left:var(--snice-spacing-2xs,.25rem)}.input-container{position:relative;display:flex;align-items:center}.input{width:100%;box-sizing:border-box;min-height:2.5rem;border:1px solid var(--snice-color-border,rgb(226 226 226));border-radius:var(--snice-border-radius-lg,6px);padding:var(--snice-spacing-xs,.5rem) 2.75rem var(--snice-spacing-xs,.5rem) var(--snice-spacing-sm,.75rem);font-size:inherit;font-family:inherit;line-height:var(--snice-line-height-normal, 1.5);background:var(--snice-color-background-input,rgb(248 247 245));color:var(--snice-color-text,rgb(23 23 23));transition:border-color var(--snice-transition-fast, 150ms) ease,box-shadow var(--snice-transition-fast, 150ms) ease;outline:0;box-sizing:border-box}.input:focus{border-color:var(--snice-color-primary,rgb(37 99 235));box-shadow:0 0 0 var(--snice-focus-ring-width,2px) var(--snice-focus-ring-color,rgb(59 130 246 / .5))}.input--invalid{border-color:var(--snice-color-danger,rgb(220 38 38))}.input--invalid:focus{border-color:var(--snice-color-danger,rgb(220 38 38));box-shadow:0 0 0 var(--snice-focus-ring-width,2px) rgb(220 38 38 / .3)}.input:disabled{background:var(--snice-color-background-secondary,rgb(243 244 246));color:var(--snice-color-text-tertiary,rgb(115 115 115));cursor:not-allowed}.input::placeholder{color:var(--snice-color-text-secondary,rgb(82 82 82));opacity:.7}.input:not(:disabled):not([readonly]){cursor:pointer}.input--small{padding:.375rem 2.75rem .375rem .625rem;font-size:.875rem;min-height:2rem}.input--large{padding:.75rem 3.5rem .75rem 1rem;font-size:1rem;min-height:3rem}.input--loading{cursor:wait}.spinner{position:absolute;right:3rem;width:1em;height:1em;pointer-events:none}.spinner::after{content:'';display:block;width:100%;height:100%;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:.6s linear infinite spin}@keyframes spin{to{transform:rotate(360deg)}}.toggle-button{position:absolute;right:.5rem;padding:.25rem;border:none;background:0 0;color:var(--snice-color-text-secondary,rgb(82 82 82));cursor:pointer;border-radius:4px;transition:color var(--snice-transition-fast, 150ms) ease,background-color var(--snice-transition-fast, 150ms) ease;display:flex;align-items:center;justify-content:center}.toggle-button:hover{color:var(--snice-color-text,rgb(23 23 23));background:var(--snice-color-background-tertiary,rgb(240 240 240))}.toggle-button:disabled{opacity:.5;cursor:not-allowed}.clear-button{position:absolute;right:2.5rem;padding:.25rem;border:none;background:0 0;color:var(--snice-color-text-secondary,rgb(82 82 82));cursor:pointer;border-radius:4px;transition:color var(--snice-transition-fast, 150ms) ease,background-color var(--snice-transition-fast, 150ms) ease;display:flex;align-items:center;justify-content:center}.clear-button:hover{color:var(--snice-color-text,rgb(23 23 23));background:var(--snice-color-background-tertiary,rgb(240 240 240))}.panel{position:absolute;top:100%;left:0;z-index:var(--snice-z-index-dropdown,1000);background:var(--snice-color-background-element,rgb(252 251 249));border:1px solid var(--snice-color-border,rgb(226 226 226));border-radius:var(--snice-border-radius-lg,8px);box-shadow:var(--snice-shadow-lg,0 10px 15px -3px rgb(0 0 0 / .1),0 4px 6px -4px rgb(0 0 0 / .1));margin-top:var(--snice-spacing-3xs,.125rem);display:flex;flex-direction:row;overflow:hidden;min-width:420px}.panel[hidden]{display:none}.panel--inline{position:static;box-shadow:none;border:1px solid var(--snice-color-border,rgb(226 226 226));margin-top:0}.panel-calendar{flex:1;padding:var(--snice-spacing-md,1rem);border-right:1px solid var(--snice-color-border,rgb(226 226 226));min-width:260px}.calendar-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--snice-spacing-sm,.75rem)}.calendar-title{font-size:var(--snice-font-size-md, 1rem);font-weight:var(--snice-font-weight-semibold,600);color:var(--snice-color-text,rgb(23 23 23));text-align:center;flex:1}.year-button{background:0 0;border:none;font-size:var(--snice-font-size-md, 1rem);font-weight:var(--snice-font-weight-semibold,600);font-family:inherit;color:var(--snice-color-primary,rgb(37 99 235));cursor:pointer;padding:.125rem .375rem;border-radius:var(--snice-border-radius-md,4px);transition:background-color var(--snice-transition-fast, 150ms) ease}.year-button:hover{background:var(--snice-color-background-tertiary,rgb(240 240 240))}.month-label{font-size:var(--snice-font-size-md, 1rem);font-weight:var(--snice-font-weight-semibold,600);color:var(--snice-color-text,rgb(23 23 23))}.year-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;padding:.5rem 0}.year-cell{border:none;background:0 0;cursor:pointer;padding:.625rem .25rem;border-radius:var(--snice-border-radius-md,4px);font-size:var(--snice-font-size-sm, .875rem);font-family:inherit;color:var(--snice-color-text,rgb(23 23 23));transition:background-color var(--snice-transition-fast, 150ms) ease,color var(--snice-transition-fast, 150ms) ease}.year-cell:hover{background:var(--snice-color-background-tertiary,rgb(240 240 240))}.year-cell--current{outline:2px solid var(--snice-color-primary,rgb(37 99 235));outline-offset:-2px;color:var(--snice-color-primary,rgb(37 99 235));font-weight:var(--snice-font-weight-semibold,600)}.year-cell--selected{background:var(--snice-color-primary,rgb(37 99 235));color:var(--snice-color-text-inverse,rgb(250 250 250));font-weight:var(--snice-font-weight-semibold,600)}.nav-button{background:0 0;border:none;padding:.375rem;cursor:pointer;color:var(--snice-color-text-secondary,rgb(82 82 82));border-radius:4px;transition:color var(--snice-transition-fast, 150ms) ease,background-color var(--snice-transition-fast, 150ms) ease;display:flex;align-items:center;justify-content:center}.nav-button:hover{color:var(--snice-color-text,rgb(23 23 23));background:var(--snice-color-background-tertiary,rgb(240 240 240))}.calendar-weekdays{display:grid;grid-template-columns:repeat(7,1fr);gap:1px;margin-bottom:var(--snice-spacing-2xs,.25rem)}.weekday{text-align:center;font-size:var(--snice-font-size-xs, .75rem);font-weight:var(--snice-font-weight-semibold,600);color:var(--snice-color-text-secondary,rgb(82 82 82));padding:.375rem .25rem}.calendar-days{display:grid;grid-template-columns:repeat(7,1fr);gap:1px}.day{width:2rem;height:2rem;border:none;background:0 0;cursor:pointer;border-radius:var(--snice-border-radius-md,4px);font-size:var(--snice-font-size-sm, .875rem);font-family:inherit;color:var(--snice-color-text,rgb(23 23 23));transition:background-color var(--snice-transition-fast, 150ms) ease,color var(--snice-transition-fast, 150ms) ease;display:flex;align-items:center;justify-content:center}.day:hover:not(.day--disabled):not(.day--empty){background:var(--snice-color-background-tertiary,rgb(240 240 240))}.day--today{font-weight:var(--snice-font-weight-semibold,600);color:var(--snice-color-primary,rgb(37 99 235))}.day--selected{background:var(--snice-color-primary,rgb(37 99 235));color:var(--snice-color-text-inverse,rgb(250 250 250));font-weight:var(--snice-font-weight-semibold,600)}.day--disabled{color:var(--snice-color-text-tertiary,rgb(115 115 115));cursor:not-allowed;opacity:.5}.day--empty{cursor:default}.calendar-footer{margin-top:var(--snice-spacing-sm,.75rem);padding-top:var(--snice-spacing-sm,.75rem);border-top:1px solid var(--snice-color-border,rgb(226 226 226));display:flex;justify-content:center}.today-button{background:0 0;border:1px solid var(--snice-color-border,rgb(226 226 226));padding:.25rem .75rem;font-size:var(--snice-font-size-sm, .875rem);font-family:inherit;color:var(--snice-color-primary,rgb(37 99 235));cursor:pointer;border-radius:var(--snice-border-radius-md,4px);transition:background-color var(--snice-transition-fast, 150ms) ease}.today-button:hover{background:var(--snice-color-background-tertiary,rgb(240 240 240))}.panel-time{width:11rem;padding:var(--snice-spacing-md,1rem);display:flex;flex-direction:column}.time-header{font-size:var(--snice-font-size-sm, .875rem);font-weight:var(--snice-font-weight-semibold,600);color:var(--snice-color-text,rgb(23 23 23));margin-bottom:var(--snice-spacing-xs,.5rem);text-align:center}.time-selectors{display:flex;gap:var(--snice-spacing-3xs,.125rem);flex:1;min-height:0}.time-column{flex:1;display:flex;flex-direction:column;min-width:0}.time-column--period{flex:0 0 auto;width:2.5rem}.time-label{font-size:var(--snice-font-size-xs, .75rem);font-weight:var(--snice-font-weight-semibold,600);color:var(--snice-color-text-secondary,rgb(82 82 82));text-align:center;padding-bottom:var(--snice-spacing-2xs,.25rem);border-bottom:1px solid var(--snice-color-border,rgb(226 226 226));margin-bottom:var(--snice-spacing-2xs,.25rem)}.time-list{display:flex;flex-direction:column;gap:1px;max-height:12rem;overflow-y:auto;scrollbar-width:thin}.time-list::-webkit-scrollbar{width:3px}.time-list::-webkit-scrollbar-thumb{background:var(--snice-color-border,rgb(226 226 226));border-radius:2px}.time-item{border:none;background:0 0;padding:.25rem .375rem;font-size:var(--snice-font-size-sm, .875rem);font-family:inherit;color:var(--snice-color-text,rgb(23 23 23));cursor:pointer;border-radius:var(--snice-border-radius-md,4px);text-align:center;transition:background-color var(--snice-transition-fast, 150ms) ease,color var(--snice-transition-fast, 150ms) ease;white-space:nowrap}.time-item:hover{background:var(--snice-color-background-tertiary,rgb(240 240 240))}.time-item--selected{background:var(--snice-color-primary,rgb(37 99 235));color:var(--snice-color-text-inverse,rgb(250 250 250));font-weight:var(--snice-font-weight-medium,500)}.time-item--selected:hover{background:var(--snice-color-primary,rgb(37 99 235))}.time-item:disabled{color:var(--snice-color-text-tertiary,rgb(115 115 115));cursor:not-allowed;opacity:.5}.error-text,.helper-text{font-size:var(--snice-font-size-xs, .75rem);margin-top:var(--snice-spacing-2xs,.25rem)}.helper-text{color:var(--snice-color-text-secondary,rgb(82 82 82))}.error-text{color:var(--snice-color-danger,rgb(220 38 38))}@media (max-width:480px){.panel{flex-direction:column;min-width:280px}.panel-calendar{border-right:none;border-bottom:1px solid var(--snice-color-border,rgb(226 226 226))}.panel-time{width:100%}.time-selectors{justify-content:center}}";

  let SniceDateTimePicker = (() => {
      let _classDecorators = [snice.element('snice-date-time-picker', { formAssociated: true })];
      let _classDescriptor;
      let _classExtraInitializers = [];
      let _classThis;
      let _classSuper = HTMLElement;
      let _instanceExtraInitializers = [];
      let _size_decorators;
      let _size_initializers = [];
      let _size_extraInitializers = [];
      let _value_decorators;
      let _value_initializers = [];
      let _value_extraInitializers = [];
      let _dateFormat_decorators;
      let _dateFormat_initializers = [];
      let _dateFormat_extraInitializers = [];
      let _timeFormat_decorators;
      let _timeFormat_initializers = [];
      let _timeFormat_extraInitializers = [];
      let _min_decorators;
      let _min_initializers = [];
      let _min_extraInitializers = [];
      let _max_decorators;
      let _max_initializers = [];
      let _max_extraInitializers = [];
      let _showSeconds_decorators;
      let _showSeconds_initializers = [];
      let _showSeconds_extraInitializers = [];
      let _loading_decorators;
      let _loading_initializers = [];
      let _loading_extraInitializers = [];
      let _clearable_decorators;
      let _clearable_initializers = [];
      let _clearable_extraInitializers = [];
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
      let _showPanel_decorators;
      let _showPanel_initializers = [];
      let _showPanel_extraInitializers = [];
      let _input_decorators;
      let _input_initializers = [];
      let _input_extraInitializers = [];
      let _panel_decorators;
      let _panel_initializers = [];
      let _panel_extraInitializers = [];
      let _clearButton_decorators;
      let _clearButton_initializers = [];
      let _clearButton_extraInitializers = [];
      let _componentStyles_decorators;
      let _renderContent_decorators;
      let _init_decorators;
      let _handleValueChange_decorators;
      let _handleShowPanelChange_decorators;
      let _handleDisabledChange_decorators;
      let _handleInvalidChange_decorators;
      let _emitClear_decorators;
      let _emitDateTimeChange_decorators;
      let _emitFocus_decorators;
      let _emitBlur_decorators;
      let _emitOpen_decorators;
      let _emitClose_decorators;
      (class extends _classSuper {
          static { _classThis = this; }
          static {
              const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
              _size_decorators = [snice.property()];
              _value_decorators = [snice.property()];
              _dateFormat_decorators = [snice.property({ attribute: 'date-format' })];
              _timeFormat_decorators = [snice.property({ attribute: 'time-format' })];
              _min_decorators = [snice.property()];
              _max_decorators = [snice.property()];
              _showSeconds_decorators = [snice.property({ type: Boolean, attribute: 'show-seconds' })];
              _loading_decorators = [snice.property({ type: Boolean })];
              _clearable_decorators = [snice.property({ type: Boolean })];
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
              _showPanel_decorators = [snice.property({ type: Boolean, attribute: 'show-panel' })];
              _input_decorators = [snice.query('.input')];
              _panel_decorators = [snice.query('.panel')];
              _clearButton_decorators = [snice.query('.clear-button')];
              _componentStyles_decorators = [snice.styles()];
              _renderContent_decorators = [snice.render()];
              _init_decorators = [snice.ready()];
              _handleValueChange_decorators = [snice.watch('value')];
              _handleShowPanelChange_decorators = [snice.watch('show-panel')];
              _handleDisabledChange_decorators = [snice.watch('disabled')];
              _handleInvalidChange_decorators = [snice.watch('invalid')];
              _emitClear_decorators = [snice.dispatch('datetimepicker-clear', { bubbles: true, composed: true })];
              _emitDateTimeChange_decorators = [snice.dispatch('datetime-change', { bubbles: true, composed: true })];
              _emitFocus_decorators = [snice.dispatch('datetimepicker-focus', { bubbles: true, composed: true })];
              _emitBlur_decorators = [snice.dispatch('datetimepicker-blur', { bubbles: true, composed: true })];
              _emitOpen_decorators = [snice.dispatch('datetimepicker-open', { bubbles: true, composed: true })];
              _emitClose_decorators = [snice.dispatch('datetimepicker-close', { bubbles: true, composed: true })];
              __esDecorate(this, null, _componentStyles_decorators, { kind: "method", name: "componentStyles", static: false, private: false, access: { has: obj => "componentStyles" in obj, get: obj => obj.componentStyles }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _renderContent_decorators, { kind: "method", name: "renderContent", static: false, private: false, access: { has: obj => "renderContent" in obj, get: obj => obj.renderContent }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _init_decorators, { kind: "method", name: "init", static: false, private: false, access: { has: obj => "init" in obj, get: obj => obj.init }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _handleValueChange_decorators, { kind: "method", name: "handleValueChange", static: false, private: false, access: { has: obj => "handleValueChange" in obj, get: obj => obj.handleValueChange }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _handleShowPanelChange_decorators, { kind: "method", name: "handleShowPanelChange", static: false, private: false, access: { has: obj => "handleShowPanelChange" in obj, get: obj => obj.handleShowPanelChange }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _handleDisabledChange_decorators, { kind: "method", name: "handleDisabledChange", static: false, private: false, access: { has: obj => "handleDisabledChange" in obj, get: obj => obj.handleDisabledChange }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _handleInvalidChange_decorators, { kind: "method", name: "handleInvalidChange", static: false, private: false, access: { has: obj => "handleInvalidChange" in obj, get: obj => obj.handleInvalidChange }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _emitClear_decorators, { kind: "method", name: "emitClear", static: false, private: false, access: { has: obj => "emitClear" in obj, get: obj => obj.emitClear }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _emitDateTimeChange_decorators, { kind: "method", name: "emitDateTimeChange", static: false, private: false, access: { has: obj => "emitDateTimeChange" in obj, get: obj => obj.emitDateTimeChange }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _emitFocus_decorators, { kind: "method", name: "emitFocus", static: false, private: false, access: { has: obj => "emitFocus" in obj, get: obj => obj.emitFocus }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _emitBlur_decorators, { kind: "method", name: "emitBlur", static: false, private: false, access: { has: obj => "emitBlur" in obj, get: obj => obj.emitBlur }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _emitOpen_decorators, { kind: "method", name: "emitOpen", static: false, private: false, access: { has: obj => "emitOpen" in obj, get: obj => obj.emitOpen }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(this, null, _emitClose_decorators, { kind: "method", name: "emitClose", static: false, private: false, access: { has: obj => "emitClose" in obj, get: obj => obj.emitClose }, metadata: _metadata }, null, _instanceExtraInitializers);
              __esDecorate(null, null, _size_decorators, { kind: "field", name: "size", static: false, private: false, access: { has: obj => "size" in obj, get: obj => obj.size, set: (obj, value) => { obj.size = value; } }, metadata: _metadata }, _size_initializers, _size_extraInitializers);
              __esDecorate(null, null, _value_decorators, { kind: "field", name: "value", static: false, private: false, access: { has: obj => "value" in obj, get: obj => obj.value, set: (obj, value) => { obj.value = value; } }, metadata: _metadata }, _value_initializers, _value_extraInitializers);
              __esDecorate(null, null, _dateFormat_decorators, { kind: "field", name: "dateFormat", static: false, private: false, access: { has: obj => "dateFormat" in obj, get: obj => obj.dateFormat, set: (obj, value) => { obj.dateFormat = value; } }, metadata: _metadata }, _dateFormat_initializers, _dateFormat_extraInitializers);
              __esDecorate(null, null, _timeFormat_decorators, { kind: "field", name: "timeFormat", static: false, private: false, access: { has: obj => "timeFormat" in obj, get: obj => obj.timeFormat, set: (obj, value) => { obj.timeFormat = value; } }, metadata: _metadata }, _timeFormat_initializers, _timeFormat_extraInitializers);
              __esDecorate(null, null, _min_decorators, { kind: "field", name: "min", static: false, private: false, access: { has: obj => "min" in obj, get: obj => obj.min, set: (obj, value) => { obj.min = value; } }, metadata: _metadata }, _min_initializers, _min_extraInitializers);
              __esDecorate(null, null, _max_decorators, { kind: "field", name: "max", static: false, private: false, access: { has: obj => "max" in obj, get: obj => obj.max, set: (obj, value) => { obj.max = value; } }, metadata: _metadata }, _max_initializers, _max_extraInitializers);
              __esDecorate(null, null, _showSeconds_decorators, { kind: "field", name: "showSeconds", static: false, private: false, access: { has: obj => "showSeconds" in obj, get: obj => obj.showSeconds, set: (obj, value) => { obj.showSeconds = value; } }, metadata: _metadata }, _showSeconds_initializers, _showSeconds_extraInitializers);
              __esDecorate(null, null, _loading_decorators, { kind: "field", name: "loading", static: false, private: false, access: { has: obj => "loading" in obj, get: obj => obj.loading, set: (obj, value) => { obj.loading = value; } }, metadata: _metadata }, _loading_initializers, _loading_extraInitializers);
              __esDecorate(null, null, _clearable_decorators, { kind: "field", name: "clearable", static: false, private: false, access: { has: obj => "clearable" in obj, get: obj => obj.clearable, set: (obj, value) => { obj.clearable = value; } }, metadata: _metadata }, _clearable_initializers, _clearable_extraInitializers);
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
              __esDecorate(null, null, _showPanel_decorators, { kind: "field", name: "showPanel", static: false, private: false, access: { has: obj => "showPanel" in obj, get: obj => obj.showPanel, set: (obj, value) => { obj.showPanel = value; } }, metadata: _metadata }, _showPanel_initializers, _showPanel_extraInitializers);
              __esDecorate(null, null, _input_decorators, { kind: "field", name: "input", static: false, private: false, access: { has: obj => "input" in obj, get: obj => obj.input, set: (obj, value) => { obj.input = value; } }, metadata: _metadata }, _input_initializers, _input_extraInitializers);
              __esDecorate(null, null, _panel_decorators, { kind: "field", name: "panel", static: false, private: false, access: { has: obj => "panel" in obj, get: obj => obj.panel, set: (obj, value) => { obj.panel = value; } }, metadata: _metadata }, _panel_initializers, _panel_extraInitializers);
              __esDecorate(null, null, _clearButton_decorators, { kind: "field", name: "clearButton", static: false, private: false, access: { has: obj => "clearButton" in obj, get: obj => obj.clearButton, set: (obj, value) => { obj.clearButton = value; } }, metadata: _metadata }, _clearButton_initializers, _clearButton_extraInitializers);
              __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
              _classThis = _classDescriptor.value;
              if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
              __runInitializers(_classThis, _classExtraInitializers);
          }
          constructor() {
              super();
              this.internals = __runInitializers(this, _instanceExtraInitializers);
              this.size = __runInitializers(this, _size_initializers, 'medium');
              this.value = (__runInitializers(this, _size_extraInitializers), __runInitializers(this, _value_initializers, ''));
              this.dateFormat = (__runInitializers(this, _value_extraInitializers), __runInitializers(this, _dateFormat_initializers, 'yyyy-mm-dd'));
              this.timeFormat = (__runInitializers(this, _dateFormat_extraInitializers), __runInitializers(this, _timeFormat_initializers, '24h'));
              this.min = (__runInitializers(this, _timeFormat_extraInitializers), __runInitializers(this, _min_initializers, ''));
              this.max = (__runInitializers(this, _min_extraInitializers), __runInitializers(this, _max_initializers, ''));
              this.showSeconds = (__runInitializers(this, _max_extraInitializers), __runInitializers(this, _showSeconds_initializers, false));
              this.loading = (__runInitializers(this, _showSeconds_extraInitializers), __runInitializers(this, _loading_initializers, false));
              this.clearable = (__runInitializers(this, _loading_extraInitializers), __runInitializers(this, _clearable_initializers, false));
              this.disabled = (__runInitializers(this, _clearable_extraInitializers), __runInitializers(this, _disabled_initializers, false));
              this.readonly = (__runInitializers(this, _disabled_extraInitializers), __runInitializers(this, _readonly_initializers, false));
              this.placeholder = (__runInitializers(this, _readonly_extraInitializers), __runInitializers(this, _placeholder_initializers, ''));
              this.label = (__runInitializers(this, _placeholder_extraInitializers), __runInitializers(this, _label_initializers, ''));
              this.helperText = (__runInitializers(this, _label_extraInitializers), __runInitializers(this, _helperText_initializers, ''));
              this.errorText = (__runInitializers(this, _helperText_extraInitializers), __runInitializers(this, _errorText_initializers, ''));
              this.required = (__runInitializers(this, _errorText_extraInitializers), __runInitializers(this, _required_initializers, false));
              this.invalid = (__runInitializers(this, _required_extraInitializers), __runInitializers(this, _invalid_initializers, false));
              this.name = (__runInitializers(this, _invalid_extraInitializers), __runInitializers(this, _name_initializers, ''));
              this.variant = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _variant_initializers, 'dropdown'));
              this.showPanel = (__runInitializers(this, _variant_extraInitializers), __runInitializers(this, _showPanel_initializers, false));
              this.input = (__runInitializers(this, _showPanel_extraInitializers), __runInitializers(this, _input_initializers, void 0));
              this.panel = (__runInitializers(this, _input_extraInitializers), __runInitializers(this, _panel_initializers, void 0));
              this.clearButton = (__runInitializers(this, _panel_extraInitializers), __runInitializers(this, _clearButton_initializers, void 0));
              // Internal state
              this.selectedDate = (__runInitializers(this, _clearButton_extraInitializers), null);
              this.viewDate = new Date();
              this.calendarView = 'days';
              this.yearRangeStart = 0;
              this.hours = 0;
              this.minutes = 0;
              this.seconds = 0;
              this.period = 'AM';
              this.monthNames = [
                  'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'
              ];
              this.dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              if (typeof this.attachInternals == 'function') {
                  this.internals = this.attachInternals();
              }
          }
          componentStyles() {
              return snice.css /*css*/ `${cssContent}`;
          }
          renderContent() {
              const labelClasses = ['label', this.required ? 'label--required' : ''].filter(Boolean).join(' ');
              const inputClasses = [
                  'input',
                  `input--${this.size}`,
                  this.invalid ? 'input--invalid' : '',
                  this.loading ? 'input--loading' : ''
              ].filter(Boolean).join(' ');
              const isInline = this.variant === 'inline';
              return snice.html /*html*/ `
      <div class="datetime-wrapper" part="base">
        <if ${this.label}>
          <label class="${labelClasses}" part="label">${this.label}</label>
        </if>

        <if ${!isInline}>
          <div class="input-container">
            <input
              class="${inputClasses}"
              type="text"
              value="${this.getDisplayValue()}"
              placeholder="${this.placeholder || this.getPlaceholder()}"
              ?disabled=${this.disabled || this.loading}
              ?readonly=${this.readonly}
              ?required=${this.required}
              name="${this.name || ''}"
              part="input"
              autocomplete="off"
              @focus=${this.handleFocus}
              @blur=${this.handleBlur}
              @click=${this.handleInputClick}
              @keydown=${this.handleKeydown}
            />

            <button
              class="toggle-button"
              type="button"
              aria-label="Open date and time picker"
              tabindex="-1"
              part="toggle"
              ?disabled=${this.disabled || this.loading}
              @click=${this.handleToggle}
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
          </div>
        </if>

        <div class="panel ${isInline ? 'panel--inline' : ''}" part="panel" ?hidden=${!isInline && !this.showPanel}>
          <div class="panel-calendar" part="calendar">
            ${this.renderCalendar()}
          </div>
          <div class="panel-time" part="time">
            ${this.renderTimeSelectors()}
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
          renderCalendar() {
              return snice.html /*html*/ `
      <case ${this.calendarView}>
        <when value="years">
          <div class="calendar-header">
            <button class="nav-button" type="button" aria-label="Previous years" @click=${this.prevYears}>
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
              </svg>
            </button>

            <div class="calendar-title">
              <span class="month-label">${this.yearRangeStart} — ${this.yearRangeStart + 11}</span>
            </div>

            <button class="nav-button" type="button" aria-label="Next years" @click=${this.nextYears}>
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>
              </svg>
            </button>
          </div>

          <div class="year-grid" @click=${(e) => this.handleYearClick(e)}>
            ${this.getYearsGrid()}
          </div>
        </when>
        <default>
          <div class="calendar-header">
            <button class="nav-button" type="button" aria-label="Previous month" @click=${this.prevMonth}>
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
              </svg>
            </button>

            <div class="calendar-title">
              <span class="month-label">${this.monthNames[this.viewDate.getMonth()]} </span><button class="year-button" type="button" @click=${this.showYears}>${this.viewDate.getFullYear()}</button>
            </div>

            <button class="nav-button" type="button" aria-label="Next month" @click=${this.nextMonth}>
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>
              </svg>
            </button>
          </div>

          <div class="calendar-weekdays">
            ${this.dayNames.map(day => snice.html `<div class="weekday">${day}</div>`)}
          </div>

          <div class="calendar-days" @click=${(e) => this.handleDayClick(e)}>
            ${this.getDaysGrid()}
          </div>
        </default>
      </case>

      <div class="calendar-footer">
        <button class="today-button" type="button" @click=${this.goToToday}>Today</button>
      </div>
    `;
          }
          renderTimeSelectors() {
              const hourMax = this.timeFormat === '12h' ? 12 : 23;
              const hourStart = this.timeFormat === '12h' ? 1 : 0;
              return snice.html /*html*/ `
      <div class="time-header">Time</div>
      <div class="time-selectors">
        <div class="time-column">
          <label class="time-label">Hr</label>
          <div class="time-list" @click=${(e) => this.handleHourClick(e)}>
            ${Array.from({ length: hourMax - hourStart + 1 }, (_, i) => i + hourStart).map(h => {
                this.timeFormat === '12h' ? this.hours : this.hours;
                const isSelected = h === (this.timeFormat === '12h' ? (this.hours === 0 ? 12 : this.hours > 12 ? this.hours - 12 : this.hours) : this.hours);
                return snice.html `
                <button
                  class="time-item ${isSelected ? 'time-item--selected' : ''}"
                  type="button"
                  data-hour="${h}"
                >${this.timeFormat === '12h' ? String(h) : h.toString().padStart(2, '0')}</button>
              `;
            })}
          </div>
        </div>

        <div class="time-column">
          <label class="time-label">Min</label>
          <div class="time-list" @click=${(e) => this.handleMinuteClick(e)}>
            ${Array.from({ length: 12 }, (_, i) => i * 5).map(m => {
                const isSelected = m === this.minutes;
                return snice.html `
                <button
                  class="time-item ${isSelected ? 'time-item--selected' : ''}"
                  type="button"
                  data-minute="${m}"
                >${m.toString().padStart(2, '0')}</button>
              `;
            })}
          </div>
        </div>

        <if ${this.showSeconds}>
          <div class="time-column">
            <label class="time-label">Sec</label>
            <div class="time-list" @click=${(e) => this.handleSecondClick(e)}>
              ${Array.from({ length: 12 }, (_, i) => i * 5).map(s => {
                const isSelected = s === this.seconds;
                return snice.html `
                  <button
                    class="time-item ${isSelected ? 'time-item--selected' : ''}"
                    type="button"
                    data-second="${s}"
                  >${s.toString().padStart(2, '0')}</button>
                `;
            })}
            </div>
          </div>
        </if>

        <if ${this.timeFormat === '12h'}>
          <div class="time-column time-column--period">
            <label class="time-label">Period</label>
            <div class="time-list">
              <button
                class="time-item ${this.period === 'AM' ? 'time-item--selected' : ''}"
                type="button"
                @click=${() => this.setPeriod('AM')}
              >AM</button>
              <button
                class="time-item ${this.period === 'PM' ? 'time-item--selected' : ''}"
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
              // Try to parse as ISO datetime (YYYY-MM-DDTHH:MM:SS or YYYY-MM-DD HH:MM:SS)
              const match = this.value.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/);
              if (match) {
                  const [, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr] = match;
                  this.selectedDate = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10));
                  this.viewDate = new Date(this.selectedDate);
                  this.hours = parseInt(hourStr, 10);
                  this.minutes = parseInt(minuteStr, 10);
                  this.seconds = secondStr ? parseInt(secondStr, 10) : 0;
                  if (this.timeFormat === '12h') {
                      if (this.hours >= 12) {
                          this.period = 'PM';
                      }
                      else {
                          this.period = 'AM';
                      }
                  }
              }
          }
          getDisplayValue() {
              if (!this.selectedDate)
                  return this.value;
              const datePart = this.formatDatePart(this.selectedDate);
              const timePart = this.formatTimePart();
              return `${datePart} ${timePart}`;
          }
          formatDatePart(date) {
              const yyyy = date.getFullYear().toString();
              const mm = (date.getMonth() + 1).toString().padStart(2, '0');
              const dd = date.getDate().toString().padStart(2, '0');
              switch (this.dateFormat) {
                  case 'mm/dd/yyyy': return `${mm}/${dd}/${yyyy}`;
                  case 'dd/mm/yyyy': return `${dd}/${mm}/${yyyy}`;
                  case 'yyyy/mm/dd': return `${yyyy}/${mm}/${dd}`;
                  case 'dd-mm-yyyy': return `${dd}-${mm}-${yyyy}`;
                  case 'mm-dd-yyyy': return `${mm}-${dd}-${yyyy}`;
                  case 'yyyy-mm-dd':
                  default: return `${yyyy}-${mm}-${dd}`;
              }
          }
          formatTimePart() {
              if (this.timeFormat === '12h') {
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
              const datePh = this.dateFormat.toUpperCase();
              const timePh = this.timeFormat === '12h'
                  ? (this.showSeconds ? 'HH:MM:SS AM' : 'HH:MM AM')
                  : (this.showSeconds ? 'HH:MM:SS' : 'HH:MM');
              return `${datePh} ${timePh}`;
          }
          getISOValue() {
              if (!this.selectedDate)
                  return '';
              const yyyy = this.selectedDate.getFullYear().toString();
              const mm = (this.selectedDate.getMonth() + 1).toString().padStart(2, '0');
              const dd = this.selectedDate.getDate().toString().padStart(2, '0');
              const hh = this.hours.toString().padStart(2, '0');
              const mi = this.minutes.toString().padStart(2, '0');
              const ss = this.seconds.toString().padStart(2, '0');
              if (this.showSeconds) {
                  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
              }
              return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
          }
          getDaysGrid() {
              const year = this.viewDate.getFullYear();
              const month = this.viewDate.getMonth();
              const firstDay = new Date(year, month, 1);
              const lastDay = new Date(year, month + 1, 0);
              const startingDay = firstDay.getDay();
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
                      const minDate = new Date(this.min);
                      if (date < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()))
                          return true;
                  }
                  if (this.max) {
                      const maxDate = new Date(this.max);
                      if (date > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate()))
                          return true;
                  }
                  return false;
              };
              const days = [];
              for (let i = 0; i < startingDay; i++) {
                  days.push(snice.html `<div class="day day--empty"></div>`);
              }
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
          ?disabled=${isDisabled(date)}
        >${day}</button>
      `);
              }
              return days;
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
          // Event handlers
          handleFocus() {
              this.emitFocus();
          }
          handleBlur() {
              this.emitBlur();
          }
          handleInputClick() {
              if (!this.showPanel && !this.disabled && !this.readonly) {
                  this.open();
              }
          }
          handleToggle() {
              if (this.showPanel) {
                  this.close();
              }
              else {
                  this.open();
              }
          }
          handleKeydown(e) {
              if (e.key === 'Escape' && this.showPanel) {
                  this.close();
                  this.focus();
              }
              else if ((e.key === 'Enter' || e.key === ' ') && !this.showPanel) {
                  e.preventDefault();
                  this.open();
              }
          }
          handleDayClick(e) {
              const target = e.target.closest('[data-date]');
              if (!target || target.disabled)
                  return;
              const dateStr = target.getAttribute('data-date');
              const [year, month, day] = dateStr.split('-').map(Number);
              this.selectedDate = new Date(year, month - 1, day);
              this.viewDate = new Date(this.selectedDate);
              this.updateValue();
          }
          handleYearClick(e) {
              const target = e.target.closest('[data-year]');
              if (!target)
                  return;
              const year = parseInt(target.getAttribute('data-year'), 10);
              this.viewDate = new Date(year, this.viewDate.getMonth(), 1);
              this.calendarView = 'days';
              this.renderContent();
          }
          handleClear(e) {
              e.stopPropagation();
              this.clear();
          }
          showYears() {
              this.yearRangeStart = this.viewDate.getFullYear() - (this.viewDate.getFullYear() % 12);
              this.calendarView = 'years';
              this.renderContent();
          }
          prevYears() {
              this.yearRangeStart -= 12;
              this.renderContent();
          }
          nextYears() {
              this.yearRangeStart += 12;
              this.renderContent();
          }
          updateClearButton() {
              if (!this.clearButton || !this.clearable)
                  return;
              const shouldShow = this.selectedDate && !this.disabled && !this.readonly;
              this.clearButton.style.display = shouldShow ? '' : 'none';
          }
          handleHourClick(e) {
              const target = e.target.closest('[data-hour]');
              if (!target)
                  return;
              let h = parseInt(target.getAttribute('data-hour'), 10);
              if (this.timeFormat === '12h') {
                  // Convert to 24h internal
                  if (this.period === 'AM' && h === 12)
                      h = 0;
                  else if (this.period === 'PM' && h !== 12)
                      h += 12;
              }
              this.hours = h;
              this.updateValue();
          }
          handleMinuteClick(e) {
              const target = e.target.closest('[data-minute]');
              if (!target)
                  return;
              this.minutes = parseInt(target.getAttribute('data-minute'), 10);
              this.updateValue();
          }
          handleSecondClick(e) {
              const target = e.target.closest('[data-second]');
              if (!target)
                  return;
              this.seconds = parseInt(target.getAttribute('data-second'), 10);
              this.updateValue();
          }
          setPeriod(period) {
              if (this.period === period)
                  return;
              // Convert hours when switching periods
              if (period === 'PM' && this.hours < 12) {
                  this.hours += 12;
              }
              else if (period === 'AM' && this.hours >= 12) {
                  this.hours -= 12;
              }
              this.period = period;
              this.updateValue();
          }
          prevMonth() {
              this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() - 1, 1);
              this.renderContent();
          }
          nextMonth() {
              this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1);
              this.renderContent();
          }
          goToToday() {
              const today = new Date();
              this.selectedDate = today;
              this.viewDate = new Date(today);
              this.calendarView = 'days';
              this.updateValue();
          }
          updateValue() {
              this.value = this.getISOValue();
              if (this.input) {
                  this.input.value = this.getDisplayValue();
              }
              if (this.internals) {
                  this.internals.setFormValue(this.value);
              }
              this.updateClearButton();
              this.emitDateTimeChange();
              this.renderContent();
          }
          setupClickOutside() {
              document.addEventListener('click', (e) => {
                  if (!this.contains(e.target) && this.showPanel) {
                      this.close();
                  }
              });
          }
          // Watchers
          handleValueChange() {
              this.parseValue();
              if (this.input) {
                  this.input.value = this.getDisplayValue();
              }
              if (this.internals) {
                  this.internals.setFormValue(this.value);
              }
          }
          handleShowPanelChange() {
              if (this.panel) {
                  if (this.showPanel) {
                      this.panel.removeAttribute('hidden');
                      this.emitOpen();
                  }
                  else {
                      this.panel.setAttribute('hidden', '');
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
          emitClear() {
              return { dateTimePicker: this };
          }
          // Event dispatchers
          emitDateTimeChange() {
              return {
                  value: this.value,
                  date: this.selectedDate,
                  dateString: this.selectedDate ? this.formatDatePart(this.selectedDate) : '',
                  timeString: this.formatTimePart(),
                  iso: this.getISOValue(),
                  dateTimePicker: this,
              };
          }
          emitFocus() {
              return { dateTimePicker: this };
          }
          emitBlur() {
              return { dateTimePicker: this };
          }
          emitOpen() {
              return { dateTimePicker: this };
          }
          emitClose() {
              return { dateTimePicker: this };
          }
          // Public API
          open() {
              if (!this.disabled && !this.readonly && this.variant === 'dropdown') {
                  this.calendarView = 'days';
                  this.showPanel = true;
                  if (this.panel) {
                      this.panel.removeAttribute('hidden');
                  }
                  this.emitOpen();
              }
          }
          close() {
              this.showPanel = false;
              if (this.panel) {
                  this.panel.setAttribute('hidden', '');
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
              this.selectedDate = null;
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
              this.emitDateTimeChange();
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

  exports.SniceDateTimePicker = SniceDateTimePicker;

  return exports;

})({}, Snice);
//# sourceMappingURL=snice-date-time-picker.js.map
