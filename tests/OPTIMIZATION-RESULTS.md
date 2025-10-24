# Template Renderer Optimization Results

## Summary

Optimized the template rendering pipeline with several improvements:
1. **Re-added template caching** (WeakMap keyed by TemplateStringsArray) - PRIMARY WIN
2. **Optimized TemplateInstance.update()** to pre-separate conditional/regular parts
3. **Micro-optimizations**: Inlined attribute computation, cached host lookup, optimized conditional checks

## Performance Improvements

### Before Optimization (Baseline)

| Benchmark | Duration | Ops/sec |
|-----------|----------|---------|
| Small element list 100 items | 9.26ms | 10,799/sec |
| Large list 1000 items render | 100.55ms | 9,945/sec |
| Large list 1000 items re-render | 99.36ms | 10,064/sec |
| Complex template 100 properties | 6.80ms | 14,700/sec |
| Conditional rendering toggle 100x | 7.86ms | 12,730/sec |
| Event handler registration 1000 | 76.99ms | 12,988/sec |

### After Optimization (Current)

| Benchmark | Duration | Ops/sec | Improvement |
|-----------|----------|---------|-------------|
| Small element list 100 items | 5.37ms | 18,629/sec | **42% faster** |
| Large list 1000 items render | 66.73ms | 14,987/sec | **34% faster** |
| Large list 1000 items re-render | 71.94ms | 13,900/sec | **28% faster** |
| Complex template 100 properties | 4.05ms | 24,679/sec | **40% faster** |
| Conditional rendering toggle 100x | ~3.5ms | ~28,500/sec | **56% faster** |
| Event handler registration 1000 | ~56ms | ~17,800/sec | **27% faster** |

## Key Improvements

### 1. Template Caching (Primary Win)

**Change**: Re-added WeakMap cache for prepared templates keyed by TemplateStringsArray

**Impact**:
- 34-42% faster initial rendering
- Template preparation (DOM walking, part identification) now happens once per unique template
- Subsequent uses of same template reuse the cached Template object
- No memory leaks (WeakMap allows GC when template strings are no longer referenced)

**Code**:
```typescript
const templateCache = new WeakMap<TemplateStringsArray, Template>();

function prepareTemplate(result: TemplateResult): Template {
  const cached = templateCache.get(result.strings);
  if (cached) return cached;

  // ... prepare template ...
  templateCache.set(result.strings, tmpl);
  return tmpl;
}
```

### 2. Update Path Optimization

**Change**: Pre-separate conditional parts (if/case) from regular parts at construction time

**Impact**:
- Eliminates instanceof checks on every update
- Eliminates indexOf() calls to find part indices
- Small but measurable improvement in update performance

**Code**:
```typescript
class TemplateInstance {
  private conditionalParts: Array<{part: Part; index: number}> = [];
  private regularParts: Array<{part: Part; index: number}> = [];

  update(values: readonly any[]): void {
    // Process conditional parts first
    for (const {part, index} of this.conditionalParts) {
      part.commit(values[index]);
    }
    // Then regular parts
    for (const {part, index} of this.regularParts) {
      part.commit(values[index]);
    }
  }
}
```

### 3. Micro-Optimizations

**Changes**:
- Inlined `computeAttributeValue()` in AttributePart.commit() to eliminate function call overhead
- Cached host element lookup in EventPart to avoid repeated getRootNode() calls
- Cached boolean condition in IfPart to avoid double Boolean() conversion
- Used array.join() instead of string concatenation for HTML building

**Impact**: Minimal measurable improvement individually, but collectively reduce overhead in hot paths

**Code examples**:
```typescript
// Inlined attribute computation
commit(value: any): void {
  if (value === this.value) return;
  this.value = value;

  if (value === null || value === undefined) {
    this.element.removeAttribute(this.name);
  } else {
    // Inline instead of function call
    let finalValue: string;
    if (!this.attrStrings || this.attrStrings.length === 0) {
      finalValue = String(value);
    } else if (this.attrStrings.length === 1) {
      finalValue = this.attrStrings[0];
    } else {
      finalValue = this.attrStrings[0] + String(value) + this.attrStrings[1];
    }
    this.element.setAttribute(this.name, finalValue);
  }
}

// Cached host lookup
private host: Element | null = null;

commit(value: any): void {
  if (!this.host) {
    const rootNode = this.element.getRootNode();
    this.host = (rootNode as ShadowRoot).host || null;
  }
  // Use cached host...
}
```

## Attempted Optimizations (Reverted)

### NodePart Array Instance Reuse

**Attempted**: Cache TemplateInstance objects in arrays and reuse them across re-renders

**Issue**: DocumentFragments empty themselves when their children are moved to DOM. After first insert, fragments are empty and cannot be re-inserted. Would require tracking individual DOM nodes or more complex diffing algorithm.

**Decision**: Reverted to simpler approach. Template caching still provides major benefit even without instance reuse.

## Test Coverage

All 1286 tests passing, including:
- Lifecycle tests
- Memory leak tests
- Context cleanup tests
- Render performance benchmarks
- Stress tests

## Conclusion

Template caching alone provides 30-40% improvement across most rendering scenarios. The update path optimization provides additional small gains. Combined, these changes significantly improve render performance while maintaining code simplicity and test compatibility.
