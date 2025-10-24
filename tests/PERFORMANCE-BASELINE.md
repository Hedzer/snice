# Render Performance Baseline

Baseline measurements for render pipeline performance. Use these numbers to measure improvements during optimization work.

Run benchmarks with: `npm test tests/render-performance-benchmark.test.ts`

**Note**: These numbers reflect optimizations made on 2025-10-24 (template caching, update path optimization). See OPTIMIZATION-RESULTS.md for details.

## Current Baseline (2025-10-24 - After Optimization)

| Benchmark | Duration | Ops/sec | Notes |
|-----------|----------|---------|-------|
| Single element initial render | 1.90ms | - | Basic element creation |
| Small element list 100 items | 5.37ms | 18,629/sec | Minimal overhead elements (+72% vs baseline) |
| Property update re-render | 0.13ms | - | Single property change |
| 100 rapid property updates | 0.74ms | 135,488/sec | Tests batching efficiency |
| Large list 1000 items render | 66.73ms | 14,987/sec | Initial render of list (+51% vs baseline) |
| Large list 1000 items re-render | 71.94ms | 13,900/sec | Update existing list (+38% vs baseline) |
| Deep nesting 20 levels | 51.03ms | 392/sec | Nested component performance |
| Wide tree 243 elements | 203.06ms | 1,197/sec | Tree with many siblings |
| Complex template 100 properties | 4.05ms | 24,679/sec | Template interpolation (+68% vs baseline) |
| Styled component CSS | 1.04ms | - | CSS processing overhead |
| Conditional rendering 100x | ~3.5ms | ~28,500/sec | Show/hide toggle (+124% vs baseline) |
| Array manipulation 50 ops | ~7ms | ~14,000/sec | Add/remove items |
| Event handler registration 1000 | ~56ms | ~17,800/sec | Event binding cost (+37% vs baseline) |
| Property binding cascade 10 levels | 100.76ms | - | Deep property propagation |
| Create/destroy 100 elements | 3.32ms | 30,125/sec | Memory management (+33% vs baseline) |

## Key Metrics Summary

- **Simple operations**: Sub-millisecond for single updates
- **Small elements**: ~18.6k elements/sec for minimal components (72% faster than baseline)
- **Batch operations**: ~135k ops/sec for rapid updates
- **Large lists**: ~15k items/sec for 1000-item initial render (51% faster than baseline)
- **Large list updates**: ~13.9k items/sec for 1000-item re-render (38% faster than baseline)
- **Tree structures**: ~1.2k elements/sec for wide trees
- **Event handlers**: ~17.8k handlers/sec registration (37% faster than baseline)
- **Memory**: ~30k create/destroy cycles/sec (33% faster than baseline)

## Optimization Targets

When optimizing, focus on:

1. **Large list rendering**: Currently ~100ms for 1000 items
2. **Wide tree rendering**: Currently ~200ms for 243 elements
3. **Deep nesting**: Currently ~50ms for 20 levels
4. **Property cascade**: Currently ~100ms for 10-level cascade
5. **Event handler registration**: Currently ~77ms for 1000 handlers

## How to Use

1. Record current baseline before optimization
2. Make optimization changes
3. Run benchmarks again
4. Compare results to baseline
5. Document improvements/regressions

## Notes

- Benchmarks run in jsdom environment (not real browser)
- Real browser performance may vary
- Focus on relative improvements, not absolute numbers
- Some variance is expected between runs
