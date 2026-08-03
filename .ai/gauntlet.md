# Dumb-Agent Gauntlet

The gauntlet runs small local language models as blind Snice builders. It is an
adversarial checker-development tool, not a model benchmark: a useful run turns
a Snice-specific mistake into a precise checker diagnostic and a permanent
clean/red regression pair.

## Quick Start

```bash
npm run gauntlet                         # complete application sample, every model
npm run gauntlet -- --sample events
npm run gauntlet -- --sample router
npm run gauntlet -- --prompt "Build a Snice application ..."
npm run gauntlet -- --prompt-file ./prompt.txt
npm run gauntlet -- --list-samples
```

The default model pool is about 4.2 GiB of quantized GGUF files. On first use,
the command downloads the missing models and the pinned llama.cpp runtime.
Every artifact has an expected byte length and SHA-256 digest; an incomplete
download resumes, an invalid artifact is rejected, and a verified artifact is
reused. All downloads and run output stay under the ignored `.local/` tree.

Prefetch without starting builders:

```bash
npm run gauntlet -- --download-only
npm run gauntlet -- --download-only --models lfm2.5-350m,qwen3-0.6b
```

Use `--runtime /path/to/llama-cli` or `SNICE_GAUNTLET_LLAMA` only when the
pinned portable runtime cannot run on the host. Automatic runtime setup
supports Linux and macOS on x64 and arm64; other hosts need an explicit
runtime.

## Prompt Inputs

Exactly one prompt source may be selected:

- `--sample <name>` reads `tooling/gauntlet/samples/<name>.txt`.
- `--prompt <text>` passes an inline prompt verbatim.
- `--prompt-file <path>` passes a file verbatim.

No prompt flag selects the `application` sample. Every selected model receives
the exact same resolved prompt. Samples say that the builder has no
Snice docs, source, examples, skill, or previous output. Single-file samples
remain useful for focused API probes. Architecture samples may use explicit
`<<<FILE: src/...>>>` / `<<<END FILE>>>` blocks to generate a safely bounded
source tree. Do not add correct API hints to a blind sample; docs-informed
rounds are separate evidence.

Committed samples:

- `application` — the default, multi-file Session Board exercising routing,
  daemon context, request/response, events, controllers, and conventional
  project boundaries in one browser-observable application.
- `daemon` — app-context daemons using request/response and events.
- `events` — typed dispatch/listen behavior across reusable elements.
- `request-response` — an element/controller request-response boundary.
- `router` — Router construction, Router-returned page decorators, route params,
  navigation, target creation, and initialization order.

## Models and Scheduling

```bash
npm run gauntlet -- --models gemma3-270m,qwen3-0.6b
npm run gauntlet -- --concurrency 2 --threads 8
```

`--models all` is the default. The manifest lives at
`tooling/gauntlet/manifest.js` and pins upstream URLs, sizes, and hashes. The
pool spans LFM2.5 350M, Gemma 3 270M/1B, Qwen2.5 Coder 500M, Qwen3 600M,
DeepSeek-R1 Distill 1.5B, and SmolLM2 1.7B. Kimi has no comparable tiny open
text checkpoint, so it is not in this local pool.

The scheduler uses at most four model processes by default and divides the
host CPUs between them. It does not impose a token or elapsed-time limit.
When the generated stream degenerates into exact repeated lines, aligned
blocks, or unaligned substrings, the process is stopped and classified as a
repetition failure; the entire raw stream remains available for diagnosis.

## What One Invocation Does

1. Resolve the prompt and selected model manifest entries.
2. Download and verify the pinned llama.cpp runtime and missing models.
3. Build the current Snice distribution once. This is `build:distribution`,
   not a release and not a version change. `--skip-framework-build` may reuse
   an existing `dist/` when intentionally testing an unchanged build.
4. Create one isolated generated project per model under
   `.local/gauntlet/runs/<timestamp>-<prompt>/`.
5. Give each model only the prompt and preserve its unedited response.
6. Extract explicit multi-file source blocks when present, validating every
   path below `src/`. Otherwise extract the longest fenced TypeScript block, or
   the exact assistant reply when no fence exists, into `src/main.ts`.
7. Run `snice check`, strict TypeScript, and a Vite production build, preserving
   every exit status and log.

The command automates the blind first attempt and objective gates. It does not
decide whether a failure is a checker bug or blindly rewrite repository code.
That judgment remains part of the checker loop below.

## Output

Each run contains:

```text
prompt.txt
run.json
summary.md
<model>/
  raw-output.txt
  generation.log
  src/
    main.ts
    ...optional generated modules and folders
  checker.log
  typecheck.log
  build.log
  result.json
```

`summary.md` is an index, not the final classification. Read the raw source and
logs before promoting a finding.

## Checker Loop

Classify each finding as one of:

- true positive — checker correctly rejects a Snice mistake;
- false negative — checker passes a Snice mistake exposed later;
- false positive — checker rejects a valid documented/package contract;
- framework bug — valid usage fails in Snice;
- app mistake — ordinary language, syntax, or application logic failure.

For a confirmed checker miss:

1. Reproduce it independently outside `.local/`.
2. Add a failing permanent fixture plus a nearby clean counterexample.
3. Make the narrow contract-backed checker change.
4. Rerun focused checker tests.
5. Start a genuinely fresh gauntlet invocation; never repair the old corpus
   and call it a fresh round.
6. Run the complete `npm test` gate only after the loop and repository cleanup
   converge.

Generated corpora and model weights are evidence, not source. They must remain
ignored and must never be copied wholesale into committed tests.
