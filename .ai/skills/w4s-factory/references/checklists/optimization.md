# Optimization critic

Perform quick sanity checks of the card's changed code and directly affected
execution paths. Catch clear causes of excessive runtime, memory use, or data movement
early. Use the expected workload, access patterns, repository constraints, and available
evidence. Keep the pass brief and proportional to the change; do not turn it into an
exhaustive performance investigation. Put the most consequential finding first.

Apply each rule only where the code and workload justify it. When a skip condition
applies, leave that issue alone and continue. Do not search for a replacement optimization,
request more investigation, or create follow-up work merely to satisfy the checklist.
No finding or explanation is needed for an inapplicable rule.

Use D1–D13 as inspection questions under [advisory review](../review.md). Their order
is not a priority ranking. Do not produce a pass/fail answer for every rule.

| ID and rule | When to use | When to skip and carry on |
|---|---|---|
| **D1 — Prioritize meaningful total cost** | Frequent operations, large inputs, or substantial resource use make the waste consequential. Consider execution frequency, cost per operation, peak memory, and the resource limiting the affected path. | The cost is negligible for the expected workload. Do not pursue isolated micro-optimizations. |
| **D2 — Choose algorithms that avoid unnecessary work** | Repeated scans, nested loops, or full sorting do more work than the required result needs. Consider lookups, indexing, heaps, partial selection, batching, or a single pass. Include construction and update costs. | Inputs are small or bounded, existing complexity is suitable, or maintaining another structure would cost more than it saves. |
| **D3 — Avoid repeated computation and setup** | Expensive parsing, preparation, lookups, or calculations repeat with unchanged inputs. Consider moving invariant work outside loops or reusing valid results. | Computation is cheap, inputs change, or reuse would introduce disproportionate invalidation, retained memory, or state management. |
| **D4 — Reduce allocations, copies, and conversions** | Frequently executed paths create avoidable temporary objects, repeated conversions, or copies of substantial data. Consider existing facilities for direct construction, reuse, or processing without intermediate objects. | Copies establish necessary ownership, isolation, or lifetime. Removing them would introduce unsafe sharing, retain larger objects, or add greater complexity than the saving warrants. |
| **D5 — Release unnecessary data and limit peak memory** | Intermediate collections, duplicate representations, retained references, or stored derived values materially increase memory use. Consider incremental consumption, shorter lifetimes, or cheap recomputation. | Data must remain available for required reuse, random access, or consistent processing; memory use is already small and bounded; or recomputation would create greater repeated work. |
| **D6 — Fit data layout to access patterns** | Many instances are processed repeatedly. Consider contiguous storage, indices instead of pointers, separating frequently accessed fields from rarely accessed fields, or separate arrays when loops read only a few fields. | Most operations need whole objects, stable addresses are required, or changing layout would add substantial coordination, conversion, or maintenance costs. |
| **D7 — Use appropriately sized numeric fields** | Many values are stored and their complete valid range or required precision is established. A smaller representation could meaningfully reduce memory traffic or storage. | Range or precision is uncertain, compatibility requires the current representation, or packing and conversion costs defeat the saving. Never weaken correctness. |
| **D8 — Avoid work on discarded results** | Filtering, stopping early, or delaying expensive work can avoid computation, allocation, fetching, or conversion for results that will not be used. | That work has required side effects, validation duties, ordering, or failure behaviour—even when its returned value is discarded. |
| **D9 — Improve traversal and reuse of nearby data** | Large or repeated traversals access scattered data or repeatedly reload data that could be processed together. Consider storage-order traversal, bounded chunks, or combining compatible passes. | Access already suits the workload, operations require the current order, or combining processing increases temporary storage or complexity without a clear benefit. |
| **D10 — Allow compiler and library optimizations** | Substantial loops contain independent operations that simple code or existing bulk operations can express clearly. Inspect avoidable dependencies and opaque calls that obstruct optimization. | Dependencies are real, the runtime cannot exploit the change, or it would alter arithmetic, ordering, or memory semantics. Do not force vectorization or replace clear code with speculative low-level tricks. |
| **D11 — Reduce concurrency overhead** | Existing parallel work incurs meaningful scheduling, synchronization, shared-state, or data-transfer costs. Consider bounded batching, fewer shared updates, or smaller critical sections where correctness permits. | Work is already efficient, too small to benefit, inherently sequential, or requires the synchronization. Do not introduce concurrency merely to satisfy this rule. |
| **D12 — Check false sharing** | Independent workers frequently update different values that occupy the same CPU cache line. Consider worker-local accumulation or separating frequently written data, accounting for additional memory. | Values are read-only, rarely updated, already separate, or there is no concrete reason to suspect this issue. Do not add padding speculatively. |
| **D13 — Fetch and return only needed data** | Database, service, or response boundaries load or transmit fields and records the operation does not need. Fetch only required rows and columns; return only what the caller requires. Avoid whole-entity loading when a smaller projection suffices. | The complete data is required by the operation, consistency requirements, or public contract. Do not change the contract to reduce payload size. |

For each serious finding:

- Identify the exact code and explain the concrete waste.
- State the relevant workload facts and flag assumptions.
- Explain why the rule applies.
- Propose one small change that preserves behaviour, public interfaces,
  topology, and correctness.
- Explain expected time and memory tradeoffs, including any additional
  storage, setup, synchronization, or maintenance costs.

Do not assume that smaller structures, array conversions, fewer allocations,
or more concurrency automatically improve performance. Distinguish expected
benefits from improvements demonstrated by existing evidence.

Advise only. Do not modify code, block advancement, or require approval
rounds. Avoid speculative optimization, unrelated rewrites, and nitpicks.
Return actionable rework advice to the responsible worker. Finish after this
bounded sanity-check pass. If no serious, actionable waste is found, say so briefly
and finish; do not keep searching for improvements.
