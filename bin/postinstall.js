#!/usr/bin/env node

import { closeSync, openSync, writeSync } from 'node:fs';

export const AI_INIT_MESSAGE = [
  '',
  'Snice installed. Add version-matched AI guidance to this project:',
  '  npx snice init-ai',
  ''
].join('\n');

function isSilent(env) {
  return String(env.npm_config_loglevel ?? '').toLowerCase() === 'silent';
}

/**
 * npm 7+ captures dependency lifecycle output by default. Prefer stdout when
 * it is already visible, otherwise write directly to an interactive terminal.
 * Every terminal operation is best-effort so installation can never fail just
 * because the recommendation could not be displayed.
 */
export function showAiInitMessage({
  env = process.env,
  platform = process.platform,
  stdout = process.stdout,
  open = openSync,
  write = writeSync,
  close = closeSync
} = {}) {
  if (isSilent(env)) return false;

  if (stdout.isTTY) {
    stdout.write(AI_INIT_MESSAGE);
    return true;
  }

  if (!env.CI) {
    let terminal;
    try {
      terminal = open(platform === 'win32' ? '\\\\.\\CONOUT$' : '/dev/tty', 'w');
      write(terminal, AI_INIT_MESSAGE);
      close(terminal);
      return true;
    } catch {
      if (terminal !== undefined) {
        try { close(terminal); } catch {}
      }
    }
  }

  try {
    stdout.write(AI_INIT_MESSAGE);
    return true;
  } catch {
    return false;
  }
}

showAiInitMessage();
