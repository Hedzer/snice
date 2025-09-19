import { PageOptions, Guard } from './PageOptions';
import { Transition } from './Transition';

export interface RouterInstance {
  page: (pageOptions: PageOptions) => <C extends { new(...args: any[]): HTMLElement }>(constructor: C, context: ClassDecoratorContext) => C;
  initialize: () => void;
  navigate: (path: string) => Promise<void>;
  register: (route: string, tag: string, transition?: Transition, guards?: Guard<any> | Guard<any>[]) => void;
}