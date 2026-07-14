import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import {
  SniceElement,
  element,
  html,
  property,
  repeat,
  state
} from './test-imports';

type RepeatItem = { id: number; label: string };

type ReactiveOperation =
  | { kind: 'count'; value: number }
  | { kind: 'flag'; value: boolean }
  | { kind: 'push'; value: number }
  | { kind: 'pop' }
  | { kind: 'map-set'; key: string; value: number }
  | { kind: 'map-delete'; key: string }
  | { kind: 'set-add'; value: string }
  | { kind: 'set-delete'; value: string };

const repeatFrame = fc.uniqueArray(
  fc.record({
    id: fc.integer({ min: -12, max: 12 }),
    label: fc.string({ maxLength: 20 })
  }),
  { selector: item => item.id, maxLength: 16 }
);

const reactiveOperation: fc.Arbitrary<ReactiveOperation> = fc.oneof(
  fc.record({ kind: fc.constant('count' as const), value: fc.integer({ min: -20, max: 20 }) }),
  fc.record({ kind: fc.constant('flag' as const), value: fc.boolean() }),
  fc.record({ kind: fc.constant('push' as const), value: fc.integer({ min: -20, max: 20 }) }),
  fc.record({ kind: fc.constant('pop' as const) }),
  fc.record({
    kind: fc.constant('map-set' as const),
    key: fc.string({ maxLength: 5 }),
    value: fc.integer({ min: -20, max: 20 })
  }),
  fc.record({ kind: fc.constant('map-delete' as const), key: fc.string({ maxLength: 5 }) }),
  fc.record({ kind: fc.constant('set-add' as const), value: fc.string({ maxLength: 5 }) }),
  fc.record({ kind: fc.constant('set-delete' as const), value: fc.string({ maxLength: 5 }) })
);

describe('declarative renderer property-based behavior', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
  });

  afterEach(() => container.remove());

  it('preserves the keyed DOM model across seeded arbitrary list histories', async () => {
    @element('test-repeat-property-history')
    class TestRepeatPropertyHistory extends SniceElement {
      @property({ attribute: false }) items: RepeatItem[] = [];

      render() {
        return html`
          <section>${repeat(this.items, {
            key: item => item.id,
            render: item => html`<article data-id=${item.id} data-label=${item.label}>${item.label}</article>`
          })}</section>
        `;
      }
    }

    await fc.assert(
      fc.asyncProperty(
        fc.array(repeatFrame, { minLength: 1, maxLength: 24 }),
        async frames => {
          const host = document.createElement('test-repeat-property-history') as TestRepeatPropertyHistory;
          container.append(host);
          await host.ready;
          let previous = new Map<number, Element>();

          try {
            for (const frame of frames) {
              host.items = frame;
              await host.rendered;

              const nodes = [...host.shadowRoot!.querySelectorAll('article')];
              expect(nodes.map(node => Number(node.getAttribute('data-id'))))
                .toEqual(frame.map(item => item.id));
              expect(nodes.map(node => node.getAttribute('data-label')))
                .toEqual(frame.map(item => item.label));
              expect(nodes.map(node => node.textContent))
                .toEqual(frame.map(item => item.label));

              const current = new Map<number, Element>();
              for (const node of nodes) {
                const id = Number(node.getAttribute('data-id'));
                current.set(id, node);
                if (previous.has(id)) expect(node).toBe(previous.get(id));
              }
              expect(current.size).toBe(frame.length);
              previous = current;
            }
          } finally {
            host.remove();
          }
        }
      ),
      { seed: 0x51ce2026, numRuns: 100, endOnFailure: true }
    );
  });

  it('matches a plain-state model across seeded arbitrary deep mutations', async () => {
    @element('test-reactive-property-history')
    class TestReactivePropertyHistory extends SniceElement {
      renders = 0;
      @state({ deep: true }) model = {
        nested: { count: 0, flag: false },
        list: [] as number[],
        map: new Map<string, number>(),
        set: new Set<string>()
      };

      render() {
        this.renders++;
        return html`<output>${this.snapshot()}</output>`;
      }

      snapshot() {
        return JSON.stringify({
          nested: this.model.nested,
          list: [...this.model.list],
          map: [...this.model.map.entries()],
          set: [...this.model.set.values()]
        });
      }
    }

    await fc.assert(
      fc.asyncProperty(
        fc.array(reactiveOperation, { minLength: 1, maxLength: 50 }),
        async operations => {
          const host = document.createElement('test-reactive-property-history') as TestReactivePropertyHistory;
          container.append(host);
          await host.ready;
          const model = {
            nested: { count: 0, flag: false },
            list: [] as number[],
            map: new Map<string, number>(),
            set: new Set<string>()
          };

          try {
            for (const operation of operations) {
              const rendersBefore = host.renders;
              let changed = false;

              switch (operation.kind) {
                case 'count':
                  changed = !Object.is(model.nested.count, operation.value);
                  model.nested.count = operation.value;
                  host.model.nested.count = operation.value;
                  break;
                case 'flag':
                  changed = !Object.is(model.nested.flag, operation.value);
                  model.nested.flag = operation.value;
                  host.model.nested.flag = operation.value;
                  break;
                case 'push':
                  changed = true;
                  model.list.push(operation.value);
                  host.model.list.push(operation.value);
                  break;
                case 'pop':
                  changed = model.list.length > 0;
                  model.list.pop();
                  host.model.list.pop();
                  break;
                case 'map-set':
                  changed = !model.map.has(operation.key) ||
                    !Object.is(model.map.get(operation.key), operation.value);
                  model.map.set(operation.key, operation.value);
                  host.model.map.set(operation.key, operation.value);
                  break;
                case 'map-delete':
                  changed = model.map.delete(operation.key);
                  host.model.map.delete(operation.key);
                  break;
                case 'set-add':
                  changed = !model.set.has(operation.value);
                  model.set.add(operation.value);
                  host.model.set.add(operation.value);
                  break;
                case 'set-delete':
                  changed = model.set.delete(operation.value);
                  host.model.set.delete(operation.value);
                  break;
              }

              await host.rendered;
              expect(host.renders).toBe(rendersBefore + (changed ? 1 : 0));
              expect(host.snapshot()).toBe(JSON.stringify({
                nested: model.nested,
                list: model.list,
                map: [...model.map.entries()],
                set: [...model.set.values()]
              }));
              expect(host.shadowRoot!.querySelector('output')!.textContent).toBe(host.snapshot());
            }
          } finally {
            host.remove();
          }
        }
      ),
      { seed: 0x5a1ce202, numRuns: 100, endOnFailure: true }
    );
  });
});
