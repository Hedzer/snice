type Maybe<T> = T | null | undefined;

export interface IController<T extends HTMLElement = HTMLElement> {
  element: Maybe<T>;
  attach(element: T): void | Promise<void>;
  detach(element: T): void | Promise<void>;
}

export type ControllerClass<T extends HTMLElement = HTMLElement> = new() => IController<T>;