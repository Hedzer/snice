import { PageOptions } from './page-options';
import { Guard } from './guard';
import { Transition } from './transition';
import { AppContext } from './app-context';

export interface RouterInstance {
  page: (pageOptions: PageOptions) => <C extends { new(...args: any[]): HTMLElement }>(constructor: C, context: ClassDecoratorContext) => C;
  initialize: () => void;
  navigate: (path: string) => Promise<void>;
  register: (route: string, tag: string, transition?: Transition, guards?: Guard<AppContext> | Guard<AppContext>[]) => void;
}