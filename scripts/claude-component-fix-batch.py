#!/usr/bin/env python3
import os
import sys
import time
import glob
import shlex
import signal
import subprocess
from pathlib import Path
from threading import Thread, Lock


ROOT = Path(__file__).resolve().parent.parent
COMPONENTS_DIR = ROOT / "components"

MODEL = os.environ.get("MODEL", "claude-opus-4-6")
BATCH = int(os.environ.get("BATCH", "10"))
TIMEOUT_SEC = int(os.environ.get("TIMEOUT_SEC", "600"))
POLL_SEC = float(os.environ.get("POLL_SEC", "5"))
USE_CHROME = os.environ.get("USE_CHROME", "0") == "1"

LOG_DIR = Path(os.environ.get("LOG_DIR", "/tmp/claude-batch-logs"))
LOG_DIR.mkdir(parents=True, exist_ok=True)

LOCK = Lock()
TOTAL = 0
COMPLETED = 0
ACTIVE = set()
STOP_STATUS = False


def read_file(path: Path) -> str:
  try:
    return path.read_text(encoding="utf-8")
  except Exception:
    return ""


def gather_standards() -> str:
  parts = []
  dev = ROOT / "DEVELOPMENT.md"
  if dev.exists():
    parts.append(f"--- DEVELOPMENT.md ---\n{read_file(dev)}")
  for p in sorted((ROOT / ".ai").glob("*.md")):
    parts.append(f"--- {p.name} ---\n{read_file(p)}")
  return "\n".join(parts)


def find_components() -> list[str]:
  comps = []
  for ts in COMPONENTS_DIR.glob("*/snice-*.ts"):
    comps.append(ts.parent.name)
  return sorted(set(comps))


def component_context(comp: str) -> str:
  comp_dir = COMPONENTS_DIR / comp
  src = comp_dir / f"snice-{comp}.ts"
  types = comp_dir / f"snice-{comp}.types.ts"
  css = comp_dir / f"snice-{comp}.css"
  ai_doc = ROOT / "docs/ai/components" / f"{comp}.md"
  human_doc = ROOT / "docs/components" / f"{comp}.md"

  parts = [f"--- SOURCE: snice-{comp}.ts ---\n{read_file(src)}"]
  if types.exists():
    parts.append(f"--- TYPES: snice-{comp}.types.ts ---\n{read_file(types)}")
  if css.exists():
    parts.append(f"--- CSS: snice-{comp}.css ---\n{read_file(css)}")
  if ai_doc.exists():
    parts.append(f"--- AI DOC: {comp}.md ---\n{read_file(ai_doc)}")
  if human_doc.exists():
    parts.append(f"--- HUMAN DOC: {comp}.md ---\n{read_file(human_doc)}")
  return "\n".join(parts)


def dir_mtime_snapshot(comp: str) -> dict[str, float]:
  comp_dir = COMPONENTS_DIR / comp
  snapshot = {}
  for path in comp_dir.rglob("*"):
    if path.is_file():
      try:
        snapshot[str(path)] = path.stat().st_mtime
      except Exception:
        continue
  return snapshot


def snapshot_changed(a: dict[str, float], b: dict[str, float]) -> bool:
  if a.keys() != b.keys():
    return True
  for k, v in a.items():
    if b.get(k, 0.0) != v:
      return True
  return False


def build_prompt(comp: str, standards: str, context: str) -> str:
  return f"""You are Claude working inside the Snice repository.

Read and follow all standards and instructions below. Apply fixes directly in the repo.

STANDARDS:
{standards}

COMPONENT CONTEXT:
{context}

Task for component: {comp}
1) Ensure it follows DEVELOPMENT.md and .ai/*.md standards.
2) Fix ARIA issues and accessibility violations in template, DOM, and CSS.
3) Ensure light and dark mode are handled correctly.
   - Use theme variables and fallbacks.
   - No hard-coded colors unless they are tokens or derived from tokens.
   - If data-theme or prefers-color-scheme is used, ensure both modes are correct.
4) If changes affect public API, update docs/ai and docs accordingly.

Operate only on this component and its docs. Make the fixes, do not just report.
"""


def run_component(comp: str, standards: str):
  global ACTIVE
  with LOCK:
    ACTIVE.add(comp)
  context = component_context(comp)
  prompt = build_prompt(comp, standards, context)
  log_path = LOG_DIR / f"{comp}.log"

  cmd = [
    "claude",
    "-p",
    "--model",
    MODEL,
    "--dangerously-skip-permissions",
    "--permission-mode",
    "bypassPermissions",
    "--no-session-persistence",
  ]
  if USE_CHROME:
    cmd.append("--chrome")
  else:
    cmd.append("--no-chrome")

  with log_path.open("w", encoding="utf-8") as log:
    proc = subprocess.Popen(
      cmd,
      stdin=subprocess.PIPE,
      stdout=log,
      stderr=log,
      text=True,
    )
    try:
      proc.stdin.write(prompt)
      proc.stdin.close()
    except Exception:
      pass

    start = time.time()
    baseline = dir_mtime_snapshot(comp)
    changed = False

    while True:
      if proc.poll() is not None:
        break
      if not changed and (time.time() - start) >= TIMEOUT_SEC:
        with LOCK:
          print(f"[timeout] {comp} no changes after {TIMEOUT_SEC}s, terminating")
        try:
          proc.terminate()
          proc.wait(timeout=10)
        except Exception:
          try:
            proc.kill()
          except Exception:
            pass
        break
      if not changed:
        current = dir_mtime_snapshot(comp)
        if snapshot_changed(baseline, current):
          changed = True
      time.sleep(POLL_SEC)

  global COMPLETED
  with LOCK:
    COMPLETED += 1
    ACTIVE.discard(comp)
    print(f"[done] {comp} log={log_path} | progress {COMPLETED}/{TOTAL}")


def worker(queue: list[str], standards: str):
  while True:
    with LOCK:
      if not queue:
        return
      comp = queue.pop(0)
    run_component(comp, standards)

def status_loop():
  global STOP_STATUS
  while True:
    with LOCK:
      if STOP_STATUS:
        return
      active = len(ACTIVE)
      completed = COMPLETED
      total = TOTAL
    bar_width = 30
    filled = int(bar_width * completed / total) if total else 0
    bar = "#" * filled + "-" * (bar_width - filled)
    print(f"[progress] [{bar}] {completed}/{total} running {active}")
    time.sleep(POLL_SEC)


def main():
  global TOTAL
  comps = find_components()
  if not comps:
    print("No components found.")
    return 1

  TOTAL = len(comps)
  print(f"[start] total {TOTAL} components")
  standards = gather_standards()
  queue = comps[:]

  threads = []
  status_thread = Thread(target=status_loop, daemon=True)
  status_thread.start()
  concurrency = max(1, BATCH)
  for _ in range(concurrency):
    t = Thread(target=worker, args=(queue, standards), daemon=True)
    threads.append(t)
    t.start()

  for t in threads:
    t.join()
  with LOCK:
    global STOP_STATUS
    STOP_STATUS = True
  return 0


if __name__ == "__main__":
  sys.exit(main())
