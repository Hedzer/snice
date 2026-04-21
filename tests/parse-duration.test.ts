import { describe, it, expect } from 'vitest';
import { parseDuration } from '../src/index';

describe('parseDuration', () => {
  it('parses ms values', () => {
    expect(parseDuration('200ms').milliseconds()).toBe(200);
    expect(parseDuration('200ms').seconds()).toBe(0.2);
  });

  it('parses seconds', () => {
    expect(parseDuration('0.4s').milliseconds()).toBe(400);
    expect(parseDuration('0.4s').seconds()).toBe(0.4);
    expect(parseDuration('2s').milliseconds()).toBe(2000);
  });

  it('parses minutes', () => {
    expect(parseDuration('2m').milliseconds()).toBe(120000);
    expect(parseDuration('2m').seconds()).toBe(120);
    expect(parseDuration('2m').minutes()).toBe(2);
  });

  it('parses hours', () => {
    expect(parseDuration('1h').milliseconds()).toBe(3600000);
    expect(parseDuration('1h').seconds()).toBe(3600);
    expect(parseDuration('1h').minutes()).toBe(60);
  });

  it('treats plain numbers as milliseconds', () => {
    expect(parseDuration('500').milliseconds()).toBe(500);
    expect(parseDuration('500').seconds()).toBe(0.5);
  });

  it('returns zero for unparseable input', () => {
    expect(parseDuration('abc').milliseconds()).toBe(0);
    expect(parseDuration('').milliseconds()).toBe(0);
  });

  it('handles whitespace', () => {
    expect(parseDuration('  200ms  ').milliseconds()).toBe(200);
  });

  it('handles fractional seconds', () => {
    expect(parseDuration('1.5s').milliseconds()).toBe(1500);
    expect(parseDuration('0.25s').milliseconds()).toBe(250);
  });

  it('is case-insensitive on suffix', () => {
    expect(parseDuration('200MS').milliseconds()).toBe(200);
    expect(parseDuration('2S').milliseconds()).toBe(2000);
  });
});
