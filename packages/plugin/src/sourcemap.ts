/**
 * Minimal zero-dependency V3 sourcemap composition (`outerMap(innerMap)`).
 * Composes `inner` (original -> intermediate) with `outer` (intermediate -> final)
 * so multi-pass transforms (Pass A decorators -> Pass B templates -> Pass C CSS)
 * preserve exact line/column/name fidelity back to original `.ts` sources.
 */

export interface RawSourceMap {
  version: number;
  file?: string;
  sourceRoot?: string;
  sources: string[];
  sourcesContent?: (string | null)[];
  names: string[];
  mappings: string;
}

const VLQ_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const CHAR_TO_INT = new Int8Array(128).fill(-1);
for (let i = 0; i < VLQ_CHARS.length; i++) {
  CHAR_TO_INT[VLQ_CHARS.charCodeAt(i)] = i;
}

type Segment = [genCol: number, srcIdx: number, origLine: number, origCol: number, nameIdx: number];

function decodeMappings(mappings: string): Segment[][] {
  const lines: Segment[][] = [];
  let line: Segment[] = [];
  let genCol = 0;
  let srcIdx = 0;
  let origLine = 0;
  let origCol = 0;
  let nameIdx = 0;
  let i = 0;
  const len = mappings.length;

  const readVlq = (): number => {
    let result = 0;
    let shift = 0;
    while (i < len) {
      const code = mappings.charCodeAt(i++);
      const digit = code < 128 ? CHAR_TO_INT[code] : -1;
      if (digit < 0) break;
      result |= (digit & 31) << shift;
      shift += 5;
      if ((digit & 32) === 0) break;
    }
    return (result & 1) === 1 ? -(result >> 1) : result >> 1;
  };

  while (i < len) {
    const ch = mappings.charCodeAt(i);
    if (ch === 59) {
      // ';'
      lines.push(line);
      line = [];
      genCol = 0;
      i++;
      continue;
    }
    if (ch === 44) {
      // ','
      i++;
      continue;
    }

    genCol += readVlq();
    if (i >= len || mappings.charCodeAt(i) === 44 || mappings.charCodeAt(i) === 59) {
      line.push([genCol, -1, 0, 0, -1]);
      continue;
    }
    srcIdx += readVlq();
    origLine += readVlq();
    origCol += readVlq();
    let segName = -1;
    if (i < len && mappings.charCodeAt(i) !== 44 && mappings.charCodeAt(i) !== 59) {
      nameIdx += readVlq();
      segName = nameIdx;
    }
    line.push([genCol, srcIdx, origLine, origCol, segName]);
  }
  lines.push(line);
  return lines;
}

function encodeVlq(value: number): string {
  let vlq = value < 0 ? ((-value) << 1) | 1 : value << 1;
  let out = '';
  do {
    let digit = vlq & 31;
    vlq >>>= 5;
    if (vlq > 0) digit |= 32;
    out += VLQ_CHARS[digit];
  } while (vlq > 0);
  return out;
}

function encodeMappings(lines: Segment[][]): string {
  let prevSrc = 0;
  let prevOrigLine = 0;
  let prevOrigCol = 0;
  let prevName = 0;
  const outLines: string[] = [];

  for (const line of lines) {
    let prevGenCol = 0;
    const parts: string[] = [];
    for (const seg of line) {
      let s = encodeVlq(seg[0] - prevGenCol);
      prevGenCol = seg[0];
      if (seg[1] >= 0) {
        s += encodeVlq(seg[1] - prevSrc);
        prevSrc = seg[1];
        s += encodeVlq(seg[2] - prevOrigLine);
        prevOrigLine = seg[2];
        s += encodeVlq(seg[3] - prevOrigCol);
        prevOrigCol = seg[3];
        if (seg[4] >= 0) {
          s += encodeVlq(seg[4] - prevName);
          prevName = seg[4];
        }
      }
      parts.push(s);
    }
    outLines.push(parts.join(','));
  }

  return outLines.join(';');
}

function findSegment(line: Segment[] | undefined, col: number): Segment | null {
  if (!line || line.length === 0) return null;
  let lo = 0;
  let hi = line.length - 1;
  let best = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    if (line[mid][0] <= col) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best >= 0 ? line[best] : line[0];
}

/**
 * Compose `inner` (original -> intermediate) with `outer` (intermediate -> final).
 * Both maps are single-file MagicString outputs from sequential transforms on the same module.
 */
export function composeSourceMaps(
  inner: RawSourceMap | null | undefined,
  outer: RawSourceMap | null | undefined
): RawSourceMap | null {
  if (!inner || !inner.mappings) return outer ?? null;
  if (!outer || !outer.mappings) return inner;

  const innerLines = decodeMappings(inner.mappings);
  const outerLines = decodeMappings(outer.mappings);
  const composedLines: Segment[][] = [];

  const names = [...(inner.names ?? [])];
  const nameIndex = new Map<string, number>();
  names.forEach((n, idx) => nameIndex.set(n, idx));

  const internName = (name: string): number => {
    let idx = nameIndex.get(name);
    if (idx === undefined) {
      idx = names.length;
      names.push(name);
      nameIndex.set(name, idx);
    }
    return idx;
  };

  for (const oLine of outerLines) {
    const cLine: Segment[] = [];
    for (const seg of oLine) {
      if (seg[1] < 0) {
        cLine.push(seg);
        continue;
      }
      const midLine = seg[2];
      const midCol = seg[3];
      const match = findSegment(innerLines[midLine], midCol);
      if (!match || match[1] < 0) {
        continue;
      }
      const colDelta = Math.max(0, midCol - match[0]);
      let mappedName = match[4];
      if (mappedName < 0 && seg[4] >= 0 && outer.names?.[seg[4]]) {
        mappedName = internName(outer.names[seg[4]]);
      }
      cLine.push([seg[0], match[1], match[2], match[3] + colDelta, mappedName]);
    }
    composedLines.push(cLine);
  }

  return {
    version: 3,
    file: outer.file ?? inner.file,
    sources: inner.sources,
    sourcesContent: inner.sourcesContent,
    names,
    mappings: encodeMappings(composedLines),
  };
}
