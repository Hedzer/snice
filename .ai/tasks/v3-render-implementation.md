# Snice v3.0.0: @render Decorator with Differential Rendering

## Major Breaking Changes

### 1. Remove Old Rendering System
- ❌ Remove `html()` and `css()` methods entirely
- ❌ Remove `@part` decorator
- ✅ Keep `@watch`, `@ready`, `@dispose`, `@query`, `@property`
- ❌ Remove `@on` decorator (replaced by template event syntax)

### 2. New Template System (lit-html inspired, custom implementation)

#### Tagged Template Processors
```typescript
// src/template.ts - NEW FILE
export function html(strings: TemplateStringsArray, ...values: any[]): TemplateResult
export function css(strings: TemplateStringsArray, ...values: any[]): CSSResult
```

#### Differential Rendering Engine
- Custom lit-html-inspired diffing algorithm
- Part-based markers for dynamic values
- Efficient DOM updates (only changed parts)
- Support for:
  - Expressions: `${value}`
  - Event handlers: `@click=${handler}`, `@input=${handler}`
  - Property binding: `.value=${prop}`
  - Boolean attributes: `?disabled=${bool}`
  - Conditionals: `${condition ? html`...` : html`...`}`
  - Loops: `${items.map(i => html`...`)}`

#### @render Decorator
```typescript
@render({ debounce?: number, throttle?: number, once?: boolean, sync?: boolean })
renderContent() {
  return html`<div @click=${this.handleClick}>...</div>`;
}
```

#### @styles Decorator
```typescript
@styles()
styles() {
  return css`:host { display: block; }`;
}
```

### 3. Auto-Render on Property Changes
- Default: microtask batching (multiple property changes = 1 render)
- Option: `@render({ sync: true })` for immediate rendering
- Calling decorated method directly forces full re-render
- `@render({ once: true })` disables auto-render (manual only)

### 4. Implementation Tasks

#### Phase 1: Template System Core
1. ✅ Create `src/template.ts` with html/css tagged template processors
2. ✅ Implement TemplateResult and CSSResult classes
3. ✅ Build differential rendering engine (Part system)
4. ✅ Add support for expressions, conditionals, loops

#### Phase 2: Event & Property Binding
5. ✅ Implement @event directive for event handlers
6. ✅ Implement .prop directive for property binding
7. ✅ Implement ?attr directive for boolean attributes
8. ✅ Create event listener cleanup on re-render

#### Phase 3: @render & @styles Decorators
9. ✅ Create `@render` decorator with debounce/throttle/once/sync options
10. ✅ Create `@styles` decorator
11. ✅ Integrate with property change detection for auto-render
12. ✅ Implement render scheduling (microtask batching by default)

#### Phase 4: Element Integration
13. ⏳ Update element.ts to use @render instead of html()/css()
14. ⏳ Remove @on decorator and old event system for @render components
15. ⏳ Remove @part decorator
16. ⏳ Keep @watch for side effects (runs separately from render)
17. ⏳ Ensure @ready runs after initial render

#### Phase 5: Testing & Migration
18. ⏳ Update all tests to use new @render system
19. ⏳ Create migration guide from v2.x to v3.0.0
20. ⏳ Update README with new @render examples
21. ⏳ Update TypeScript types and exports

#### Phase 6: Documentation
22. ⏳ Document html`` template syntax
23. ⏳ Document css`` template syntax
24. ⏳ Document @render options (debounce, throttle, once, sync)
25. ⏳ Document migration from @on to @event template syntax
26. ⏳ Update all examples in docs/

### 5. Example: Before vs After

**v2.x (Old):**
```typescript
@element('my-counter')
class Counter extends HTMLElement {
  @property({ type: Number })
  count = 0;

  html() {
    return `<div>${this.count}</div><button>+</button>`;
  }

  @on('click', 'button')
  increment() {
    this.count++;
    // Manual re-render needed
    this.shadowRoot!.innerHTML = this.html();
  }
}
```

**v3.0.0 (New):**
```typescript
@element('my-counter')
class Counter extends HTMLElement {
  @property({ type: Number })
  count = 0;

  @render()
  renderContent() {
    return html`
      <div>${this.count}</div>
      <button @click=${this.increment}>+</button>
    `;
  }

  @styles()
  styles() {
    return css`:host { display: block; }`;
  }

  increment() {
    this.count++; // Auto re-renders with differential updates!
  }
}
```

### 6. Technical Design

#### Template Result Structure
```typescript
interface TemplateResult {
  strings: TemplateStringsArray;  // Static HTML parts
  values: any[];                   // Dynamic values
  _$litType$: 1;                   // Type marker
}

interface CSSResult {
  cssText: string;                 // CSS content
  _$litType$: 2;                   // Type marker
}
```

#### Part System for Differential Rendering
```typescript
// Parts represent dynamic locations in the template
abstract class Part {
  abstract commit(value: any): void;
}

class AttributePart extends Part {
  // Handles attribute updates: class="..." id="..."
}

class PropertyPart extends Part {
  // Handles .prop=${} bindings
}

class BooleanAttributePart extends Part {
  // Handles ?attr=${} bindings
}

class EventPart extends Part {
  // Handles @event=${} bindings
}

class NodePart extends Part {
  // Handles text content and nested templates
}
```

#### Render Scheduling
```typescript
// Microtask batching (default)
class RenderScheduler {
  private pending = new Set<HTMLElement>();
  private scheduled = false;

  schedule(element: HTMLElement) {
    this.pending.add(element);
    if (!this.scheduled) {
      this.scheduled = true;
      queueMicrotask(() => this.flush());
    }
  }

  flush() {
    for (const element of this.pending) {
      element._internalRender();
    }
    this.pending.clear();
    this.scheduled = false;
  }
}
```

### 7. File Changes
- **NEW**: `src/template.ts` - Template system (html/css tagged templates, TemplateResult, CSSResult)
- **NEW**: `src/parts.ts` - Part system for differential rendering
- **NEW**: `src/directives.ts` - Template directives (@event, .prop, ?attr)
- **NEW**: `src/render.ts` - @render & @styles decorators, render scheduling
- **MODIFY**: `src/element.ts` - Remove html()/css()/part, integrate @render
- **MODIFY**: `src/events.ts` - Remove @on decorator
- **MODIFY**: `src/index.ts` - Update exports
- **MODIFY**: `src/symbols.ts` - Add new symbols for render system
- **MODIFY**: `package.json` - Version 3.0.0
- **MODIFY**: All tests
- **MODIFY**: README.md
- **NEW**: `MIGRATION_V2_TO_V3.md`

### 8. Migration Strategy

#### Breaking Changes
1. `html()` method → `@render()` decorator returning `html\`...\``
2. `css()` method → `@styles()` decorator returning `css\`...\``
3. `@on('click', 'button')` → Template syntax `@click=${handler}`
4. `@part('name')` → Use differential rendering instead
5. Manual re-renders → Automatic on property change

#### Compatibility Notes
- All v2.x code will break
- No backward compatibility layer
- Clean break for v3.0.0
- Clear migration path in documentation

### 9. Performance Considerations
- Differential rendering only updates changed parts
- Event listener reuse (don't re-attach if handler unchanged)
- Microtask batching prevents redundant renders
- Shadow DOM keeps styles scoped and performant
- Constructable stylesheets for CSS when available

### 10. Next Steps
1. Implement core template system
2. Build differential rendering engine
3. Create decorators
4. Integrate with element lifecycle
5. Test thoroughly
6. Document everything
7. Release v3.0.0
