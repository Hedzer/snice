# Testing

## Unit Tests (Vitest)
```bash
npm test                   # Complete required gate (source, built, CDN, React,
                           # core coverage, browser, generated website)
npm run test:source        # Source tests
npm run test:matrix        # Component feature-combination matrices (tests/matrix/) —
                           # opt-in fuzz tier; the default vitest include keeps only
                           # each directory's smoke.test.ts (.ai/fuzzing.md)
npm run test:matrix:visual # Same matrices in a real browser — on-demand visual tier,
                           # chromium by default, --all-engines for all three
npm run test:distribution  # Fresh dist build + built tests
npm run test:cdn           # CDN tests
npm run test:react         # React tests
npm run test:watch         # Watch mode
npm run test:ui            # Vitest UI
npm run test:coverage      # General coverage report
npm run test:coverage:core # Enforced rendering-engine coverage (>90% every metric)
npm run test:browsers:install # Install Chromium, Firefox, and WebKit
npm run test:browser:framework # Built customer/rendering/showcase tests in all 3 engines
npm run test:browser:website # Build and test the generated deployment in all 3 engines
```

- `await el.ready` before assertions
- `el.shadowRoot.querySelector()` for shadow DOM

## Playwright (E2E)

**Rules:**
- Temp files go in `.debug/` — delete after use
- Real tests go in `tests/`
- Always headless — no `--headed`, no screenshots
- Use console logs and text content for debugging

```bash
npx playwright test .debug/test-file.spec.js --config=tests/playwright.config.ts --project=chromium
```

Permanent browser tests use the shared Chromium, Firefox, and WebKit project
matrix in `tests/playwright.config.ts`. Wait for the exact custom element or DOM
state under test; do not use `networkidle` as a proxy for application readiness.

The one exception to the shared config is the on-demand true-visual matrix
tier, `tests/live/matrix/` — it has its own `tests/playwright.matrix.config.ts`
and is excluded from the shared one (`testIgnore: ['live/matrix/**']`) so the
required browser gate cannot pull it in. Run it with `npm run test:matrix:visual`.

**Debug pattern:**
```javascript
page.on('console', msg => console.log('PAGE LOG:', msg.text()));
page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
```

## Browser tier (Playwright)

### ⚠️ CRITICAL: .debug/ is ONLY for temporary debugging

**Real tests belong in `tests/` directories, NOT in `.debug/`**

- `.debug/` = Temporary debugging files (delete after use)
- `tests/components/` = Permanent component unit tests
- `tests/matrix/<component>/` = Permanent feature-combination matrices (fuzz tier)
- `tests/live/` = Permanent Playwright e2e tests

### Core Rules

#### 🚫 Never Do:
- Create testing files in root directory
- Use screenshots (`--screenshot`, `page.screenshot()`) as a DEBUGGING crutch.
  The single sanctioned use is a *paint-level assertion*: capture, decode the
  PNG inside the browser under test, and assert on the pixel values (see
  `tests/live/components/table/table-stripes-and-loading.spec.ts` and the
  marquee layer of `tests/live/matrix/`). A screenshot nobody asserts on is
  still forbidden.
- Run in headed mode (`--headed`)
- Keep test files in `.debug/` permanently
- Put real/permanent tests in `.debug/`

#### ✅ Always Do:
- Put temporary debug test files in `.debug/` folder ONLY
- Run headless only
- Use console logs and text content for debugging
- DELETE debug test files after debugging
- Put real tests in proper `tests/` directories

### Testing Pattern

#### 1. Create Debug Test File
```bash
# Always create in .debug folder
mkdir -p .debug
```

#### 2. Basic Test Structure
```javascript
// .debug/test-component.spec.js
import { test, expect } from '@playwright/test';

test('component functionality', async ({ page }) => {
  // Navigate to component demo
  await page.goto('http://localhost:5566/components/component-name/demo.html', {
    waitUntil: 'domcontentloaded'
  });

  // Wait for the exact readiness condition the test needs
  await page.waitForFunction(() => !!customElements.get('snice-component-name'));

  // Test interactions - NO SCREENSHOTS
  const button = page.locator('button');
  await button.click();

  // Check results via text content, not visuals
  const result = await page.locator('.result').textContent();
  console.log('Result:', result);

  // Check element states
  const isVisible = await page.locator('.component').isVisible();
  console.log('Component visible:', isVisible);
});
```

#### 3. Running Tests
```bash
# One-off debugging in a single engine
npx playwright test .debug/test-file.spec.js --config=tests/playwright.config.ts --project=chromium

# Install the complete supported matrix once
npm run test:browsers:install

# Managed-server live tests in Chromium, Firefox, and WebKit
npm run test:live

# Required built-customer/rendering/table browser gate in all three engines
npm run test:browser:framework

# Build the deployment artifact and test the public site in all three engines
npm run test:browser:website
```

`tests/playwright.config.ts` defines the supported desktop browser matrix:
Chromium, Firefox, and WebKit. Permanent tests must pass in all three. The npm
runners start and stop the required servers; do not require a developer to have
an existing server or stale build running.

