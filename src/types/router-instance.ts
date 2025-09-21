import { PageOptions, Guard } from './page-options';
import { Transition } from './transition';

export interface RouterInstance {
  page: (pageOptions: PageOptions) => <C extends { new(...args: any[]): HTMLElement }>(constructor: C, context: ClassDecoratorContext) => C;
  initialize: () => void;
  navigate: (path: string) => Promise<void>;
  register: (route: string, tag: string, transition?: Transition, guards?: Guard<any> | Guard<any>[]) => void;
}