import { nothing } from './template';
import { IS_ELEMENT_CLASS, PENDING_CONTROLLER_BINDING } from './symbols';
import { attachControllerClassViaBridge, detachElementController } from './lifecycle-hooks';
import { Part, NOT_COMMITTED, noChange } from './part-base';

/**
 * ControllerPart handles bare controller=${...} bindings.
 */
export class ControllerPart extends Part {
  readonly type = 'controller' as const;
  element: Element;
  private _committedValue: unknown = NOT_COMMITTED;

  constructor(element: Element) {
    super();
    this.element = element;
  }

  commit(value: unknown): void {
    if (value === noChange) return;

    const next = (value == null || value === false || value === '' || value === nothing)
      ? null
      : value;
    const first = this._committedValue === NOT_COMMITTED;
    const previous = first ? null : this._committedValue;
    if (!first && next === previous) return;
    this._committedValue = next;

    const el = this.element as any;

    if (typeof previous === 'function' && typeof next !== 'function') {
      if (el[PENDING_CONTROLLER_BINDING] !== undefined) {
        delete el[PENDING_CONTROLLER_BINDING];
      } else if (el[IS_ELEMENT_CLASS]) {
        el.controller = null;
      } else {
        this._detach();
      }
    }

    if (typeof next === 'function') {
      if (this.isConnected) {
        this._apply(next);
      } else if (this.element.localName.includes('-') && !el[IS_ELEMENT_CLASS]) {
        el[PENDING_CONTROLLER_BINDING] = next;
      }
    } else if (typeof next === 'string') {
      this.element.setAttribute('controller', next);
    } else if (typeof previous === 'string') {
      this.element.removeAttribute('controller');
    }
  }

  private _apply(controllerClass: any): void {
    const el = this.element as any;

    if (el[IS_ELEMENT_CLASS]) {
      if (el.controller !== controllerClass) {
        el.controller = controllerClass;
      } else {
        this._attach(controllerClass);
      }
      return;
    }

    if (this.element.localName.includes('-')) {
      el[PENDING_CONTROLLER_BINDING] = controllerClass;
      return;
    }

    if (!el.ready) el.ready = Promise.resolve();
    this._attach(controllerClass);
  }

  private _attach(controllerClass: any): void {
    attachControllerClassViaBridge(this.element as HTMLElement, controllerClass);
  }

  private _detach(): void {
    detachElementController(this.element as HTMLElement);
  }

  disconnected(_preserveEventListeners = false): void {
    const committed = this._committedValue;
    if (typeof committed !== 'function') return;
    const el = this.element as any;
    if (el[PENDING_CONTROLLER_BINDING] !== undefined) return;
    if (el[IS_ELEMENT_CLASS]) return;
    this._detach();
  }

  reconnected(): void {
    const committed = this._committedValue;
    if (typeof committed !== 'function') return;
    this._apply(committed);
  }

  clear(): void {
    const el = this.element as any;
    if (el[PENDING_CONTROLLER_BINDING] !== undefined) delete el[PENDING_CONTROLLER_BINDING];
    const committed = this._committedValue;
    this._committedValue = NOT_COMMITTED;
    if (typeof committed !== 'function') return;
    if (el[IS_ELEMENT_CLASS]) return;
    this._detach();
  }
}

/** @internal Tree-shakeable compiled-template factory for ControllerPart */
export function __pCtrl(node: Node): ControllerPart {
  return new ControllerPart(node as HTMLElement);
}