Prefer deterministic readiness checks (`customElements.whenDefined()`, a known
DOM state, or a visible locator) over `networkidle`. The generated website loads
many independent assets, so network quiet is neither necessary nor sufficient.

#### 4. Debugging Techniques

##### Console Logs
```javascript
// Log page console messages
page.on('console', msg => console.log('PAGE LOG:', msg.text()));

// Log page errors
page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
```

##### Element State Checking
```javascript
// Check if element exists and is visible
const element = page.locator('.drawer');
console.log('Element count:', await element.count());
console.log('Element visible:', await element.isVisible());
console.log('Element text:', await element.textContent());

// Check attributes
console.log('Element class:', await element.getAttribute('class'));
console.log('Element open:', await element.getAttribute('open'));
```

##### CSS Properties
```javascript
// Check computed styles
const styles = await page.evaluate(() => {
  const el = document.querySelector('.drawer');
  return window.getComputedStyle(el);
});
console.log('Display:', styles.display);
console.log('Visibility:', styles.visibility);
```

##### JavaScript Evaluation
```javascript
// Run code in browser context
const result = await page.evaluate(() => {
  const drawer = document.querySelector('snice-drawer');
  return {
    open: drawer.open,
    position: drawer.position,
    size: drawer.size
  };
});
console.log('Drawer state:', result);
```

### Common Debugging Scenarios

#### Component Not Loading
```javascript
// Check if custom element is defined
const isDefinedBefore = await page.evaluate(() =>
  customElements.get('snice-drawer') !== undefined
);
console.log('Custom element defined before:', isDefinedBefore);

// Wait for custom element
await page.waitForFunction(() =>
  customElements.get('snice-drawer') !== undefined
);

const isDefinedAfter = await page.evaluate(() =>
  customElements.get('snice-drawer') !== undefined
);
console.log('Custom element defined after:', isDefinedAfter);
```

#### Event Not Firing
```javascript
// Listen for custom events
await page.evaluate(() => {
  document.addEventListener('drawer-open', (e) => {
    console.log('Drawer opened:', e.detail);
  });
  document.addEventListener('drawer-close', (e) => {
    console.log('Drawer closed:', e.detail);
  });
});
```

#### Property Changes
```javascript
// Check property changes
const before = await page.locator('snice-drawer').getAttribute('open');
console.log('Open before click:', before);

await page.click('button');
await page.waitForTimeout(100);

const after = await page.locator('snice-drawer').getAttribute('open');
console.log('Open after click:', after);
```

### File Management

#### Temporary Test Files
```bash
# Create temp test
echo "test content" > .debug/temp-test.spec.js

# Run test
npx playwright test .debug/temp-test.spec.js

# Clean up
rm .debug/temp-test.spec.js
```

Reusable cases are permanent tests and belong under `tests/live/`, never under
`.debug/`.

### Example: Debugging Drawer Issue

```javascript
// .debug/debug-drawer-opening.spec.js
import { test } from '@playwright/test';

test('debug drawer opening issue', async ({ page }) => {
  // Listen for console logs and errors
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('ERROR:', err.message));

  // Navigate to demo
  await page.goto('http://localhost:5566/components/drawer/demo.html');
  await page.waitForFunction(() => !!customElements.get('snice-drawer'));

  // Check if custom element is defined
  const isCustomElementDefined = await page.evaluate(() =>
    customElements.get('snice-drawer') !== undefined
  );
  console.log('snice-drawer custom element defined:', isCustomElementDefined);

  // Check drawer initial state
  const drawerState = await page.evaluate(() => {
    const drawer = document.querySelector('#drawer-left');
    return {
      exists: !!drawer,
      open: drawer?.open,
      hasOpenAttr: drawer?.hasAttribute('open'),
      visible: drawer?.style.visibility || 'not set'
    };
  });
  console.log('Initial drawer state:', drawerState);

  // Try to click the button
  const button = page.locator('text=Open Left Drawer');
  const buttonExists = await button.count() > 0;
  console.log('Button exists:', buttonExists);

  if (buttonExists) {
    await button.click();

    // Check state after click
    const afterClickState = await page.evaluate(() => {
      const drawer = document.querySelector('#drawer-left');
      return {
        open: drawer?.open,
        hasOpenAttr: drawer?.hasAttribute('open'),
        classList: Array.from(drawer?.classList || []),
        visibility: getComputedStyle(drawer).visibility
      };
    });
    console.log('State after click:', afterClickState);
  }
});
```

Remember: Always use `.debug/` folder, never create files in root, always headless, no screenshots.

## Dumb-Agent Gauntlet

The gauntlet runs small local language models as blind Snice builders. It is an
adversarial checker-development tool, not a model benchmark: a useful run turns
a Snice-specific mistake into a precise checker diagnostic and a permanent
clean/red regression pair.

### Quick Start

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

### Prompt Inputs

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

### Models and Scheduling

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

### What One Invocation Does

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

### Output

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

### Checker Loop

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
