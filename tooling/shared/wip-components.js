/**
 * Reads packages/components/.wip and returns component names excluded from builds.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WIP_FILE = path.resolve(__dirname, '..', '..', 'packages', 'components', '.wip');

let _cached;

export function getWipComponents() {
  if (_cached) return _cached;
  _cached = parseWipFile(WIP_FILE);
  return _cached;
}

/** Parse a .wip file into a Set of names. Exported for testing. */
export function parseWipFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return new Set(
      content.split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('#'))
    );
  } catch {
    return new Set();
  }
}
